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

  // Crypto: proxy to Binance (free, no key needed)
  if (isCrypto) {
    const pair = symbol.split(':').pop();
    const intervalMap = { '240': '4h', '60': '1h', D: '1d', W: '1w' };
    const interval = intervalMap[resolution] || '4h';
    const limit = 300;

    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        // Binance error response: { code: -1121, msg: "Invalid symbol." }
        return res.status(502).json({
          s: 'error',
          error: data.msg || `Binance returned ${response.status}`,
        });
      }

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(200).json({ s: 'no_data' });
      }

      // Normalize Binance kline data to unified format
      return res.status(200).json({
        s: 'ok',
        t: data.map((k) => Math.floor(k[0] / 1000)),
        o: data.map((k) => parseFloat(k[1])),
        h: data.map((k) => parseFloat(k[2])),
        l: data.map((k) => parseFloat(k[3])),
        c: data.map((k) => parseFloat(k[4])),
        v: data.map((k) => parseFloat(k[5])),
      });
    } catch (err) {
      return res.status(502).json({ s: 'error', error: 'Failed to reach Binance: ' + err.message });
    }
  }

  // Stocks: proxy to Finnhub
  const apiKey = token || process.env.FINNHUB_KEY || process.env.VITE_FINNHUB_KEY;

  if (!apiKey) {
    return res.status(500).json({
      s: 'error',
      error: 'FINNHUB_KEY not configured. Add it in Vercel dashboard → Settings → Environment Variables.',
    });
  }

  const params = new URLSearchParams({ symbol, resolution, from, to, token: apiKey });
  const url = `https://finnhub.io/api/v1/stock/candle?${params}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        s: 'error',
        error: data.error || `Finnhub returned ${response.status}`,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ s: 'error', error: 'Failed to reach Finnhub: ' + err.message });
  }
}
