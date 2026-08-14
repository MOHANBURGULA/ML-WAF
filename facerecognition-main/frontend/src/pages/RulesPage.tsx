import React, { useState } from 'react';
import { useWaf } from '../context/WafContext';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  BrainCircuit,
  Search
} from 'lucide-react';

export const RulesPage: React.FC = () => {
  const { 
    activeRules, 
    pendingRules, 
    toggleRuleEnabled, 
    deleteRule, 
    addRule, 
    approvePendingRule, 
    rejectPendingRule 
  } = useWaf();

  // Search & Filter
  const [ruleSearch, setRuleSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'auto' | 'manual'>('all');

  // Add Rule Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'regex' | 'rate-limit' | 'ip-block' | 'entropy'>('regex');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleExplanation, setNewRuleExplanation] = useState('');

  const filteredActiveRules = activeRules.filter(r => {
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (ruleSearch && !r.name.toLowerCase().includes(ruleSearch.toLowerCase()) && !r.pattern.toLowerCase().includes(ruleSearch.toLowerCase())) return false;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName || !newRulePattern) return;

    addRule({
      name: newRuleName,
      type: newRuleType,
      source: 'manual',
      pattern: newRulePattern,
      enabled: true,
      explanation: newRuleExplanation || 'Manually created by SOC Administrator',
    });

    setNewRuleName('');
    setNewRulePattern('');
    setNewRuleExplanation('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>WAF Firewall Rules & ML Feedback Engine</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage active inspection rules & review AI self-learned rule recommendations
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Rule</span>
        </button>
      </div>

      {/* KEY SELF-LEARNING SECTION: AI Pending Review Queue */}
      <div className="p-5 bg-white dark:bg-soc-850 rounded-2xl border border-purple-500/30 dark:border-purple-500/30 shadow-md space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-purple-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>AI Self-Learning Rule Suggestions</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono font-extrabold text-[10px]">
                {pendingRules.length} PENDING APPROVAL
              </span>
            </h3>
          </div>
          <span className="text-xs text-purple-600 dark:text-purple-300 font-mono font-semibold">Continuous ML Feedback Loop Active</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          The Sentinel WAF self-learning engine analyzes live HTTP telemetry and attack entropy spikes to automatically generate suggested security rules. Approved rules deploy instantly to proxy edge nodes.
        </p>

        {pendingRules.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-purple-500/20 rounded-xl">
            No pending AI rule suggestions at this time. Model feedback loop is operating nominal.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRules.map(pending => (
              <div 
                key={pending.id} 
                className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-purple-500/30 space-y-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
                      Auto-Suggested Rule
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{pending.suggestedRuleName}</h4>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {(pending.mlConfidence * 100).toFixed(0)}% ML Confidence
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{pending.createdAt}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans">{pending.reason}</p>

                {/* Pattern snippet */}
                <div className="p-2.5 bg-slate-900 text-cyan-400 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Suggested Pattern:</div>
                  <code>{pending.pattern}</code>
                </div>

                {/* Approve / Reject Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Scope: {pending.affectedEndpoints.join(', ')}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => rejectPendingRule(pending.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => approvePendingRule(pending.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Deploy Rule</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Rules Section */}
      <div className="p-5 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm space-y-4">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-soc-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Rule Registry</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Rules actively matching incoming proxy requests</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter rules..."
                value={ruleSearch}
                onChange={e => setRuleSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">Source: All</option>
              <option value="auto">Auto-generated</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-soc-border text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Rule Name & Type</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Pattern / Threshold</th>
                <th className="py-2.5 px-3 text-right">Total Hits</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-soc-800">
              {filteredActiveRules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-soc-800/50 transition-colors">
                  {/* Enabled Toggle */}
                  <td className="py-3 px-3">
                    <button
                      onClick={() => toggleRuleEnabled(rule.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-soc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          rule.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Name & Type */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{rule.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Type: {rule.type}</div>
                  </td>

                  {/* Source Badge */}
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                      rule.source === 'auto'
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
                        : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
                    }`}>
                      {rule.source === 'auto' ? 'Auto-generated' : 'Manual'}
                    </span>
                  </td>

                  {/* Pattern */}
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    <code>{rule.pattern}</code>
                  </td>

                  {/* Hits Count */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {rule.hitsCount.toLocaleString()}
                  </td>

                  {/* Delete Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-soc-border pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Custom WAF Security Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block Malicious User-Agent Bot"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Rule Type</label>
                <select
                  value={newRuleType}
                  onChange={e => setNewRuleType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="regex">Regex Match</option>
                  <option value="rate-limit">Rate Limit Threshold</option>
                  <option value="ip-block">IP / Subnet Block</option>
                  <option value="entropy">Payload Entropy Threshold</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pattern / Threshold Expression</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. (?i)(sqlmap|nikto|nmap|acunetix)"
                  value={newRulePattern}
                  onChange={e => setNewRulePattern(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Explanation / Rationale</label>
                <textarea
                  placeholder="Why is this rule being added?"
                  value={newRuleExplanation}
                  onChange={e => setNewRuleExplanation(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-soc-800 font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20"
                >
                  Save & Deploy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
