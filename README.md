# BiasBoard

A multi-timeframe market bias dashboard that analyzes price action using technical indicators to generate a composite bias score (0–100) for any ticker.

## What It Does

BiasBoard fetches candlestick data across three timeframes (1H, 4H, Daily) and runs a scoring engine that combines five technical indicators into a single directional bias reading. The score tells you at a glance whether conditions lean bullish, bearish, or neutral — and how confident that lean is.

## Scoring Engine

The bias score is built from five weighted components, each normalized to 0.0–1.0:

| Component | What It Measures | Scoring |
|-----------|-----------------|---------|
| **EMA Stack** | 20/50/100/200 EMA alignment | BULL (all aligned bullish) = 1.0, BEAR = 0.0, MIXED = 0.5 |
| **SMMA 99** | Price position vs 99-period smoothed MA | ABOVE = 1.0, NEAR (within 0.5× ATR) = 0.5, BELOW = 0.0 |
| **RSI 14** | Momentum via Relative Strength Index | Continuous linear curve: `clamp((rsi - 30) / 40, 0, 1)` |
| **MACD** | Momentum crossover confirmation | BULL (histogram + crossover agree) = 1.0, BEAR = 0.0, else 0.5 |
| **Pattern** | Candlestick pattern detection (20 patterns) | BULL = 1.0, BEAR = 0.0, NEUTRAL = 0.5. Excluded if none detected |

Weights are user-configurable (default 20 each, adjustable 0–40 via settings). Components are normalized proportionally regardless of weight distribution.

### Modifiers

After computing the weighted base score, two confidence modifiers push it toward neutral (50) when conditions are unreliable:

- **ADX modifier**: ADX < 15 → 0.6×, ADX < 20 → 0.8×, ADX ≥ 40 → 1.1×
- **Volume modifier**: Vol ratio < 0.5 → 0.8×, < 0.8 → 0.9×, ≥ 1.5 → 1.1×

A **conflict penalty** clamps the score to 40–60 when the 4H and Daily timeframes disagree on direction.

### Pattern Detection

20 candlestick patterns across three priority tiers:

- **3-candle** (highest): Three White Soldiers, Three Black Crows, Morning Star, Evening Star, Three Inside Up/Down, Bullish/Bearish Abandoned Baby
- **2-candle**: Bullish/Bearish Engulfing, Piercing Line, Dark Cloud Cover, Bullish/Bearish Harami, Tweezer Bottom
- **1-candle**: Hammer, Shooting Star, Bullish/Bear Marubozu, Doji

## Features

- **Multi-timeframe analysis** — 1H, 4H, and Daily with per-timeframe scoring
- **TradingView chart** — Embedded interactive chart synced to active ticker/timeframe
- **Ticker search** — Instant client-side search across 85+ tickers (crypto, stocks, ETFs, futures, indices)
- **Watchlist** — Persistent watchlist with quick-switch chips
- **Multi-ticker comparison** — Side-by-side bias scores for all watchlist tickers
- **Historical backtest** — Replays scoring engine across historical candles with accuracy stats, win rates, and score zone performance
- **Auto-refresh** — Silent background refresh every 5 minutes with stale data indicator
- **Score sparkline** — Mini chart tracking score changes over refreshes
- **Indicator weight customization** — Adjust per-indicator contribution via settings panel, persisted to localStorage
- **Mobile responsive** — ANALYSIS/CHART toggle on mobile with touch-optimized targets
- **Dynamic reasoning** — Natural language explanation of why the score leans a given direction

## Data Sources

- **Crypto**: CryptoCompare API (dev), serverless proxy (production)
- **Stocks/ETFs/Futures/Indices**: Yahoo Finance with symbol aliasing (WTI → CL=F, XAUUSD → GC=F, etc.)

## Tech Stack

- React + Vite
- Tailwind CSS + CSS custom properties (tokens.css)
- Vercel serverless functions (production API proxy)

## Getting Started

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`. No API keys required for development.

## Project Structure

```
src/
  App.jsx                    # Root layout, state management, mobile toggle
  hooks/
    useFinnhub.js            # Data fetching with auto-refresh + stale detection
    useIndicators.js         # Runs scoring engine on candle data
    useScoreHistory.js       # Tracks score changes for sparkline
  utils/
    indicators.js            # All TA calculations, scoring formula, backtest engine
    finnhub.js               # API fetchers (CryptoCompare, Yahoo Finance)
    tickers.js               # Ticker metadata (name, type, exchange)
    format.js                # Shared formatting and color helpers
  components/
    Panel.jsx                # Right sidebar: collapsible card stack
    HeroBlock.jsx            # Bias score display with reasoning + tooltip breakdown
    EntryStopTarget.jsx      # ATR-based trade levels (3× target, 1.5× stop)
    BacktestPanel.jsx        # Historical score replay with popout modal
    BacktestChart.jsx        # Dual-axis SVG (price + score)
    BacktestStats.jsx        # Accuracy, win rates, zone performance table
    TimeframeTabs.jsx        # 1H / 4H / Daily selector with scores
    TickerSearch.jsx          # Modal search with type/exchange badges
    TickerCompare.jsx        # Multi-ticker comparison modal
    WeightSettings.jsx       # Indicator weight sliders
    SignalRows.jsx           # Individual indicator readouts
    PatternBreakouts.jsx     # Detected pattern card with info panel
    Sparkline.jsx            # Mini SVG score history chart
api/
  candles.js                 # Vercel serverless proxy
```
