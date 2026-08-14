import { 
  Home,
  Activity, 
  ShieldAlert, 
  Sliders, 
  Settings, 
  BrainCircuit
} from 'lucide-react';
import { useWaf } from '../context/WafContext';

export type NavTab = 'overview' | 'traffic' | 'attacks' | 'rules' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { pendingRules, modelInfo, isStreamingPaused } = useWaf();

  const navItems = [
    { id: 'overview' as NavTab, label: 'Home & Overview', icon: Home },
    { 
      id: 'traffic' as NavTab, 
      label: 'Live Traffic', 
      icon: Activity,
      badge: !isStreamingPaused ? 'LIVE' : 'PAUSED',
      badgeColor: !isStreamingPaused ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600'
    },
    { id: 'attacks' as NavTab, label: 'Attacks', icon: ShieldAlert },
    { 
      id: 'rules' as NavTab, 
      label: 'Rules', 
      icon: Sliders,
      countBadge: pendingRules.length > 0 ? pendingRules.length : null 
    },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-soc-900 border-r border-slate-200 dark:border-soc-border flex flex-col justify-between py-5 px-3.5 select-none transition-colors duration-200 shadow-xs">
      {/* Primary Navigation */}
      <div className="space-y-6">
        <div className="px-3">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-500">
            SOC Navigation
          </span>
        </div>

        <nav className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'bg-blue-50/90 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-400 border border-blue-200/80 dark:border-cyan-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-soc-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {/* Status Badges */}
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}

                {/* Pending Rule Self-Learning Count */}
                {item.countBadge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] animate-pulse">
                    {item.countBadge} AI pending
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Diagnostics Card */}
      <div 
        onClick={() => setActiveTab('settings')}
        className="p-3.5 bg-slate-50 dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border space-y-2.5 shadow-xs cursor-pointer hover:border-cyan-500/50 transition-colors group"
        title="Click to view ML Model diagnostics & retraining settings"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200">ML Engine Health</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">99.4% Acc</span>
        </div>
        
        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 font-mono">
          Model: {modelInfo.version.split('-')[0]}-{modelInfo.version.split('-')[1]}
        </p>

        <div className="w-full bg-slate-200 dark:bg-soc-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full w-[99.4%]" />
        </div>

        <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-500 font-mono">
          <span>Telemetry: Live ML</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping"></span>
            Online
          </span>
        </div>
      </div>
    </aside>
  );
};
