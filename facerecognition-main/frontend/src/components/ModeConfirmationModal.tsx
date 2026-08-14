import React from 'react';
import { useWaf } from '../context/WafContext';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

export const ModeConfirmationModal: React.FC = () => {
  const { 
    showModeModal, 
    setShowModeModal, 
    pendingModeChange, 
    setPendingModeChange,
    confirmModeChange 
  } = useWaf();

  if (!showModeModal || !pendingModeChange) return null;

  const isSwitchingToBlocking = pendingModeChange === 'Active Blocking';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-soc-850 rounded-2xl border border-slate-200 dark:border-soc-border shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSwitchingToBlocking 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
            }`}>
              {isSwitchingToBlocking ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Switch to {pendingModeChange}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm protection mode change
              </p>
            </div>
          </div>

          <button 
            onClick={() => { setShowModeModal(false); setPendingModeChange(null); }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="p-3.5 bg-slate-50 dark:bg-soc-900 rounded-xl border border-slate-200 dark:border-soc-800 text-xs space-y-2">
          {isSwitchingToBlocking ? (
            <>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                In <strong className="text-emerald-500">Active Blocking Mode</strong>, incoming requests evaluated as malicious (confidence &gt; 0.65) or matching active security rules will be <strong>automatically dropped / HTTP 403 response</strong> at the proxy edge.
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p>• Zero-day anomalies will trigger automated temporary blocks.</p>
                <p>• Legitimate users with high payload entropy could experience drop errors if false-positive rules are active.</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                In <strong className="text-amber-500">Monitoring Only Mode</strong>, the WAF will log telemetry and score requests but <strong>WILL NOT DROP or BLOCK any traffic</strong>.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ⚠️ Warning: Malicious SQL injections, XSS scripts, and path traversal requests will pass through to downstream origin servers unhindered. Use for audit tuning only!
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={() => { setShowModeModal(false); setPendingModeChange(null); }}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-soc-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={confirmModeChange}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-lg transition-all ${
              isSwitchingToBlocking
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
            }`}
          >
            Confirm & Activate {pendingModeChange}
          </button>
        </div>
      </div>
    </div>
  );
};
