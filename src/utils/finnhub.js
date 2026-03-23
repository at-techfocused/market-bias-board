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

// ── Fetch via serverless proxy (production — handles both crypto & stocks) ──
async function fetchViaProxy(ticker, resolution) {
  const now = Math.floor(Date.now() / 1000);
  let intervalSeconds;
  if (resolution === '240') intervalSeconds = 4 * 60 * 60;
  else if (resolution === 'W') intervalSeconds = 7 * 24 * 60 * 60;
  else if (resolution === 'D') intervalSeconds = 24 * 60 * 60;
  else intervalSeconds = 60 * 60;

  const from = now - 300 * intervalSeconds;
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
async function fetchCryptoDirect(ticker, resolution) {
  const pair = ticker.split(':').pop();
  const { fsym, tsym } = parseCryptoPair(pair);

  const endpointMap = {
    '240': { endpoint: 'histohour', aggregate: 4 },
    '60': { endpoint: 'histohour', aggregate: 1 },
    D: { endpoint: 'histoday', aggregate: 1 },
    W: { endpoint: 'histoday', aggregate: 7 },
  };
  const { endpoint, aggregate } = endpointMap[resolution] || endpointMap['240'];

  const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${fsym}&tsym=${tsym}&limit=300&aggregate=${aggregate}`;
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

// ── Yahoo Finance direct call (dev mode — no API key needed) ──
async function fetchYahooDirect(ticker, resolution) {
  const configMap = {
    '60': { interval: '1h', range: '1mo' },
    D: { interval: '1d', range: '2y' },
    W: { interval: '1wk', range: '10y' },
  };
  const config = configMap[resolution] || configMap.D;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${config.interval}&range=${config.range}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Yahoo Finance error: ${res.status}`);
  }

  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result || !result.timestamp) {
    throw new Error('No data available for this ticker');
  }

  const quote = result.indicators?.quote?.[0];
  if (!quote) {
    throw new Error('No data available for this ticker');
  }

  const indices = result.timestamp
    .map((_, i) => i)
    .filter((i) => quote.close[i] != null && quote.open[i] != null);

  if (indices.length === 0) {
    throw new Error('No data available for this ticker');
  }

  return indices.map((i) => ({
    t: result.timestamp[i],
    o: quote.open[i],
    h: quote.high[i],
    l: quote.low[i],
    c: quote.close[i],
    v: quote.volume[i] || 0,
  }));
}

// ── Unified fetch ──
export async function fetchCandles(ticker, resolution) {
  if (IS_PROD) {
    return fetchViaProxy(ticker, resolution);
  }

  if (isCrypto(ticker)) {
    return fetchCryptoDirect(ticker, resolution);
  }
  return fetchYahooDirect(ticker, resolution);
}

export async function fetchDualTimeframe(ticker) {
  // Crypto: 4H + Daily via CryptoCompare
  // Stocks: Daily + Weekly via Yahoo Finance
  const [shortRes, longRes] = isCrypto(ticker)
    ? ['240', 'D']
    : ['D', 'W'];

  const [shortTf, longTf] = await Promise.all([
    fetchCandles(ticker, shortRes),
    fetchCandles(ticker, longRes),
  ]);

  return { '4H': shortTf, D: longTf };
}
