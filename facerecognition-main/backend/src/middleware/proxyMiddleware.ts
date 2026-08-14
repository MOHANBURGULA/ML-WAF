import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { extractRequestFeatures, performFastLocalRuleCheck } from '../services/featureExtractor.js';
import { predictThreatWithML, hybridClassify } from '../services/mlClient.js';
import { RequestModel } from '../models/Request.js';
import { SettingsModel } from '../models/Settings.js';
import { RuleModel } from '../models/Rule.js';
import { getSocketIO } from '../services/socketService.js';
import { checkAndAutoGenerateRules } from '../services/selfLearningEngine.js';
import { incrementAttackStat } from '../services/attackStatService.js';

const TARGET_ORIGIN_URL = process.env.TARGET_ORIGIN_URL || 'http://127.0.0.1:3000';
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.socket.remoteAddress
    || '127.0.0.1';
}

// Country Flag Mapping Helper for IP Telemetry
function getCountryFromIp(ip: string): { country: string; flag: string } {
  if (ip.includes('185.220') || ip.includes('127.0.0.1') || ip === '::1') return { country: 'Local/TOR Node', flag: '🇩🇪' };
  if (ip.startsWith('45.154')) return { country: 'Russia', flag: '🇷🇺' };
  if (ip.startsWith('103.145')) return { country: 'China', flag: '🇨🇳' };
  if (ip.startsWith('194.26')) return { country: 'Netherlands', flag: '🇳🇱' };
  return { country: 'United States', flag: '🇺🇸' };
}

/**
 * Custom HTML Page served when WAF drops a malicious request in Active Blocking mode.
 */
