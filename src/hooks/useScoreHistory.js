import { useState, useEffect, useRef } from 'react';

const MAX_POINTS = 20;
const DELTA_LOOKBACK = 5;

export function useScoreHistory(signals) {
  const [history, setHistory] = useState({
    '1H': [], '4H': [], D: [],
  });
  const prevScores = useRef({});

  useEffect(() => {
    if (!signals) return;

    const updated = { ...history };
    let changed = false;

    for (const tf of ['1H', '4H', 'D']) {
      const score = signals[tf]?.score;
      if (score != null && score !== prevScores.current[tf]) {
        prevScores.current[tf] = score;
        const points = [...updated[tf], { score, time: Date.now() }].slice(-MAX_POINTS);
        updated[tf] = points;
        changed = true;
      }
    }

    if (changed) setHistory(updated);
  }, [signals]);

  return history;
}

// Derive score delta from history points
export function getScoreDelta(historyPoints) {
  if (!historyPoints || historyPoints.length < DELTA_LOOKBACK + 1) return null;
  const current = historyPoints[historyPoints.length - 1].score;
  const past = historyPoints[historyPoints.length - 1 - DELTA_LOOKBACK]?.score;
  if (past == null) return null;
  return current - past;
}
