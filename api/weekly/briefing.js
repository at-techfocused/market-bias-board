import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  // Manual refresh — protected by CRON_SECRET
  const refresh = req.query.refresh === 'true';
  if (refresh) {
    const secret = req.headers['x-cron-secret'] || req.headers['authorization'];
    if (secret !== process.env.CRON_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Trigger generation by calling the generate endpoint internally
    try {
      const { default: generate } = await import('./generate.js');
      const mockRes = {
        status: (code) => ({ json: (data) => data }),
      };
      await generate(req, mockRes);
    } catch (err) {
      console.error('[Weekly] Refresh generation failed:', err);
    }
  }

  try {
    const raw = await kv.get('weekly:briefing');

    if (!raw) {
      // First run — no data yet. Try to generate on-demand.
      try {
        const { default: generate } = await import('./generate.js');
        const mockRes = {
          statusCode: 200,
          data: null,
          status: function (code) {
            this.statusCode = code;
            return { json: (d) => { this.data = d; } };
          },
        };
        await generate(req, mockRes);

        // Re-read from KV after generation
        const freshRaw = await kv.get('weekly:briefing');
        if (freshRaw) {
          const briefing = typeof freshRaw === 'string' ? JSON.parse(freshRaw) : freshRaw;
          return res.status(200).json(briefing);
        }
      } catch (err) {
        console.error('[Weekly] On-demand generation failed:', err);
      }

      return res.status(200).json({ empty: true, message: 'Weekly brief not yet generated' });
    }

    const briefing = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json(briefing);
  } catch (err) {
    console.error('[Weekly] Briefing read failed:', err);
    return res.status(500).json({ error: 'Failed to load briefing' });
  }
}
