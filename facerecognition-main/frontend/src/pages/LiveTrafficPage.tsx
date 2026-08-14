import React, { useState } from 'react';
import { useWaf } from '../context/WafContext';
import type { LiveRequest, Verdict, AttackType } from '../types/waf';
import { 
  Play, 
  Pause, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  Code2,
  Brain,
  ShieldCheck,
  Ban,
  Copy,
  Check
} from 'lucide-react';

export const LiveTrafficPage: React.FC = () => {
  const { 
    liveRequests, 
    isStreamingPaused, 
    togglePauseStream, 
    clearLiveStream, 
    updateRequestOverride 
  } = useWaf();

  // Filters State
  const [selectedVerdict, setSelectedVerdict] = useState<Verdict | 'All'>('All');
  const [selectedAttackType, setSelectedAttackType] = useState<AttackType | 'Normal Traffic' | 'All'>('All');
  const [ipQuery, setIpQuery] = useState('');
  const [confidenceMin, setConfidenceMin] = useState<number>(0.0);

  // Inspector Drawer State
  const [selectedRequest, setSelectedRequest] = useState<LiveRequest | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Filter Logic
  const filteredRequests = liveRequests.filter(req => {
    if (selectedVerdict !== 'All' && req.verdict !== selectedVerdict) return false;
    if (selectedAttackType !== 'All' && req.attackType !== selectedAttackType) return false;
    if (ipQuery && !req.clientIp.toLowerCase().includes(ipQuery.toLowerCase()) && !req.path.toLowerCase().includes(ipQuery.toLowerCase())) return false;
    if (req.confidence < confidenceMin) return false;
    return true;
  });

  const handleCopyPayload = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const getVerdictBadge = (verdict: Verdict) => {
    switch (verdict) {
      case 'Allowed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono text-[10px] font-bold flex items-center space-x-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            <span>Allowed</span>
          </span>
        );
      case 'Blocked':
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-mono text-[10px] font-bold flex items-center space-x-1 w-fit">
            <ShieldAlert className="w-3 h-3" />
            <span>Blocked</span>
          </span>
        );
      case 'Flagged':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono text-[10px] font-bold flex items-center space-x-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            <span>Flagged</span>
          </span>
        );
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    let color = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (confidence > 0.65) color = 'bg-red-500/10 text-red-500 border-red-500/20';
    else if (confidence > 0.35) color = 'bg-amber-500/10 text-amber-500 border-amber-500/20';

    return (
      <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${color}`}>
        {confidence.toFixed(2)}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Live Controls Header Bar */}
      <div className="p-4 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${!isStreamingPaused ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Traffic Request Feed</h2>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-soc-900 text-slate-500 font-mono text-[10px]">
                {filteredRequests.length} items showing
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Streaming HTTP requests evaluated in real-time by Sentinel-Transformer ML
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={togglePauseStream}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isStreamingPaused
                ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm'
                : 'bg-slate-100 dark:bg-soc-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-soc-800 hover:bg-slate-200 dark:hover:bg-soc-800'
            }`}
          >
            {isStreamingPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isStreamingPaused ? 'Resume Stream' : 'Pause Feed'}</span>
          </button>

          <button
            onClick={clearLiveStream}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Clear buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
          <Filter className="w-4 h-4 text-cyan-500" />
          <span>Real-time Telemetry Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* IP / Path Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search IP or Path..."
              value={ipQuery}
              onChange={e => setIpQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-cyan-500 transition-all duration-150"
            />
          </div>

          {/* Verdict Filter */}
          <div>
            <select
              value={selectedVerdict}
              onChange={e => setSelectedVerdict(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-cyan-500 transition-all duration-150"
            >
              <option value="All">Verdict: All Statuses</option>
              <option value="Allowed">Verdict: Allowed Only</option>
              <option value="Blocked">Verdict: Blocked Only</option>
              <option value="Flagged">Verdict: Flagged Only</option>
            </select>
          </div>

          {/* Attack Type Filter */}
          <div>
            <select
              value={selectedAttackType}
              onChange={e => setSelectedAttackType(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-soc-900 border border-slate-200 dark:border-soc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-cyan-500 transition-all duration-150"
            >
              <option value="All">Attack Vector: All Types</option>
              <option value="SQL Injection">SQL Injection</option>
              <option value="XSS">XSS (Cross-Site Scripting)</option>
              <option value="DDoS">DDoS / Rate Limit</option>
              <option value="Path Traversal">Path Traversal</option>
              <option value="Unknown / Zero-day">Unknown / Zero-day</option>
              <option value="Normal Traffic">Normal Traffic</option>
            </select>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>ML Score Threshold</span>
              <span className="text-cyan-500 font-bold">&gt;= {confidenceMin.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={confidenceMin}
              onChange={e => setConfidenceMin(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-soc-700 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Live Table */}
      <div className="bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-soc-border text-slate-400 uppercase font-mono text-[10px] bg-slate-50 dark:bg-soc-900/50">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Method & Target Path</th>
                <th className="py-3 px-4 text-center">ML Confidence</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-soc-800 font-mono">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No traffic requests match the active filter parameters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr 
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="hover:bg-slate-50 dark:hover:bg-soc-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {req.timestamp}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200 whitespace-nowrap">
                      <span className="mr-1.5 text-sm">{req.flag}</span>
                      <span>{req.clientIp}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          req.method === 'GET' ? 'bg-blue-500/10 text-blue-500' :
                          req.method === 'POST' ? 'bg-emerald-500/10 text-emerald-500' :
                          req.method === 'DELETE' ? 'bg-red-500/10 text-red-500' : 'bg-purple-500/10 text-purple-500'
                        }`}>
                          {req.method}
                        </span>
                        <span className="text-slate-800 dark:text-slate-300 font-medium truncate max-w-xs md:max-w-md">
                          {req.path}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getConfidenceBadge(req.confidence)}
                    </td>

                    <td className="py-3 px-4">
                      {getVerdictBadge(req.verdict)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 rounded bg-slate-100 dark:bg-soc-800 text-slate-600 dark:text-slate-300 group-hover:bg-cyan-500 group-hover:text-white transition-colors text-[11px] font-semibold">
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Inspector Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-soc-850 h-full border-l border-slate-200 dark:border-soc-border shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-soc-border pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Request Inspector</h3>
                    <span className="font-mono text-xs text-slate-500">ID: {selectedRequest.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Evaluated at {selectedRequest.timestamp} by Sentinel WAF Edge Node
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Header Bar */}
              <div className="p-3 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Current Verdict</div>
                  <div className="mt-0.5">{getVerdictBadge(selectedRequest.verdict)}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">ML Anomaly Rating</div>
                  <div className="mt-0.5">{getConfidenceBadge(selectedRequest.confidence)}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Attack Classification</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedRequest.attackType}
                  </div>
                </div>
              </div>

              {/* Request Metadata Box */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-400">Connection Telemetry</span>
                <div className="p-3 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client IP:</span>
                    <span className="text-slate-900 dark:text-slate-100">{selectedRequest.flag} {selectedRequest.clientIp} ({selectedRequest.country})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">HTTP Method:</span>
                    <span className="font-bold text-cyan-500">{selectedRequest.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target URI:</span>
                    <span className="text-slate-900 dark:text-slate-200 break-all">{selectedRequest.path}</span>
                  </div>
                </div>
              </div>

              {/* Request Payload Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center space-x-1">
                    <Code2 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Raw HTTP Payload / Query Snippet</span>
                  </span>
                  <button 
                    onClick={() => handleCopyPayload(selectedRequest.payload)}
                    className="flex items-center space-x-1 text-[11px] text-cyan-500 hover:underline"
                  >
                    {copiedPayload ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPayload ? 'Copied!' : 'Copy Payload'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto break-all shadow-inner">
                  <code>{selectedRequest.payload}</code>
                </div>
              </div>

              {/* ML Feature Breakdown Section */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center space-x-1">
                  <Brain className="w-3.5 h-3.5 text-purple-500" />
                  <span>ML Feature Vector Decomposition</span>
                </span>

                <div className="space-y-2">
                  {selectedRequest.features.map((feat, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-900 dark:text-slate-200">{feat.name}</span>
                        <span className={`font-mono ${
                          feat.status === 'anomalous' ? 'text-red-500 font-bold' :
                          feat.status === 'suspicious' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {feat.score}/100 ({feat.status})
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-200 dark:bg-soc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            feat.status === 'anomalous' ? 'bg-red-500' :
                            feat.status === 'suspicious' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${feat.score}%` }}
                        />
                      </div>
                      
                      <p className="text-[11px] text-slate-500 font-mono">{feat.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Headers Collapse */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-400">Full Request Headers</span>
                <div className="p-3 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 text-[11px] font-mono space-y-1 text-slate-600 dark:text-slate-400">
                  {Object.entries(selectedRequest.headers).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-100 dark:border-soc-800/40 pb-1">
                      <span className="text-slate-400 font-semibold">{key}:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Manual Override Action Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-soc-border space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-slate-400">SOC Operator Override Action</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    updateRequestOverride(selectedRequest.id, 'false_positive');
                    setSelectedRequest(prev => prev ? { ...prev, verdict: 'Allowed' } : null);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-xs font-semibold flex items-center justify-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mark as False Positive</span>
                </button>

                <button
                  onClick={() => {
                    updateRequestOverride(selectedRequest.id, 'confirmed_attack');
                    setSelectedRequest(prev => prev ? { ...prev, verdict: 'Blocked' } : null);
                  }}
                  className="px-3 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-xs font-semibold flex items-center justify-center space-x-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Confirm & Block IP</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
