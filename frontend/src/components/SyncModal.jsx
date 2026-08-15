import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, CheckCircle2, AlertTriangle, FileText, Database, Clock } from 'lucide-react';

export default function SyncModal({ isOpen, onClose, syncStatus, onResync, isSyncing }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-card bg-navy-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-850">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal/15 text-teal-light border border-teal/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">CSV Data Ingestion & Sync</h3>
                <p className="text-xs text-slate-400">Single Source of Truth: /data/data.csv</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Status overview pill */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950/80 border border-slate-800">
              <span className="text-sm text-slate-300">Sync Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  syncStatus?.status === 'success'
                    ? 'bg-teal/15 text-teal-light border border-teal/30'
                    : syncStatus?.status === 'running'
                    ? 'bg-amber/15 text-amber-light border border-amber/30 animate-pulse'
                    : 'bg-rose/15 text-rose-light border border-rose/30'
                }`}
              >
                {syncStatus?.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {syncStatus?.status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {syncStatus?.status || 'Unknown'}
              </span>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Rows Read
                </p>
                <p className="text-2xl font-bold text-white mt-1">{syncStatus?.rows_read ?? 0}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-teal-light" />
                  Inserted / Upserted
                </p>
                <p className="text-2xl font-bold text-teal-light mt-1">
                  {(syncStatus?.inserted ?? 0) + (syncStatus?.updated ?? 0)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-light" />
                  Skipped / Malformed
                </p>
                <p className="text-2xl font-bold text-rose-light mt-1">{syncStatus?.skipped ?? 0}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-light" />
                  Last Synced
                </p>
                <p className="text-xs font-mono text-slate-200 mt-2 truncate">
                  {syncStatus?.last_sync_timestamp
                    ? new Date(syncStatus.last_sync_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Not synced'}
                </p>
              </div>
            </div>

            {/* Validation errors if any */}
            {syncStatus?.errors && syncStatus.errors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-200 space-y-1 max-h-32 overflow-y-auto">
                <p className="font-semibold flex items-center gap-1 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5" /> Validation Notice:
                </p>
                {syncStatus.errors.map((err, i) => (
                  <p key={i} className="pl-4 font-mono text-[11px]">• {err}</p>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              Drop any new CSV into <code className="text-teal-light font-mono px-1 py-0.5 rounded bg-slate-800">/data/data.csv</code> and trigger a resync. Existing records will be updated idempotently without creating duplicates.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-navy-850">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={onResync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Ingesting...' : 'Resync from data.csv'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
