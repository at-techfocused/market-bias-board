export default async function handler(req, res) {
  const { symbol, resolution, from, to, token } = req.query;

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
    // Parse "BINANCE:BTCUSDT" → fsym=BTC, tsym=USDT
    const pair = symbol.split(':').pop(); // "BTCUSDT"
    const { fsym, tsym } = parseCryptoPair(pair);

    // Map resolution to CryptoCompare endpoint
    const endpointMap = {
      '240': { endpoint: 'histohour', aggregate: 4 },
      '60': { endpoint: 'histohour', aggregate: 1 },
      D: { endpoint: 'histoday', aggregate: 1 },
      W: { endpoint: 'histoday', aggregate: 7 },
    };
    const { endpoint, aggregate } = endpointMap[resolution] || endpointMap['240'];
    const limit = 300;

    try {
      const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${fsym}&tsym=${tsym}&limit=${limit}&aggregate=${aggregate}`;
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

      // Filter out candles with zero volume (padding entries)
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

  // ── Stocks: Finnhub ──
  const apiKey = (token || process.env.FINNHUB_KEY || process.env.VITE_FINNHUB_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({
      s: 'error',
      error: 'FINNHUB_KEY not configured. Add it in Vercel dashboard → Settings → Environment Variables, then redeploy.',
    });
  }

  const params = new URLSearchParams({ symbol, resolution, from, to, token: apiKey });
  const url = `https://finnhub.io/api/v1/stock/candle?${params}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      const hint = response.status === 403
        ? 'Finnhub returned 403. Verify your FINNHUB_KEY is valid at https://finnhub.io/dashboard — and redeploy after updating.'
        : (data.error || `Finnhub returned ${response.status}`);
      return res.status(response.status).json({ s: 'error', error: hint });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ s: 'error', error: 'Failed to reach Finnhub: ' + err.message });
  }
}

// Parse crypto pair like "BTCUSDT" → { fsym: "BTC", tsym: "USDT" }
function parseCryptoPair(pair) {
  const quoteAssets = ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'GBP', 'BTC', 'ETH', 'BNB'];
  for (const quote of quoteAssets) {
    if (pair.endsWith(quote) && pair.length > quote.length) {
      return { fsym: pair.slice(0, -quote.length), tsym: quote };
    }
  }
  // Fallback: assume last 3 chars are quote
  return { fsym: pair.slice(0, -3), tsym: pair.slice(-3) };
}
