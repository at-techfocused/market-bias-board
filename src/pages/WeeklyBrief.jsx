import { useState, useEffect } from 'react';
import AlertBanner from '../components/weekly/AlertBanner';
import MarketSnapshot from '../components/weekly/MarketSnapshot';
import PrimaryNarrative from '../components/weekly/PrimaryNarrative';
import GeopoliticalAlert from '../components/weekly/GeopoliticalAlert';
import EconomicCalendar from '../components/weekly/EconomicCalendar';
import EarningsCalendar from '../components/weekly/EarningsCalendar';
import StrategicLevels from '../components/weekly/StrategicLevels';
import WhatToWatch from '../components/weekly/WhatToWatch';
import WeeklyFooter from '../components/weekly/WeeklyFooter';

function SkeletonCard({ height = 80 }) {
  return (
    <div
      className="rounded-[10px] skeleton-pulse"
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        height,
        marginBottom: 10,
      }}
    />
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Weekly brief not yet generated
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.5, lineHeight: 1.6 }}>
          Check back Sunday evening or contact admin.
          The briefing is generated automatically every Sunday at 11PM UTC.
        </div>
      </div>
    </div>
  );
}

export default function WeeklyBrief() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchBriefing() {
      try {
        const res = await fetch('/api/weekly/briefing');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          if (data.empty) {
            setBriefing(null);
          } else {
            setBriefing(data);
          }
        }
      } catch (err) {
        console.error('[WeeklyBrief] Fetch failed:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBriefing();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
        <SkeletonCard height={60} />
        <SkeletonCard height={100} />
        <SkeletonCard height={140} />
        <SkeletonCard height={120} />
        <SkeletonCard height={100} />
      </div>
    );
  }

  if (error || !briefing) {
    return <EmptyState />;
  }

  const ai = briefing.ai;

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: '0 auto', overflowY: 'auto' }}>
      {/* Week header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
          Week of {briefing.weekLabel}
        </div>
        {ai?.dominantTheme && (
          <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.6, marginTop: 4 }}>
            {ai.dominantTheme}
          </div>
        )}
      </div>

      {/* Alert banner */}
      {ai?.alertBanner && <AlertBanner alert={ai.alertBanner} />}

      {/* Market snapshot */}
      <MarketSnapshot snapshot={briefing.snapshot} macro={briefing.macro} />

      {/* Primary narrative */}
      <PrimaryNarrative narrative={ai?.narrative} />

      {/* Geopolitical alert */}
      <GeopoliticalAlert alert={ai?.alertBanner} />

      {/* What to watch */}
      <WhatToWatch economic={briefing.economic} earnings={briefing.earnings} />

      {/* Economic calendar */}
      <EconomicCalendar events={briefing.economic} />

      {/* Earnings calendar */}
      <EarningsCalendar earnings={briefing.earnings} />

      {/* Strategic levels */}
      <StrategicLevels levels={ai?.strategicLevels} />

      {/* Footer */}
      <WeeklyFooter weekLabel={briefing.weekLabel} generatedAt={briefing.generatedAt} />
    </div>
  );
}
