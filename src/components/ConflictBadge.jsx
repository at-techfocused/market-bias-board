export default function ConflictBadge({ signals }) {
  const h4Score = signals?.['4H']?.score;
  const dScore = signals?.D?.score;
  const hasConflict = h4Score != null && dScore != null &&
    ((h4Score < 50 && dScore > 50) || (h4Score > 50 && dScore < 50));

  if (!hasConflict) return null;

  const h4Side = h4Score >= 50 ? 'bullish' : 'bearish';
  const dSide = dScore >= 50 ? 'bullish' : 'bearish';

  return (
    <div className="flex items-start gap-2" style={{ padding: '14px 16px' }}>
      <span style={{ color: 'var(--amber)', fontSize: 14, lineHeight: 1 }}>!</span>
      <span style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.5 }}>
        Conflict — 4H {h4Side}, Daily {dSide}. Signal capped at bias level. Await resolution before sizing in.
      </span>
    </div>
  );
}