function renderBlockedPage(incidentId: string, attackType: string, clientIp: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>403 Forbidden — SentinelAI WAF Intercepted Request</title>
    <style>
      body { background-color: #06090e; color: #f8fafc; font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { background: #0b0f17; border: 1px solid #ef4444; border-radius: 16px; padding: 40px; max-width: 520px; text-align: center; box-shadow: 0 0 30px rgba(239,68,68,0.25); }
      .icon { width: 64px; h: 64px; margin: 0 auto 20px; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 32px; font-weight: bold; }
      h1 { font-size: 22px; margin-bottom: 8px; color: #ffffff; }
      p { font-size: 13px; color: #94a3b8; line-height: 1.6; }
      .ref-box { background: #161e2e; border: 1px border #1e2d42; border-radius: 8px; padding: 12px; margin: 20px 0; font-family: monospace; font-size: 12px; color: #22d3ee; }
      .footer { font-size: 11px; color: #64748b; margin-top: 24px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">🛡️</div>
      <h1>Request Intercepted & Blocked</h1>
      <p>The SentinelAI Web Application Firewall detected an active security policy violation or high-entropy anomaly signature on this request.</p>
      <div class="ref-box">
        Incident Ref ID: <strong>${incidentId}</strong><br>
        Classification: <strong>${attackType}</strong><br>
        Client IP: <strong>${clientIp}</strong>
      </div>
      <p>If you believe this is a false-positive interception, please contact your SOC Administrator with the incident reference ID above.</p>
      <div class="footer">Protected by SentinelAI Self-Learning WAF Kernel v3.4</div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Fast, cheap per-IP rate limiter that runs BEFORE feature extraction / ML
 * inference. Requests that exceed the window are blocked immediately and
 * logged as "Rate Limit Exceeded" without ever calling the ML service.
 */
export const proxyRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  skip: (req: Request) => req.path.startsWith('/api/admin') || req.path.startsWith('/socket.io') || req.path === '/health',
  handler: (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const incidentId = 'INC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const countryObj = getCountryFromIp(clientIp);

    // Async, non-blocking telemetry log + live dashboard broadcast
    setImmediate(async () => {
      try {
        const logData = {
          incidentId,
          timestamp: new Date(),
          sourceIp: clientIp,
          country: countryObj.country,
          flag: countryObj.flag,
          method: req.method,
          path: req.originalUrl || req.path,
          headers: req.headers,
          payload: '',
          features: { payloadLength: 0, entropy: 0, specialCharCount: 0, sqliKeywordCount: 0, xssKeywordCount: 0 },
          mlVerdict: { isAttack: true, confidence: 1, attackType: 'Rate Limit Exceeded' },
          finalAction: 'Blocked' as const,
          attackType: 'Rate Limit Exceeded',
          source: 'rules' as const,
          reason: 'Per-IP Rate Limit Threshold Exceeded'
        };
        const savedReq = await RequestModel.create(logData);
        await incrementAttackStat({ finalAction: 'Blocked', attackType: 'Rate Limit Exceeded', country: countryObj.country });

        const io = getSocketIO();
        if (io) {
          io.emit('new_request', {
            id: savedReq._id,
            timestamp: savedReq.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            clientIp: savedReq.sourceIp,
            country: savedReq.country,
            flag: savedReq.flag,
            method: savedReq.method,
            path: savedReq.path,
            confidence: 1,
            verdict: 'Blocked',
            attackType: 'Rate Limit Exceeded'
          });
        }
      } catch (err) {
        console.error('[WAF Rate Limiter] Async log error:', err);
      }
    });

    res.status(429).send(renderBlockedPage(incidentId, 'Rate Limit Exceeded', clientIp));
  }
});

/**
 * REVERSE PROXY & INSPECTION PIPELINE MIDDLEWARE
 * Walkthrough Flow:
 * 1. Extract request metadata & payload snippet.
 * 2. Perform fast local regex blocklist & active database rules evaluation.
 * 3. Extract ML feature breakdown (entropy, special characters, SQLi/XSS token count).
 * 4. Perform Hybrid Threat Classification (Fast Rules -> ML Model -> Smart LLM Fallback).
 * 5. Fetch protection mode & confidence threshold from Settings.
 * 6. If Blocking Mode & Attack Confidence > Threshold -> Serve HTTP 403 Blocked Page.
 * 7. Else -> Forward request untouched to target origin app via http-proxy-middleware.
 * 8. Asynchronously log request to MongoDB & broadcast live Socket.IO update.
 */
export async function wafInspectionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Ignore admin API routes and internal socket requests from proxy inspection
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/socket.io') || req.path === '/health') {
    return next();
  }

  const clientIp = getClientIp(req);
  const method = req.method;
  const path = req.originalUrl || req.path;
  const payloadStr = typeof req.body === 'string' ? req.body : (req.body ? JSON.stringify(req.body) : '');

  const incidentId = 'INC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const countryObj = getCountryFromIp(clientIp);

  try {
    // Step 1: Fast local regex blocklist check
    const localCheck = performFastLocalRuleCheck(path, payloadStr);

    // Step 2: Active DB rule evaluation
    let dbRuleMatched = false;
    let matchedRuleName = '';
    try {
      const activeRules = await RuleModel.find({ status: 'active' });
      for (const rule of activeRules) {
        if (!rule.enabled) continue;
        try {
          let matched = false;
          if (rule.type === 'ip-block') {
            matched = rule.pattern === clientIp || new RegExp(rule.pattern, 'i').test(clientIp);
          } else {
            const regex = new RegExp(rule.pattern, 'i');
            matched = regex.test(path) || regex.test(payloadStr);
          }
          if (matched) {
            dbRuleMatched = true;
            matchedRuleName = rule.name;
            rule.hitsCount += 1;
            rule.save().catch(() => {});
            break;
          }
        } catch (e) {}
      }
    } catch (dbErr: any) {
      console.warn('[WAF Middleware] Active rule lookup unavailable (DB down?), continuing with local checks only:', dbErr.message);
    }

    // Step 3: Feature extraction
    const features = extractRequestFeatures(method, path, req.headers, payloadStr);

    // Step 4: Hybrid Detection Pipeline (Rules -> ML -> LLM Fallback)
    const localRuleMatched = localCheck.isBlocked || dbRuleMatched;
    const ruleMatchedName = localCheck.attackType || (dbRuleMatched ? 'Rule Match: ' + matchedRuleName : '');

    const hybridResult = await hybridClassify(
      method,
      path,
      payloadStr,
      req.headers,
      features,
      localRuleMatched,
      ruleMatchedName
    );

    const mlVerdict = {
      isAttack: hybridResult.isAttack,
      confidence: hybridResult.confidence,
      attackType: hybridResult.attackType
    };

    // Step 5: Settings & Decision Engine
    let settings = { protectionMode: 'Active Blocking', confidenceThreshold: 0.65 };
    try {
      const settingsDoc = await SettingsModel.findOne();
      if (settingsDoc) settings = settingsDoc as any;
    } catch (dbErr: any) {
      console.warn('[WAF Middleware] Settings lookup unavailable (DB down?), using default Active Blocking policy:', dbErr.message);
    }
    const isBlockingMode = settings.protectionMode === 'Active Blocking';
    const isThresholdExceeded = mlVerdict.isAttack && mlVerdict.confidence >= settings.confidenceThreshold;

    let finalAction: 'Allowed' | 'Blocked' | 'Flagged' = 'Allowed';
    if (isThresholdExceeded) {
      finalAction = isBlockingMode ? 'Blocked' : 'Flagged';
    } else if (mlVerdict.isAttack) {
      finalAction = 'Flagged';
    }

    // Prepare log record
    const logData = {
      incidentId,
      timestamp: new Date(),
      sourceIp: clientIp,
      country: countryObj.country,
      flag: countryObj.flag,
      method,
      path,
      headers: req.headers,
      payload: payloadStr || path,
      features,
      mlVerdict,
      finalAction,
      attackType: hybridResult.attackType,
      source: hybridResult.source,
      reason: hybridResult.reason || null
    };

    // Step 5: Asynchronous Non-Blocking Database Save & Socket.IO Broadcast
    setImmediate(async () => {
      try {
        const savedReq = await RequestModel.create(logData);

        // Update precomputed daily aggregates used by dashboard charts
        await incrementAttackStat({ finalAction, attackType: hybridResult.attackType, country: countryObj.country });

        // Check if this attack pattern should auto-generate an AI rule
        await checkAndAutoGenerateRules(savedReq);

        // Broadcast to React SOC Dashboard via Socket.IO
        const io = getSocketIO();
        if (io) {
          io.emit('new_request', {
            id: savedReq._id,
            timestamp: savedReq.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            clientIp: savedReq.sourceIp,
            country: savedReq.country,
            flag: savedReq.flag,
            method: savedReq.method,
            path: savedReq.path,
            confidence: savedReq.mlVerdict.confidence,
            verdict: savedReq.finalAction,
            attackType: savedReq.attackType,
            headers: savedReq.headers,
            payload: savedReq.payload,
            features: [
              { name: 'SQL Keyword Density', score: features.sqliKeywordCount * 30, detail: `Count: ${features.sqliKeywordCount}`, status: features.sqliKeywordCount > 0 ? 'anomalous' : 'normal' },
              { name: 'Payload Entropy Score', score: Math.min(100, Math.floor(features.entropy * 18)), detail: `Entropy: ${features.entropy} bits/char`, status: features.entropy > 4.8 ? 'anomalous' : 'normal' },
              { name: 'Special Chars Density', score: Math.min(100, features.specialCharCount * 10), detail: `Count: ${features.specialCharCount}`, status: features.specialCharCount > 5 ? 'suspicious' : 'normal' }
            ]
          });
        }
      } catch (err) {
        console.error('[WAF Async Log Error]:', err);
      }
    });

    // Step 6: Action Enforcement
    if (finalAction === 'Blocked') {
      res.status(403).send(renderBlockedPage(incidentId, hybridResult.attackType, clientIp));
      return;
    }

    // Step 7: Clean request -> Delegate to Origin Reverse Proxy
    next();
  } catch (err) {
    console.error('[WAF Middleware Error]:', err);
    next();
  }
}

// http-proxy-middleware handler targeting real origin server
export const targetOriginProxy = createProxyMiddleware({
  target: TARGET_ORIGIN_URL,
  changeOrigin: true,
  ws: true,
  on: {
    proxyReq: (proxyReq, req: any) => {
      // Re-stream body if parsed by Express json middleware
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    error: (err, req, res: any) => {
      console.error('[Proxy Gateway Error]: Cannot connect to origin target app at', TARGET_ORIGIN_URL);
      if (!res.headersSent) {
        res.status(502).send('<h1>502 Bad Gateway</h1><p>WAF proxy cannot connect to origin application server.</p>');
      }
    }
  }
});
