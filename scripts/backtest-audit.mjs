#!/usr/bin/env node

/**
 * BiasBoard Backtest Audit
 *
 * Runs the scoring engine backtest across all tickers × 3 timeframes,
 * collects accuracy stats, and outputs a summary report.
 *
 * Usage:  node scripts/backtest-audit.mjs
 * Output: scripts/backtest-results.json + console summary table
 *
 * Options (env vars):
 *   TICKERS=AAPL,MSFT          Run only specific tickers
 *   TIMEFRAMES=4H,D            Run only specific timeframes (1H,4H,D)
 *   FORWARD=5                  Forward-look period (default: 5)
 *   BATCH_SIZE=3               Concurrent fetches per batch (default: 3)
 *   BATCH_DELAY=2000           Delay between batches in ms (default: 2000)
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Proxy support (Node fetch doesn't auto-use HTTP_PROXY) ───
let dispatcher;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
if (proxyUrl) {
  const { ProxyAgent } = await import('undici');
  dispatcher = new ProxyAgent(proxyUrl);
}
const fetchOpts = (headers = {}) => ({ headers: { 'User-Agent': 'Mozilla/5.0 BiasBoard-Audit/1.0', ...headers }, ...(dispatcher ? { dispatcher } : {}) });

// ─── Config ───
const FORWARD_BARS = parseInt(process.env.FORWARD || '5');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '3');
const BATCH_DELAY = parseInt(process.env.BATCH_DELAY || '2000');
const TF_KEYS = (process.env.TIMEFRAMES || '1H,4H,D').split(',');
const TF_RESOLUTION = { '1H': '60', '4H': '240', D: 'D' };

// Timeframe-scaled forward periods (variant B)
const TF_FORWARD = { '1H': 12, '4H': 5, D: 3 };

// Score delta lookback (how many windows back to measure momentum)
const DELTA_LOOKBACK = 5;

// ─── Yahoo symbol aliases ───
const YAHOO_ALIASES = {
  WTI: 'CL=F', USOIL: 'CL=F', BRENT: 'BZ=F', XAUUSD: 'GC=F',
  GOLD: 'GC=F', XAGUSD: 'SI=F', SILVER: 'SI=F', NATGAS: 'NG=F',
  DXY: 'DX-Y.NYB', US30: 'YM=F', US500: 'ES=F', NAS100: 'NQ=F',
  DOW: 'YM=F', VIX: '^VIX',
};

// ─── Ticker list (deduplicated — skip aliases that resolve to the same Yahoo symbol) ───
const TICKER_LIST = [
  // Crypto
  'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:SOLUSDT', 'BINANCE:BNBUSDT',
  'BINANCE:XRPUSDT', 'BINANCE:ADAUSDT', 'BINANCE:DOGEUSDT', 'BINANCE:AVAXUSDT',
  'BINANCE:DOTUSDT', 'BINANCE:MATICUSDT', 'BINANCE:LINKUSDT', 'BINANCE:ATOMUSDT',
  'BINANCE:LTCUSDT', 'BINANCE:NEARUSDT', 'BINANCE:UNIUSDT', 'BINANCE:APTUSDT',
  'BINANCE:ARUSDT', 'BINANCE:OPUSDT', 'BINANCE:ARBUSDT', 'BINANCE:SUIUSDT',
  'BINANCE:PEPEUSDT', 'BINANCE:WIFUSDT', 'BINANCE:FETUSDT', 'BINANCE:INJUSDT',
  'BINANCE:RENDERUSDT', 'BINANCE:TRXUSDT', 'BINANCE:SHIBUSDT',
  // Stocks
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'AMD', 'NFLX', 'INTC',
  'CRM', 'UBER', 'PLTR', 'SOFI', 'COIN', 'MSTR', 'JPM', 'V', 'DIS', 'BA',
  'WMT', 'KO', 'GS',
  // ETFs
  'SPY', 'QQQ', 'IWM', 'DIA', 'GLD', 'SLV', 'USO', 'TLT', 'XLF', 'XLE', 'XLK',
  'ARKK', 'BITO', 'IBIT', 'SOXL', 'TQQQ', 'SQQQ', 'EEM', 'VTI', 'VOO',
  // Futures / Commodities (deduplicated)
  'WTI', 'BRENT', 'XAUUSD', 'XAGUSD', 'NATGAS',
  // Indices
  'DXY', 'VIX', 'US500', 'NAS100',
];

// ─── Data Fetching ───

function isCrypto(ticker) { return ticker.includes(':'); }

function parseCryptoPair(pair) {
  const quoteAssets = ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'GBP', 'BTC', 'ETH', 'BNB'];
  for (const quote of quoteAssets) {
    if (pair.endsWith(quote) && pair.length > quote.length) {
      return { fsym: pair.slice(0, -quote.length), tsym: quote };
    }
  }
  return { fsym: pair.slice(0, -3), tsym: pair.slice(-3) };
}

function resolveYahooSymbol(ticker) {
  return YAHOO_ALIASES[ticker.toUpperCase()] || ticker;
}

function aggregateToFourHour(candles) {
  if (!candles || candles.length === 0) return [];
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

async function fetchCrypto(ticker, resolution) {
  const pair = ticker.split(':').pop();
  const { fsym, tsym } = parseCryptoPair(pair);
  const map = { '240': { endpoint: 'histohour', aggregate: 4 }, '60': { endpoint: 'histohour', aggregate: 1 }, D: { endpoint: 'histoday', aggregate: 1 } };
  const { endpoint, aggregate } = map[resolution] || map['240'];
  const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${fsym}&tsym=${tsym}&limit=300&aggregate=${aggregate}`;
  const res = await fetch(url, fetchOpts());
  const json = await res.json();
  if (!res.ok || json.Response === 'Error') throw new Error(json.Message || `CryptoCompare error`);
  const candles = json.Data?.Data;
  if (!candles?.length) throw new Error('No data');
  const valid = candles.filter((c) => c.volumefrom > 0 || c.volumeto > 0);
  if (!valid.length) throw new Error('No data');
  return valid.map((c) => ({ t: c.time, o: c.open, h: c.high, l: c.low, c: c.close, v: c.volumefrom }));
}

async function fetchYahoo(rawTicker, resolution) {
  const ticker = resolveYahooSymbol(rawTicker);
  const needsAggregation = resolution === '240';
  const configMap = { '60': { interval: '1h', range: '6mo' }, '240': { interval: '1h', range: '2y' }, D: { interval: '1d', range: '2y' } };
  const config = configMap[resolution] || configMap.D;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${config.interval}&range=${config.range}`;
  const res = await fetch(url, fetchOpts());
  if (!res.ok) throw new Error(`Yahoo error: ${res.status}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result?.timestamp) throw new Error('No data');
  const quote = result.indicators?.quote?.[0];
  if (!quote) throw new Error('No data');
  const indices = result.timestamp.map((_, i) => i).filter((i) => quote.close[i] != null && quote.open[i] != null);
  if (!indices.length) throw new Error('No data');
  const candles = indices.map((i) => ({ t: result.timestamp[i], o: quote.open[i], h: quote.high[i], l: quote.low[i], c: quote.close[i], v: quote.volume[i] || 0 }));
  return needsAggregation ? aggregateToFourHour(candles) : candles;
}

async function fetchCandles(ticker, resolution) {
  return isCrypto(ticker) ? fetchCrypto(ticker, resolution) : fetchYahoo(ticker, resolution);
}

// ─── Indicator Logic (copied from indicators.js to avoid ESM/browser issues) ───

function calcEMA(closes, period) {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) ema = closes[i] * k + ema * (1 - k);
  return ema;
}

function calcEMASeries(closes, period) {
  if (closes.length < period) return [];
  const k = 2 / (period + 1);
  const result = [];
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  for (let i = period; i < closes.length; i++) { ema = closes[i] * k + ema * (1 - k); result.push(ema); }
  return result;
}

function calcSMMA(closes, period = 99) {
  if (closes.length < period) return null;
  let smma = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) smma = (smma * (period - 1) + closes[i]) / period;
  return smma;
}

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) { const d = closes[i] - closes[i - 1]; if (d > 0) gains += d; else losses -= d; }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) { const d = closes[i] - closes[i - 1]; avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period; avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period; }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calcATR(highs, lows, closes, period = 14) {
  if (closes.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < closes.length; i++) trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period;
  return atr;
}

function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return null;
  const fastEMA = calcEMASeries(closes, fast);
  const slowEMA = calcEMASeries(closes, slow);
  const offset = slow - fast;
  const macdLine = slowEMA.map((s, i) => fastEMA[i + offset] - s);
  if (macdLine.length < signal) return null;
  const k = 2 / (signal + 1);
  let sigEma = macdLine.slice(0, signal).reduce((a, b) => a + b, 0) / signal;
  for (let i = signal; i < macdLine.length; i++) sigEma = macdLine[i] * k + sigEma * (1 - k);
  const macd = macdLine[macdLine.length - 1];
  return { macd, signal: sigEma, histogram: macd - sigEma };
}

function calcADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2 + 1) return null;
  const plusDMs = [], minusDMs = [], trs = [];
  for (let i = 1; i < highs.length; i++) {
    const up = highs[i] - highs[i - 1], down = lows[i - 1] - lows[i];
    plusDMs.push(up > down && up > 0 ? up : 0);
    minusDMs.push(down > up && down > 0 ? down : 0);
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let plusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let minusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const dxValues = [];
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    plusDM = (plusDM * (period - 1) + plusDMs[i]) / period;
    minusDM = (minusDM * (period - 1) + minusDMs[i]) / period;
    const plusDI = atr !== 0 ? (plusDM / atr) * 100 : 0;
    const minusDI = atr !== 0 ? (minusDM / atr) * 100 : 0;
    const diSum = plusDI + minusDI;
    dxValues.push(diSum !== 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0);
  }
  if (dxValues.length < period) return null;
  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxValues.length; i++) adx = (adx * (period - 1) + dxValues[i]) / period;
  return parseFloat(adx.toFixed(1));
}

function calcVolumeRatio(volumes) {
  if (!volumes || volumes.length < 21) return null;
  const avg = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  if (avg === 0) return null;
  return parseFloat((volumes[volumes.length - 1] / avg).toFixed(1));
}

// Classification
function getEMAStack(close, ema20, ema50, ema100, ema200) {
  if ([ema20, ema50, ema100, ema200].some((v) => v == null)) return 'MIXED';
  if (close > ema20 && ema20 > ema50 && ema50 > ema100 && ema100 > ema200) return 'BULL';
  if (close < ema20 && ema20 < ema50 && ema50 < ema100 && ema100 < ema200) return 'BEAR';
  return 'MIXED';
}
function getSMMAPosition(close, smma, atr) {
  if (smma == null) return 'BELOW';
  if (atr != null && Math.abs(close - smma) < atr * 0.5) return 'NEAR';
  return close > smma ? 'ABOVE' : 'BELOW';
}
function getRSIScore(rsi) {
  if (rsi == null) return 0.5;
  return Math.max(0, Math.min(1, (rsi - 30) / 40));
}
function getMACDDirection(macdData) {
  if (!macdData) return 'NEUTRAL';
  if (macdData.histogram > 0 && macdData.macd > macdData.signal) return 'BULL';
  if (macdData.histogram < 0 && macdData.macd < macdData.signal) return 'BEAR';
  return 'NEUTRAL';
}

// Pattern detection (simplified — just detect direction, name not needed for audit)
function candleBody(c) { return Math.abs(c.c - c.o); }
function candleRange(c) { return c.h - c.l; }
function isGreen(c) { return c.c > c.o; }
function isRed(c) { return c.c <= c.o; }
function bodyTop(c) { return Math.max(c.c, c.o); }
function bodyBot(c) { return Math.min(c.c, c.o); }
function bodyRatio(c) { const r = candleRange(c); return r === 0 ? 0 : candleBody(c) / r; }
function bodyMid(c) { return (bodyTop(c) + bodyBot(c)) / 2; }
function upperWick(c) { return c.h - bodyTop(c); }
function lowerWick(c) { return bodyBot(c) - c.l; }

function detectPattern(candles) {
  const len = candles.length;
  if (len < 3) return null;
  const c0 = candles[len - 1], c1 = candles[len - 2], c2 = candles[len - 3];
  const r0 = candleRange(c0), r1 = candleRange(c1), r2 = candleRange(c2);

  // Three-candle
  if (r0 > 0 && r1 > 0 && r2 > 0 && isGreen(c2) && isGreen(c1) && isGreen(c0) && c1.c > c2.c && c0.c > c1.c && bodyRatio(c2) > 0.4 && bodyRatio(c1) > 0.4 && bodyRatio(c0) > 0.4) return { direction: 'BULL' };
  if (r0 > 0 && r1 > 0 && r2 > 0 && isRed(c2) && isRed(c1) && isRed(c0) && c1.c < c2.c && c0.c < c1.c && bodyRatio(c2) > 0.4 && bodyRatio(c1) > 0.4 && bodyRatio(c0) > 0.4) return { direction: 'BEAR' };
  if (r0 > 0 && r1 > 0 && r2 > 0 && isRed(c2) && bodyRatio(c2) > 0.4 && bodyRatio(c1) < 0.3 && isGreen(c0) && bodyRatio(c0) > 0.4 && c0.c > bodyMid(c2)) return { direction: 'BULL' };
  if (r0 > 0 && r1 > 0 && r2 > 0 && isGreen(c2) && bodyRatio(c2) > 0.4 && bodyRatio(c1) < 0.3 && isRed(c0) && bodyRatio(c0) > 0.4 && c0.c < bodyMid(c2)) return { direction: 'BEAR' };

  // Two-candle
  if (r0 > 0 && r1 > 0 && isRed(c1) && isGreen(c0) && bodyBot(c0) < bodyBot(c1) && bodyTop(c0) > bodyTop(c1) && bodyRatio(c0) > 0.4) return { direction: 'BULL' };
  if (r0 > 0 && r1 > 0 && isGreen(c1) && isRed(c0) && bodyBot(c0) < bodyBot(c1) && bodyTop(c0) > bodyTop(c1) && bodyRatio(c0) > 0.4) return { direction: 'BEAR' };

  // Single-candle
  const body0 = candleBody(c0), br0 = bodyRatio(c0);
  if (r0 > 0) {
    if (br0 > 0.10 && br0 < 0.40 && lowerWick(c0) >= body0 * 2 && upperWick(c0) <= body0 * 0.5) return { direction: 'BULL' };
    if (br0 > 0.10 && br0 < 0.40 && upperWick(c0) >= body0 * 2 && lowerWick(c0) <= body0 * 0.5) return { direction: 'BEAR' };
    if (br0 > 0.90 && isGreen(c0)) return { direction: 'BULL' };
    if (br0 > 0.90 && isRed(c0)) return { direction: 'BEAR' };
    if (br0 < 0.10) return { direction: 'NEUTRAL' };
  }
  return null;
}

// EMA distance scoring (v2) — continuous 0.0-1.0
function getEMAScore(close, ema20, ema50, ema100, ema200, atr) {
  if ([ema20, ema50, ema100, ema200].some((v) => v == null)) return 0.5;
  const above = [ema20, ema50, ema100, ema200].filter((e) => close > e).length;
  const positionScore = above / 4;
  const pairs = [[ema20, ema50], [ema50, ema100], [ema100, ema200]];
  const bullOrder = pairs.filter(([a, b]) => a > b).length;
  const orderScore = bullOrder / 3;
  if (atr == null || atr === 0) return positionScore * 0.6 + orderScore * 0.4;
  const distFromEma200 = (close - ema200) / atr;
  const distScore = Math.max(0, Math.min(1, 0.5 + distFromEma200 / 8));
  return positionScore * 0.4 + orderScore * 0.35 + distScore * 0.25;
}

// Scoring — v1 (baseline, binary EMA)
function calcScoreV1(emaStack, smmaPos, rsiScore, pattern, macdDir, adx, volRatio) {
  const emaRaw = emaStack === 'BULL' ? 1 : emaStack === 'BEAR' ? 0 : 0.5;
  const smmaRaw = smmaPos === 'ABOVE' ? 1 : smmaPos === 'NEAR' ? 0.5 : 0;
  const rsiRaw = rsiScore;
  const macdRaw = macdDir === 'BULL' ? 1 : macdDir === 'BEAR' ? 0 : 0.5;

  let totalWeight = 80;
  let weightedSum = (emaRaw * 20) + (smmaRaw * 20) + (rsiRaw * 20) + (macdRaw * 20);

  if (pattern != null) {
    const patternRaw = pattern.direction === 'BULL' ? 1 : pattern.direction === 'BEAR' ? 0 : 0.5;
    weightedSum += patternRaw * 20;
    totalWeight += 20;
  }

  let baseScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 50;

  let adxMod = 1.0;
  if (adx != null) { if (adx < 15) adxMod = 0.6; else if (adx < 20) adxMod = 0.8; else if (adx >= 40) adxMod = 1.1; }
  let volMod = 1.0;
  if (volRatio != null) { if (volRatio < 0.5) volMod = 0.8; else if (volRatio < 0.8) volMod = 0.9; else if (volRatio >= 1.5) volMod = 1.1; }

  const deviation = baseScore - 50;
  return Math.round(Math.max(0, Math.min(100, 50 + deviation * adxMod * volMod)));
}

// Scoring — v2 (continuous EMA + extreme dampening)
function calcScoreV2(emaScore, smmaPos, rsiScore, pattern, macdDir, adx, volRatio) {
  const emaRaw = emaScore; // continuous 0.0–1.0
  const smmaRaw = smmaPos === 'ABOVE' ? 1 : smmaPos === 'NEAR' ? 0.5 : 0;
  const rsiRaw = rsiScore;
  const macdRaw = macdDir === 'BULL' ? 1 : macdDir === 'BEAR' ? 0 : 0.5;

  let totalWeight = 80;
  let weightedSum = (emaRaw * 20) + (smmaRaw * 20) + (rsiRaw * 20) + (macdRaw * 20);

  if (pattern != null) {
    const patternRaw = pattern.direction === 'BULL' ? 1 : pattern.direction === 'BEAR' ? 0 : 0.5;
    weightedSum += patternRaw * 20;
    totalWeight += 20;
  }

  let baseScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 50;

  let adxMod = 1.0;
  if (adx != null) { if (adx < 15) adxMod = 0.6; else if (adx < 20) adxMod = 0.8; else if (adx >= 40) adxMod = 1.1; }
  let volMod = 1.0;
  if (volRatio != null) { if (volRatio < 0.5) volMod = 0.8; else if (volRatio < 0.8) volMod = 0.9; else if (volRatio >= 1.5) volMod = 1.1; }

  const deviation = baseScore - 50;
  let finalScore = Math.round(Math.max(0, Math.min(100, 50 + deviation * adxMod * volMod)));

  // Extreme dampening
  if (finalScore > 75) finalScore = 75 + Math.round((finalScore - 75) * 0.4);
  else if (finalScore < 25) finalScore = 25 - Math.round((25 - finalScore) * 0.4);

  return finalScore;
}

// computeSignals returns BOTH v1 and v2 scores for A/B comparison
function computeSignals(candles) {
  if (!candles || candles.length < 200) return null;
  const closes = candles.map((c) => c.c);
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const volumes = candles.map((c) => c.v);
  const close = closes[closes.length - 1];

  const ema20 = calcEMA(closes, 20), ema50 = calcEMA(closes, 50), ema100 = calcEMA(closes, 100), ema200 = calcEMA(closes, 200);
  const smma99 = calcSMMA(closes, 99);
  const rsi = calcRSI(closes, 14);
  const atr = calcATR(highs, lows, closes, 14);
  const pattern = detectPattern(candles);
  const macdData = calcMACD(closes);
  const adx = calcADX(highs, lows, closes);
  const volRatio = calcVolumeRatio(volumes);

  const emaStack = getEMAStack(close, ema20, ema50, ema100, ema200);
  const emaScoreVal = getEMAScore(close, ema20, ema50, ema100, ema200, atr);
  const smmaPosition = getSMMAPosition(close, smma99, atr);
  const rsiScore = getRSIScore(rsi);
  const macdDirection = getMACDDirection(macdData);

  const scoreV1 = calcScoreV1(emaStack, smmaPosition, rsiScore, pattern, macdDirection, adx, volRatio);
  const scoreV2 = calcScoreV2(emaScoreVal, smmaPosition, rsiScore, pattern, macdDirection, adx, volRatio);

  return { score: scoreV1, scoreV2, close };
}

// ─── Backtest Runner ───

// Collects raw score (v1 + v2) + forward return data for a given forward period
function runBacktest(candles, lookForward) {
  if (!candles || candles.length < 201) return [];
  const results = [];
  for (let end = 200; end <= candles.length; end++) {
    const window = candles.slice(end - 200, end);
    const signals = computeSignals(window);
    if (!signals) continue;
    const current = candles[end - 1];
    let fwdReturn = null;
    if (end + lookForward <= candles.length) {
      fwdReturn = ((candles[end + lookForward - 1].c - current.c) / current.c) * 100;
    }
    results.push({ score: signals.score, scoreV2: signals.scoreV2, fwdReturn });
  }
  return results;
}

// ─── Strategy A: Baseline (absolute score > 50 = bull) ───
function analyzeBaseline(results) {
  const withFwd = results.filter((r) => r.fwdReturn != null);
  if (withFwd.length < 5) return null;

  let correct = 0;
  const zones = { strongBull: [], bull: [], neutral: [], bear: [], strongBear: [] };

  for (const r of withFwd) {
    const predicted = r.score > 50 ? 'bull' : r.score < 50 ? 'bear' : 'neutral';
    const actual = r.fwdReturn > 0 ? 'bull' : r.fwdReturn < 0 ? 'bear' : 'neutral';
    if (predicted === actual) correct++;

    if (r.score >= 70) zones.strongBull.push(r.fwdReturn);
    else if (r.score >= 55) zones.bull.push(r.fwdReturn);
    else if (r.score >= 45) zones.neutral.push(r.fwdReturn);
    else if (r.score >= 30) zones.bear.push(r.fwdReturn);
    else zones.strongBear.push(r.fwdReturn);
  }

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const bullSignals = withFwd.filter((r) => r.score >= 60);
  const bearSignals = withFwd.filter((r) => r.score <= 40);

  return {
    dataPoints: results.length,
    signalsWithForward: withFwd.length,
    accuracy: parseFloat(((correct / withFwd.length) * 100).toFixed(1)),
    bullWinRate: bullSignals.length ? parseFloat(((bullSignals.filter((r) => r.fwdReturn > 0).length / bullSignals.length) * 100).toFixed(1)) : null,
    bearWinRate: bearSignals.length ? parseFloat(((bearSignals.filter((r) => r.fwdReturn < 0).length / bearSignals.length) * 100).toFixed(1)) : null,
    zones: {
      strongBull: { count: zones.strongBull.length, avgReturn: parseFloat(avg(zones.strongBull).toFixed(3)) },
      bull: { count: zones.bull.length, avgReturn: parseFloat(avg(zones.bull).toFixed(3)) },
      neutral: { count: zones.neutral.length, avgReturn: parseFloat(avg(zones.neutral).toFixed(3)) },
      bear: { count: zones.bear.length, avgReturn: parseFloat(avg(zones.bear).toFixed(3)) },
      strongBear: { count: zones.strongBear.length, avgReturn: parseFloat(avg(zones.strongBear).toFixed(3)) },
    },
  };
}

// ─── Strategy B: Score Delta (predict based on score momentum) ───
// Combines absolute level + momentum: score > 50 AND delta > 0 → bull call
// Only measures accuracy on directional calls (skips neutral — "no trade" signal)
function analyzeScoreDelta(results) {
  const withFwd = results.filter((r) => r.fwdReturn != null);
  if (withFwd.length < DELTA_LOOKBACK + 1) return null;

  let correct = 0, directional = 0;
  let bullCorrect = 0, bullTotal = 0;
  let bearCorrect = 0, bearTotal = 0;
  let neutralCount = 0;

  for (let i = DELTA_LOOKBACK; i < withFwd.length; i++) {
    const current = withFwd[i];
    const past = withFwd[i - DELTA_LOOKBACK];
    const delta = current.score - past.score;
    const actual = current.fwdReturn > 0 ? 'bull' : 'bear';

    // Momentum + level combined signal
    if (delta > 0 && current.score >= 50) {
      directional++; bullTotal++;
      if (actual === 'bull') { correct++; bullCorrect++; }
    } else if (delta < 0 && current.score <= 50) {
      directional++; bearTotal++;
      if (actual === 'bear') { correct++; bearCorrect++; }
    } else {
      neutralCount++; // No trade signal — excluded from accuracy
    }
  }

  if (directional < 5) return null;
  const totalBars = withFwd.length - DELTA_LOOKBACK;

  return {
    dataPoints: results.length,
    signalsWithForward: directional,
    selectivity: parseFloat(((directional / totalBars) * 100).toFixed(1)), // % of bars that produce a signal
    accuracy: parseFloat(((correct / directional) * 100).toFixed(1)),
    bullWinRate: bullTotal ? parseFloat(((bullCorrect / bullTotal) * 100).toFixed(1)) : null,
    bearWinRate: bearTotal ? parseFloat(((bearCorrect / bearTotal) * 100).toFixed(1)) : null,
  };
}

// ─── Strategy E: V2 scoring (continuous EMA + extreme dampening) ───
// Uses scoreV2 field from results instead of score
function analyzeV2(results) {
  const withFwd = results.filter((r) => r.fwdReturn != null && r.scoreV2 != null);
  if (withFwd.length < 5) return null;

  let correct = 0;
  for (const r of withFwd) {
    const predicted = r.scoreV2 > 50 ? 'bull' : r.scoreV2 < 50 ? 'bear' : 'neutral';
    const actual = r.fwdReturn > 0 ? 'bull' : r.fwdReturn < 0 ? 'bear' : 'neutral';
    if (predicted === actual) correct++;
  }

  const bullSignals = withFwd.filter((r) => r.scoreV2 >= 60);
  const bearSignals = withFwd.filter((r) => r.scoreV2 <= 40);

  return {
    dataPoints: results.length,
    signalsWithForward: withFwd.length,
    accuracy: parseFloat(((correct / withFwd.length) * 100).toFixed(1)),
    bullWinRate: bullSignals.length ? parseFloat(((bullSignals.filter((r) => r.fwdReturn > 0).length / bullSignals.length) * 100).toFixed(1)) : null,
    bearWinRate: bearSignals.length ? parseFloat(((bearSignals.filter((r) => r.fwdReturn < 0).length / bearSignals.length) * 100).toFixed(1)) : null,
  };
}

// ─── Strategy F: V2 + Score Delta (best of both) ───
function analyzeV2Delta(results) {
  const withFwd = results.filter((r) => r.fwdReturn != null && r.scoreV2 != null);
  if (withFwd.length < DELTA_LOOKBACK + 1) return null;

  let correct = 0, directional = 0;
  let bullCorrect = 0, bullTotal = 0;
  let bearCorrect = 0, bearTotal = 0;

  for (let i = DELTA_LOOKBACK; i < withFwd.length; i++) {
    const current = withFwd[i];
    const past = withFwd[i - DELTA_LOOKBACK];
    const delta = current.scoreV2 - past.scoreV2;
    const actual = current.fwdReturn > 0 ? 'bull' : 'bear';

    if (delta > 0 && current.scoreV2 >= 50) {
      directional++; bullTotal++;
      if (actual === 'bull') { correct++; bullCorrect++; }
    } else if (delta < 0 && current.scoreV2 <= 50) {
      directional++; bearTotal++;
      if (actual === 'bear') { correct++; bearCorrect++; }
    }
  }

  if (directional < 5) return null;

  return {
    dataPoints: results.length,
    signalsWithForward: directional,
    accuracy: parseFloat(((correct / directional) * 100).toFixed(1)),
    bullWinRate: bullTotal ? parseFloat(((bullCorrect / bullTotal) * 100).toFixed(1)) : null,
    bearWinRate: bearTotal ? parseFloat(((bearCorrect / bearTotal) * 100).toFixed(1)) : null,
  };
}

// ─── Main ───

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function shortName(ticker) { return ticker.includes(':') ? ticker.split(':')[1] : ticker; }

async function main() {
  const filterTickers = process.env.TICKERS?.split(',').map((t) => t.trim());
  const tickers = filterTickers || TICKER_LIST;

  // Strategy names for reporting
  const STRATEGIES = ['baseline', 'scoreDelta', 'v2', 'v2+delta'];

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║       BiasBoard Backtest Audit — A/B Variant Test           ║`);
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║  Tickers:    ${String(tickers.length).padEnd(5)} Timeframes: ${TF_KEYS.join(', ').padEnd(20)} ║`);
  console.log(`║  Forward:    ${String(FORWARD_BARS).padEnd(5)} Delta LB:   ${String(DELTA_LOOKBACK).padEnd(20)} ║`);
  console.log(`║  Batch size: ${String(BATCH_SIZE).padEnd(5)}                                ║`);
  console.log(`║  Strategies: baseline | scoreDelta | v2 | v2+delta          ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

  // allResults[ticker][tf] = rawResults (each entry has score v1 + v2)
  const allResults = {};
  const errors = [];
  let completed = 0;
  const total = tickers.length;

  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (ticker) => {
      const tickerResults = {};
      for (const tf of TF_KEYS) {
        const res = TF_RESOLUTION[tf];
        try {
          const candles = await fetchCandles(ticker, res);
          // Run backtest twice: once with fixed forward, once with TF-scaled forward
          const backtestData = runBacktest(candles, FORWARD_BARS);
          tickerResults[tf] = backtestData;
        } catch (err) {
          tickerResults[tf] = null;
          errors.push({ ticker, tf, error: err.message });
        }
      }
      return { ticker, results: tickerResults };
    });

    const batchResults = await Promise.all(promises);
    for (const { ticker, results } of batchResults) {
      allResults[ticker] = results;
    }

    completed += batch.length;
    const pct = ((completed / total) * 100).toFixed(0);
    process.stdout.write(`\r  Progress: ${completed}/${total} (${pct}%) — ${batch.map(shortName).join(', ')}    `);

    if (i + BATCH_SIZE < tickers.length) await sleep(BATCH_DELAY);
  }

  console.log('\n');

  // ─── Analyze all strategies ───
  // For each strategy, build aggregate stats
  const stratAgg = {};
  for (const s of STRATEGIES) {
    stratAgg[s] = {
      overall: { accuracies: [], bullWins: [], bearWins: [] },
      byTimeframe: Object.fromEntries(TF_KEYS.map(tf => [tf, { accuracies: [], bullWins: [], bearWins: [] }])),
      byAssetType: {},
    };
  }

  // Per-ticker analyzed results for table output
  const analyzed = {}; // analyzed[ticker][tf] = { baseline, scoreDelta, v2, 'v2+delta' }

  for (const [ticker, tfResults] of Object.entries(allResults)) {
    analyzed[ticker] = {};
    const assetType = isCrypto(ticker) ? 'crypto' : (YAHOO_ALIASES[ticker.toUpperCase()] ? 'commodity' : 'equity');

    for (const tf of TF_KEYS) {
      const raw = tfResults[tf];
      if (!raw || !raw.length) { analyzed[ticker][tf] = null; continue; }

      const result = {
        baseline: analyzeBaseline(raw),             // A: v1 scoring (binary EMA, no dampening)
        scoreDelta: analyzeScoreDelta(raw),         // B: v1 + score delta signal
        v2: analyzeV2(raw),                         // C: continuous EMA + extreme dampening
        'v2+delta': analyzeV2Delta(raw),            // D: v2 + score delta
      };
      analyzed[ticker][tf] = result;

      // Aggregate per-strategy
      for (const s of STRATEGIES) {
        const stats = result[s];
        if (!stats) continue;
        if (!stratAgg[s].byAssetType[assetType]) stratAgg[s].byAssetType[assetType] = { accuracies: [], bullWins: [], bearWins: [] };

        stratAgg[s].overall.accuracies.push(stats.accuracy);
        stratAgg[s].byTimeframe[tf].accuracies.push(stats.accuracy);
        stratAgg[s].byAssetType[assetType].accuracies.push(stats.accuracy);
        if (stats.bullWinRate != null) {
          stratAgg[s].overall.bullWins.push(stats.bullWinRate);
          stratAgg[s].byTimeframe[tf].bullWins.push(stats.bullWinRate);
          stratAgg[s].byAssetType[assetType].bullWins.push(stats.bullWinRate);
        }
        if (stats.bearWinRate != null) {
          stratAgg[s].overall.bearWins.push(stats.bearWinRate);
          stratAgg[s].byTimeframe[tf].bearWins.push(stats.bearWinRate);
          stratAgg[s].byAssetType[assetType].bearWins.push(stats.bearWinRate);
        }
      }
    }
  }

  const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '--';

  // ─── Print A/B Comparison ───
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        STRATEGY A/B COMPARISON                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  ' + 'STRATEGY'.padEnd(20) + 'Accuracy'.padStart(10) + 'Bull Win'.padStart(10) + 'Bear Win'.padStart(10) + '  n');
  console.log('  ' + '─'.repeat(55));
  for (const s of STRATEGIES) {
    const d = stratAgg[s].overall;
    console.log(`  ${s.padEnd(20)}${(avg(d.accuracies) + '%').padStart(10)}${(avg(d.bullWins) + '%').padStart(10)}${(avg(d.bearWins) + '%').padStart(10)}  ${d.accuracies.length}`);
  }

  // Find winner
  const stratAccuracies = STRATEGIES.map(s => ({ name: s, acc: stratAgg[s].overall.accuracies.length ? parseFloat(avg(stratAgg[s].overall.accuracies)) : 0 }));
  stratAccuracies.sort((a, b) => b.acc - a.acc);
  const best = stratAccuracies[0];
  const baseline = stratAccuracies.find(s => s.name === 'baseline');
  console.log('');
  console.log(`  WINNER: ${best.name} (${best.acc}%)  vs baseline (${baseline.acc}%)  delta: ${(best.acc - baseline.acc).toFixed(1)}pp`);
  console.log('');

  // ─── Per-timeframe breakdown per strategy ───
  console.log('  BY TIMEFRAME:');
  console.log('  ' + 'TF'.padEnd(8) + STRATEGIES.map(s => s.padStart(16)).join(''));
  console.log('  ' + '─'.repeat(8 + STRATEGIES.length * 16));
  for (const tf of TF_KEYS) {
    let line = '  ' + tf.padEnd(8);
    for (const s of STRATEGIES) {
      const d = stratAgg[s].byTimeframe[tf];
      line += (avg(d.accuracies) + '%').padStart(16);
    }
    console.log(line);
  }
  console.log('');

  // ─── Per-asset-type breakdown per strategy ───
  console.log('  BY ASSET TYPE:');
  const assetTypes = [...new Set(STRATEGIES.flatMap(s => Object.keys(stratAgg[s].byAssetType)))];
  console.log('  ' + 'TYPE'.padEnd(12) + STRATEGIES.map(s => s.padStart(16)).join(''));
  console.log('  ' + '─'.repeat(12 + STRATEGIES.length * 16));
  for (const type of assetTypes) {
    let line = '  ' + type.padEnd(12);
    for (const s of STRATEGIES) {
      const d = stratAgg[s].byAssetType[type];
      line += (d ? avg(d.accuracies) + '%' : '--').padStart(16);
    }
    console.log(line);
  }
  console.log('');

  // ─── Per-ticker table (baseline vs best variant) ───
  const bestStrat = best.name;
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  PER-TICKER: baseline vs ${bestStrat}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ' + 'TICKER'.padEnd(16) + TF_KEYS.map(tf => `${tf} base`.padStart(8) + `${tf} best`.padStart(8)).join(''));
  console.log('  ' + '─'.repeat(16 + TF_KEYS.length * 16));

  for (const [ticker, tfResults] of Object.entries(analyzed)) {
    let line = '  ' + shortName(ticker).padEnd(16);
    for (const tf of TF_KEYS) {
      const r = tfResults[tf];
      if (r) {
        const bAcc = r.baseline?.accuracy;
        const vAcc = r[bestStrat]?.accuracy;
        line += (bAcc != null ? bAcc + '%' : 'FAIL').padStart(8);
        line += (vAcc != null ? vAcc + '%' : 'FAIL').padStart(8);
      } else {
        line += '    FAIL'.padStart(8) + '    FAIL'.padStart(8);
      }
    }
    console.log(line);
  }

  if (errors.length > 0) {
    console.log(`\n  ERRORS (${errors.length}):`);
    for (const e of errors.slice(0, 20)) {
      console.log(`    ${shortName(e.ticker)} ${e.tf}: ${e.error}`);
    }
    if (errors.length > 20) console.log(`    ... and ${errors.length - 20} more`);
  }

  // ─── Zone analysis for winning strategy (baseline only has zones) ───
  console.log('');
  console.log('  SCORE ZONE ANALYSIS (baseline — avg forward return per zone):');
  for (const tf of TF_KEYS) {
    const zoneAgg = { strongBull: [], bull: [], neutral: [], bear: [], strongBear: [] };
    for (const [, tfResults] of Object.entries(analyzed)) {
      const r = tfResults[tf]?.baseline;
      if (!r?.zones) continue;
      for (const z of Object.keys(zoneAgg)) {
        if (r.zones[z].count > 0) zoneAgg[z].push(r.zones[z].avgReturn);
      }
    }
    console.log(`    ${tf}:  strongBull(70+): ${avg(zoneAgg.strongBull)}%  bull(55-70): ${avg(zoneAgg.bull)}%  neutral(45-55): ${avg(zoneAgg.neutral)}%  bear(30-45): ${avg(zoneAgg.bear)}%  strongBear(<30): ${avg(zoneAgg.strongBear)}%`);
  }

  // ─── Save JSON ───
  const outputPath = join(__dirname, 'backtest-results.json');
  const output = {
    meta: {
      date: new Date().toISOString(),
      forwardBars: FORWARD_BARS,
      tfForward: TF_FORWARD,
      deltaLookback: DELTA_LOOKBACK,
      timeframes: TF_KEYS,
      tickerCount: tickers.length,
      errorCount: errors.length,
      strategies: STRATEGIES,
    },
    comparison: Object.fromEntries(STRATEGIES.map(s => [s, {
      overall: { accuracy: avg(stratAgg[s].overall.accuracies), bullWinRate: avg(stratAgg[s].overall.bullWins), bearWinRate: avg(stratAgg[s].overall.bearWins), count: stratAgg[s].overall.accuracies.length },
      byTimeframe: Object.fromEntries(TF_KEYS.map(tf => [tf, { accuracy: avg(stratAgg[s].byTimeframe[tf].accuracies), bullWinRate: avg(stratAgg[s].byTimeframe[tf].bullWins), bearWinRate: avg(stratAgg[s].byTimeframe[tf].bearWins), count: stratAgg[s].byTimeframe[tf].accuracies.length }])),
      byAssetType: Object.fromEntries(Object.entries(stratAgg[s].byAssetType).map(([t, d]) => [t, { accuracy: avg(d.accuracies), bullWinRate: avg(d.bullWins), bearWinRate: avg(d.bearWins), count: d.accuracies.length }])),
    }])),
    tickers: analyzed,
    errors,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n  Results saved to: ${outputPath}\n`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
