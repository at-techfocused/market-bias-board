import AlertBanner from '../components/weekly/AlertBanner';
import MarketSnapshot from '../components/weekly/MarketSnapshot';
import PrimaryNarrative from '../components/weekly/PrimaryNarrative';
import EconomicCalendar from '../components/weekly/EconomicCalendar';
import EarningsCalendar from '../components/weekly/EarningsCalendar';
import StrategicLevels from '../components/weekly/StrategicLevels';
import WhatToWatch from '../components/weekly/WhatToWatch';
import WeeklyFooter from '../components/weekly/WeeklyFooter';

// ── Dynamic mock data — dates computed relative to now ──
function buildMockBriefing() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMon = day === 0 ? 1 : day === 1 ? 0 : (8 - day);
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + daysUntilMon);
  mon.setUTCHours(0, 0, 0, 0);

  const fri = new Date(mon);
  fri.setUTCDate(mon.getUTCDate() + 4);

  const fmt = (d) => d.toISOString().slice(0, 10);
  const label = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const monStr = fmt(mon);
  const weekLabel = `${label(mon)}–${label(fri)}, ${mon.getUTCFullYear()}`;

  const dayStr = (offset) => {
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + offset);
    return fmt(d);
  };

  return {
    generatedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    snapshotUpdatedAt: new Date(now.getTime() - 3600000).toISOString(),
    majorMoves: [
      { symbol: 'Oil WTI', move: 3.42, direction: 'down' },
    ],
    weekLabel,
    snapshot: [
      { label: 'SPY', symbol: 'SPY', price: 548.32, change: -0.84 },
      { label: 'QQQ', symbol: 'QQQ', price: 462.15, change: -1.22 },
      { label: 'Gold', symbol: 'GC=F', price: 3284.50, change: 1.45 },
      { label: 'Oil WTI', symbol: 'CL=F', price: 71.83, change: -2.31 },
      { label: 'BTC', symbol: 'BTC-USD', price: 68412.00, change: 3.18 },
    ],
    macro: {
      vix: { price: 22.45, changePct: 8.12 },
      yield10y: { price: 4.38, changePct: -0.91 },
    },
    earnings: [
      { symbol: 'JPM', date: dayStr(0), time: 'bmo', epsEstimated: 4.62, revenueEstimated: 42_800_000_000 },
      { symbol: 'WFC', date: dayStr(0), time: 'bmo', epsEstimated: 1.24, revenueEstimated: 20_400_000_000 },
      { symbol: 'UNH', date: dayStr(1), time: 'bmo', epsEstimated: 7.29, revenueEstimated: 109_200_000_000 },
      { symbol: 'BAC', date: dayStr(1), time: 'bmo', epsEstimated: 0.82, revenueEstimated: 25_600_000_000 },
      { symbol: 'GS', date: dayStr(2), time: 'bmo', epsEstimated: 12.35, revenueEstimated: 14_800_000_000 },
      { symbol: 'MS', date: dayStr(2), time: 'bmo', epsEstimated: 1.98, revenueEstimated: 15_200_000_000 },
      { symbol: 'TSMC', date: dayStr(3), time: 'bmo', epsEstimated: 2.05, revenueEstimated: 25_800_000_000 },
    ],
    economic: [
      { event: 'FOMC Meeting Minutes', date: dayStr(0), time: '14:00', country: 'US' },
      { event: 'CPI (MoM)', date: dayStr(1), time: '08:30', country: 'US' },
      { event: 'Core CPI (YoY)', date: dayStr(1), time: '08:30', country: 'US' },
      { event: 'PPI (MoM)', date: dayStr(2), time: '08:30', country: 'US' },
      { event: 'Initial Jobless Claims', date: dayStr(3), time: '08:30', country: 'US' },
      { event: 'Consumer Sentiment (Prelim)', date: dayStr(3), time: '10:00', country: 'US' },
    ],
    ai: {
      weekLabel,
      alertBanner: {
        active: true,
        level: 'high',
        title: 'CPI print and FOMC minutes dominate the week',
        body: 'Inflation data on Tuesday will set the tone for rate expectations. FOMC minutes may reveal divisions on the timing of cuts. Elevated VIX at 22.45 suggests the market is pricing event risk.',
      },
      narrative: [
        { text: 'CPI — inflation data is the week\'s key catalyst. Consensus expects 0.3% MoM; a hot print above 0.4% would likely trigger a selloff in rate-sensitive tech.', bold: 'CPI' },
        { text: 'JPM kicks off bank earnings season Monday pre-market. Credit reserves and NII guidance will signal consumer health and rate margin trajectory.', bold: 'JPM' },
        { text: 'Gold continues its safe-haven bid, gaining 1.45% last week to $3,284. A CPI miss could accelerate the move toward $3,400.', bold: 'Gold' },
        { text: 'BTC rallied 3.18% to $68,412 amid growing institutional ETF inflows. The $70K level remains the key psychological resistance to watch.', bold: 'BTC' },
      ],
      strategicLevels: [
        { ticker: 'SPX', price: '5,483', support: '5,400', resistance: '5,560', note: 'Trading below the 20-day EMA. CPI reaction likely determines direction for the rest of the month.' },
        { ticker: 'NDX', price: '18,420', support: '18,100', resistance: '18,800', note: 'Tech is underperforming. A hot CPI could push NDX below 18,000 support.' },
        { ticker: 'Gold', price: '3,284', support: '3,220', resistance: '3,350', note: 'Bullish structure intact. Consecutive higher lows since February.' },
        { ticker: 'BTC', price: '68,412', support: '65,000', resistance: '70,000', note: 'ETF flows remain positive. A break above 70K opens the path to ATH retest.' },
        { ticker: '10Y', price: '4.38%', support: '4.20%', resistance: '4.50%', note: 'Yields drifting lower on growth concerns. CPI could reverse the trend sharply.' },
      ],
      alertLevel: 'high',
      dominantTheme: 'Inflation data + bank earnings kick off Q2',
    },
  };
}

