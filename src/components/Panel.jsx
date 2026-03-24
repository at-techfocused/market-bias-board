import { useState, useEffect } from 'react';
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
import { TF_KEYS, TF_DISPLAY } from '../utils/format';

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

export default function Panel({ signals, data, lastFetch, ticker, activeTf, onTfChange }) {
  const active = signals?.[activeTf];
  const isLoading = data?.['1H']?.loading || data?.['4H']?.loading || data?.D?.loading;
  const allErrors = TF_KEYS.every((tf) => data?.[tf]?.error && !data?.[tf]?.loading);

  if (isLoading && !active) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg-base)' }}>
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
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center" style={{ color: 'var(--red)', fontSize: 12 }}>
          Failed to load data for {ticker}
        </div>
      </div>
    );
  }

  const displayName = ASSET_NAMES[ticker] || ticker;
  const tickerShort = ticker.includes(':') ? ticker.split(':')[1] : ticker;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>
      <PanelTopBar ticker={tickerShort} name={displayName} signals={signals} activeTf={activeTf} />
      <TimeframeTabs signals={signals} activeTf={activeTf} onTfChange={onTfChange} />
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}>
        <HeroBlock signals={signals} activeTf={activeTf} />
        <ConflictBadge signals={signals} />
        <EntryStopTarget signals={signals} activeTf={activeTf} />
        <MetricsRow signals={signals} activeTf={activeTf} />
        <SignalRows signals={signals} activeTf={activeTf} />
        <EmaStackDetail signals={signals} activeTf={activeTf} />
        <SmmaCard signals={signals} activeTf={activeTf} />
        <PatternBreakouts signals={signals} activeTf={activeTf} />
        <SignalCardsGrid signals={signals} activeTf={activeTf} />
      </div>
      <PanelFooter signals={signals} activeTf={activeTf} />
    </div>
  );
}
