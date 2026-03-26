import PanelTopBar from './PanelTopBar';
import TimeframeTabs from './TimeframeTabs';
import HeroBlock from './HeroBlock';
import EntryStopTarget from './EntryStopTarget';

import SignalRows from './SignalRows';
import EmaStackDetail from './EmaStackDetail';
import SmmaCard from './SmmaCard';
import PatternBreakouts from './PatternBreakouts';
import SignalCardsGrid from './SignalCardsGrid';
import PanelFooter from './PanelFooter';
import CollapsibleSection from './CollapsibleSection';
import { TF_KEYS, TF_DISPLAY, getBiasLabel, getBiasColor } from '../utils/format';
import { getTickerName } from '../utils/tickers';


const card = {
  background: '#0f1923',
  border: '1px solid #1c2e3d',
  borderRadius: 10,
  padding: '14px 16px',
  marginBottom: 8,
  overflow: 'hidden',
  flexShrink: 0,
};

function Card({ children, style }) {
  if (!children) return null;
  return <div style={{ ...card, ...style }}>{children}</div>;
}

function StackBadge({ value }) {
  const color = value === 'BULL' ? 'var(--green)' : value === 'BEAR' ? 'var(--red)' : 'var(--amber)';
  return (
    <span className="px-2 py-[2px] rounded-[3px]"
      style={{ fontSize: 10, fontWeight: 700, color, background: value === 'BULL' ? 'rgba(91,201,138,0.1)' : value === 'BEAR' ? 'rgba(224,85,85,0.1)' : 'rgba(200,124,0,0.1)' }}>
      {value}
    </span>
  );
}

function SmmaBadge({ position }) {
  const color = position === 'ABOVE' ? 'var(--green)' : position === 'NEAR' ? 'var(--amber)' : 'var(--red)';
  const label = position === 'ABOVE' ? 'ABOVE ▲' : position === 'NEAR' ? 'NEAR ◆' : 'BELOW ▼';
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color }}>
      {label}
    </span>
  );
}

export default function Panel({ signals, data, lastFetch, ticker, activeTf, onTfChange }) {
  const active = signals?.[activeTf];
  const isLoading = data?.['1H']?.loading || data?.['4H']?.loading || data?.D?.loading;
  const allErrors = TF_KEYS.every((tf) => data?.[tf]?.error && !data?.[tf]?.loading);

  const displayName = getTickerName(ticker);
  const tickerShort = ticker.includes(':') ? ticker.split(':')[1] : ticker;

  if (isLoading && !active) {
    return (
      <div className="flex items-center justify-center h-full"
        style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div className="text-center">
          <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-body)' }} />
          <div style={{ color: 'var(--text-body)', fontSize: 11 }}>Loading {ticker}...</div>
        </div>
      </div>
    );
  }

  if (allErrors) {
    return (
      <div className="flex items-center justify-center h-full"
        style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div className="text-center" style={{ color: 'var(--red)', fontSize: 12 }}>
          Failed to load data for {ticker}
        </div>
      </div>
    );
  }

  const biasLabel = active ? getBiasLabel(active.score) : '';
  const biasColor = active ? getBiasColor(active.score) : '';

  return (
    <div className="flex flex-col h-full"
      style={{ background: '#0a1218' }}>
      {/* Top bar + tabs: flush to top, outside card system */}
      <PanelTopBar ticker={tickerShort} name={displayName} signals={signals} activeTf={activeTf} />
      <TimeframeTabs signals={signals} activeTf={activeTf} onTfChange={onTfChange} />

      {/* Scrollable card stack */}
      <div className="flex-1 overflow-y-auto panel-scroll"
        style={{ padding: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          <Card>
            <CollapsibleSection
              title={`${biasLabel} BIAS · ${TF_DISPLAY[activeTf]}`}
              badge={<span style={{ fontSize: 13, fontWeight: 700, color: biasColor, fontFamily: "'Georgia', serif" }}>{active?.score ?? '--'}</span>}
            >
              <HeroBlock signals={signals} activeTf={activeTf} tickerName={displayName} tickerShort={tickerShort} />
            </CollapsibleSection>
          </Card>

          <Card>
            <CollapsibleSection title={`ENTRY / STOP / TARGET`}>
              <EntryStopTarget signals={signals} activeTf={activeTf} />
            </CollapsibleSection>
          </Card>

          <Card>
            <CollapsibleSection title={`SIGNALS · ${TF_DISPLAY[activeTf]}`}>
              <SignalRows signals={signals} activeTf={activeTf} />
            </CollapsibleSection>
          </Card>

          <Card>
            <CollapsibleSection
              title={`EMA STACK DETAIL · ${TF_DISPLAY[activeTf]}`}
              badge={active ? <StackBadge value={active.emaStack} /> : null}
            >
              <EmaStackDetail signals={signals} activeTf={activeTf} />
            </CollapsibleSection>
          </Card>

          <Card>
            <CollapsibleSection
              title={`SMMA 99 · ${TF_DISPLAY[activeTf]}`}
              badge={active ? <SmmaBadge position={active.smma99} /> : null}
            >
              <SmmaCard signals={signals} activeTf={activeTf} />
            </CollapsibleSection>
          </Card>

          {active?.pattern ? (
            <Card>
              <CollapsibleSection title="PATTERN BREAKOUTS">
                <PatternBreakouts signals={signals} activeTf={activeTf} />
              </CollapsibleSection>
            </Card>
          ) : (
            <div style={{ padding: '0 8px' }}>
              <PatternBreakouts signals={signals} activeTf={activeTf} />
            </div>
          )}

          <Card>
            <CollapsibleSection title={`SIGNAL CARDS · ${TF_DISPLAY[activeTf]}`}>
              <SignalCardsGrid signals={signals} activeTf={activeTf} />
            </CollapsibleSection>
          </Card>

        </div>
      </div>

      <PanelFooter signals={signals} activeTf={activeTf} />
    </div>
  );
}