const MOCK_BRIEFING = buildMockBriefing();

export default function WeeklyBrief() {
  const briefing = MOCK_BRIEFING;
  const ai = briefing.ai;

  return (
    <div style={{ padding: '16px 20px 24px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
          Week of {briefing.weekLabel}
        </div>
        {ai?.dominantTheme && (
          <div style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.6, marginTop: 4 }}>
            {ai.dominantTheme}
          </div>
        )}
      </div>

      {ai?.alertBanner && <AlertBanner alert={ai.alertBanner} />}

      {/* Major move intraday alert */}
      {briefing.majorMoves?.length > 0 && (
        <div className="rounded-[10px]" style={{
          background: 'var(--bg-base)', border: '1px solid var(--border)',
          borderLeft: '3px solid var(--amber)', padding: '10px 14px', marginBottom: 12,
        }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--amber)', textTransform: 'uppercase' }}>MAJOR MOVE</span>
            {briefing.majorMoves.map((m, i) => (
              <span key={i} style={{ fontSize: 12, color: m.direction === 'up' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                {m.symbol} {m.direction === 'up' ? '▲' : '▼'} {m.move}%
              </span>
            ))}
            <span style={{ fontSize: 10, color: 'var(--text-body)', opacity: 0.4, marginLeft: 'auto' }}>since last snapshot</span>
          </div>
        </div>
      )}

      <MarketSnapshot snapshot={briefing.snapshot} macro={briefing.macro} />

      <PrimaryNarrative narrative={ai?.narrative} />

      <WhatToWatch economic={briefing.economic} earnings={briefing.earnings} />

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 4 }}>
        <EconomicCalendar events={briefing.economic} />
        <EarningsCalendar earnings={briefing.earnings} />
      </div>

      <StrategicLevels levels={ai?.strategicLevels} />

      <WeeklyFooter weekLabel={briefing.weekLabel} generatedAt={briefing.generatedAt} snapshotUpdatedAt={briefing.snapshotUpdatedAt} />
    </div>
  );
}
