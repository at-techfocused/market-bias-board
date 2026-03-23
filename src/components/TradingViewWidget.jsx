import { useMemo } from 'react';

export default function TradingViewWidget({ ticker, interval = '240' }) {
  const src = useMemo(() => {
    const symbol = encodeURIComponent(ticker);
    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${symbol}&interval=${interval}&theme=dark&style=1&locale=en&hide_side_toolbar=0&allow_symbol_change=0`;
  }, [ticker, interval]);

  return (
    <div className="flex-1 relative" style={{ background: '#080c10' }}>
      <iframe
        key={`${ticker}-${interval}`}
        src={src}
        className="w-full h-full border-0"
        allowTransparency="true"
        allowFullScreen
        title="TradingView Chart"
      />
    </div>
  );
}
