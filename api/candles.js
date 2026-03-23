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

  // ── Stocks: Yahoo Finance (free, no API key needed) ──
  return fetchStock(req, res, symbol, resolution);
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

async function fetchStock(req, res, symbol, resolution) {
  // Map our resolution to Yahoo Finance interval + range
  const configMap = {
    '60': { interval: '1h', range: '1mo' },
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

    return res.status(200).json({
      s: 'ok',
      t: indices.map((i) => result.timestamp[i]),
      o: indices.map((i) => quote.open[i]),
      h: indices.map((i) => quote.high[i]),
      l: indices.map((i) => quote.low[i]),
      c: indices.map((i) => quote.close[i]),
      v: indices.map((i) => quote.volume[i] || 0),
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
