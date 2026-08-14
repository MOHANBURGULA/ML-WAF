import React, { useState } from 'react';
import { useWaf } from '../context/WafContext';
import { useTheme } from '../context/ThemeContext';
import type { NavTab } from './Sidebar';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Bell, 
  Sun, 
  Moon, 
  ChevronDown, 
  AlertTriangle, 
  Info,
  Radio
} from 'lucide-react';

interface NavbarProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();
  const { 
    protectionMode, 
    setShowModeModal, 
    setPendingModeChange,
    notifications,
    markNotificationRead 
  } = useWaf();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleModeClick = () => {
    const targetMode = protectionMode === 'Active Blocking' ? 'Monitoring' : 'Active Blocking';
    setPendingModeChange(targetMode);
    setShowModeModal(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-soc-900/95 backdrop-blur-md border-b border-slate-200 dark:border-soc-border px-5 py-2.5 flex items-center justify-between transition-colors duration-200 shadow-xs">
      {/* Brand Logo & Status Pill */}
      <div className="flex items-center space-x-4">
        <div 
          onClick={() => setActiveTab && setActiveTab('overview')} 
          className="flex items-center space-x-2.5 cursor-pointer group"
          title="Go to Overview Dashboard"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-cyan-500/10 border border-blue-500/30 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">SentinelAI</span>
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">WAF</span>
          </div>
        </div>

        {/* Protection Mode Switch Pill */}
        <button
          onClick={handleModeClick}
          className={`hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all duration-150 active:scale-95 shadow-xs ${
            protectionMode === 'Active Blocking'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Click to toggle protection mode"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              protectionMode === 'Active Blocking' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              protectionMode === 'Active Blocking' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </span>
          <span className="text-slate-700 dark:text-slate-300">Mode: <strong className="font-bold">{protectionMode}</strong></span>
          <Radio className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      </div>

      {/* Center Top Navbar Navigation Tabs */}
      {setActiveTab && (
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-soc-850 p-1 rounded-xl border border-slate-200 dark:border-soc-800 text-xs font-semibold">
          {[
            { id: 'overview' as NavTab, label: 'Overview' },
            { id: 'traffic' as NavTab, label: 'Live Traffic' },
            { id: 'attacks' as NavTab, label: 'Attacks' },
            { id: 'rules' as NavTab, label: 'Rules' },
            { id: 'settings' as NavTab, label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 dark:bg-cyan-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-soc-800 bg-slate-100/90 dark:bg-soc-850 hover:bg-slate-200/80 dark:hover:bg-soc-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all duration-150 active:scale-95 shadow-xs"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-[11px] font-semibold">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="font-mono text-[11px] font-semibold">Dark</span>
            </>
          )}
        </button>

        {/* Notifications Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-soc-800 bg-slate-100/90 dark:bg-soc-850 hover:bg-slate-200/80 dark:hover:bg-soc-800 transition-all duration-150 active:scale-95 shadow-xs"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-2xl z-50 p-3 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-soc-border pb-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-mono">SOC Security Alerts</span>
                <span className="text-[10px] text-slate-500 font-mono">{notifications.length} total</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-mono">No security notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all duration-150 ${
                        n.read 
                          ? 'bg-slate-50 dark:bg-soc-900/50 border-slate-200 dark:border-soc-800 opacity-70' 
                          : 'bg-slate-100/90 dark:bg-soc-800 border-blue-500/30 dark:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {n.severity === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        ) : n.severity === 'warning' ? (
                          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative border-l border-slate-200 dark:border-soc-border pl-2.5">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-soc-800 transition-colors duration-150"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              SA
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-slate-900 dark:text-white leading-none">Admin SecOps</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Chief Security Officer</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-soc-850 rounded-xl border border-slate-200 dark:border-soc-border shadow-xl z-50 p-2 text-xs animate-fadeIn">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-soc-border">
                <p className="font-semibold text-slate-900 dark:text-white">secops@company.io</p>
                <p className="text-[10px] text-slate-500 font-mono">Role: Lead WAF Operator</p>
              </div>
              <div className="py-1">
                <button 
                  onClick={() => {
                    if (setActiveTab) setActiveTab('settings');
                    setShowProfile(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-soc-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Profile Settings
                </button>
                <button 
                  onClick={() => {
                    if (setActiveTab) setActiveTab('traffic');
                    setShowProfile(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-soc-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Audit Logs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
