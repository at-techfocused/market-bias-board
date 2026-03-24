import PanelTopBar from './PanelTopBar';
import TimeframeTabs from './TimeframeTabs';
import HeroBlock from './HeroBlock';
import ConflictBadge from './ConflictBadge';
import EntryStopTarget from './EntryStopTarget';
import MetricsRow from './MetricsRow';
import SignalRows from './SignalRows';
import EmaStackDetail from './EmaStackDetail';
import SmmaCard from './SmmaCard';
import PatternBreakouts from './PatternBreakouts';
import SignalCardsGrid from './SignalCardsGrid';
import PanelFooter from './PanelFooter';
import { TF_KEYS } from '../utils/format';

const ASSET_NAMES = {
  'BINANCE:BTCUSDT': 'Bitcoin',
  'BINANCE:ETHUSDT': 'Ethereum',
  'BINANCE:SOLUSDT': 'Solana',
  AAPL: 'Apple Inc.',
  TSLA: 'Tesla Inc.',
  MSFT: 'Microsoft',
  AMZN: 'Amazon',
  GOOG: 'Alphabet',
  NVDA: 'NVIDIA',
  META: 'Meta Platforms',
  SPY: 'S&P 500 ETF',
  QQQ: 'Nasdaq 100 ETF',
};

const card = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  overflow: 'hidden',
};

function Card({ children, style }) {
  if (!children) return null;
  return <div style={{ ...card, ...style }}>{children}</div>;
}

export default function Panel({ signals, data, lastFetch, ticker, activeTf, onTfChange }) {
  const active = signals?.[activeTf];
  const isLoading = data?.['1H']?.loading || data?.['4H']?.loading || data?.D?.loading;
  const allErrors = TF_KEYS.every((tf) => data?.[tf]?.error && !data?.[tf]?.loading);

  const displayName = ASSET_NAMES[ticker] || ticker;
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

  const h4Score = signals?.['4H']?.score;
  const dScore = signals?.D?.score;
  const hasConflict = h4Score != null && dScore != null &&
    ((h4Score < 50 && dScore > 50) || (h4Score > 50 && dScore < 50));

  return (
    <div className="flex flex-col h-full"
      style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
      {/* Top bar + tabs: flush to top, outside card system */}
      <PanelTopBar ticker={tickerShort} name={displayName} signals={signals} activeTf={activeTf} />
      <TimeframeTabs signals={signals} activeTf={activeTf} onTfChange={onTfChange} />

      {/* Scrollable card stack */}
      <div className="flex-1 overflow-y-auto flex flex-col"
        style={{ padding: 8, gap: 6, scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}>
        <Card><HeroBlock signals={signals} activeTf={activeTf} /></Card>
        {hasConflict && <Card><ConflictBadge signals={signals} /></Card>}
        <Card><EntryStopTarget signals={signals} activeTf={activeTf} /></Card>
        <Card><MetricsRow signals={signals} activeTf={activeTf} /></Card>
        <Card><SignalRows signals={signals} activeTf={activeTf} /></Card>
        <Card><EmaStackDetail signals={signals} activeTf={activeTf} /></Card>
        <Card><SmmaCard signals={signals} activeTf={activeTf} /></Card>
        <Card><PatternBreakouts signals={signals} activeTf={activeTf} /></Card>
        <Card><SignalCardsGrid signals={signals} activeTf={activeTf} /></Card>
      </div>

      <PanelFooter signals={signals} activeTf={activeTf} />
    </div>
  );
}
