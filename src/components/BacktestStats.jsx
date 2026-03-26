import { useMemo } from 'react';
import { getScoreColor } from '../utils/format';

function StatBox({ label, value, sub, color }) {
  return (
    <div className="rounded-[5px] py-2 px-2.5 text-center"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-inner)' }}>
      <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 9, color: 'var(--text-body)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ZoneRow({ label, count, total, avgReturn, color }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
  return (
    <div className="flex items-center justify-between" style={{ padding: '3px 0' }}>
      <div className="flex items-center gap-2">
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        <span style={{ fontSize: 10, color: 'var(--text-body)' }}>{label}</span>
      </div>
      <div className="flex items-center gap-4" style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ color: 'var(--text-body)', minWidth: 40, textAlign: 'right' }}>{count} ({pct}%)</span>
        <span style={{ color: avgReturn >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
          {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function BacktestStats({ results }) {
  const stats = useMemo(() => {
    if (!results || results.length < 10) return null;

    const withFwd = results.filter((r) => r.fwdReturn != null);
    if (withFwd.length < 5) return null;

    // Directional accuracy: score > 50 predicted up, score < 50 predicted down
    let correct = 0;
    let bullSignals = 0;
    let bearSignals = 0;
    let bullReturns = [];
    let bearReturns = [];
    let neutralReturns = [];

    // Score zones
    const zones = {
      strongBull: { min: 70, max: 101, returns: [], count: 0 },
      bull: { min: 55, max: 70, returns: [], count: 0 },
      neutral: { min: 45, max: 55, returns: [], count: 0 },
      bear: { min: 30, max: 45, returns: [], count: 0 },
      strongBear: { min: 0, max: 30, returns: [], count: 0 },
    };

    for (const r of withFwd) {
      const predicted = r.score > 50 ? 'bull' : r.score < 50 ? 'bear' : 'neutral';
      const actual = r.fwdReturn > 0 ? 'bull' : r.fwdReturn < 0 ? 'bear' : 'neutral';

      if (predicted === actual) correct++;
      if (predicted === 'bull') { bullSignals++; bullReturns.push(r.fwdReturn); }
      else if (predicted === 'bear') { bearSignals++; bearReturns.push(r.fwdReturn); }
      else { neutralReturns.push(r.fwdReturn); }

      for (const z of Object.values(zones)) {
        if (r.score >= z.min && r.score < z.max) {
          z.returns.push(r.fwdReturn);
          z.count++;
        }
      }
    }

    const accuracy = ((correct / withFwd.length) * 100).toFixed(1);
    const avgBullReturn = bullReturns.length > 0 ? bullReturns.reduce((a, b) => a + b, 0) / bullReturns.length : 0;
    const avgBearReturn = bearReturns.length > 0 ? bearReturns.reduce((a, b) => a + b, 0) / bearReturns.length : 0;

    // Score distribution
    const scores = results.map((r) => r.score);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Win rate when bullish (score > 60): forward return positive
    const strongBullWins = withFwd.filter((r) => r.score >= 60 && r.fwdReturn > 0).length;
    const strongBullTotal = withFwd.filter((r) => r.score >= 60).length;
    const bullWinRate = strongBullTotal > 0 ? ((strongBullWins / strongBullTotal) * 100).toFixed(0) : '--';

    // Win rate when bearish (score < 40): forward return negative
    const strongBearWins = withFwd.filter((r) => r.score <= 40 && r.fwdReturn < 0).length;
    const strongBearTotal = withFwd.filter((r) => r.score <= 40).length;
    const bearWinRate = strongBearTotal > 0 ? ((strongBearWins / strongBearTotal) * 100).toFixed(0) : '--';

    const avgZoneReturn = (zone) => {
      if (zone.returns.length === 0) return 0;
      return zone.returns.reduce((a, b) => a + b, 0) / zone.returns.length;
    };

    return {
      total: withFwd.length,
      accuracy,
      avgScore,
      minScore,
      maxScore,
      bullWinRate,
      bearWinRate,
      avgBullReturn,
      avgBearReturn,
      fwdCandles: withFwd[0]?.fwdCandles || 5,
      zones: {
        strongBull: { ...zones.strongBull, avgReturn: avgZoneReturn(zones.strongBull) },
        bull: { ...zones.bull, avgReturn: avgZoneReturn(zones.bull) },
        neutral: { ...zones.neutral, avgReturn: avgZoneReturn(zones.neutral) },
        bear: { ...zones.bear, avgReturn: avgZoneReturn(zones.bear) },
        strongBear: { ...zones.strongBear, avgReturn: avgZoneReturn(zones.strongBear) },
      },
    };
  }, [results]);

  if (!stats) {
    return (
      <div style={{ padding: 8, textAlign: 'center', fontSize: 11, color: 'var(--text-body)' }}>
        Not enough data for statistics
      </div>
    );
  }

  return (
    <div>
      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-1.5" style={{ marginBottom: 10 }}>
        <StatBox
          label="Accuracy"
          value={`${stats.accuracy}%`}
          sub={`${stats.total} signals`}
          color={parseFloat(stats.accuracy) >= 55 ? 'var(--green)' : parseFloat(stats.accuracy) < 45 ? 'var(--red)' : 'var(--amber)'}
        />
        <StatBox
          label="Bull Win"
          value={`${stats.bullWinRate}%`}
          sub={`score ≥60`}
          color={parseInt(stats.bullWinRate) >= 55 ? 'var(--green)' : 'var(--amber)'}
        />
        <StatBox
          label="Bear Win"
          value={`${stats.bearWinRate}%`}
          sub={`score ≤40`}
          color={parseInt(stats.bearWinRate) >= 55 ? 'var(--green)' : 'var(--amber)'}
        />
        <StatBox
          label="Avg Score"
          value={stats.avgScore}
          sub={`${stats.minScore}–${stats.maxScore}`}
          color={getScoreColor(parseInt(stats.avgScore))}
        />
      </div>

      {/* Zone breakdown */}
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-body)', letterSpacing: '0.08em', marginBottom: 4 }}>
        SCORE ZONE PERFORMANCE ({stats.fwdCandles}-BAR FORWARD)
      </div>
      <div style={{ padding: '4px 0' }}>
        <ZoneRow label="Strong Bull (70+)" count={stats.zones.strongBull.count} total={stats.total} avgReturn={stats.zones.strongBull.avgReturn} color="var(--green)" />
        <ZoneRow label="Bull (55–70)" count={stats.zones.bull.count} total={stats.total} avgReturn={stats.zones.bull.avgReturn} color="rgba(91,201,138,0.5)" />
        <ZoneRow label="Neutral (45–55)" count={stats.zones.neutral.count} total={stats.total} avgReturn={stats.zones.neutral.avgReturn} color="var(--amber)" />
        <ZoneRow label="Bear (30–45)" count={stats.zones.bear.count} total={stats.total} avgReturn={stats.zones.bear.avgReturn} color="rgba(224,85,85,0.5)" />
        <ZoneRow label="Strong Bear (<30)" count={stats.zones.strongBear.count} total={stats.total} avgReturn={stats.zones.strongBear.avgReturn} color="var(--red)" />
      </div>
    </div>
  );
}
