const API_KEY = import.meta.env.VITE_FINNHUB_KEY || '';

function isCrypto(ticker) {
  return ticker.includes(':');
}

// ── Binance public API for crypto (free, no key needed) ──
async function fetchBinanceCandles(ticker, resolution, count = 300) {
  // Extract pair from format like "BINANCE:BTCUSDT" → "BTCUSDT"
  const symbol = ticker.split(':').pop();

  const intervalMap = {
    '240': '4h',
    D: '1d',
  };
  const interval = intervalMap[resolution] || '4h';

  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${count}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);

  const data = await res.json();
  if (!data || data.length === 0) {
    throw new Error('No data available for this ticker');
  }

  // Binance kline format: [openTime, open, high, low, close, volume, ...]
  return data.map((k) => ({
    t: Math.floor(k[0] / 1000),
    o: parseFloat(k[1]),
    h: parseFloat(k[2]),
    l: parseFloat(k[3]),
    c: parseFloat(k[4]),
    v: parseFloat(k[5]),
  }));
}

// ── Finnhub for stocks ──
async function fetchFinnhubCandles(ticker, resolution, count = 300) {
  const now = Math.floor(Date.now() / 1000);
  let intervalSeconds;
  if (resolution === '240') intervalSeconds = 4 * 60 * 60;
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

  const url = `https://finnhub.io/api/v1/stock/candle?${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('API access denied. Check your Finnhub API key in .env (VITE_FINNHUB_KEY).');
    }
    if (res.status === 429) {
      throw new Error('Rate limited. Wait a moment and try again.');
    }
    throw new Error(`Finnhub API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.s === 'no_data' || !data.c) {
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

// ── Unified fetch ──
export async function fetchCandles(ticker, resolution, count = 300) {
  if (isCrypto(ticker)) {
    return fetchBinanceCandles(ticker, resolution, count);
  }
  return fetchFinnhubCandles(ticker, resolution, count);
}

export async function fetchDualTimeframe(ticker) {
  const [h4, daily] = await Promise.all([
    fetchCandles(ticker, '240', 300),
    fetchCandles(ticker, 'D', 300),
  ]);
  return { '4H': h4, D: daily };
}
