import { AttackStatModel } from '../models/AttackStat.js';

/**
 * Incrementally updates today's precomputed AttackStat document every time a
 * request is logged, so dashboard charts can read a single small document
 * instead of running an expensive live aggregation over the fast-growing
 * WafRequest collection.
 */
export async function incrementAttackStat(params: {
  finalAction: 'Allowed' | 'Blocked' | 'Flagged';
  attackType: string;
  country: string;
}) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const inc: Record<string, number> = {
      totalRequests: 1,
      [`countryCounts.${sanitizeKey(params.country)}`]: 1
    };

    if (params.finalAction === 'Blocked') {
      inc.blockedRequests = 1;
      inc[`attackTypeCounts.${sanitizeKey(params.attackType)}`] = 1;
    }

    await AttackStatModel.findOneAndUpdate(
      { date: today },
      { $inc: inc },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('[AttackStat Service] Failed to increment daily aggregate:', err);
  }
}

// Mongo dot-notation keys can't contain '.', '$', or be empty
function sanitizeKey(key: string): string {
  return (key || 'Unknown').replace(/[.$]/g, '_').trim() || 'Unknown';
}
