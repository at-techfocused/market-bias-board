export const TF_KEYS = ['1H', '4H', 'D'];
export const TF_DISPLAY = { '1H': '1H', '4H': '4H', D: 'DAILY' };

export function getBiasLabel(score) {
  if (score == null) return 'Neutral';
  if (score <= 40) return 'Bearish';
  if (score >= 60) return 'Bullish';
  return 'Neutral';
}

export function getBiasColor(score) {
  if (score == null) return 'var(--amber)';
  if (score <= 40) return 'var(--red)';
  if (score >= 60) return 'var(--green)';
  return 'var(--amber)';
}

export function fmtPrice(val) {
  if (val == null) return '--';
  if (val >= 10000) return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (val >= 100) return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}
