import { kv } from '@vercel/kv';

// Try to read from KV, return null if KV is not configured
async function readBriefing() {
  try {
    const raw = await kv.get('weekly:briefing');
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    console.error('[Weekly] KV read error:', err.message);
    return null;
  }
}

// Run the generate pipeline and return the briefing directly
async function generateBriefing() {
  const { runGeneration } = await import('./generate.js');
  return runGeneration();
}

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
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const briefing = await generateBriefing();
      if (briefing) return res.status(200).json(briefing);
    } catch (err) {
      console.error('[Weekly] Refresh generation failed:', err);
    }
  }

  // Try reading from KV first
  const cached = await readBriefing();
  if (cached) {
    return res.status(200).json(cached);
  }

  // KV empty — generate on demand (first visit before cron fires)
  console.log('[Weekly] No cached briefing found, generating on demand...');
  try {
    const briefing = await generateBriefing();
    if (briefing) {
      return res.status(200).json(briefing);
    }
  } catch (err) {
    console.error('[Weekly] On-demand generation failed:', err);
  }

  return res.status(200).json({ empty: true, message: 'Weekly brief not yet generated' });
}
