// ── EMA (Exponential Moving Average) ──
function calcEMA(closes, period) {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

// ── EMA Series (returns array for MACD) ──
function calcEMASeries(closes, period) {
  if (closes.length < period) return [];
  const k = 2 / (period + 1);
  const result = [];
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

// ── SMMA (Smoothed Moving Average) ──
function calcSMMA(closes, period = 99) {
  if (closes.length < period) return null;
  let smma = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    smma = (smma * (period - 1) + closes[i]) / period;
  }
  return smma;
}

// ── RSI (Relative Strength Index) ──
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

// ── ATR (Average True Range) ──
function calcATR(highs, lows, closes, period = 14) {
  if (closes.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

// ── Bollinger Bands ──
function calcBollingerBands(closes, period = 20, mult = 2) {
  if (closes.length < period) return null;
  const recent = closes.slice(-period);
  const sma = recent.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(recent.reduce((sum, c) => sum + (c - sma) ** 2, 0) / period);
  return { upper: sma + mult * stdDev, middle: sma, lower: sma - mult * stdDev };
}

// ── MACD ──
function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return null;
  const fastEMA = calcEMASeries(closes, fast);
  const slowEMA = calcEMASeries(closes, slow);
  const offset = slow - fast;
  const macdLine = slowEMA.map((s, i) => fastEMA[i + offset] - s);
  if (macdLine.length < signal) return null;
  const k = 2 / (signal + 1);
  let sigEma = macdLine.slice(0, signal).reduce((a, b) => a + b, 0) / signal;
  for (let i = signal; i < macdLine.length; i++) {
    sigEma = macdLine[i] * k + sigEma * (1 - k);
  }
  const macd = macdLine[macdLine.length - 1];
  return { macd, signal: sigEma, histogram: macd - sigEma };
}

// ── ADX (Average Directional Index) ──
function calcADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2 + 1) return null;
  const plusDMs = [], minusDMs = [], trs = [];
  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
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
  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
  }
  return parseFloat(adx.toFixed(1));
}

// ── Volume Ratio (current vs 20-period average) ──
function calcVolumeRatio(volumes) {
  if (!volumes || volumes.length < 21) return null;
  const avg = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  if (avg === 0) return null;
  return parseFloat((volumes[volumes.length - 1] / avg).toFixed(1));
}

// ── Classification helpers ──
function getEMAStack(close, ema20, ema50, ema100, ema200) {
  if ([ema20, ema50, ema100, ema200].some((v) => v == null)) return 'MIXED';
  if (close > ema20 && ema20 > ema50 && ema50 > ema100 && ema100 > ema200) return 'BULL';
  if (close < ema20 && ema20 < ema50 && ema50 < ema100 && ema100 < ema200) return 'BEAR';
  return 'MIXED';
}

function getSMMAPosition(close, smma) {
  return smma == null || close <= smma ? 'BELOW' : 'ABOVE';
}

function getRSIZone(rsi) {
  if (rsi == null) return 'NEUTRAL';
  if (rsi > 55) return 'BULLISH';
  if (rsi < 45) return 'BEARISH';
  return 'NEUTRAL';
}

function getMACDDirection(macdData) {
  if (!macdData) return 'NEUTRAL';
  if (macdData.histogram > 0 && macdData.macd > macdData.signal) return 'BULL';
  if (macdData.histogram < 0 && macdData.macd < macdData.signal) return 'BEAR';
  return 'NEUTRAL';
}

// ── Pattern Detection (20 candlestick patterns) ──
// Helpers
function candleBody(c) { return Math.abs(c.c - c.o); }
function candleRange(c) { return c.h - c.l; }
function isGreen(c) { return c.c > c.o; }
function isRed(c) { return c.c <= c.o; }
function bodyTop(c) { return Math.max(c.c, c.o); }
function bodyBot(c) { return Math.min(c.c, c.o); }
function upperWick(c) { return c.h - bodyTop(c); }
function lowerWick(c) { return bodyBot(c) - c.l; }
function bodyRatio(c) { const r = candleRange(c); return r === 0 ? 0 : candleBody(c) / r; }
function bodyMid(c) { return (bodyTop(c) + bodyBot(c)) / 2; }
function pctStr(c) { return (bodyRatio(c) * 100).toFixed(1); }

