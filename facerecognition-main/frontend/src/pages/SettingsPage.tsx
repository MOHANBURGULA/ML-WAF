import React, { useState } from 'react';
import { useWaf } from '../context/WafContext';
import { 
  Settings, 
  BrainCircuit, 
  RefreshCw, 
  Bell, 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Mail,
  MessageSquare,
  Webhook
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { 
    modelInfo, 
    isRetraining, 
    retrainProgress, 
    retrainStage, 
    startModelRetrain,
    apiKeys,
    addApiKey,
    revokeApiKey 
  } = useWaf();

  // API Key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Alert Settings state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [webhookAlerts, setWebhookAlerts] = useState(false);

  const handleCopyKey = (id: string, keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    addApiKey(newKeyName);
    setNewKeyName('');
    setShowKeyModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">System Settings & Model Lifecycle</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure ML classifier hyperparameters, alert webhooks, and proxy edge API credentials
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: AI Model Diagnostics & Interactive Retraining Stepper */}
      <div className="p-5 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-soc-border pb-3">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Neural Classifier Diagnostic Stats</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active model version: <strong className="font-mono text-cyan-600 dark:text-cyan-400">{modelInfo.version}</strong></p>
            </div>
          </div>

          <button
            onClick={startModelRetrain}
            disabled={isRetraining}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              isRetraining
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-wait'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>{isRetraining ? 'Retraining Model...' : 'Retrain Model Now'}</span>
          </button>
        </div>

        {/* Retraining Progress Bar Stepper */}
        {isRetraining && (
          <div className="p-4 bg-slate-900 rounded-xl border border-purple-500/30 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-purple-400 font-mono flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>{retrainStage}</span>
              </span>
              <span className="font-mono text-emerald-400 font-extrabold">{retrainProgress}%</span>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${retrainProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Accuracy</span>
            <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-500">{modelInfo.accuracy}%</div>
            <p className="text-[10px] text-slate-500">Benchmark Test Split</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Precision</span>
            <div className="text-xl font-mono font-extrabold text-cyan-600 dark:text-cyan-400">{modelInfo.precision}%</div>
            <p className="text-[10px] text-slate-500">Low False Alarm Score</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Recall</span>
            <div className="text-xl font-mono font-extrabold text-purple-600 dark:text-purple-400">{modelInfo.recall}%</div>
            <p className="text-[10px] text-slate-500">Exploit Detection Rate</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">F1-Score</span>
            <div className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-500">{modelInfo.f1Score}%</div>
            <p className="text-[10px] text-slate-500">Harmonic Classifier Balance</p>
          </div>
        </div>

        {/* Model Meta Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 pt-1">
          <span>Dataset Volume: {modelInfo.datasetSamples}</span>
          <span>Last Fine-Tuned: {modelInfo.lastRetrained}</span>
        </div>
      </div>

      {/* SECTION 2: Notification & Alert Integration Preferences */}
      <div className="p-5 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-soc-border pb-3">
          <Bell className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">SOC Incident Notification Channels</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure alert dispatches for high-velocity attack spikes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email Channel */}
          <div className="p-4 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">Email Dispatch</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={e => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Send instant email digest to secops-leads@company.com</p>
          </div>

          {/* Slack Channel */}
          <div className="p-4 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">Slack Webhook</span>
              </div>
              <input
                type="checkbox"
                checked={slackAlerts}
                onChange={e => setSlackAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Post critical payloads to #secops-waf-alerts channel</p>
          </div>

          {/* Custom Webhook */}
          <div className="p-4 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Webhook className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">SIEM / PagerDuty</span>
              </div>
              <input
                type="checkbox"
                checked={webhookAlerts}
                onChange={e => setWebhookAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Push JSON telemetry stream to external Datadog / SIEM</p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Reverse Proxy API Keys Management */}
      <div className="p-5 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-soc-border pb-3">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reverse Proxy Node Credentials</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">API keys authenticating Cloudflare Workers, NGINX, and envoy proxies</p>
            </div>
          </div>

          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Key</span>
          </button>
        </div>

        {/* API Keys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-soc-border text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Gateway Name</th>
                <th className="py-2.5 px-3">API Secret Key</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3">Last Activity</th>
                <th className="py-2.5 px-3 text-center">Status / Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-soc-800">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                    No proxy API keys generated yet. Click "Generate New Key" to create one.
                  </td>
                </tr>
              ) : (
                apiKeys.map(k => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-soc-800/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {k.name}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex items-center space-x-2">
                        <code>{k.key.substring(0, 12)}••••••••</code>
                        <button
                          onClick={() => handleCopyKey(k.id, k.key)}
                          className="text-slate-400 hover:text-cyan-500 transition-colors"
                          title="Copy full key"
                        >
                          {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {k.createdAt}
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {k.lastUsed}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {k.status === 'active' ? (
                        <button
                          onClick={() => revokeApiKey(k.id)}
                          className="px-2.5 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[11px] font-semibold"
                        >
                          Revoke Key
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-soc-800 text-slate-500 text-[10px] font-mono">
                          Revoked
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate Proxy API Key</h3>
            
            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gateway Identifier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AP-South AWS Ingress Controller"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-soc-800 font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
