import { useMemo } from 'react';
import { computeSignals, getCompositeLabel, getCompositeDescription, getActionLabel } from '../utils/indicators';

export function useIndicators(data) {
  return useMemo(() => {
    const h4Signals = data['4H'].candles ? computeSignals(data['4H'].candles) : null;
    const dSignals = data.D.candles ? computeSignals(data.D.candles) : null;

    let composite = null;
    if (h4Signals && dSignals) {
      const score = Math.round((h4Signals.score + dSignals.score) / 2);
      const label = getCompositeLabel(score);
      const actionLabel = getActionLabel(score);
      const conflict =
        (h4Signals.score < 50 && dSignals.score > 50) ||
        (h4Signals.score > 50 && dSignals.score < 50);

      // Generate entry/stop/target from daily timeframe
      const close = dSignals.close;
      const atr = dSignals.atr;
      const isBull = score > 50;
      const entry = close;
      const stop = atr != null ? (isBull ? close - atr * 1.5 : close + atr * 1.5) : null;
      const target = atr != null ? (isBull ? close + atr * 3 : close - atr * 3) : null;
      const stopPct = stop != null ? Math.abs((stop - entry) / entry * 100) : null;
      const targetPct = target != null ? Math.abs((target - entry) / entry * 100) : null;
      const rr = stopPct != null && stopPct > 0 ? (targetPct / stopPct) : null;

      composite = {
        score,
        label,
        actionLabel,
        description: getCompositeDescription(label),
        conflict,
        entry,
        stop,
        target,
        stopPct,
        targetPct,
        rr,
      };
    }

    return {
      '4H': h4Signals,
      D: dSignals,
      composite,
    };
  }, [data]);
}
