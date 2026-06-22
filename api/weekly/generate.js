import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

// ── Helpers ──

function getWeekDates() {
  const now = new Date();
  const day = now.getUTCDay();
  // Find this week's Monday (or next Monday if Sunday)
  let daysToMon;
  if (day === 0) daysToMon = 1;          // Sunday → tomorrow
  else if (day === 6) daysToMon = 2;     // Saturday → day after tomorrow
  else daysToMon = -(day - 1);           // Weekday → go back to this Monday
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + daysToMon);
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

// ── Market snapshot via Yahoo Finance (free, no key) ──

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
      if (!meta) throw new Error('No data');

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

// ── VIX and 10Y yield via Yahoo Finance (free, no key) ──

async function fetchMacro() {
  const fetchQuote = async (symbol) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const meta = json.chart?.result?.[0]?.meta;
      if (!meta) throw new Error('No data');
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose;
      const changePct = prevClose ? ((price - prevClose) / prevClose * 100) : 0;
      return { price: parseFloat(price.toFixed(2)), changePct: parseFloat(changePct.toFixed(2)) };
    } catch (err) {
      console.error(`[Weekly] Macro fetch failed for ${symbol}:`, err.message);
      return null;
    }
  };

  const [vix, yield10y] = await Promise.all([fetchQuote('^VIX'), fetchQuote('^TNX')]);
  return { vix, yield10y };
}

// ── Earnings calendar via FMP ──

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

    const rev = (e) => e.revenueEstimated ?? e.revenue ?? 0;
    return data
      .filter((e) => rev(e) > 1_000_000_000)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
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

// ── Economic calendar via FMP ──

async function fetchEconomic(monStr, friStr) {
  const key = process.env.FMP_API_KEY;
  if (!key) return [];

  try {
    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${monStr}&to=${friStr}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const HI_KEYWORDS = ['GDP', 'CPI', 'FOMC', 'Fed', 'Nonfarm', 'NFP', 'Unemployment', 'Retail Sales',
      'PMI', 'Interest Rate', 'Consumer Confidence', 'PPI', 'Core PCE', 'PCE', 'Jobless Claims',
      'Housing Starts', 'Industrial Production', 'Trade Balance', 'Durable Goods'];

    const isHighImpact = (e) =>
      (e.impact === 'High') || HI_KEYWORDS.some((kw) => (e.event || '').includes(kw));

    return data
      .filter((e) => e.event && isHighImpact(e))
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

// ── AI narrative generation ──

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
  "weekLabel": "Jun 23–27, 2026",
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
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt,
    });

    const text = response.content[0]?.text;
    if (!text) throw new Error('Empty AI response');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[Weekly] AI generation failed:', err.message);
    return null;
  }
}

// ── Major move detection ──

const MOVE_THRESHOLDS = { SPY: 1.5, QQQ: 2.0, 'GC=F': 2.0, 'CL=F': 3.0, 'BTC-USD': 4.0 };

function detectMajorMoves(oldSnapshot, newSnapshot) {
  if (!oldSnapshot?.length || !newSnapshot?.length) return [];
  const moves = [];
  for (const fresh of newSnapshot) {
    const old = oldSnapshot.find((s) => s.symbol === fresh.symbol);
    if (!old?.price || !fresh.price) continue;
    const pctMove = Math.abs((fresh.price - old.price) / old.price * 100);
    const threshold = MOVE_THRESHOLDS[fresh.symbol] || 2.0;
    if (pctMove >= threshold) {
      moves.push({ symbol: fresh.label, move: parseFloat(pctMove.toFixed(2)), direction: fresh.price > old.price ? 'up' : 'down' });
    }
  }
  return moves;
}

// ── KV helpers ──

async function readBriefing() {
  try {
    const raw = await kv.get('weekly:briefing');
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    console.error('[Weekly] KV read error:', err.message);
    return null;
  }
}

async function storeBriefing(briefing) {
  try {
    await kv.set('weekly:briefing', JSON.stringify(briefing));
    await kv.set('weekly:generated_at', briefing.generatedAt);
    console.log('[Weekly] Briefing stored in KV');
  } catch (err) {
    console.error('[Weekly] KV write failed:', err.message);
  }
}

// ── Snapshot-only refresh (every 4h on weekdays) ──

export async function runSnapshotRefresh() {
  console.log('[Weekly] Running snapshot refresh...');

  const existing = await readBriefing();
  if (!existing) {
    console.log('[Weekly] No existing briefing — running full generation instead');
    return runFullGeneration();
  }

  const [snapshotData, macroData] = await Promise.all([fetchSnapshot(), fetchMacro()]);

  // Check for major moves
  const majorMoves = detectMajorMoves(existing.snapshot, snapshotData);
  if (majorMoves.length > 0) {
    console.log('[Weekly] Major moves detected:', majorMoves);
  }

  const briefing = {
    ...existing,
    snapshot: snapshotData,
    macro: macroData,
    snapshotUpdatedAt: new Date().toISOString(),
    majorMoves: majorMoves.length > 0 ? majorMoves : (existing.majorMoves || null),
  };

  await storeBriefing(briefing);
  return { briefing, majorMoves };
}

// ── Full generation with AI narrative (twice weekly) ──

export async function runFullGeneration() {
  console.log('[Weekly] Starting full briefing generation...');

  const { monStr, friStr, weekLabel } = getWeekDates();

  const [snapshotData, macroData, earningsData, economicData] = await Promise.all([
    fetchSnapshot(),
    fetchMacro(),
    fetchEarnings(monStr, friStr),
    fetchEconomic(monStr, friStr),
  ]);

  console.log('[Weekly] Data fetched. Snapshot:', snapshotData.length, 'Earnings:', earningsData.length, 'Economic:', economicData.length);

  const aiOutput = await generateNarrative(snapshotData, earningsData, economicData, weekLabel, macroData);

  const briefing = {
    generatedAt: new Date().toISOString(),
    snapshotUpdatedAt: new Date().toISOString(),
    weekLabel,
    snapshot: snapshotData,
    macro: macroData,
    earnings: earningsData,
    economic: economicData,
    ai: aiOutput,
    majorMoves: null,
  };

  await storeBriefing(briefing);
  console.log('[Weekly] Full briefing generated');
  return briefing;
}

// Keep backward compat for briefing.js on-demand import
export const runGeneration = runFullGeneration;

// ── Cron handler — route based on query param ──

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const mode = req.query.mode || 'full';

  try {
    if (mode === 'snapshot') {
      const { briefing, majorMoves } = await runSnapshotRefresh();
      return res.status(200).json({
        success: true,
        mode: 'snapshot',
        snapshotUpdatedAt: briefing.snapshotUpdatedAt,
        majorMoves: majorMoves || [],
      });
    }

    const briefing = await runFullGeneration();
    return res.status(200).json({ success: true, mode: 'full', generatedAt: briefing.generatedAt });
  } catch (err) {
    console.error('[Weekly] Generation failed:', err);
    return res.status(500).json({ success: false, error: 'Generation failed' });
  }
}
