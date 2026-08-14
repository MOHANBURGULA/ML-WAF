import crypto from 'crypto';

export interface ILLMClassificationResult {
  type: string;
  confidence: number;
  source: 'llm';
  reason: string;
}

// 1. In-Memory Cache keyed by SHA-256 hash of (payload + url)
const llmCache = new Map<string, { result: ILLMClassificationResult; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache TTL

// 2. Sliding Window Rate Limiter Guard (Max 20 LLM requests per 60 seconds)
const MAX_LLM_CALLS_PER_MIN = 20;
let llmCallTimestamps: number[] = [];

function checkRateLimitGuard(): boolean {
  const now = Date.now();
  llmCallTimestamps = llmCallTimestamps.filter(ts => now - ts < 60_000);
  if (llmCallTimestamps.length >= MAX_LLM_CALLS_PER_MIN) {
    return false;
  }
  llmCallTimestamps.push(now);
  return true;
}

function getCacheKey(payload: string, url: string): string {
  return crypto.createHash('sha256').update(`${url}::${payload}`).digest('hex');
}

/**
 * Smart Heuristic Fallback Classifier for novel/zero-day attack vectors
 * (Used when GEMINI_API_KEY is unconfigured or during API timeouts)
 */
function heuristicNovelAttackClassifier(combinedText: string): ILLMClassificationResult | null {
  const text = decodeURIComponent(combinedText).toLowerCase();

  // SSTI (Server-Side Template Injection)
  if (/(\{\{.*?\}\}|\$\{.*?\}|<%.*?%>)/i.test(text)) {
    return {
      type: 'SSTI',
      confidence: 0.92,
      source: 'llm',
      reason: 'Detected Server-Side Template Injection syntax ({{...}} or ${...})'
    };
  }

  // Command Injection
  if (/(cat\s+|\bls\b|whoami|uname\s+-|netstat|curl\s+|wget\s+|;\s*cat|\|\s*cat|&\s*cat|;\s*ls|\|\s*ls|&&\s*whoami|\bcmd\b)/i.test(text)) {
    return {
      type: 'Command Injection',
      confidence: 0.94,
      source: 'llm',
      reason: 'Detected OS Command Execution signature (cat, ls, whoami, pipe)'
    };
  }

  // NoSQL Injection
  if (/(\[\$ne\]|\[\$gt\]|\[\$lt\]|\[\$regex\]|\$where|\$or|\$and|\{\$ne|\{\$gt)/i.test(text)) {
    return {
      type: 'NoSQL Injection',
      confidence: 0.91,
      source: 'llm',
      reason: 'Detected MongoDB / NoSQL operator injection ($ne, $gt, $where)'
    };
  }

  // XXE (XML External Entity)
  if (/(<!entity|system\s+["']|<!element|<!doctype.*\[)/i.test(text)) {
    return {
      type: 'XXE',
      confidence: 0.93,
      source: 'llm',
      reason: 'Detected XML External Entity payload (<!ENTITY SYSTEM)'
    };
  }

  // CRLF Injection
  if (/(%0d%0a|\r\n|set-cookie:)/i.test(text)) {
    return {
      type: 'CRLF',
      confidence: 0.88,
      source: 'llm',
      reason: 'Detected HTTP response splitting / CRLF injection'
    };
  }

  // LDAP Injection
  if (/(\(\||&\(|\*\(|objectclass=|\(cn=\*)/i.test(text)) {
    return {
      type: 'LDAP Injection',
      confidence: 0.89,
      source: 'llm',
      reason: 'Detected LDAP filter injection pattern'
    };
  }

  return null;
}

/**
 * Smart Path (LLM Fallback) — Sends unclassified or low-confidence requests to Gemini
 * for deep classification of novel/unknown attack vectors (Command Injection, SSTI, NoSQL, XXE, CRLF, etc.).
 */
export async function classifyWithLLM(payload: string, headers: any, url: string): Promise<ILLMClassificationResult> {
  const cacheKey = getCacheKey(payload, url);
  const cached = llmCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[WAF LLM Classifier] Returning cached LLM threat classification for request.');
    return cached.result;
  }

  const combinedText = `${url} ${payload} ${JSON.stringify(headers || {})}`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    const heuristic = heuristicNovelAttackClassifier(combinedText);
    if (heuristic) {
      console.log(`[WAF Smart Classifier] Classified novel vector as ${heuristic.type} via deep pattern analysis.`);
      llmCache.set(cacheKey, { result: heuristic, timestamp: Date.now() });
      return heuristic;
    }

    return {
      type: 'Unknown',
      confidence: 0.5,
      source: 'llm',
      reason: 'GEMINI_API_KEY environment variable not set'
    };
  }

  // Check rate limit guard to avoid runaway costs
  if (!checkRateLimitGuard()) {
    console.warn('[WAF LLM Classifier] Rate limit guard triggered (max 20 LLM calls/min exceeded). Using fallback classification.');
    const heuristic = heuristicNovelAttackClassifier(combinedText);
    return heuristic || {
      type: 'Unknown',
      confidence: 0.5,
      source: 'llm',
      reason: 'LLM rate limit guard triggered to protect cost'
    };
  }

  const prompt = `
You are a cybersecurity expert analyzing a Web Application Firewall (WAF) HTTP request. Classify the following HTTP request into a specific attack type.

Possible types include but are not limited to: SQL Injection, XSS, Path Traversal, Command Injection, SSTI, NoSQL Injection, Header Injection, CRLF, XXE, LDAP Injection, Rate Limit Exceeded, DDoS, or Unknown.

Request URL: ${url}
Payload: ${payload}
Headers: ${JSON.stringify(headers || {})}

Reply ONLY in this valid JSON format without markdown ticks:
{
  "type": "Attack Type",
  "confidence": 0.85,
  "reason": "short 1-sentence technical explanation"
}
`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[WAF LLM Classifier] Gemini API returned error status ${response.status}:`, errText);
      const heuristic = heuristicNovelAttackClassifier(combinedText);
      return heuristic || {
        type: 'Unknown',
        confidence: 0.5,
        source: 'llm',
        reason: `Gemini API HTTP Error ${response.status}`
      };
    }

    const data: any = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    if (parsed && typeof parsed.type === 'string' && typeof parsed.confidence === 'number') {
      const result: ILLMClassificationResult = {
        type: parsed.type || 'Unknown',
        confidence: Number(parsed.confidence) || 0.7,
        source: 'llm',
        reason: parsed.reason || 'Deep LLM anomaly classification'
      };

      llmCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
  } catch (err: any) {
    console.error('[WAF LLM Classifier] Error parsing LLM response:', err.message);
  }

  const heuristicFallback = heuristicNovelAttackClassifier(combinedText);
  const fallbackResult: ILLMClassificationResult = heuristicFallback || {
    type: 'Unknown',
    confidence: 0.5,
    source: 'llm',
    reason: 'LLM parse failure or unhandled response'
  };

  llmCache.set(cacheKey, { result: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}