function detectPattern(candles) {
  const len = candles.length;
  if (len < 3) return null;

  const c0 = candles[len - 1]; // most recent
  const c1 = candles[len - 2]; // prior
  const c2 = candles[len - 3]; // two back
  const r0 = candleRange(c0);
  const r1 = candleRange(c1);
  const r2 = candleRange(c2);

  // ── Three-candle patterns (highest priority) ──

  // Three White Soldiers: 3 consecutive green candles, each closing higher, each opening within prior body
  if (r0 > 0 && r1 > 0 && r2 > 0 &&
      isGreen(c2) && isGreen(c1) && isGreen(c0) &&
      c1.c > c2.c && c0.c > c1.c &&
      c1.o >= bodyBot(c2) && c1.o <= bodyTop(c2) &&
      c0.o >= bodyBot(c1) && c0.o <= bodyTop(c1) &&
      bodyRatio(c2) > 0.4 && bodyRatio(c1) > 0.4 && bodyRatio(c0) > 0.4) {
    return { name: 'Three White Soldiers', direction: 'BULL', symbol: '\u25B2\u25B2\u25B2', type: 1, bodyPct: pctStr(c0), price: c0.c };
  }

  // Three Black Crows: 3 consecutive red candles, each closing lower, each opening within prior body
  if (r0 > 0 && r1 > 0 && r2 > 0 &&
      isRed(c2) && isRed(c1) && isRed(c0) &&
      c1.c < c2.c && c0.c < c1.c &&
      c1.o <= bodyTop(c2) && c1.o >= bodyBot(c2) &&
      c0.o <= bodyTop(c1) && c0.o >= bodyBot(c1) &&
      bodyRatio(c2) > 0.4 && bodyRatio(c1) > 0.4 && bodyRatio(c0) > 0.4) {
    return { name: 'Three Black Crows', direction: 'BEAR', symbol: '\u25BC\u25BC\u25BC', type: 1, bodyPct: pctStr(c0), price: c0.c };
  }

  // Morning Star: red → small body → green closing above midpoint of first
  if (r0 > 0 && r1 > 0 && r2 > 0 &&
      isRed(c2) && bodyRatio(c2) > 0.4 &&
      bodyRatio(c1) < 0.3 &&
      isGreen(c0) && bodyRatio(c0) > 0.4 &&
      c0.c > bodyMid(c2)) {
    return { name: 'Morning Star', direction: 'BULL', symbol: '\u2606', type: 1, bodyPct: pctStr(c0), price: c0.c };
  }

  // Evening Star: green → small body → red closing below midpoint of first
  if (r0 > 0 && r1 > 0 && r2 > 0 &&
      isGreen(c2) && bodyRatio(c2) > 0.4 &&
      bodyRatio(c1) < 0.3 &&
      isRed(c0) && bodyRatio(c0) > 0.4 &&
      c0.c < bodyMid(c2)) {
    return { name: 'Evening Star', direction: 'BEAR', symbol: '\u2605', type: 1, bodyPct: pctStr(c0), price: c0.c };
  }

  // Three Inside Up: bearish harami (large red → small green inside) → green close above first candle's high
  if (r0 > 0 && r1 > 0 && r2 > 0 &&
      isRed(c2) && bodyRatio(c2) > 0.4 &&
      isGreen(c1) && candleBody(c1) < candleBody(c2) &&
      bodyTop(c1) <= bodyTop(c2) && bodyBot(c1) >= bodyBot(c2) &&
      isGreen(c0) && c0.c > c2.h) {
    return { name: 'Three Inside Up', direction: 'BULL', symbol: '\u25B3', type: 1, bodyPct: pctStr(c0), price: c0.c };
  }

  // Three Inside Down: bullish harami (large green → small red inside) → red close below first candle's low
  if (r0 > 0 && r1 > 0 && r2 > 0 &&
      isGreen(c2) && bodyRatio(c2) > 0.4 &&
      isRed(c1) && candleBody(c1) < candleBody(c2) &&
      bodyTop(c1) <= bodyTop(c2) && bodyBot(c1) >= bodyBot(c2) &&
      isRed(c0) && c0.c < c2.l) {
    return { name: 'Three Inside Down', direction: 'BEAR', symbol: '\u25BD', type: 1, bodyPct: pctStr(c0), price: c0.c };
  }

  // Bullish Abandoned Baby: red → doji gaps below → green gaps above
  if (r0 > 0 && r1 > 0 && r2 > 0 &&
      isRed(c2) && bodyRatio(c2) > 0.4 &&
      bodyRatio(c1) < 0.10 &&
      c1.h < c2.l && c0.l > c1.h &&
      isGreen(c0)) {
    return { name: 'Bullish Abandoned Baby', direction: 'BULL', symbol: '\u2740', type: 1, bodyPct: pctStr(c1), price: c0.c };
  }

  // Bearish Abandoned Baby: green → doji gaps above → red gaps below
  if (r0 > 0 && r1 > 0 && r2 > 0 &&
      isGreen(c2) && bodyRatio(c2) > 0.4 &&
      bodyRatio(c1) < 0.10 &&
      c1.l > c2.h && c0.h < c1.l &&
      isRed(c0)) {
    return { name: 'Bearish Abandoned Baby', direction: 'BEAR', symbol: '\u2740', type: 1, bodyPct: pctStr(c1), price: c0.c };
  }

  // ── Two-candle patterns ──

  // Bullish Engulfing: red candle → green candle whose body fully engulfs prior body
  if (r0 > 0 && r1 > 0 &&
      isRed(c1) && isGreen(c0) &&
      bodyBot(c0) < bodyBot(c1) && bodyTop(c0) > bodyTop(c1) &&
      bodyRatio(c0) > 0.4) {
    return { name: 'Bullish Engulfing', direction: 'BULL', symbol: '\u25B2', type: 1, bodyPct: pctStr(c0), price: c0.c };
  }

  // Bearish Engulfing: green candle → red candle whose body fully engulfs prior body
  if (r0 > 0 && r1 > 0 &&
      isGreen(c1) && isRed(c0) &&
      bodyBot(c0) < bodyBot(c1) && bodyTop(c0) > bodyTop(c1) &&
      bodyRatio(c0) > 0.4) {
    return { name: 'Bearish Engulfing', direction: 'BEAR', symbol: '\u25BC', type: 1, bodyPct: pctStr(c0), price: c0.c };
  }

  // Piercing Line: red candle → green candle opens below prior low, closes above prior midpoint
  if (r0 > 0 && r1 > 0 &&
      isRed(c1) && bodyRatio(c1) > 0.4 &&
      isGreen(c0) && c0.o < c1.l && c0.c > bodyMid(c1) && c0.c < bodyTop(c1)) {
    return { name: 'Piercing Line', direction: 'BULL', symbol: '\u2197', type: 2, bodyPct: pctStr(c0), price: c0.c };
  }

  // Dark Cloud Cover: green candle → red candle opens above prior high, closes below prior midpoint
  if (r0 > 0 && r1 > 0 &&
      isGreen(c1) && bodyRatio(c1) > 0.4 &&
      isRed(c0) && c0.o > c1.h && c0.c < bodyMid(c1) && c0.c > bodyBot(c1)) {
    return { name: 'Dark Cloud Cover', direction: 'BEAR', symbol: '\u2198', type: 2, bodyPct: pctStr(c0), price: c0.c };
  }

  // Bullish Harami: large red candle → small green candle contained within prior body
  if (r0 > 0 && r1 > 0 &&
      isRed(c1) && bodyRatio(c1) > 0.5 &&
      isGreen(c0) && candleBody(c0) < candleBody(c1) * 0.6 &&
      bodyTop(c0) <= bodyTop(c1) && bodyBot(c0) >= bodyBot(c1)) {
    return { name: 'Bullish Harami', direction: 'BULL', symbol: '\u25CB', type: 2, bodyPct: pctStr(c0), price: c0.c };
  }

  // Bearish Harami: large green candle → small red candle contained within prior body
  if (r0 > 0 && r1 > 0 &&
      isGreen(c1) && bodyRatio(c1) > 0.5 &&
      isRed(c0) && candleBody(c0) < candleBody(c1) * 0.6 &&
      bodyTop(c0) <= bodyTop(c1) && bodyBot(c0) >= bodyBot(c1)) {
    return { name: 'Bearish Harami', direction: 'BEAR', symbol: '\u25CF', type: 2, bodyPct: pctStr(c0), price: c0.c };
  }

  // Tweezer Bottom: two candles with nearly equal lows, second closes green
  if (r0 > 0 && r1 > 0 &&
      isRed(c1) && isGreen(c0) &&
      Math.abs(c1.l - c0.l) / r1 < 0.05 &&
      bodyRatio(c0) > 0.3 && bodyRatio(c1) > 0.3) {
    return { name: 'Tweezer Bottom', direction: 'BULL', symbol: '\u2AE1', type: 2, bodyPct: pctStr(c0), price: c0.c };
  }

  // ── Single-candle patterns ──
  const body0 = candleBody(c0);
  const br0 = bodyRatio(c0);

  if (r0 > 0) {
    // Hammer: small body at top, lower wick >= 2x body, upper wick minimal
    if (br0 > 0.10 && br0 < 0.40 &&
        lowerWick(c0) >= body0 * 2 &&
        upperWick(c0) <= body0 * 0.5) {
      return { name: 'Hammer', direction: 'BULL', symbol: '\u{1F528}', type: 2, bodyPct: pctStr(c0), price: c0.c };
    }

    // Shooting Star: small body at bottom, upper wick >= 2x body, lower wick minimal
    if (br0 > 0.10 && br0 < 0.40 &&
        upperWick(c0) >= body0 * 2 &&
        lowerWick(c0) <= body0 * 0.5) {
      return { name: 'Shooting Star', direction: 'BEAR', symbol: '\u2604', type: 2, bodyPct: pctStr(c0), price: c0.c };
    }

    // Bullish Marubozu: body > 90%, green
    if (br0 > 0.90 && isGreen(c0)) {
      return { name: 'Bullish Marubozu', direction: 'BULL', symbol: '\u25B2', type: 1, bodyPct: pctStr(c0), price: c0.c };
    }

    // Bear Marubozu: body > 90%, red
    if (br0 > 0.90 && isRed(c0)) {
      return { name: 'Bear Marubozu', direction: 'BEAR', symbol: '\u25BC', type: 1, bodyPct: pctStr(c0), price: c0.c };
    }

    // Doji: body < 10%
    if (br0 < 0.10) {
      return { name: 'Doji', direction: 'NEUTRAL', symbol: '\u25C6', type: 2, bodyPct: pctStr(c0), price: c0.c };
    }
  }

  return null;
}

