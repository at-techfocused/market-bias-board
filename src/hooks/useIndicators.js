import { useMemo } from 'react';
import { computeSignals, getCompositeLabel, getCompositeDescription } from '../utils/indicators';

export function useIndicators(data) {
  return useMemo(() => {
    const h4Signals = data['4H'].candles ? computeSignals(data['4H'].candles) : null;
    const dSignals = data.D.candles ? computeSignals(data.D.candles) : null;

    let composite = null;
    if (h4Signals && dSignals) {
      const score = Math.round((h4Signals.score + dSignals.score) / 2);
      const label = getCompositeLabel(score);
      const conflict =
        (h4Signals.score < 50 && dSignals.score > 50) ||
        (h4Signals.score > 50 && dSignals.score < 50);
      composite = {
        score,
        label,
        description: getCompositeDescription(label),
        conflict,
      };
    }

    return {
      '4H': h4Signals,
      D: dSignals,
      composite,
    };
  }, [data]);
}
