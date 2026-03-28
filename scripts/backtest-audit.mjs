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

// Scoring
function calcScore(emaStack, smmaPos, rsiScore, pattern, macdDir, adx, volRatio) {
  const emaRaw = emaStack === 'BULL' ? 1 : emaStack === 'BEAR' ? 0 : 0.5;
  const smmaRaw = smmaPos === 'ABOVE' ? 1 : smmaPos === 'NEAR' ? 0.5 : 0;
  const rsiRaw = rsiScore;
  const macdRaw = macdDir === 'BULL' ? 1 : macdDir === 'BEAR' ? 0 : 0.5;

  let totalWeight = 80; // 4 components × 20
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
  const smmaPosition = getSMMAPosition(close, smma99, atr);
  const rsiScore = getRSIScore(rsi);
  const macdDirection = getMACDDirection(macdData);
  const score = calcScore(emaStack, smmaPosition, rsiScore, pattern, macdDirection, adx, volRatio);

  return { score, close };
}

// ─── Backtest Runner ───

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
    results.push({ score: signals.score, fwdReturn });
  }
  return results;
}

function analyzeResults(results) {
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
  const scores = results.map((r) => r.score);
  const bullSignals = withFwd.filter((r) => r.score >= 60);
  const bearSignals = withFwd.filter((r) => r.score <= 40);

  return {
    dataPoints: results.length,
    signalsWithForward: withFwd.length,
    accuracy: parseFloat(((correct / withFwd.length) * 100).toFixed(1)),
    avgScore: Math.round(avg(scores)),
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
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

// ─── Main ───

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function shortName(ticker) { return ticker.includes(':') ? ticker.split(':')[1] : ticker; }

async function main() {
  const filterTickers = process.env.TICKERS?.split(',').map((t) => t.trim());
  const tickers = filterTickers || TICKER_LIST;

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║       BiasBoard Backtest Audit                   ║`);
  console.log(`╠══════════════════════════════════════════════════╣`);
  console.log(`║  Tickers:    ${String(tickers.length).padEnd(5)} Timeframes: ${TF_KEYS.join(', ').padEnd(13)} ║`);
  console.log(`║  Forward:    ${String(FORWARD_BARS).padEnd(5)} Batch size: ${String(BATCH_SIZE).padEnd(13)} ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);

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
          const backtestData = runBacktest(candles, FORWARD_BARS);
          const stats = analyzeResults(backtestData);
          tickerResults[tf] = stats;
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

  // ─── Aggregate stats ───
  const aggregate = { byTimeframe: {}, byAssetType: {}, overall: { accuracies: [], bullWins: [], bearWins: [] } };

  for (const tf of TF_KEYS) {
    aggregate.byTimeframe[tf] = { accuracies: [], bullWins: [], bearWins: [] };
  }

  for (const [ticker, tfResults] of Object.entries(allResults)) {
    const assetType = isCrypto(ticker) ? 'crypto' : (YAHOO_ALIASES[ticker.toUpperCase()] ? 'commodity' : 'equity');
    if (!aggregate.byAssetType[assetType]) aggregate.byAssetType[assetType] = { accuracies: [], bullWins: [], bearWins: [] };

    for (const tf of TF_KEYS) {
      const stats = tfResults[tf];
      if (!stats) continue;
      aggregate.byTimeframe[tf].accuracies.push(stats.accuracy);
      aggregate.byAssetType[assetType].accuracies.push(stats.accuracy);
      aggregate.overall.accuracies.push(stats.accuracy);
      if (stats.bullWinRate != null) {
        aggregate.byTimeframe[tf].bullWins.push(stats.bullWinRate);
        aggregate.byAssetType[assetType].bullWins.push(stats.bullWinRate);
        aggregate.overall.bullWins.push(stats.bullWinRate);
      }
      if (stats.bearWinRate != null) {
        aggregate.byTimeframe[tf].bearWins.push(stats.bearWinRate);
        aggregate.byAssetType[assetType].bearWins.push(stats.bearWinRate);
        aggregate.overall.bearWins.push(stats.bearWinRate);
      }
    }
  }

  const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '--';

  // ─── Print Summary ───
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AGGREGATE RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Overall Accuracy:   ${avg(aggregate.overall.accuracies)}%  (${aggregate.overall.accuracies.length} ticker-TF combos)`);
  console.log(`  Bull Win Rate:      ${avg(aggregate.overall.bullWins)}%`);
  console.log(`  Bear Win Rate:      ${avg(aggregate.overall.bearWins)}%`);
  console.log('');

  console.log('  BY TIMEFRAME:');
  for (const tf of TF_KEYS) {
    const d = aggregate.byTimeframe[tf];
    console.log(`    ${tf.padEnd(6)} Accuracy: ${avg(d.accuracies).padStart(5)}%   Bull: ${avg(d.bullWins).padStart(5)}%   Bear: ${avg(d.bearWins).padStart(5)}%   (n=${d.accuracies.length})`);
  }
  console.log('');

  console.log('  BY ASSET TYPE:');
  for (const [type, d] of Object.entries(aggregate.byAssetType)) {
    console.log(`    ${type.padEnd(12)} Accuracy: ${avg(d.accuracies).padStart(5)}%   Bull: ${avg(d.bullWins).padStart(5)}%   Bear: ${avg(d.bearWins).padStart(5)}%   (n=${d.accuracies.length})`);
  }
  console.log('');

  // Per-ticker table
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PER-TICKER BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ' + 'TICKER'.padEnd(16) + TF_KEYS.map((tf) => `${tf} Acc`.padStart(8) + `${tf} Bull`.padStart(9) + `${tf} Bear`.padStart(9)).join(''));
  console.log('  ' + '─'.repeat(16 + TF_KEYS.length * 26));

  for (const [ticker, tfResults] of Object.entries(allResults)) {
    let line = '  ' + shortName(ticker).padEnd(16);
    for (const tf of TF_KEYS) {
      const s = tfResults[tf];
      if (s) {
        line += `${String(s.accuracy + '%').padStart(8)}${String((s.bullWinRate ?? '--') + '%').padStart(9)}${String((s.bearWinRate ?? '--') + '%').padStart(9)}`;
      } else {
        line += '    FAIL'.padStart(8) + '        --'.padStart(9) + '        --'.padStart(9);
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

  // ─── Save JSON ───
  const outputPath = join(__dirname, 'backtest-results.json');
  const output = {
    meta: {
      date: new Date().toISOString(),
      forwardBars: FORWARD_BARS,
      timeframes: TF_KEYS,
      tickerCount: tickers.length,
      errorCount: errors.length,
    },
    aggregate: {
      overall: { accuracy: avg(aggregate.overall.accuracies), bullWinRate: avg(aggregate.overall.bullWins), bearWinRate: avg(aggregate.overall.bearWins) },
      byTimeframe: Object.fromEntries(TF_KEYS.map((tf) => [tf, { accuracy: avg(aggregate.byTimeframe[tf].accuracies), bullWinRate: avg(aggregate.byTimeframe[tf].bullWins), bearWinRate: avg(aggregate.byTimeframe[tf].bearWins), count: aggregate.byTimeframe[tf].accuracies.length }])),
      byAssetType: Object.fromEntries(Object.entries(aggregate.byAssetType).map(([t, d]) => [t, { accuracy: avg(d.accuracies), bullWinRate: avg(d.bullWins), bearWinRate: avg(d.bearWins), count: d.accuracies.length }])),
    },
    tickers: allResults,
    errors,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n  Results saved to: ${outputPath}\n`);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
