import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { RequestModel } from '../models/Request.js';
import { RuleModel } from '../models/Rule.js';
import { SettingsModel } from '../models/Settings.js';
import { AttackStatModel } from '../models/AttackStat.js';
import { ApiKeyModel } from '../models/ApiKey.js';
import { TrainingSampleModel } from '../models/TrainingSample.js';
import { ModelVersionModel } from '../models/ModelVersion.js';
import { triggerMLRetraining } from '../services/mlClient.js';
import { getSocketIO } from '../services/socketService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sentinel_waf_super_secret_jwt_key_2026';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin';

// Middleware for JWT Authentication
function authMiddleware(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid JWT token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Expired or invalid JWT token' });
  }
}

// 1. Admin Login
router.post('/auth/login', (req: Request, res: Response) => {
  const loginSchema = z.object({
    username: z.string(),
    password: z.string()
  });

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid login request format' });
  }

  const { username, password } = parsed.data;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username, role: 'SecOps_Admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, username, role: 'Chief Security Officer' });
  }

  return res.status(401).json({ error: 'Invalid admin credentials' });
});

// All routes below this point require a valid admin JWT Bearer token
router.use(authMiddleware);

// 2. GET /api/admin/stats/overview
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalToday, blockedToday, activeRulesCount, pendingRulesCount] = await Promise.all([
      RequestModel.countDocuments({ timestamp: { $gte: todayStart } }),
      RequestModel.countDocuments({ timestamp: { $gte: todayStart }, finalAction: 'Blocked' }),
      RuleModel.countDocuments({ status: 'active', enabled: true }),
      RuleModel.countDocuments({ status: 'pending-review' })
    ]);

    const fpCount = await RequestModel.countDocuments({ userOverride: 'false_positive' });
    const fpRate = totalToday > 0 ? ((fpCount / totalToday) * 100).toFixed(2) : '0.00';

    const topAttackers = await RequestModel.aggregate([
      { $match: { finalAction: 'Blocked' } },
      { $group: { _id: '$sourceIp', country: { $first: '$country' }, flag: { $first: '$flag' }, requestCount: { $sum: 1 }, lastSeen: { $max: '$timestamp' } } },
      { $sort: { requestCount: -1 } },
      { $limit: 5 }
    ]);

    // Pull the last 7 days of precomputed daily aggregates instead of running
    // a live aggregation over the fast-growing Request collection.
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }
    const dailyStats = await AttackStatModel.find({ date: { $in: last7Days } }).sort({ date: 1 });
    const dailyTrend = last7Days.map(date => {
      const stat = dailyStats.find(s => s.date === date);
      return {
        date,
        totalRequests: stat?.totalRequests || 0,
        blockedRequests: stat?.blockedRequests || 0
      };
    });

    const todayStat = dailyStats.find(s => s.date === last7Days[last7Days.length - 1]);

    return res.json({
      requestsToday: totalToday,
      attacksBlocked: blockedToday,
      activeRules: activeRulesCount,
      pendingRules: pendingRulesCount,
      falsePositiveRate: `${fpRate}%`,
      topAttackers,
      attackTypeBreakdown: todayStat?.attackTypeCounts || {},
      dailyTrend
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/admin/traffic (Paginated & Filterable)
router.get('/traffic', async (req: Request, res: Response) => {
  try {
    const { verdict, attackType, ip, minConfidence, page = '1', limit = '50' } = req.query;

    const query: any = {};
    if (verdict && verdict !== 'All') query.finalAction = verdict;
    if (attackType && attackType !== 'All') query.attackType = attackType;
    if (ip) query.$or = [{ sourceIp: new RegExp(ip as string, 'i') }, { path: new RegExp(ip as string, 'i') }];
    if (minConfidence) query['mlVerdict.confidence'] = { $gte: parseFloat(minConfidence as string) };

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const [requests, total] = await Promise.all([
      RequestModel.find(query)
        .sort({ timestamp: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      RequestModel.countDocuments(query)
    ]);

    return res.json({
      requests,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/admin/attacks (Timeline view)
router.get('/attacks', async (req: Request, res: Response) => {
  try {
    const attacks = await RequestModel.find({ finalAction: 'Blocked' })
      .sort({ timestamp: -1 })
      .limit(100);

    return res.json({ attacks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/admin/rules & POST /api/admin/rules
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const rules = await RuleModel.find().sort({ createdAt: -1 });
    return res.json({ rules });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/rules', async (req: Request, res: Response) => {
  const createRuleSchema = z.object({
    name: z.string().min(3),
    type: z.enum(['regex', 'rate-limit', 'ip-block', 'entropy']),
    pattern: z.string().min(1),
    explanation: z.string().optional()
  });

  const parsed = createRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
  }

  try {
    const newRule = await RuleModel.create({
      ...parsed.data,
      source: 'manual',
      status: 'active',
      enabled: true
    });
    return res.status(201).json({ rule: newRule });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. PATCH /api/admin/rules/:id (Approve/Reject pending or Toggle enabled)
router.patch('/rules/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateSchema = z.object({
    status: z.enum(['active', 'pending-review', 'disabled']).optional(),
    enabled: z.boolean().optional(),
    action: z.enum(['approve', 'reject']).optional()
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  try {
    const rule = await RuleModel.findById(id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    if (parsed.data.action === 'approve') {
      rule.status = 'active';
    } else if (parsed.data.action === 'reject') {
      await RuleModel.findByIdAndDelete(id);
      return res.json({ message: 'Rule suggestion rejected and removed' });
    }

    if (parsed.data.status) rule.status = parsed.data.status;

    await rule.save();
    return res.json({ rule });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. DELETE /api/admin/rules/:id
router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    await RuleModel.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Rule deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/admin/mode (Switch Protection Mode)
router.post('/mode', async (req: Request, res: Response) => {
  const modeSchema = z.object({
    mode: z.enum(['Monitoring', 'Active Blocking'])
  });

  const parsed = modeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid mode' });

  try {
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = new SettingsModel({ protectionMode: parsed.data.mode });
    } else {
      settings.protectionMode = parsed.data.mode;
    }
    await settings.save();

    const io = getSocketIO();
    if (io) io.emit('mode_changed', { protectionMode: settings.protectionMode });

    return res.json({ protectionMode: settings.protectionMode });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. POST /api/admin/requests/:id/feedback (Admin Ground Truth Feedback)
router.post('/requests/:id/feedback', async (req: Request, res: Response) => {
  const feedbackSchema = z.object({
    override: z.enum(['false_positive', 'confirmed_attack'])
  });

  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid feedback action' });

  try {
    const requestItem = await RequestModel.findById(req.params.id);
    if (!requestItem) return res.status(404).json({ error: 'Request not found' });

    requestItem.userOverride = parsed.data.override;
    if (parsed.data.override === 'false_positive') {
      requestItem.finalAction = 'Allowed';
    } else {
      requestItem.finalAction = 'Blocked';
    }

    await requestItem.save();
    return res.json({ request: requestItem });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 10. GET /api/admin/model/info
router.get('/model/info', async (req: Request, res: Response) => {
  try {
    const settings = await SettingsModel.findOne() || {
      modelVersion: 'Sentinel-Transformer-v3.4.2-Live',
      lastRetrained: 'Today at 04:00 UTC',
      accuracy: 99.42,
      precision: 99.15,
      recall: 98.88,
      f1Score: 99.01
    };
    return res.json({ modelInfo: settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 11. POST /api/admin/model/retrain
router.post('/model/retrain', async (req: Request, res: Response) => {
  try {
    const feedbackSamples = await RequestModel.find({ userOverride: { $ne: null } }).limit(50);
    const retrainResult = await triggerMLRetraining(feedbackSamples);

    let settings = await SettingsModel.findOne();
    if (!settings) settings = new SettingsModel();

    settings.modelVersion = retrainResult.version;
    settings.accuracy = retrainResult.accuracy;
    settings.lastRetrained = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    await settings.save();

    return res.json({ success: true, modelInfo: settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 12. GET /api/admin/api-keys
router.get('/api-keys', async (req: Request, res: Response) => {
  try {
    const apiKeys = await ApiKeyModel.find().sort({ createdAt: -1 });
    return res.json({ apiKeys });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 13. POST /api/admin/api-keys
router.post('/api-keys', async (req: Request, res: Response) => {
  const schema = z.object({ name: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Name is required' });

  try {
    const keyStr = 'sg_waf_live_' + Math.random().toString(36).substring(2, 18);
    const newKey = await ApiKeyModel.create({
      name: parsed.data.name,
      key: keyStr,
      status: 'active',
      lastUsed: 'Never'
    });
    return res.status(201).json({ apiKey: newKey });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 14. PATCH /api/admin/api-keys/:id/revoke
router.patch('/api-keys/:id/revoke', async (req: Request, res: Response) => {
  try {
    const key = await ApiKeyModel.findByIdAndUpdate(req.params.id, { status: 'revoked' }, { new: true });
    if (!key) return res.status(404).json({ error: 'Key not found' });
    return res.json({ apiKey: key });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 15. GET /api/admin/stats/self-learning
router.get('/stats/self-learning', async (req: Request, res: Response) => {
  try {
    const unusedSampleCount = await TrainingSampleModel.countDocuments({ used_for_training: false });
    const totalTrainingSamples = await TrainingSampleModel.countDocuments();
    const modelVersions = await ModelVersionModel.find().sort({ createdAt: -1 }).limit(10);
    
    const totalRequests = await RequestModel.countDocuments();
    const llmRequests = await RequestModel.countDocuments({ source: 'llm' });
    const fallbackRate = totalRequests > 0 ? Number(((llmRequests / totalRequests) * 100).toFixed(1)) : 14.5;

    return res.json({
      unusedSampleCount,
      totalTrainingSamples,
      modelVersions,
      fallbackRate,
      threshold: Number(process.env.RETRAIN_SAMPLE_THRESHOLD || 50)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
