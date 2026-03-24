import CompositeScore from './CompositeScore';
import TimeframePanel from './TimeframePanel';
import PatternCard from './PatternCard';
import MiniCardGrid from './MiniCardGrid';
import { getBiasLabel, getBiasColor, TF_DISPLAY } from '../utils/format';

function formatTickerDisplay(ticker) {
  if (!ticker) return '--';
  return ticker.split(':').pop();
}

const ASSET_NAMES = {
  BTCUSDT: 'Bitcoin / USD',
  ETHUSDT: 'Ethereum / USD',
  SOLUSDT: 'Solana / USD',
  BNBUSDT: 'Binance Coin / USD',
  XRPUSDT: 'Ripple / USD',
  ADAUSDT: 'Cardano / USD',
  DOGEUSDT: 'Dogecoin / USD',
  DOTUSDT: 'Polkadot / USD',
  AVAXUSDT: 'Avalanche / USD',
  LINKUSDT: 'Chainlink / USD',
  MATICUSDT: 'Polygon / USD',
  AAPL: 'Apple Inc.',
  TSLA: 'Tesla Inc.',
  MSFT: 'Microsoft Corp.',
  AMZN: 'Amazon.com Inc.',
  GOOGL: 'Alphabet Inc.',
  META: 'Meta Platforms Inc.',
  NVDA: 'NVIDIA Corp.',
  AMD: 'Advanced Micro Devices',
  SPY: 'S&P 500 ETF',
  QQQ: 'Nasdaq 100 ETF',
};

function getAssetName(ticker) {
  if (!ticker) return '';
  return ASSET_NAMES[formatTickerDisplay(ticker)] || formatTickerDisplay(ticker);
}

// Section label used between cards
function SectionLabel({ children, right }) {
  return (
    <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
      <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: '#2d3a47' }}>{children}</span>
      {right && <span className="text-[10px]" style={{ color: '#2d3a47' }}>{right}</span>}
    </div>
  );
}

export default function SignalPanel({ signals, data, lastFetch, ticker, activeTf, onTfChange }) {
  const loading = data['1H']?.loading || data['4H']?.loading || data.D?.loading;
  const allErrors = [data['1H']?.error, data['4H']?.error, data.D?.error].filter(Boolean);
  const error = allErrors.length === 3 ? allErrors[0] : null;

  const tickerDisplay = formatTickerDisplay(ticker);
  const assetName = getAssetName(ticker);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0a0e14' }}>
        <div className="text-center">
          <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#1e2d3d', borderTopColor: '#00d4ff' }} />
          <div className="text-[13px] tracking-wide" style={{ color: '#4d5768' }}>Loading {tickerDisplay}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0a0e14' }}>
        <div className="text-center px-6 max-w-full">
          <div className="text-[18px] mb-2" style={{ color: '#f85149' }}>&#9888;</div>
          <div className="text-[13px] tracking-wide leading-relaxed break-words" style={{ color: '#f85149' }}>{error}</div>
          <div className="text-[12px] mt-2" style={{ color: '#4d5768' }}>Check your API key or try a different ticker</div>
        </div>
      </div>
    );
  }

  const h1 = signals['1H'];
  const h4 = signals['4H'];
  const d = signals.D;
  const activeSignals = signals[activeTf];

  const card = {
    background: '#111820',
    borderRadius: 8,
    border: '1px solid rgba(30,45,61,0.5)',
  };

  return (
    <div className="flex flex-col overflow-y-auto h-full p-4 gap-2.5" style={{ background: '#0a0e14', scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d transparent' }}>

      {/* Ticker header */}
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#00d4ff', boxShadow: '0 0 6px rgba(0,212,255,0.3)' }} />
          <span className="text-[18px] font-bold tracking-wide" style={{ color: '#cdd9e5' }}>{tickerDisplay}</span>
          <span className="text-[12px]" style={{ color: '#4d5768' }}>
            {assetName !== tickerDisplay ? assetName : ''}
          </span>
        </div>
        <span className="text-[13px] font-bold tabular-nums" style={{ color: '#636e7b' }}>
          {activeSignals?.close != null ? `$${activeSignals.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
        </span>
      </div>

      {/* Action Signal card */}
      <div style={card} className="overflow-hidden">
        <CompositeScore activeTf={activeTf} onTfChange={onTfChange} signals={signals} lastFetch={lastFetch} />
      </div>

      {/* Timeframe detail */}
      {(() => {
        const tfSignals = { '1H': h1, '4H': h4, D: d }[activeTf];
        const label = TF_DISPLAY[activeTf];
        const tfColor = getBiasColor(tfSignals?.score);
        const tfBias = getBiasLabel(tfSignals?.score);
        return (
          <div style={card} className="overflow-hidden">
            {/* Accent-top header (pattern 3 — data record) */}
            <div className="flex items-center gap-2 px-5 py-3 text-[13px] font-bold tracking-[0.12em] uppercase"
              style={{ color: tfColor, borderBottom: '1px solid rgba(30,45,61,0.4)', background: '#0d1219' }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tfColor, boxShadow: `0 0 6px ${tfColor}` }} />
              {label}
              <span style={{ color: '#2d3a47' }}>&middot;</span>
              {tfBias}
              <span style={{ color: '#2d3a47' }}>&middot;</span>
              <span className="tabular-nums">Score {tfSignals?.score ?? '--'}/100</span>
            </div>
            <TimeframePanel label={activeTf} signals={tfSignals} />
          </div>
        );
      })()}

      {/* Pattern Breakouts — accent-left pattern (5) */}
      <div style={card} className="overflow-hidden">
        <div className={activeSignals?.pattern ? 'px-5 py-3.5' : 'flex items-center justify-between px-5 py-3'}>
          <SectionLabel right={!activeSignals?.pattern ? 'None detected' : undefined}>Pattern Breakouts</SectionLabel>
          {activeSignals?.pattern && (
            <PatternCard pattern={activeSignals.pattern} timeframe={activeTf} atr={activeSignals.atr} close={activeSignals.close} />
          )}
        </div>
      </div>

      {/* Metric cards — pattern 1 (flat, no border, secondary bg) */}
      <div style={card} className="overflow-hidden">
        <MiniCardGrid signals={activeSignals} tfLabel={activeTf} />
      </div>
    </div>
  );
}
