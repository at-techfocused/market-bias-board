// ── EMA (Exponential Moving Average) ──
export function calcEMA(closes, period) {
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
export function calcSMMA(closes, period = 99) {
  if (closes.length < period) return null;
  let smma = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    smma = (smma * (period - 1) + closes[i]) / period;
  }
  return smma;
}

// ── RSI (Relative Strength Index) ──
export function calcRSI(closes, period = 14) {
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
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ── ATR (Average True Range) ──
export function calcATR(highs, lows, closes, period = 14) {
  if (closes.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

// ── Bollinger Bands ──
export function calcBollingerBands(closes, period = 20, stdDevMultiplier = 2) {
  if (closes.length < period) return null;
  const recent = closes.slice(-period);
  const sma = recent.reduce((a, b) => a + b, 0) / period;
  const variance = recent.reduce((sum, c) => sum + (c - sma) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: sma + stdDevMultiplier * stdDev,
    middle: sma,
    lower: sma - stdDevMultiplier * stdDev,
  };
}

// ── MACD ──
export function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return null;
  const fastEMA = calcEMASeries(closes, fast);
  const slowEMA = calcEMASeries(closes, slow);
  // Align arrays — slowEMA starts later
  const offset = fast < slow ? slow - fast : 0;
  const macdLine = [];
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }
  if (macdLine.length < signal) return null;
  // Signal line is EMA of MACD line
  const k = 2 / (signal + 1);
  let sigEma = macdLine.slice(0, signal).reduce((a, b) => a + b, 0) / signal;
  for (let i = signal; i < macdLine.length; i++) {
    sigEma = macdLine[i] * k + sigEma * (1 - k);
  }
  const macd = macdLine[macdLine.length - 1];
  const histogram = macd - sigEma;
  return { macd, signal: sigEma, histogram };
}

// ── ADX (Average Directional Index) ──
export function calcADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2 + 1) return null;
  const plusDMs = [];
  const minusDMs = [];
  const trs = [];
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
    const dx = diSum !== 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    dxValues.push(dx);
  }
  if (dxValues.length < period) return null;
  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
  }
  return parseFloat(adx.toFixed(1));
}

// ── Volume Ratio (current vs 20-period average) ──
export function calcVolumeRatio(volumes) {
  if (!volumes || volumes.length < 21) return null;
  const recent = volumes[volumes.length - 1];
  const avg = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  if (avg === 0) return null;
  return parseFloat((recent / avg).toFixed(1));
}

// ── EMA Stack Alignment ──
export function getEMAStack(close, ema20, ema50, ema100, ema200) {
  if ([ema20, ema50, ema100, ema200].some((v) => v == null)) return 'MIXED';
  if (close > ema20 && ema20 > ema50 && ema50 > ema100 && ema100 > ema200) return 'BULL';
  if (close < ema20 && ema20 < ema50 && ema50 < ema100 && ema100 < ema200) return 'BEAR';
  return 'MIXED';
}

// ── SMMA Position ──
export function getSMMAPosition(close, smma) {
  if (smma == null) return 'BELOW';
  return close > smma ? 'ABOVE' : 'BELOW';
}

// ── RSI Zone ──
export function getRSIZone(rsi) {
  if (rsi == null) return 'NEUTRAL';
  if (rsi > 55) return 'BULLISH';
  if (rsi < 45) return 'BEARISH';
  return 'NEUTRAL';
}

// ── MACD Direction ──
export function getMACDDirection(macdData) {
  if (!macdData) return 'NEUTRAL';
  if (macdData.histogram > 0 && macdData.macd > macdData.signal) return 'BULL';
  if (macdData.histogram < 0 && macdData.macd < macdData.signal) return 'BEAR';
  return 'NEUTRAL';
}

// ── Pattern Detection ──
export function detectPattern(candles) {
  const len = candles.length;
  for (let i = len - 1; i >= Math.max(0, len - 3); i--) {
    const { o, h, l, c } = candles[i];
    const range = h - l;
    if (range === 0) continue;
    const body = Math.abs(c - o);
    const bodyRatio = body / range;

    if (bodyRatio < 0.10) {
      return { name: 'Doji', direction: 'NEUTRAL', symbol: '◆', type: 2, bodyPct: (bodyRatio * 100).toFixed(1), price: c };
    }
    if (bodyRatio > 0.90 && c > o) {
      return { name: 'Bullish Marubozu', direction: 'BULL', symbol: '▲', type: 1, bodyPct: (bodyRatio * 100).toFixed(1), price: c };
    }
    if (bodyRatio > 0.90 && c < o) {
      return { name: 'Bear Marubozu', direction: 'BEAR', symbol: '▼', type: 1, bodyPct: (bodyRatio * 100).toFixed(1), price: c };
    }
  }
  return null;
}

// ── Scoring (now includes MACD) ──
export function calcScore(emaStack, smmaPos, rsiZone, pattern, macdDir) {
  let score = 0;
  // EMA Stack: 20pts
  score += emaStack === 'BULL' ? 20 : emaStack === 'BEAR' ? 0 : 10;
  // SMMA 99: 20pts
  score += smmaPos === 'ABOVE' ? 20 : 0;
  // RSI Zone: 20pts
  score += rsiZone === 'BULLISH' ? 20 : rsiZone === 'BEARISH' ? 0 : 10;
  // MACD: 20pts
  score += macdDir === 'BULL' ? 20 : macdDir === 'BEAR' ? 0 : 10;
  // Pattern: 20pts
  if (pattern == null) {
    score += 10;
  } else {
    score += pattern.direction === 'BULL' ? 20 : pattern.direction === 'BEAR' ? 0 : 10;
  }
  return score;
}

export function getCompositeLabel(score) {
  if (score <= 25) return 'STRONG BEAR';
  if (score <= 40) return 'BEAR BIAS';
  if (score <= 60) return 'NEUTRAL';
  if (score <= 75) return 'BULL BIAS';
  return 'STRONG BULL';
}

export function getActionLabel(score) {
  if (score <= 20) return 'STRONG SHORT';
  if (score <= 35) return 'SHORT BIAS';
  if (score <= 45) return 'LEAN SHORT';
  if (score <= 55) return 'NEUTRAL';
  if (score <= 65) return 'LEAN LONG';
  if (score <= 80) return 'STRONG LONG';
  return 'STRONG LONG';
}

export function getCompositeDescription(label) {
  switch (label) {
    case 'STRONG BEAR': return 'High conviction bearish. Short on bounces. Trail stop tight.';
    case 'BEAR BIAS': return 'Majority of indicators bearish. Lean short, tighten any longs held.';
    case 'NEUTRAL': return 'Mixed signals across timeframes. Monitor closely.';
    case 'BULL BIAS': return 'Majority of indicators aligned bullish. Lean long, scale in with R.';
    case 'STRONG BULL': return 'High conviction. All indicators aligned bullish. Scale in with full R.';
    default: return '';
  }
}

// ── Compute all signals for a candle set ──
export function computeSignals(candles) {
  if (!candles || candles.length < 200) {
    return null;
  }

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
