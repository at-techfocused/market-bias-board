const API_KEY = import.meta.env.VITE_FINNHUB_KEY || '';
const IS_PROD = import.meta.env.PROD;

function isCrypto(ticker) {
  return ticker.includes(':');
}

// Parse crypto pair like "BTCUSDT" → { fsym: "BTC", tsym: "USDT" }
function parseCryptoPair(pair) {
  const quoteAssets = ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'GBP', 'BTC', 'ETH', 'BNB'];
  for (const quote of quoteAssets) {
    if (pair.endsWith(quote) && pair.length > quote.length) {
      return { fsym: pair.slice(0, -quote.length), tsym: quote };
    }
  }
  return { fsym: pair.slice(0, -3), tsym: pair.slice(-3) };
}

// ── Parse normalized candle response { s, t, o, h, l, c, v } ──
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
    throw new Error(errData.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return parseNormalizedCandles(data);
}

// ── CryptoCompare direct call (dev mode) ──
async function fetchCryptoDirect(ticker, resolution, count = 300) {
  const pair = ticker.split(':').pop();
  const { fsym, tsym } = parseCryptoPair(pair);

  const endpointMap = {
    '240': { endpoint: 'histohour', aggregate: 4 },
    '60': { endpoint: 'histohour', aggregate: 1 },
    D: { endpoint: 'histoday', aggregate: 1 },
    W: { endpoint: 'histoday', aggregate: 7 },
  };
  const { endpoint, aggregate } = endpointMap[resolution] || endpointMap['240'];

  const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${fsym}&tsym=${tsym}&limit=${count}&aggregate=${aggregate}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.Response === 'Error') {
    throw new Error(json.Message || `CryptoCompare error: ${res.status}`);
  }

  const candles = json.Data?.Data;
  if (!candles || candles.length === 0) {
    throw new Error('No data available for this ticker');
  }

  const valid = candles.filter((c) => c.volumefrom > 0 || c.volumeto > 0);
  if (valid.length === 0) {
    throw new Error('No data available for this ticker');
  }

  return valid.map((c) => ({
    t: c.time,
    o: c.open,
    h: c.high,
    l: c.low,
    c: c.close,
    v: c.volumefrom,
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
  if (IS_PROD) {
    return fetchViaProxy(ticker, resolution, count);
  }

  if (isCrypto(ticker)) {
    return fetchCryptoDirect(ticker, resolution, count);
  }
  return fetchFinnhubDirect(ticker, resolution, count);
}

export async function fetchDualTimeframe(ticker) {
  // Crypto: 4H + Daily via CryptoCompare
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
