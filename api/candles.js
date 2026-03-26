// Symbol alias map — matches display symbols to Yahoo Finance tickers
const YAHOO_ALIASES = {
  WTI: 'CL=F',
  USOIL: 'CL=F',
  BRENT: 'BZ=F',
  XAUUSD: 'GC=F',
  GOLD: 'GC=F',
  XAGUSD: 'SI=F',
  SILVER: 'SI=F',
  NATGAS: 'NG=F',
  DXY: 'DX-Y.NYB',
  US30: 'YM=F',
  US500: 'ES=F',
  NAS100: 'NQ=F',
  DOW: 'YM=F',
  VIX: '^VIX',
};

export default async function handler(req, res) {
  const { symbol, resolution, from, to } = req.query;

  if (!symbol || !resolution) {
    return res.status(400).json({ s: 'error', error: 'Missing required parameters' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isCrypto = symbol.includes(':');

  // ── Crypto: CryptoCompare (free, no geo-restrictions, no key needed) ──
  if (isCrypto) {
    return fetchCrypto(req, res, symbol, resolution);
  }

  // ── Stocks / Commodities: Yahoo Finance (resolve aliases first) ──
  const resolved = YAHOO_ALIASES[symbol.toUpperCase()] || symbol;
  return fetchStock(req, res, resolved, resolution);
}

async function fetchCrypto(req, res, symbol, resolution) {
  const pair = symbol.split(':').pop();
  const { fsym, tsym } = parseCryptoPair(pair);

  const endpointMap = {
    '240': { endpoint: 'histohour', aggregate: 4 },
    '60': { endpoint: 'histohour', aggregate: 1 },
    D: { endpoint: 'histoday', aggregate: 1 },
    W: { endpoint: 'histoday', aggregate: 7 },
  };
  const { endpoint, aggregate } = endpointMap[resolution] || endpointMap['240'];

  try {
    const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${fsym}&tsym=${tsym}&limit=300&aggregate=${aggregate}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!response.ok || json.Response === 'Error') {
      return res.status(502).json({
        s: 'error',
        error: json.Message || `CryptoCompare returned ${response.status}`,
      });
    }

    const candles = json.Data?.Data;
    if (!candles || candles.length === 0) {
      return res.status(200).json({ s: 'no_data' });
    }

    const valid = candles.filter((c) => c.volumefrom > 0 || c.volumeto > 0);
    if (valid.length === 0) {
      return res.status(200).json({ s: 'no_data' });
    }

    return res.status(200).json({
      s: 'ok',
      t: valid.map((c) => c.time),
      o: valid.map((c) => c.open),
      h: valid.map((c) => c.high),
      l: valid.map((c) => c.low),
      c: valid.map((c) => c.close),
      v: valid.map((c) => c.volumefrom),
    });
  } catch (err) {
    return res.status(502).json({ s: 'error', error: 'Failed to reach CryptoCompare: ' + err.message });
  }
}

// Aggregate 1H candles into 4H candles
function aggregateToFourHour(candles) {
  const buckets = new Map();
  for (const c of candles) {
    const key = Math.floor(c.t / (4 * 3600)) * (4 * 3600);
    if (!buckets.has(key)) {
      buckets.set(key, { t: key, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v });
    } else {
      const b = buckets.get(key);
      b.h = Math.max(b.h, c.h);
      b.l = Math.min(b.l, c.l);
      b.c = c.c;
      b.v += c.v;
    }
  }
  return Array.from(buckets.values()).sort((a, b) => a.t - b.t);
}

async function fetchStock(req, res, symbol, resolution) {
  // For 4H (240): fetch 1H data and aggregate
  const needsAggregation = resolution === '240';
  const configMap = {
    '60': { interval: '1h', range: '6mo' },
    '240': { interval: '1h', range: '2y' },
    D: { interval: '1d', range: '2y' },
    W: { interval: '1wk', range: '10y' },
  };
  const config = configMap[resolution] || configMap.D;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${config.interval}&range=${config.range}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({
        s: 'error',
        error: `Yahoo Finance returned ${response.status}: ${text.slice(0, 200)}`,
      });
    }

    const json = await response.json();
    const result = json.chart?.result?.[0];

    if (!result || !result.timestamp) {
      return res.status(200).json({ s: 'no_data' });
    }

    const quote = result.indicators?.quote?.[0];
    if (!quote) {
      return res.status(200).json({ s: 'no_data' });
    }

    // Filter out null entries (market holidays etc)
    const indices = result.timestamp
      .map((_, i) => i)
      .filter((i) => quote.close[i] != null && quote.open[i] != null);

    if (indices.length === 0) {
      return res.status(200).json({ s: 'no_data' });
    }

    let candles = indices.map((i) => ({
      t: result.timestamp[i],
      o: quote.open[i],
      h: quote.high[i],
      l: quote.low[i],
      c: quote.close[i],
      v: quote.volume[i] || 0,
    }));

    if (needsAggregation) {
      candles = aggregateToFourHour(candles);
    }

    return res.status(200).json({
      s: 'ok',
      t: candles.map((c) => c.t),
      o: candles.map((c) => c.o),
      h: candles.map((c) => c.h),
      l: candles.map((c) => c.l),
      c: candles.map((c) => c.c),
      v: candles.map((c) => c.v),
    });
  } catch (err) {
    return res.status(502).json({ s: 'error', error: 'Failed to reach Yahoo Finance: ' + err.message });
  }
}

function parseCryptoPair(pair) {
  const quoteAssets = ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'GBP', 'BTC', 'ETH', 'BNB'];
  for (const quote of quoteAssets) {
    if (pair.endsWith(quote) && pair.length > quote.length) {
      return { fsym: pair.slice(0, -quote.length), tsym: quote };
    }
  }
  return { fsym: pair.slice(0, -3), tsym: pair.slice(-3) };
}
