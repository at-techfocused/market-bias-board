import { useState, useEffect, useRef } from 'react';

const MAX_POINTS = 20;

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
        updated[tf] = [...updated[tf], { score, time: Date.now() }].slice(-MAX_POINTS);
        changed = true;
      }
    }

    if (changed) setHistory(updated);
  }, [signals]);

  return history;
}
