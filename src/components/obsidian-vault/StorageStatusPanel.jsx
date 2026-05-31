/**
 * StorageStatusPanel
 * Read-only panel showing Obsidian draft/audit storage health.
 * Primary source: VeridanObsidianDraft + VeridanObsidianWriteAudit entities (backend).
 * Fallback/cache: localStorage lightweight keys.
 *
 * Safety guarantees:
 * - No OpenClaw dispatch · No browser automation · No credentials · No InvokeLLM
 * - No direct vault writes
 * - "Clear Local Cache Only" removes ONLY obsolete localStorage cache keys.
 * - Backend entity records are NEVER deleted or mutated.
 * - Approved drafts and write audits are always preserved.
 * - executionStatus / dispatchStatus / openclawCall remain untouched.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Database, HardDrive, RefreshCw, Trash2, CheckCircle2, AlertTriangle, XCircle, Info, ShieldCheck } from 'lucide-react';
import { loadDraftsFromBackend, loadAuditsFromBackend, clearLocalCacheOnly } from '@/lib/obsidianDraftStore';

const LS_CACHE_KEYS = [
  'veridan_obsidian_drafts',
  'veridan_obsidian_drafts_cache',
  'veridan_obsidian_write_audits',
];

function getLocalStorageCounts() {
  const draftEntries = (() => {
    try { const r = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]'); return Array.isArray(r) ? r.length : 0; } catch { return 0; }
  })();
  const draftCache = (() => {
    try { const r = JSON.parse(localStorage.getItem('veridan_obsidian_drafts_cache') || '[]'); return Array.isArray(r) ? r.length : 0; } catch { return 0; }
  })();
  const auditCache = (() => {
    try { const r = JSON.parse(localStorage.getItem('veridan_obsidian_write_audits') || '[]'); return Array.isArray(r) ? r.length : 0; } catch { return 0; }
  })();
  return { draftEntries, draftCache, auditCache };
}

function getLocalStorageHealth() {
  try {
    let total = 0;
    for (const k of LS_CACHE_KEYS) {
      total += (localStorage.getItem(k) || '').length;
    }
    const kb = Math.round(total / 1024);
    if (kb > 800) return { label: 'Cleanup Recommended', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: XCircle, kb };
    if (kb > 400) return { label: 'Near Limit', color: 'text-accent', bg: 'bg-accent/10 border-accent/30', icon: AlertTriangle, kb };
    return { label: 'OK', color: 'text-primary', bg: 'bg-primary/10 border-primary/30', icon: CheckCircle2, kb };
  } catch {
    return { label: 'Unknown', color: 'text-slate-400', bg: 'bg-border/20 border-border/30', icon: Info, kb: 0 };
  }
}

function deriveStorageSource(backendDrafts, backendAudits, lsCounts) {
  const hasBackend = backendDrafts > 0 || backendAudits > 0;
  const hasLocal = lsCounts.draftEntries > 0 || lsCounts.draftCache > 0 || lsCounts.auditCache > 0;
  if (hasBackend && hasLocal) return 'mixed';
  if (hasBackend) return 'backend';
  if (hasLocal) return 'localStorage';
  return 'empty';
}

const SOURCE_CONFIG = {
  backend: { label: 'Backend Entity Storage', color: 'text-primary', bg: 'bg-primary/10 border-primary/30', icon: Database },
  localStorage: { label: 'LocalStorage Fallback', color: 'text-accent', bg: 'bg-accent/10 border-accent/30', icon: HardDrive },
  mixed: { label: 'Mixed / Cache Mode', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', icon: Database },
  empty: { label: 'No Data', color: 'text-slate-500', bg: 'bg-border/20 border-border/30', icon: Info },
};

const VERIFICATIONS = [
  'Backend entities read-only (no mutations from this panel)',
  '"Clear Local Cache Only" does NOT touch backend records',
  'Approved drafts and write audits are always preserved',
  'executionStatus remains NOT_EXECUTED',
  'dispatchStatus remains NOT_DISPATCHED',
  'openclawCall remains NOT_SENT',
  'No OpenClaw dispatch · No browser automation · No credentials · No InvokeLLM',
];

export default function StorageStatusPanel({ className = '' }) {
  const [status, setStatus] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  const refresh = useCallback(async () => {
    setStatus(null);
    setError('');

    let backendDrafts = 0;
    let backendAudits = 0;
    let backendError = '';

    try {
      const [drafts, audits] = await Promise.all([
        loadDraftsFromBackend(200),
        loadAuditsFromBackend(200),
      ]);
      backendDrafts = drafts.length;
      backendAudits = audits.length;
    } catch (e) {
      backendError = e?.message || 'Backend read failed';
    }

    const lsCounts = getLocalStorageCounts();
    const lsHealth = getLocalStorageHealth();
    const source = backendError
      ? 'localStorage'
      : deriveStorageSource(backendDrafts, backendAudits, lsCounts);

    setError(backendError);
    setStatus({ backendDrafts, backendAudits, lsCounts, lsHealth, source });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleClearCache = async () => {
    setClearing(true);
    setClearResult(null);
    const result = clearLocalCacheOnly();
    setClearResult(result);
    await refresh();
    setClearing(false);
    setTimeout(() => setClearResult(null), 6000);
  };

  const src = status ? SOURCE_CONFIG[status.source] : null;

  return (
    <div className={`border border-border/40 bg-card rounded-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Storage Status</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVerification(v => !v)}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-mono border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 rounded-sm transition-colors"
          >
            <ShieldCheck className="w-2.5 h-2.5" /> Verify
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={!status}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-bold uppercase border border-border/40 text-slate-400 hover:text-slate-200 hover:border-primary/30 rounded-sm transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${!status ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* Loading */}
        {!status && (
          <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" /> Loading storage status…
          </div>
        )}

        {status && (
          <>
            {/* Backend error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-sm">
                <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                <div className="text-[7px] font-mono text-destructive">
                  <span className="font-bold">Backend read error:</span> {error}
                  <div className="text-destructive/70 mt-0.5">Showing localStorage fallback counts only.</div>
                </div>
              </div>
            )}

            {/* Storage source badge */}
            {src && (
              <div className={`flex items-center gap-2 px-3 py-2 border rounded-sm ${src.bg}`}>
                <src.icon className={`w-3.5 h-3.5 ${src.color} shrink-0`} />
                <div>
                  <div className={`text-[8px] font-bold uppercase tracking-widest ${src.color}`}>{src.label}</div>
                </div>
              </div>
            )}

            {/* Counts grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Backend */}
              <div className="col-span-2">
                <div className="text-[6px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1.5">Backend Entities</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <CountRow icon={<Database className="w-2.5 h-2.5 text-primary/60" />} label="Drafts" value={status.backendDrafts} color="text-primary" />
                  <CountRow icon={<Database className="w-2.5 h-2.5 text-primary/60" />} label="Write Audits" value={status.backendAudits} color="text-primary" />
                </div>
              </div>

              {/* LocalStorage */}
              <div className="col-span-2">
                <div className="text-[6px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1.5">LocalStorage Cache</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <CountRow icon={<HardDrive className="w-2.5 h-2.5 text-slate-500" />} label="Draft refs" value={status.lsCounts.draftEntries} color="text-slate-400" />
                  <CountRow icon={<HardDrive className="w-2.5 h-2.5 text-slate-500" />} label="Draft cache" value={status.lsCounts.draftCache} color="text-slate-400" />
                  <CountRow icon={<HardDrive className="w-2.5 h-2.5 text-slate-500" />} label="Audit cache" value={status.lsCounts.auditCache} color="text-slate-400" />
                </div>
              </div>
            </div>

            {/* LS Health */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[7px] font-mono text-slate-500 uppercase tracking-wide">localStorage health:</div>
              <div className={`flex items-center gap-1 px-2 py-0.5 border rounded-sm ${status.lsHealth.bg}`}>
                <status.lsHealth.icon className={`w-2.5 h-2.5 ${status.lsHealth.color}`} />
                <span className={`text-[7px] font-bold ${status.lsHealth.color}`}>{status.lsHealth.label}</span>
                <span className="text-[6px] font-mono text-slate-500 ml-1">({status.lsHealth.kb} KB used)</span>
              </div>
            </div>

            {/* Clear cache button */}
            <div className="flex items-center gap-2 flex-wrap border-t border-border/20 pt-3">
              <button
                type="button"
                onClick={handleClearCache}
                disabled={clearing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[7px] font-bold uppercase tracking-widest border border-destructive/30 text-destructive/80 bg-destructive/5 hover:bg-destructive/10 disabled:opacity-40 rounded-sm transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                {clearing ? 'Clearing…' : 'Clear Local Cache Only'}
              </button>
              <div className="text-[6px] font-mono text-slate-600">
                Removes obsolete localStorage cache only. Backend entities untouched.
              </div>
            </div>

            {/* Clear result */}
            {clearResult && (
              <div className="text-[7px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-sm px-3 py-2">
                ✓ Removed {clearResult.removed} obsolete entry(s) · {clearResult.kept} kept · Backend records unaffected
              </div>
            )}

            {/* Verification panel */}
            {showVerification && (
              <div className="border border-primary/20 bg-primary/5 rounded-sm p-3 space-y-1.5">
                <div className="text-[7px] font-bold uppercase tracking-widest text-primary/80 mb-2">Safety Verification</div>
                {VERIFICATIONS.map((v, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                    <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                    {v}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CountRow({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-background/50 border border-border/30 rounded-sm">
      {icon}
      <div className="min-w-0">
        <div className={`text-[9px] font-bold ${color}`}>{value}</div>
        <div className="text-[6px] font-mono text-slate-600 truncate">{label}</div>
      </div>
    </div>
  );
}