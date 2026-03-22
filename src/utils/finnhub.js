const API_KEY = import.meta.env.VITE_FINNHUB_KEY || '';

function isCrypto(ticker) {
  return ticker.includes(':');
}

function getBaseURL() {
  // In production (Vercel), use the serverless proxy to avoid CORS
  // In dev, Vite proxy handles it
  return '/api';
}

export async function fetchCandles(ticker, resolution, count = 300) {
  const now = Math.floor(Date.now() / 1000);
  let intervalSeconds;
  if (resolution === '240') intervalSeconds = 4 * 60 * 60;
  else if (resolution === 'D') intervalSeconds = 24 * 60 * 60;
  else intervalSeconds = 60 * 60;

  const from = now - count * intervalSeconds;
  const crypto = isCrypto(ticker);
  const endpoint = crypto ? 'crypto/candle' : 'stock/candle';

  const params = new URLSearchParams({
    symbol: ticker,
    resolution,
    from: String(from),
    to: String(now),
    token: API_KEY,
  });

  const url = `https://finnhub.io/api/v1/${endpoint}?${params}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub API error: ${res.status}`);

  const data = await res.json();
  if (data.s === 'no_data' || !data.c) {
    throw new Error('No data available for this ticker');
  }

  // Convert to array of candle objects
  const candles = data.c.map((_, i) => ({
    t: data.t[i],
    o: data.o[i],
    h: data.h[i],
    l: data.l[i],
    c: data.c[i],
    v: data.v[i],
  }));

  return candles;
}

export async function fetchDualTimeframe(ticker) {
  const [h4, daily] = await Promise.all([
    fetchCandles(ticker, '240', 300),
    fetchCandles(ticker, 'D', 300),
  ]);
  return { '4H': h4, D: daily };
}
