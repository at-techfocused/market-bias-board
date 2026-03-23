export default function ConflictBadge({ signals }) {
  if (!signals?.composite?.conflict) return null;

  const h4 = signals['4H'];
  const d = signals.D;
  const h4Side = h4?.score >= 50 ? 'bullish' : 'bearish';
  const dSide = d?.score >= 50 ? 'bullish' : 'bearish';

  return (
    <div
      className="mx-5 mt-3 px-4 py-2.5 rounded flex items-center gap-2.5 text-[12px] tracking-wide leading-relaxed"
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
