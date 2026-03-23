import CompositeScore from './CompositeScore';
import TimeframePanel from './TimeframePanel';
import PatternCard from './PatternCard';
import MiniCardGrid from './MiniCardGrid';

function getBiasLabel(score) {
  if (score == null) return 'LOADING';
  if (score <= 40) return 'BEARISH';
  if (score >= 60) return 'BULLISH';
  return 'NEUTRAL';
}

function getBiasColor(score) {
  if (score == null) return '#636e7b';
  if (score <= 40) return '#f85149';
  if (score >= 60) return '#3fb950';
  return '#d29922';
}

function formatTickerDisplay(ticker) {
  if (!ticker) return '--';
  const parts = ticker.split(':');
  return parts[parts.length - 1];
}

// Full asset name mapping
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
  const symbol = formatTickerDisplay(ticker);
  return ASSET_NAMES[symbol] || symbol;
}

export default function SignalPanel({ signals, data, lastFetch, ticker, activeTf, onTfChange }) {
  const loading = data['1H']?.loading || data['4H']?.loading || data.D?.loading;
  // Only show full-panel error if ALL timeframes failed
  const allErrors = [data['1H']?.error, data['4H']?.error, data.D?.error].filter(Boolean);
  const error = allErrors.length === 3 ? allErrors[0] : null;

  const tickerDisplay = formatTickerDisplay(ticker);
  const assetName = getAssetName(ticker);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#1e2d3d', borderTopColor: '#00d4ff' }} />
          <div className="text-[14px] tracking-wide" style={{ color: '#636e7b' }}>Loading {tickerDisplay}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <div className="text-center px-6 max-w-full">
          <div className="text-[20px] mb-2" style={{ color: '#f85149' }}>&#9888;</div>
          <div className="text-[14px] tracking-wide leading-relaxed break-words" style={{ color: '#f85149' }}>{error}</div>
          <div className="text-[13px] mt-2" style={{ color: '#636e7b' }}>Check your API key or try a different ticker</div>
        </div>
      </div>
    );
  }

  const h1 = signals['1H'];
  const h4 = signals['4H'];
  const d = signals.D;

  const activeSignals = signals[activeTf];

  const cardStyle = {
    background: '#111820',
    border: '1px solid #1e2d3d',
    borderRadius: 8,
  };

  return (
    <div className="flex flex-col overflow-y-auto h-full p-4 gap-3" style={{ background: '#0a0e14', scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d transparent' }}>

      {/* Ticker header — larger with full name */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#00d4ff', boxShadow: '0 0 8px rgba(0,212,255,0.4)' }} />
          <div>
            <span className="text-[20px] font-bold tracking-wide" style={{ color: '#cdd9e5' }}>
              {tickerDisplay}
            </span>
            <span className="text-[13px] ml-2" style={{ color: '#636e7b' }}>
              {assetName !== tickerDisplay ? assetName : ''}
            </span>
          </div>
        </div>
        <span className="text-[14px] font-bold tabular-nums" style={{ color: '#8b949e' }}>
          {activeSignals?.close != null ? `$${activeSignals.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
        </span>
      </div>

      {/* Action Signal card */}
      <div style={cardStyle} className="overflow-hidden">
        <CompositeScore
          activeTf={activeTf}
          onTfChange={onTfChange}
          signals={signals}
          lastFetch={lastFetch}
        />
      </div>

      {/* Active Timeframe panel only */}
      {(() => {
        const tfMap = { '1H': { label: '1H', signals: h1 }, '4H': { label: '4H', signals: h4 }, D: { label: 'DAILY', signals: d } };
        const { label, signals: tfSignals } = tfMap[activeTf];
        const tfColor = getBiasColor(tfSignals?.score);
        const tfBias = getBiasLabel(tfSignals?.score);
        return (
          <div style={cardStyle} className="overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 text-[14px] font-bold tracking-[0.12em] uppercase"
              style={{ color: tfColor, borderBottom: '1px solid #1e2d3d', background: '#0d1219' }}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: tfColor, boxShadow: `0 0 8px ${tfColor}` }} />
              {label}
              <span style={{ color: '#636e7b' }}>&middot;</span>
              {tfBias}
              <span style={{ color: '#636e7b' }}>&middot;</span>
              <span>Score {tfSignals?.score ?? '--'}/100</span>
            </div>
            <TimeframePanel label={activeTf} signals={tfSignals} />
          </div>
        );
      })()}

      {/* Pattern Breakouts card — only for active TF */}
      {activeSignals?.pattern ? (
        <div style={cardStyle} className="overflow-hidden">
          <div className="px-5 py-4">
            <span className="text-[13px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
              Pattern Breakouts
            </span>
            <PatternCard pattern={activeSignals.pattern} timeframe={activeTf} atr={activeSignals.atr} close={activeSignals.close} />
          </div>
        </div>
      ) : (
        <div style={cardStyle} className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
              Pattern Breakouts
            </span>
            <span className="text-[12px]" style={{ color: '#636e7b' }}>
              None detected
            </span>
          </div>
        </div>
      )}

      {/* Signal Cards — shows active TF */}
      <div style={cardStyle} className="overflow-hidden">
        <MiniCardGrid signals={activeSignals} tfLabel={activeTf} />
      </div>
    </div>
  );
}
