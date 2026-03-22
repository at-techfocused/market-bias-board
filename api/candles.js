export default async function handler(req, res) {
  const { symbol, resolution, from, to, token } = req.query;

  if (!symbol || !resolution) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');

  const isCrypto = symbol.includes(':');

  // Crypto: proxy to Binance (free, no key needed)
  if (isCrypto) {
    const pair = symbol.split(':').pop();
    const intervalMap = { '240': '4h', D: '1d' };
    const interval = intervalMap[resolution] || '4h';
    const limit = 300;

    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`
      );
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch from Binance' });
    }
  }

  // Stocks: proxy to Finnhub
  const apiKey = token || process.env.FINNHUB_KEY || process.env.VITE_FINNHUB_KEY;
  const params = new URLSearchParams({ symbol, resolution, from, to, token: apiKey });
  const url = `https://finnhub.io/api/v1/stock/candle?${params}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from Finnhub' });
  }
}
