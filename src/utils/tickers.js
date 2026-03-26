// Shared ticker metadata — single source of truth for names, types, exchanges.
// Used by TickerSearch, Panel, and HeroBlock.
const TICKER_DATA = {
  // Crypto
  'BINANCE:BTCUSDT': { name: 'Bitcoin / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:ETHUSDT': { name: 'Ethereum / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:SOLUSDT': { name: 'Solana / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:BNBUSDT': { name: 'BNB / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:XRPUSDT': { name: 'XRP / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:ADAUSDT': { name: 'Cardano / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:DOGEUSDT': { name: 'Dogecoin / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:AVAXUSDT': { name: 'Avalanche / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:DOTUSDT': { name: 'Polkadot / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:MATICUSDT': { name: 'Polygon / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:LINKUSDT': { name: 'Chainlink / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:ATOMUSDT': { name: 'Cosmos / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:LTCUSDT': { name: 'Litecoin / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:NEARUSDT': { name: 'NEAR Protocol / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:UNIUSDT': { name: 'Uniswap / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:APTUSDT': { name: 'Aptos / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:ARUSDT': { name: 'Arweave / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:OPUSDT': { name: 'Optimism / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:ARBUSDT': { name: 'Arbitrum / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:SUIUSDT': { name: 'Sui / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:PEPEUSDT': { name: 'Pepe / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:WIFUSDT': { name: 'dogwifhat / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:FETUSDT': { name: 'Fetch.ai / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:INJUSDT': { name: 'Injective / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:RENDERUSDT': { name: 'Render / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:TRXUSDT': { name: 'TRON / USDT', type: 'crypto', exchange: 'BINANCE' },
  'BINANCE:SHIBUSDT': { name: 'Shiba Inu / USDT', type: 'crypto', exchange: 'BINANCE' },
  // Stocks
  AAPL: { name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
  MSFT: { name: 'Microsoft Corp.', type: 'stock', exchange: 'NASDAQ' },
  GOOGL: { name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ' },
  AMZN: { name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
  NVDA: { name: 'NVIDIA Corp.', type: 'stock', exchange: 'NASDAQ' },
  TSLA: { name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
  META: { name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ' },
  AMD: { name: 'Advanced Micro Devices', type: 'stock', exchange: 'NASDAQ' },
  NFLX: { name: 'Netflix Inc.', type: 'stock', exchange: 'NASDAQ' },
  INTC: { name: 'Intel Corp.', type: 'stock', exchange: 'NASDAQ' },
  CRM: { name: 'Salesforce Inc.', type: 'stock', exchange: 'NYSE' },
  UBER: { name: 'Uber Technologies', type: 'stock', exchange: 'NYSE' },
  PLTR: { name: 'Palantir Technologies', type: 'stock', exchange: 'NYSE' },
  SOFI: { name: 'SoFi Technologies', type: 'stock', exchange: 'NASDAQ' },
  COIN: { name: 'Coinbase Global Inc.', type: 'stock', exchange: 'NASDAQ' },
  MSTR: { name: 'MicroStrategy Inc.', type: 'stock', exchange: 'NASDAQ' },
  JPM: { name: 'JPMorgan Chase & Co.', type: 'stock', exchange: 'NYSE' },
  V: { name: 'Visa Inc.', type: 'stock', exchange: 'NYSE' },
  DIS: { name: 'Walt Disney Co.', type: 'stock', exchange: 'NYSE' },
  BA: { name: 'Boeing Co.', type: 'stock', exchange: 'NYSE' },
  WMT: { name: 'Walmart Inc.', type: 'stock', exchange: 'NYSE' },
  KO: { name: 'Coca-Cola Co.', type: 'stock', exchange: 'NYSE' },
  GS: { name: 'Goldman Sachs Group', type: 'stock', exchange: 'NYSE' },
  // ETFs
  SPY: { name: 'SPDR S&P 500 ETF Trust', type: 'etf', exchange: 'NYSE' },
  QQQ: { name: 'Invesco Nasdaq 100 ETF', type: 'etf', exchange: 'NASDAQ' },
  IWM: { name: 'iShares Russell 2000 ETF', type: 'etf', exchange: 'NYSE' },
  DIA: { name: 'SPDR Dow Jones ETF', type: 'etf', exchange: 'NYSE' },
  GLD: { name: 'SPDR Gold Shares ETF', type: 'etf', exchange: 'NYSE' },
  SLV: { name: 'iShares Silver Trust ETF', type: 'etf', exchange: 'NYSE' },
  USO: { name: 'United States Oil Fund', type: 'etf', exchange: 'NYSE' },
  TLT: { name: 'iShares 20+ Yr Treasury ETF', type: 'etf', exchange: 'NASDAQ' },
  XLF: { name: 'Financial Select Sector ETF', type: 'etf', exchange: 'NYSE' },
  XLE: { name: 'Energy Select Sector ETF', type: 'etf', exchange: 'NYSE' },
  XLK: { name: 'Technology Select Sector ETF', type: 'etf', exchange: 'NYSE' },
  ARKK: { name: 'ARK Innovation ETF', type: 'etf', exchange: 'NYSE' },
  BITO: { name: 'ProShares Bitcoin Strategy ETF', type: 'etf', exchange: 'NYSE' },
  IBIT: { name: 'iShares Bitcoin Trust ETF', type: 'etf', exchange: 'NASDAQ' },
  SOXL: { name: 'Direxion Semiconductor Bull 3X', type: 'etf', exchange: 'NYSE' },
  TQQQ: { name: 'ProShares UltraPro QQQ 3X', type: 'etf', exchange: 'NASDAQ' },
  SQQQ: { name: 'ProShares UltraPro Short QQQ', type: 'etf', exchange: 'NASDAQ' },
  EEM: { name: 'iShares Emerging Markets ETF', type: 'etf', exchange: 'NYSE' },
  VTI: { name: 'Vanguard Total Stock Market ETF', type: 'etf', exchange: 'NYSE' },
  VOO: { name: 'Vanguard S&P 500 ETF', type: 'etf', exchange: 'NYSE' },
  // Futures / Commodities
  WTI: { name: 'WTI Crude Oil', type: 'futures', exchange: 'NYMEX' },
  USOIL: { name: 'WTI Crude Oil', type: 'futures', exchange: 'NYMEX' },
  BRENT: { name: 'Brent Crude Oil', type: 'futures', exchange: 'ICE' },
  XAUUSD: { name: 'Gold', type: 'futures', exchange: 'COMEX' },
  GOLD: { name: 'Gold', type: 'futures', exchange: 'COMEX' },
  XAGUSD: { name: 'Silver', type: 'futures', exchange: 'COMEX' },
  SILVER: { name: 'Silver', type: 'futures', exchange: 'COMEX' },
  NATGAS: { name: 'Natural Gas', type: 'futures', exchange: 'NYMEX' },
  // Indices
  DXY: { name: 'US Dollar Index', type: 'index', exchange: 'ICE' },
  VIX: { name: 'CBOE Volatility Index', type: 'index', exchange: 'CBOE' },
  US30: { name: 'Dow Jones Industrial Avg', type: 'futures', exchange: 'CBOT' },
  US500: { name: 'S&P 500 E-mini', type: 'futures', exchange: 'CME' },
  NAS100: { name: 'Nasdaq 100 E-mini', type: 'futures', exchange: 'CME' },
  DOW: { name: 'Dow Jones Industrial Avg', type: 'futures', exchange: 'CBOT' },
};

export function getTickerInfo(ticker) {
  return TICKER_DATA[ticker] || TICKER_DATA[ticker.toUpperCase()] || null;
}

export function getTickerName(ticker) {
  const info = getTickerInfo(ticker);
  return info ? info.name : ticker;
}

export function getTickerList() {
  return Object.entries(TICKER_DATA).map(([symbol, data]) => ({ symbol, ...data }));
}
