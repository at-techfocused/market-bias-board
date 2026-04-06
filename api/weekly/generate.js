import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

// ── Helpers ──

function getWeekDates() {
  const now = new Date();
  // Find next Monday
  const day = now.getUTCDay();
  const daysUntilMon = day === 0 ? 1 : (8 - day);
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + daysUntilMon);
  mon.setUTCHours(0, 0, 0, 0);

  const fri = new Date(mon);
  fri.setUTCDate(mon.getUTCDate() + 4);

  const fmt = (d) => d.toISOString().slice(0, 10);
  const monStr = fmt(mon);
  const friStr = fmt(fri);

  const monLabel = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const friLabel = fri.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const year = mon.getUTCFullYear();
  const weekLabel = `${monLabel}–${friLabel}, ${year}`;

  return { monStr, friStr, weekLabel };
}

// ── Step 1: Market snapshot via Yahoo Finance ──

async function fetchSnapshot() {
  const tickers = [
    { symbol: 'SPY', label: 'SPY' },
    { symbol: 'QQQ', label: 'QQQ' },
    { symbol: 'GC=F', label: 'Gold' },
    { symbol: 'CL=F', label: 'Oil WTI' },
    { symbol: 'BTC-USD', label: 'BTC' },
  ];

  const results = [];
  for (const { symbol, label } of tickers) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const result = json.chart?.result?.[0];
      const meta = result?.meta;
      const quote = result?.indicators?.quote?.[0];
      if (!meta || !quote) throw new Error('No data');

      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose;
      const change = prevClose ? ((price - prevClose) / prevClose * 100) : 0;

      results.push({ label, symbol, price: parseFloat(price.toFixed(2)), change: parseFloat(change.toFixed(2)) });
    } catch (err) {
      console.error(`[Weekly] Snapshot failed for ${label}:`, err.message);
      results.push({ label, symbol, price: null, change: null, error: true });
    }
  }
  return results;
}

// ── Step 2: VIX and 10Y yield via Alpha Vantage ──

async function fetchMacro() {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) {
    console.error('[Weekly] ALPHA_VANTAGE_KEY not set');
    return { vix: null, yield10y: null };
  }

  const fetchQuote = async (symbol) => {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const q = json['Global Quote'];
      if (!q || !q['05. price']) throw new Error('No quote data');
      return {
        price: parseFloat(q['05. price']),
        changePct: parseFloat((q['10. change percent'] || '0').replace('%', '')),
      };
    } catch (err) {
      console.error(`[Weekly] Alpha Vantage failed for ${symbol}:`, err.message);
      return null;
    }
  };

  const [vix, yield10y] = await Promise.all([fetchQuote('VIX'), fetchQuote('TNX')]);
  return { vix, yield10y };
}

// ── Step 3: Earnings calendar via FMP ──

async function fetchEarnings(monStr, friStr) {
  const key = process.env.FMP_API_KEY;
  if (!key) {
    console.error('[Weekly] FMP_API_KEY not set');
    return [];
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/earning_calendar?from=${monStr}&to=${friStr}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((e) => e.revenue != null && e.revenue > 1_000_000_000)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10)
      .map((e) => ({
        symbol: e.symbol,
        date: e.date,
        time: e.time || 'TBD',
        epsEstimated: e.epsEstimated,
        revenueEstimated: e.revenueEstimated,
      }));
  } catch (err) {
    console.error('[Weekly] Earnings fetch failed:', err.message);
    return [];
  }
}

// ── Step 4: Economic calendar via FMP ──

async function fetchEconomic(monStr, friStr) {
  const key = process.env.FMP_API_KEY;
  if (!key) return [];

  try {
    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${monStr}&to=${friStr}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((e) => e.impact === 'High')
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 8)
      .map((e) => ({
        event: e.event,
        date: e.date,
        time: e.time || '',
        country: e.country || 'US',
      }));
  } catch (err) {
    console.error('[Weekly] Economic calendar fetch failed:', err.message);
    return [];
  }
}

// ── Step 5: AI generation ──

