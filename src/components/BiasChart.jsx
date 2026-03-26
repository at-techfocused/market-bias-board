import { useRef, useEffect, useMemo } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';

const CHART_BG = '#080c10';
const GRID_COLOR = 'rgba(28,46,61,0.4)';
const TEXT_COLOR = '#c8d8e8';
const UP_COLOR = '#5bc98a';
const DOWN_COLOR = '#e05555';

export default function BiasChart({ candles, signals, activeTf }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const linesRef = useRef([]);

  // Convert candle data to lightweight-charts format
  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return { ohlc: [], vol: [] };

    const ohlc = candles.map((c) => ({
      time: c.t,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    }));

    const vol = candles.map((c) => ({
      time: c.t,
      value: c.v,
      color: c.c >= c.o ? 'rgba(91,201,138,0.2)' : 'rgba(224,85,85,0.2)',
    }));

    return { ohlc, vol };
  }, [candles]);

  // Compute entry/stop/target from signals
  const levels = useMemo(() => {
    const active = signals?.[activeTf];
    if (!active || active.atr == null) return null;

    const close = active.close;
    const atr = active.atr;
    const isBull = active.score > 50;

    return {
      entry: close,
      stop: isBull ? close - atr * 1.5 : close + atr * 1.5,
      target: isBull ? close + atr * 3 : close - atr * 3,
      isBull,
    };
  }, [signals, activeTf]);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_BG },
        textColor: TEXT_COLOR,
        fontSize: 10,
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: GRID_COLOR },
        horzLines: { color: GRID_COLOR },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(200,216,232,0.3)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(200,216,232,0.3)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(28,46,61,0.6)',
        scaleMargins: { top: 0.08, bottom: 0.18 },
      },
      timeScale: {
        borderColor: 'rgba(28,46,61,0.6)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize observer
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      linesRef.current = [];
    };
  }, []);

  // Update candle data
  useEffect(() => {
    if (!candleSeriesRef.current || !chartData.ohlc.length) return;
    candleSeriesRef.current.setData(chartData.ohlc);
    volumeSeriesRef.current.setData(chartData.vol);
    chartRef.current?.timeScale().fitContent();
  }, [chartData]);

  // Update price lines (entry/stop/target)
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Remove existing lines
    for (const line of linesRef.current) {
      candleSeriesRef.current.removePriceLine(line);
    }
    linesRef.current = [];

    if (!levels) return;

    const createLine = (price, title, color, lineStyle) => {
      return candleSeriesRef.current.createPriceLine({
        price,
        color,
        lineWidth: 1,
        lineStyle,
        axisLabelVisible: true,
        title,
        axisLabelColor: color,
        axisLabelTextColor: '#0a1218',
      });
    };

    linesRef.current.push(
      createLine(levels.entry, 'ENTRY', '#c8d8e8', LineStyle.Dotted),
      createLine(levels.stop, 'STOP', DOWN_COLOR, LineStyle.Dashed),
      createLine(levels.target, 'TARGET', UP_COLOR, LineStyle.Dashed),
    );
  }, [levels]);

  return (
    <div
      ref={containerRef}
      className="flex-1"
      style={{ background: CHART_BG, minHeight: 0 }}
    />
  );
}
