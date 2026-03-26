import { useMemo } from 'react';
import { computeSignals } from '../utils/indicators';

export function useIndicators(data, weights) {
  return useMemo(() => {
    const h1Signals = data['1H']?.candles ? computeSignals(data['1H'].candles, weights) : null;
    const h4Signals = data['4H']?.candles ? computeSignals(data['4H'].candles, weights) : null;
    const dSignals = data.D?.candles ? computeSignals(data.D.candles, weights) : null;

    return {
      '1H': h1Signals,
      '4H': h4Signals,
      D: dSignals,
    };
  }, [data, weights]);
}