async function generateNarrative(snapshotData, earningsData, economicData, weekLabel, macroData) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[Weekly] ANTHROPIC_API_KEY not set');
    return null;
  }

  const systemPrompt = `You are a senior market analyst writing a weekly briefing for a technical trader.
You will receive structured market data and must return a JSON object only — no markdown, no preamble, no explanation.
Respond with exactly this JSON shape:
{
  "weekLabel": "Apr 6–10, 2026",
  "alertBanner": {
    "active": true,
    "level": "critical",
    "title": "one line title of the dominant risk event",
    "body": "2-3 sentence plain english summary of the critical event and its market implications"
  },
  "narrative": [
    { "text": "bullet point 1 — bold the ticker or key term at the start", "bold": "DAL" },
    { "text": "bullet point 2", "bold": "CPI" },
    { "text": "bullet point 3", "bold": "FOMC" },
    { "text": "bullet point 4", "bold": "Oil WTI" }
  ],
  "strategicLevels": [
    {
      "ticker": "SPX",
      "price": "6,582",
      "support": "6,400",
      "resistance": "6,700",
      "note": "2 sentence technical commentary"
    }
  ],
  "alertLevel": "critical | high | standard",
  "dominantTheme": "one phrase describing the week's dominant macro theme"
}
alertBanner.level options: "critical" (binary events, geopolitical), "high" (major data/Fed), "standard" (normal week), "none" (quiet week — set active: false).
strategicLevels: include SPX, WTI, Gold, BTC, and 10Y yield. Use the price data provided.
Keep all text concise and data-driven. No fluff. Trader-grade language.`;

  const currentDate = new Date().toISOString().slice(0, 10);

  const userMessage = `Here is this week's market data. Generate the briefing JSON:

MARKET SNAPSHOT: ${JSON.stringify(snapshotData)}
MACRO DATA: VIX=${macroData.vix ? macroData.vix.price : 'N/A'}, 10Y Yield=${macroData.yield10y ? macroData.yield10y.price : 'N/A'}%
EARNINGS THIS WEEK: ${JSON.stringify(earningsData)}
ECONOMIC EVENTS THIS WEEK: ${JSON.stringify(economicData)}
CURRENT DATE: ${currentDate}
WEEK: ${weekLabel}`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: userMessage },
      ],
      system: systemPrompt,
    });

    const text = response.content[0]?.text;
    if (!text) throw new Error('Empty AI response');

    // Extract JSON from response (handle possible markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    console.error('[Weekly] AI generation failed:', err.message);
    return null;
  }
}

// ── Core generation pipeline (used by both cron handler and on-demand) ──

export async function runGeneration() {
  console.log('[Weekly] Starting weekly briefing generation...');

  const { monStr, friStr, weekLabel } = getWeekDates();

  // Run independent fetches in parallel
  const [snapshotData, macroData, earningsData, economicData] = await Promise.all([
    fetchSnapshot(),
    fetchMacro(),
    fetchEarnings(monStr, friStr),
    fetchEconomic(monStr, friStr),
  ]);

  console.log('[Weekly] Data fetched. Snapshot:', snapshotData.length, 'Earnings:', earningsData.length, 'Economic:', economicData.length);

  // AI generation
  const aiOutput = await generateNarrative(snapshotData, earningsData, economicData, weekLabel, macroData);

  // Assemble briefing
  const briefing = {
    generatedAt: new Date().toISOString(),
    weekLabel,
    snapshot: snapshotData,
    macro: macroData,
    earnings: earningsData,
    economic: economicData,
    ai: aiOutput,
  };

  // Store in KV
  try {
    await kv.set('weekly:briefing', JSON.stringify(briefing));
    await kv.set('weekly:generated_at', briefing.generatedAt);
    console.log('[Weekly] Briefing stored in KV');
  } catch (err) {
    console.error('[Weekly] KV write failed (briefing still returned):', err.message);
  }

  console.log('[Weekly] Briefing generated successfully');
  return briefing;
}

// ── Cron / manual trigger handler ──

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const briefing = await runGeneration();
    return res.status(200).json({ success: true, generatedAt: briefing.generatedAt });
  } catch (err) {
    console.error('[Weekly] Generation failed:', err);
    return res.status(500).json({ success: false, error: 'Generation failed' });
  }
}
