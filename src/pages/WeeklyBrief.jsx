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
        {/* Pulsing ring */}
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

        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '0.02em' }}>
          Generating Weekly Brief
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-body)', opacity: 0.5, marginBottom: 32, lineHeight: 1.6 }}>
          First-time generation takes 15–30 seconds.
          <br />Subsequent visits load from cache.
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', maxWidth: 280, margin: '0 auto' }}>
          {steps.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div key={i} className="flex items-center gap-3">
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'rgba(42,184,184,0.15)' : active ? 'rgba(42,184,184,0.08)' : 'transparent',
                  border: done ? '1px solid rgba(42,184,184,0.4)' : active ? '1px solid rgba(42,184,184,0.25)' : '1px solid var(--border)',
                }}>
                  {done && <span style={{ fontSize: 11, color: 'var(--green)' }}>&#10003;</span>}
                  {active && (
                    <div className="animate-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} />
                  )}
                </div>
                <span style={{
                  fontSize: 13,
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
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
          Weekly brief not yet generated
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-body)', opacity: 0.5, lineHeight: 1.6 }}>
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
  const [generating, setGenerating] = useState(false);
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
            // API is generating on-demand — show generating state
            setGenerating(true);
            setLoading(false);
            // Poll for completion
            pollForBriefing(cancelled);
          } else {
            setBriefing(data);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('[WeeklyBrief] Fetch failed:', err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    async function pollForBriefing() {
      // The first request likely triggered on-demand generation
      // Wait and retry a few times
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        if (cancelled) return;
        try {
          const res = await fetch('/api/weekly/briefing');
          if (!res.ok) continue;
          const data = await res.json();
          if (!data.empty && !cancelled) {
            setBriefing(data);
            setGenerating(false);
            return;
          }
        } catch {}
      }
      if (!cancelled) {
        setGenerating(false);
        setError(true);
      }
    }

    fetchBriefing();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <GeneratingState />;
  }

  if (generating) {
    return <GeneratingState />;
  }

  if (error || !briefing) {
    return <EmptyState />;
  }

  const ai = briefing.ai;

  return (
    <div style={{ padding: '24px 20px 32px', maxWidth: 960, margin: '0 auto', overflowY: 'auto' }}>
      {/* Week header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
          Week of {briefing.weekLabel}
        </div>
        {ai?.dominantTheme && (
          <div style={{ fontSize: 14, color: 'var(--text-body)', opacity: 0.6, marginTop: 6 }}>
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

      {/* Two-column layout for calendars */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: 4 }}>
        {/* Economic calendar */}
        <EconomicCalendar events={briefing.economic} />

        {/* Earnings calendar */}
        <EarningsCalendar earnings={briefing.earnings} />
      </div>

      {/* Strategic levels */}
      <StrategicLevels levels={ai?.strategicLevels} />

      {/* Footer */}
      <WeeklyFooter weekLabel={briefing.weekLabel} generatedAt={briefing.generatedAt} />
    </div>
  );
}
