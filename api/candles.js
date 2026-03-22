export default async function handler(req, res) {
  const { symbol, resolution, from, to, token } = req.query;

  if (!symbol || !resolution) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const isCrypto = symbol.includes(':');
  const endpoint = isCrypto ? 'crypto/candle' : 'stock/candle';
  const apiKey = token || process.env.VITE_FINNHUB_KEY;

  const params = new URLSearchParams({ symbol, resolution, from, to, token: apiKey });
  const url = `https://finnhub.io/api/v1/${endpoint}?${params}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from Finnhub' });
  }
}
