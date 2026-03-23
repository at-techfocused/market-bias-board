const API_KEY = import.meta.env.VITE_FINNHUB_KEY || '';
const IS_PROD = import.meta.env.PROD;

function isCrypto(ticker) {
  return ticker.includes(':');
}

// ── Parse normalized candle response (same format from proxy for both crypto & stocks) ──
function parseNormalizedCandles(data) {
  if (data.s === 'error') {
    throw new Error(data.error || 'API error');
  }
  if (data.s === 'no_data' || !data.c || data.c.length === 0) {
    throw new Error('No data available for this ticker');
  }
  return data.c.map((_, i) => ({
    t: data.t[i],
    o: data.o[i],
    h: data.h[i],
    l: data.l[i],
    c: data.c[i],
    v: data.v[i],
  }));
}

// ── Fetch via serverless proxy (production) ──
async function fetchViaProxy(ticker, resolution, count = 300) {
  const now = Math.floor(Date.now() / 1000);
  let intervalSeconds;
  if (resolution === '240') intervalSeconds = 4 * 60 * 60;
  else if (resolution === 'W') intervalSeconds = 7 * 24 * 60 * 60;
  else if (resolution === 'D') intervalSeconds = 24 * 60 * 60;
  else intervalSeconds = 60 * 60;

  const from = now - count * intervalSeconds;
  const params = new URLSearchParams({
    symbol: ticker,
    resolution,
    from: String(from),
    to: String(now),
  });

  const res = await fetch(`/api/candles?${params}`);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new Error('API access denied. Check your Finnhub API key.');
    }
    if (res.status === 429) {
      throw new Error('Rate limited. Wait a moment and try again.');
    }
    throw new Error(errData.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return parseNormalizedCandles(data);
}

// ── Binance direct call (dev mode only) ──
async function fetchBinanceDirect(ticker, resolution, count = 300) {
  const symbol = ticker.split(':').pop();
  const intervalMap = { '240': '4h', D: '1d' };
  const interval = intervalMap[resolution] || '4h';

  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${count}`;
  const res = await fetch(url);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.msg || `Binance API error: ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data available for this ticker');
  }

  return data.map((k) => ({
    t: Math.floor(k[0] / 1000),
    o: parseFloat(k[1]),
    h: parseFloat(k[2]),
    l: parseFloat(k[3]),
    c: parseFloat(k[4]),
    v: parseFloat(k[5]),
  }));
}

// ── Finnhub direct call (dev mode with API key) ──
async function fetchFinnhubDirect(ticker, resolution, count = 300) {
  if (!API_KEY) {
    throw new Error(
      'Set VITE_FINNHUB_KEY in .env for local dev, or deploy to Vercel with FINNHUB_KEY.'
    );
  }

  const now = Math.floor(Date.now() / 1000);
  let intervalSeconds;
  if (resolution === '240') intervalSeconds = 4 * 60 * 60;
  else if (resolution === 'W') intervalSeconds = 7 * 24 * 60 * 60;
  else if (resolution === 'D') intervalSeconds = 24 * 60 * 60;
  else intervalSeconds = 60 * 60;

  const from = now - count * intervalSeconds;
  const params = new URLSearchParams({
    symbol: ticker,
    resolution,
    from: String(from),
    to: String(now),
    token: API_KEY,
  });

  const res = await fetch(`https://finnhub.io/api/v1/stock/candle?${params}`);

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('API access denied. Check your Finnhub API key.');
    }
    if (res.status === 429) {
      throw new Error('Rate limited. Wait a moment and try again.');
    }
    throw new Error(`Finnhub API error: ${res.status}`);
  }

  const data = await res.json();
  return parseNormalizedCandles(data);
}

// ── Unified fetch ──
export async function fetchCandles(ticker, resolution, count = 300) {
  // In production, always use the serverless proxy (avoids CORS / geo-blocking)
  if (IS_PROD) {
    return fetchViaProxy(ticker, resolution, count);
  }

  // In dev mode, call APIs directly
  if (isCrypto(ticker)) {
    return fetchBinanceDirect(ticker, resolution, count);
  }
  return fetchFinnhubDirect(ticker, resolution, count);
}

export async function fetchDualTimeframe(ticker) {
  // Crypto: 4H + Daily via Binance
  // Stocks: Daily + Weekly via Finnhub (free tier only supports D/W/M)
  const [shortRes, longRes] = isCrypto(ticker)
    ? ['240', 'D']
    : ['D', 'W'];

  const [shortTf, longTf] = await Promise.all([
    fetchCandles(ticker, shortRes, 300),
    fetchCandles(ticker, longRes, 300),
  ]);

  return { '4H': shortTf, D: longTf };
}
