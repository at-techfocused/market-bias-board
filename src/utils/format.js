// ── Shared bias helpers & formatters ──
// Single source of truth — used by CompositeScore, SignalPanel, TimeframePanel, PatternCard

export const TF_KEYS = ['1H', '4H', 'D'];
export const TF_DISPLAY = { '1H': '1H', '4H': '4H', D: 'DAILY' };

export function getBiasLabel(score) {
  if (score == null) return 'NEUTRAL';
  if (score <= 40) return 'BEARISH';
  if (score >= 60) return 'BULLISH';
  return 'NEUTRAL';
}

export function getBiasColor(score) {
  if (score == null) return '#636e7b';
  if (score <= 40) return '#f85149';
  if (score >= 60) return '#3fb950';
  return '#d29922';
}

export function fmtPrice(val) {
  if (val == null) return '--';
  if (val >= 10000) return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (val >= 100) return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}
