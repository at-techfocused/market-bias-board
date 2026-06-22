import { useState, useEffect } from 'react';
import AlertBanner from '../components/weekly/AlertBanner';
import MarketSnapshot from '../components/weekly/MarketSnapshot';
import PrimaryNarrative from '../components/weekly/PrimaryNarrative';
import EconomicCalendar from '../components/weekly/EconomicCalendar';
import EarningsCalendar from '../components/weekly/EarningsCalendar';
import StrategicLevels from '../components/weekly/StrategicLevels';
import WhatToWatch from '../components/weekly/WhatToWatch';
import WeeklyFooter from '../components/weekly/WeeklyFooter';

function GeneratingState() {
  const steps = [
    'Fetching market data',
    'Checking economic calendar',
    'Loading earnings reports',
    'Generating AI narrative',
    'Assembling briefing',
  ];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 3000);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 28px' }}>
          <div
            className="generating-ring"
            style={{
              position: 'absolute', inset: 0,
              border: '2px solid transparent',
              borderTopColor: 'var(--green)',
              borderRightColor: 'rgba(42,184,184,0.3)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute', inset: 8,
              background: 'rgba(42,184,184,0.08)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div
              className="animate-pulse"
              style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 12px var(--green)' }}
            />
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Generating Weekly Brief
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.5, marginBottom: 28, lineHeight: 1.6 }}>
          First-time generation takes 15–30 seconds.
          <br />Subsequent visits load from cache.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', maxWidth: 260, margin: '0 auto' }}>
          {steps.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div key={i} className="flex items-center gap-3">
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'rgba(42,184,184,0.15)' : active ? 'rgba(42,184,184,0.08)' : 'transparent',
                  border: done ? '1px solid rgba(42,184,184,0.4)' : active ? '1px solid rgba(42,184,184,0.25)' : '1px solid var(--border)',
                }}>
                  {done && <span style={{ fontSize: 10, color: 'var(--green)' }}>&#10003;</span>}
                  {active && (
                    <div className="animate-pulse" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)' }} />
                  )}
                </div>
                <span style={{
                  fontSize: 12,
                  color: done ? 'var(--green)' : active ? 'var(--text-primary)' : 'var(--text-body)',
                  opacity: done ? 0.7 : active ? 1 : 0.35,
                  fontWeight: active ? 600 : 400,
                }}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
          Weekly brief not yet generated
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.5, lineHeight: 1.6 }}>
          The briefing is generated automatically every Sunday at 11PM UTC.
        </div>
      </div>
    </div>
  );
}

const STALE_MS = 6 * 60 * 60 * 1000;

export default function WeeklyBrief({ briefing, onBriefingLoaded }) {
  const [loading, setLoading] = useState(!briefing);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (briefing) {
      const age = Date.now() - new Date(briefing.snapshotUpdatedAt || briefing.generatedAt).getTime();
      if (age < STALE_MS) {
        setLoading(false);
        return;
      }
      setLoading(false);
      fetchBriefingSilent();
      return;
    }

    let cancelled = false;

    async function fetchBriefing() {
      try {
        const res = await fetch('/api/weekly/briefing');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.empty) {
          setGenerating(true);
          setLoading(false);
          pollForBriefing();
        } else {
          onBriefingLoaded(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('[WeeklyBrief] Fetch failed:', err);
        if (!cancelled) { setError(true); setLoading(false); }
      }
    }

    async function pollForBriefing() {
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        if (cancelled) return;
        try {
          const res = await fetch('/api/weekly/briefing');
          if (!res.ok) continue;
          const data = await res.json();
          if (!data.empty && !cancelled) {
            onBriefingLoaded(data);
            setGenerating(false);
            return;
          }
        } catch {}
      }
      if (!cancelled) { setGenerating(false); setError(true); }
    }

    fetchBriefing();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchBriefingSilent() {
    try {
      const res = await fetch('/api/weekly/briefing');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.empty) onBriefingLoaded(data);
    } catch {}
  }

  if (loading) return <GeneratingState />;
  if (generating) return <GeneratingState />;
  if (error && !briefing) return <EmptyState />;
  if (!briefing) return <EmptyState />;

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
