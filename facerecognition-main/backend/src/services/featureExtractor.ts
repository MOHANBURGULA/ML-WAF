import { IFeatureBreakdown } from '../models/Request.js';

export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

const SQLI_REGEX = /(union\s+select|information_schema|select\s+.*from|drop\s+table|insert\s+into|delete\s+from|exec\s*\(|sleep\s*\(|benchmark\s*\(|'\s*(or|and)\s*'?\d|'\s*(or|and)\s*'[^']*'\s*=\s*'|(--|#)(\s|$)|;\s*--|\bor\s+1\s*=\s*1\b|\bor\s+true\b|xp_cmdshell)/i;
const XSS_REGEX = /(<script[^>]*>|<svg[^>]*onload|onmouseover\s*=|javascript\s*:|eval\s*\(|alert\s*\(|document\.cookie)/i;
const PATH_TRAVERSAL_REGEX = /(\.\.[\/\\]|%2e%2e%2f|%252e%252e%252f|\/etc\/passwd|\/etc\/shadow|\/proc\/self)/i;

export function extractRequestFeatures(method: string, path: string, headers: any, payload: string): IFeatureBreakdown {
  const combinedText = `${method} ${path} ${payload} ${JSON.stringify(headers || {})}`;

  // Special characters count
  const specialCharsMatch = combinedText.match(/['"<>;()=\-\\/\%]/g);
  const specialCharCount = specialCharsMatch ? specialCharsMatch.length : 0;

  // SQLi Keyword Count
  const sqliMatch = combinedText.match(/(union|select|information_schema|sleep|drop|insert|delete|exec|benchmark|xp_cmdshell|'\s*(or|and)\s*'|--\s|;--|\bor\s+1\s*=\s*1\b|\bor\s+true\b)/gi);
  const sqliKeywordCount = sqliMatch ? sqliMatch.length : 0;

  // XSS Keyword Count
  const xssMatch = combinedText.match(/(script|svg|onload|onmouseover|javascript|alert|eval|document\.cookie)/gi);
  const xssKeywordCount = xssMatch ? xssMatch.length : 0;

  return {
    payloadLength: payload.length,
    entropy: calculateShannonEntropy(payload || path),
    specialCharCount,
    sqliKeywordCount,
    xssKeywordCount
  };
}

export function performFastLocalRuleCheck(path: string, payload: string): { isBlocked: boolean; reason?: string; attackType?: string } {
  const targetText = `${path} ${payload}`;

  if (SQLI_REGEX.test(targetText)) {
    return { isBlocked: true, reason: 'Matched fast-pass local SQL Injection regex signature', attackType: 'SQL Injection' };
  }

  if (XSS_REGEX.test(targetText)) {
    return { isBlocked: true, reason: 'Matched fast-pass local XSS regex signature', attackType: 'XSS' };
  }

  if (PATH_TRAVERSAL_REGEX.test(targetText)) {
    return { isBlocked: true, reason: 'Matched fast-pass local Path Traversal regex signature', attackType: 'Path Traversal' };
  }

  return { isBlocked: false };
}
