export default function ConflictBadge({ signals }) {
  if (!signals?.composite?.conflict) return null;

  const h4 = signals['4H'];
  const d = signals.D;
  const h4Side = h4?.score >= 50 ? 'bullish' : 'bearish';
  const dSide = d?.score >= 50 ? 'bullish' : 'bearish';

  return (
    <div
      className="mx-4 mt-2.5 px-3 py-2 rounded flex items-center gap-2 text-[10px] tracking-wide leading-relaxed"
      style={{
        background: '#3d2e0a',
        border: '1px solid #d29922',
        color: '#d29922',
      }}
    >
      <span className="text-[13px]">⚠</span>
      <div>
        <strong>Timeframe Conflict</strong> — Daily {dSide}, 4H {h4Side}. Await resolution before sizing in.
      </div>
    </div>
  );
}
