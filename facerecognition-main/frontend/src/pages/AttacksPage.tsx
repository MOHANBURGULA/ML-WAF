import React, { useState } from 'react';
import { useWaf } from '../context/WafContext';
import type { AttackLog } from '../types/waf';
import { 
  ShieldAlert, 
  Globe, 
  ChevronDown, 
  ChevronRight, 
  Code2, 
  Calendar
} from 'lucide-react';

export const AttacksPage: React.FC = () => {
  const { attackLogs, topAttackers } = useWaf();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group attacks by dateGroup
  const groups: Record<string, AttackLog[]> = {};
  attackLogs.forEach(atk => {
    const key = atk.dateGroup || 'Recent';
    if (!groups[key]) groups[key] = [];
    groups[key].push(atk);
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const topRegions = topAttackers.map(atk => ({
    name: atk.country,
    flag: atk.flag,
    ip: atk.ip,
    count: atk.requestCount,
    pct: topAttackers[0]?.requestCount ? Math.min(100, Math.round((atk.requestCount / topAttackers[0].requestCount) * 100)) : 100,
    color: atk.requestCount > 10 ? 'bg-red-500' : 'bg-amber-500'
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Confirmed Attack Timeline & Threat Geography</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit timeline of high-severity security exploits detected across edge nodes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-soc-900 border border-slate-200 dark:border-soc-800">
            {attackLogs.length} logged incidents
          </span>
        </div>
      </div>

      {/* Attacker Geography World Map Section */}
      <div className="p-5 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-soc-border pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Global Threat Origin Distribution</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Real-time IP Geolocation Telemetry</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Custom SVG World Map Graphic with glowing threat nodes */}
          <div className="lg:col-span-2 relative p-4 bg-slate-950 rounded-xl border border-slate-800 h-64 flex items-center justify-center overflow-hidden shadow-inner">
            <svg viewBox="0 0 1000 500" className="w-full h-full opacity-30 stroke-slate-500 fill-slate-900">
              <path d="M 150 150 Q 200 120 280 140 T 250 250 T 160 220 Z" strokeWidth="2" />
              <path d="M 280 270 Q 320 300 300 420 T 250 350 Z" strokeWidth="2" />
              <path d="M 470 120 Q 550 100 580 180 T 480 180 Z" strokeWidth="2" />
              <path d="M 480 200 Q 560 220 540 380 T 460 260 Z" strokeWidth="2" />
              <path d="M 600 100 Q 750 80 880 150 T 700 280 Z" strokeWidth="2" />
              <path d="M 780 320 Q 860 330 840 420 T 760 380 Z" strokeWidth="2" />
            </svg>

            {topAttackers.length > 0 ? (
              topAttackers.slice(0, 4).map((atk, idx) => {
                const positions = [
                  { top: '28%', left: '49%' },
                  { top: '22%', left: '65%' },
                  { top: '38%', left: '75%' },
                  { top: '32%', left: '22%' }
                ];
                const pos = positions[idx % positions.length];
                return (
                  <div key={atk.id} className="absolute flex items-center justify-center" style={{ top: pos.top, left: pos.left }}>
                    <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-glow-red"></span>
                    <span className="absolute -top-5 left-4 font-mono text-[9px] bg-slate-900/90 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {atk.flag} {atk.ip} ({atk.requestCount})
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="absolute text-slate-500 font-mono text-xs">No active threat origin pins</div>
            )}
          </div>

          {/* Top Threat Countries List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-400">Top Attack Regions</h4>
            {topRegions.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono">No attack telemetry logged yet.</div>
            ) : (
              <div className="space-y-2">
                {topRegions.map((item, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-200">{item.flag} {item.name} ({item.ip})</span>
                      <span className="font-mono text-red-500 font-bold">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-soc-800 h-1 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline View Grouped by Day */}
      <div className="space-y-6">
        {Object.keys(groups).length === 0 ? (
          <div className="p-8 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border text-center text-xs text-slate-400 font-mono">
            No confirmed attack incidents recorded. Send blocked attack requests through proxy to view logs.
          </div>
        ) : (
          Object.entries(groups).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-soc-border pb-2">
                <Calendar className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {dateGroup} ({items.length} attacks)
                </h3>
              </div>

              <div className="space-y-3">
                {items.map(atk => {
                  const isExpanded = expandedId === atk.id;
                  return (
                    <div 
                      key={atk.id}
                      className="bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-sm overflow-hidden transition-all"
                    >
                      <div 
                        onClick={() => toggleExpand(atk.id)}
                        className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-soc-800/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-1 rounded text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            atk.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            atk.severity === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {atk.severity}
                          </span>

                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {atk.attackType}
                          </span>

                          <span className="font-mono text-xs text-cyan-500 font-medium">
                            {atk.targetEndpoint}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-xs font-mono">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">
                              {atk.flag} {atk.sourceIp}
                            </span>
                          </div>

                          <span className="text-slate-400 text-[11px]">
                            {atk.timestamp}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 dark:border-soc-800 bg-slate-50/50 dark:bg-soc-900/50 space-y-3 animate-fadeIn">
                          <div className="space-y-1">
                            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase flex items-center space-x-1">
                              <Code2 className="w-3.5 h-3.5 text-red-500" />
                              <span>Intercepted Malicious Payload Snippet</span>
                            </span>
                            <div className="p-3 bg-slate-950 text-red-400 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner">
                              <code>{atk.payloadSnippet}</code>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-1 text-slate-500">
                            <span>Origin Country: {atk.flag} {atk.country}</span>
                            <span className="text-emerald-500">Action Taken: Dropped & Intercepted by WAF</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
