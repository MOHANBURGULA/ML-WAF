export type Verdict = 'Allowed' | 'Blocked' | 'Flagged';
export type ProtectionMode = 'Monitoring' | 'Active Blocking';
export type AttackType = 'SQL Injection' | 'XSS' | 'DDoS' | 'Path Traversal' | 'Unknown / Zero-day';

export interface FeatureScore {
  name: string;
  score: number; // 0 to 100
  detail: string;
  status: 'normal' | 'suspicious' | 'anomalous';
}

export interface LiveRequest {
  id: string;
  timestamp: string;
  clientIp: string;
  country: string;
  flag: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  confidence: number; // 0.00 to 1.00 anomaly score
  verdict: Verdict;
  attackType: AttackType | 'Normal Traffic';
  headers: Record<string, string>;
  payload: string;
  features: FeatureScore[];
  userOverride?: 'false_positive' | 'confirmed_attack' | null;
}

export interface TopAttacker {
  id: string;
  ip: string;
  country: string;
  flag: string;
  requestCount: number;
  lastSeen: string;
  isBlocked: boolean;
}

export interface AttackLog {
  id: string;
  timestamp: string;
  dateGroup: string; // e.g. 'Today', 'Yesterday', 'July 29, 2026'
  attackType: AttackType;
  targetEndpoint: string;
  payloadSnippet: string;
  sourceIp: string;
  country: string;
  flag: string;
  ipAttackCount: number;
  severity: 'Critical' | 'High' | 'Medium';
}

export interface WafRule {
  id: string;
  name: string;
  type: 'regex' | 'rate-limit' | 'ip-block' | 'entropy';
  source: 'auto' | 'manual';
  pattern: string;
  enabled: boolean;
  createdAt: string;
  hitsCount: number;
  explanation?: string;
}

export interface PendingRule {
  id: string;
  suggestedRuleName: string;
  type: 'regex' | 'rate-limit' | 'ip-block' | 'entropy';
  pattern: string;
  mlConfidence: number;
  reason: string;
  affectedEndpoints: string[];
  samplePayload: string;
  createdAt: string;
}

export interface ModelInfo {
  version: string;
  lastRetrained: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  datasetSamples: string;
  status: 'active' | 'retraining';
}

export interface ProxyApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  status: 'active' | 'revoked';
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  severity: 'critical' | 'warning' | 'info';
  read: boolean;
}
