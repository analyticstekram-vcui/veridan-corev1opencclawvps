/**
 * ObsidianSystemStatusCard
 * Simple system status overview for the Obsidian Workbench.
 * Shows bridge health, last safe write, file counts, and safety state.
 * Read-only — no state mutations, no external calls.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, HardDrive, Shield } from 'lucide-react';
import { loadAuditsFromBackend } from '@/lib/obsidianDraftStore';

function StatusIndicator({ label, status, value }) {
  const isWorking = status === 'working' || status === 'success';
  const color = isWorking ? 'text-primary' : status === 'pending' ? 'text-accent' : 'text-destructive';
  const Icon = isWorking ? CheckCircle2 : AlertCircle;
  
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-[7px] font-mono uppercase text-slate-400">{label}</span>
      </div>
      <span className={`text-[9px] font-bold ${color}`}>{value}</span>
    </div>
  );
}

export default function ObsidianSystemStatusCard() {
  const [stats, setStats] = useState({
    bridgeWorking: 'checking',
    lastSafeWrite: 'unknown',
    filesWritten: 0,
    failedWrites: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Check Safe Test Write logs first (localStorage)
        let latestTestWrite = null;
        try {
          const testWriteLogs = JSON.parse(localStorage.getItem('veridan_safe_test_writes') || '[]');
          if (testWriteLogs.length > 0) {
            latestTestWrite = testWriteLogs[0]; // Most recent is first
          }
        } catch { /* ignore */ }
        
        // Load audits to count written/failed
        const audits = await loadAuditsFromBackend(100);
        const written = audits.filter(a => a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY').length;
        const failed = audits.filter(a =>
          a.filesystemWrite && a.filesystemWrite !== 'COMPLETED_APPROVED_DRAFT_ONLY' && a.filesystemWrite !== 'DISABLED'
        ).length;
        
        // Get last successful write timestamp
        const successfulWrites = audits.filter(a => a.filesystemWrite === 'COMPLETED_APPROVED_DRAFT_ONLY' && a.timestamp);
        const lastWrite = successfulWrites.length > 0
          ? new Date(successfulWrites[0].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'never';
        
        // Bridge is working if: latest Safe Test Write is WRITE_COMPLETED, OR we have successful audits
        const bridgeWorking = (latestTestWrite?.status === 'WRITE_COMPLETED') || (written > 0 || (latestTestWrite?.status === 'WRITE_COMPLETED'));
        
        setStats({
          bridgeWorking: bridgeWorking ? 'working' : 'not-working',
          lastSafeWrite: lastWrite,
          filesWritten: written,
          failedWrites: failed,
        });
      } catch (e) {
        setStats(prev => ({ ...prev, bridgeWorking: 'not-working' }));
      }
      setLoading(false);
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="border border-border/40 bg-card rounded-sm p-4">
        <div className="text-[8px] font-mono text-slate-500">Loading system status…</div>
      </div>
    );
  }

  return (
    <div className="border border-primary/30 bg-primary/5 rounded-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-primary">System Status</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusIndicator
          label="Bridge"
          status={stats.bridgeWorking}
          value={stats.bridgeWorking === 'working' ? 'Working' : 'Not Working'}
        />
        <StatusIndicator
          label="Last Safe Write"
          status="success"
          value={stats.lastSafeWrite}
        />
        <StatusIndicator
          label="Vault Files Written"
          status="success"
          value={stats.filesWritten}
        />
        <StatusIndicator
          label="Failed Writes"
          status={stats.failedWrites > 0 ? 'failed' : 'success'}
          value={stats.failedWrites}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-primary/20 text-[6px] font-mono text-slate-500">
        Safety State: <span className="text-primary font-bold">Protected</span> — executionStatus NOT_EXECUTED · dispatchStatus NOT_DISPATCHED · openclawCall NOT_SENT
      </div>
    </div>
  );
}