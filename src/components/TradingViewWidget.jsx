import { useMemo } from 'react';

export default function TradingViewWidget({ ticker }) {
  const src = useMemo(() => {
    const symbol = encodeURIComponent(ticker);
    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${symbol}&interval=240&theme=dark&style=1&locale=en&hide_side_toolbar=0&allow_symbol_change=0`;
  }, [ticker]);

  return (
    <div className="flex-1 relative" style={{ background: '#080c10' }}>
      <iframe
        key={ticker}
        src={src}
        className="w-full h-full border-0"
        allowTransparency="true"
        allowFullScreen
        title="TradingView Chart"
      />
    </div>
  );
}