// ── Scoring ──
// MIXED EMA gets only 5/20 to prevent false high scores
function calcScore(emaStack, smmaPos, rsiZone, pattern, macdDir) {
  let score = 0;
  score += emaStack === 'BULL' ? 20 : emaStack === 'BEAR' ? 0 : 5;
  score += smmaPos === 'ABOVE' ? 20 : 0;
  score += rsiZone === 'BULLISH' ? 20 : rsiZone === 'BEARISH' ? 0 : 10;
  score += macdDir === 'BULL' ? 20 : macdDir === 'BEAR' ? 0 : 10;
  score += pattern == null ? 10 : pattern.direction === 'BULL' ? 20 : pattern.direction === 'BEAR' ? 0 : 10;
  return score;
}

// ── Compute all signals for a candle set ──
export function computeSignals(candles) {
  if (!candles || candles.length < 200) return null;

  const closes = candles.map((c) => c.c);
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const volumes = candles.map((c) => c.v);
  const close = closes[closes.length - 1];

  const ema20 = calcEMA(closes, 20);
  const ema50 = calcEMA(closes, 50);
  const ema100 = calcEMA(closes, 100);
  const ema200 = calcEMA(closes, 200);
  const smma99 = calcSMMA(closes, 99);
  const rsi = calcRSI(closes, 14);
  const atr = calcATR(highs, lows, closes, 14);
  const bb = calcBollingerBands(closes);
  const pattern = detectPattern(candles);
  const macdData = calcMACD(closes);
  const adx = calcADX(highs, lows, closes);
  const volRatio = calcVolumeRatio(volumes);

  const emaStack = getEMAStack(close, ema20, ema50, ema100, ema200);
  const smmaPosition = getSMMAPosition(close, smma99);
  const rsiZone = getRSIZone(rsi);
  const macdDirection = getMACDDirection(macdData);
  const score = calcScore(emaStack, smmaPosition, rsiZone, pattern, macdDirection);

  const atrPct = atr != null ? (atr / close) * 100 : null;
  const bbPct = bb != null ? ((close - bb.lower) / (bb.upper - bb.lower)) * 100 : null;

  return {
    emaStack,
    ema: { ema20, ema50, ema100, ema200 },
    smma99: smmaPosition,
    smma99Value: smma99,
    rsi: rsi != null ? parseFloat(rsi.toFixed(1)) : null,
    rsiZone,
    pattern,
    macd: macdData,
    macdDirection,
    adx,
    volRatio,
    score,
    atr,
    atrPct: atrPct != null ? parseFloat(atrPct.toFixed(2)) : null,
    bbPct: bbPct != null ? parseFloat(bbPct.toFixed(0)) : null,
    close,
  };
}
