/**
 * VaultFileIndex
 * Read-only viewer for all vault files written through the governed Obsidian write workflow.
 * Data source: veridan_obsidian_write_audits (primary) + veridan_obsidian_drafts (cross-check)
 * NO API, NO OpenClaw, NO mutation, NO credentials, NO browser automation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import ModuleNav from '../components/navigation/ModuleNav';
import VaultFileTable from '../components/vault-index/VaultFileTable';
import VaultIndexSummaryCards from '../components/vault-index/VaultIndexSummaryCards';
import VaultFileDetailDrawer from '../components/vault-index/VaultFileDetailDrawer';
import VaultIndexFilters from '../components/vault-index/VaultIndexFilters';
import VaultIndexVerificationPanel from '../components/vault-index/VaultIndexVerificationPanel';
import { Shield, Download, FileSearch, RefreshCw, Database } from 'lucide-react';
import { loadAuditsFromBackend, loadDraftsFromBackend } from '@/lib/obsidianDraftStore';

function buildFileRecords(audits, drafts) {
  const draftMap = {};
  for (const d of drafts) {
    if (d.id) draftMap[d.id] = d;
    if (d.filename) draftMap[d.filename] = d;
  }

  return audits.map(a => {
    const matchedDraft =
      draftMap[a.draftId] ||
      draftMap[a.filename] ||
      null;

    return {
      auditId: a.auditId || a.dryRunAuditId || '—',
      draftId: a.draftId || '—',
      filename: a.filename || a.filePath?.split('/').pop() || '—',
      folder: a.folder || a.targetFolder || '—',
      filePath: a.filePath || '—',
      source: matchedDraft?.source || a.source || '—',
      draftType: matchedDraft?.draftType || a.draftType || '—',
      riskLevel: a.riskLevel || matchedDraft?.riskLevel || 'LOW',
      approvalStatus: a.approvalStatus || matchedDraft?.approvalStatus || 'APPROVED',
      filesystemWrite: a.filesystemWrite || 'COMPLETED_APPROVED_DRAFT_ONLY',
      executionStatus: a.executionStatus || 'NOT_EXECUTED',
      dispatchStatus: a.dispatchStatus || 'NOT_DISPATCHED',
      openclawCall: a.openclawCall || matchedDraft?.openclawCall || 'NOT_SENT',
      timestamp: a.timestamp || a.writtenAt || a.createdAt || '—',
      contentPreview: matchedDraft?.content
        ? matchedDraft.content.slice(0, 400) + (matchedDraft.content.length > 400 ? '\n…' : '')
        : null,
    };
  });
}

export default function VaultFileIndex() {
  const [records, setRecords] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({ search: '', folder: '', source: '', draftType: '' });
  const [loading, setLoading] = useState(false);
  const [storageSource, setStorageSource] = useState('—');

  const refresh = async () => {
    setLoading(true);
    // Primary: backend entities
    const [audits, drafts] = await Promise.all([
      loadAuditsFromBackend(200),
      loadDraftsFromBackend(200),
    ]);

    if (audits.length > 0) {
      setStorageSource('backend');
      setRecords(buildFileRecords(audits, drafts));
    } else {
      // Fallback: localStorage cache (legacy / offline)
      try {
        const lsAudits = JSON.parse(localStorage.getItem('veridan_obsidian_write_audits') || '[]');
        const lsDrafts = JSON.parse(localStorage.getItem('veridan_obsidian_drafts') || '[]');
        setStorageSource(lsAudits.length > 0 ? 'localStorage (cache)' : 'empty');
        setRecords(buildFileRecords(lsAudits, lsDrafts));
      } catch {
        setRecords([]);
      }
    }
    setLastRefresh(new Date().toISOString());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const uniqueFolders = useMemo(() => [...new Set(records.map(r => r.folder).filter(f => f && f !== '—'))].sort(), [records]);
  const uniqueSources = useMemo(() => [...new Set(records.map(r => r.source).filter(s => s && s !== '—'))].sort(), [records]);
  const uniqueDraftTypes = useMemo(() => [...new Set(records.map(r => r.draftType).filter(d => d && d !== '—'))].sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const q = filters.search.toLowerCase();
      if (q && !r.filename.toLowerCase().includes(q) && !r.filePath.toLowerCase().includes(q) && !r.folder.toLowerCase().includes(q)) return false;
      if (filters.folder && r.folder !== filters.folder) return false;
      if (filters.source && r.source !== filters.source) return false;
      if (filters.draftType && r.draftType !== filters.draftType) return false;
      return true;
    });
  }, [records, filters]);

  const lastWritten = useMemo(() => {
    const ts = records.map(r => r.timestamp).filter(t => t && t !== '—').sort().reverse()[0];
    return ts || null;
  }, [records]);

  const handleExport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      totalWrittenFiles: records.length,
      folders: uniqueFolders,
      files: records,
      safetyState: {
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus: 'NOT_DISPATCHED',
        openclawCall: 'NOT_SENT',
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-vault-file-index-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Vault File Index
            </div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-primary" />
              Vault File Index
            </h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Written files generated by governed Obsidian workflow
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['READ_ONLY', 'NO_EXECUTION', 'NOT_DISPATCHED', 'APPROVED_WRITES_ONLY'].map(chip => (
                <span key={chip} className="px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest border border-primary/30 bg-primary/10 text-primary rounded-sm">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {storageSource && (
              <span className="flex items-center gap-1 px-2 py-1 text-[7px] font-mono border border-primary/20 bg-primary/5 text-primary/70 rounded-sm">
                <Database className="w-2.5 h-2.5" /> {storageSource}
              </span>
            )}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase border border-border/40 text-slate-400 hover:text-slate-200 hover:border-primary/30 rounded-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 rounded-sm transition-colors"
            >
              <Download className="w-3 h-3" /> Export Index JSON
            </button>
          </div>
        </div>
        {lastRefresh && (
          <div className="text-[7px] font-mono text-slate-600 mt-2">
            Last refreshed: {lastRefresh}
          </div>
        )}
      </div>

      {/* Safety banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-6 py-2 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="text-[8px] font-bold text-amber-500">
          Vault File Index is read-only. It displays approved written file records only. No OpenClaw dispatch, browser automation, credentials, or external execution occurs from this page.
        </span>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">

        {/* Summary cards */}
        <VaultIndexSummaryCards
          records={records}
          uniqueFolders={uniqueFolders}
          lastWritten={lastWritten}
        />

        {/* Filters */}
        <VaultIndexFilters
          filters={filters}
          onChange={setFilters}
          uniqueFolders={uniqueFolders}
          uniqueSources={uniqueSources}
          uniqueDraftTypes={uniqueDraftTypes}
        />

        {/* File table */}
        {filtered.length === 0 ? (
          <div className="border border-border/40 bg-card rounded-sm p-10 text-center space-y-2">
            <FileSearch className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {records.length === 0
                ? 'No governed vault files have been written yet.'
                : 'No files match the current filters.'}
            </div>
            {records.length === 0 && (
              <div className="text-[8px] text-slate-600 font-mono">
                Run the Governed Vault Pack workflow on the Obsidian Workbench to write files.
              </div>
            )}
          </div>
        ) : (
          <VaultFileTable
            records={filtered}
            onSelectRecord={setSelectedRecord}
          />
        )}

        {/* Verification panel */}
        <VaultIndexVerificationPanel />

      </div>

      {/* Detail drawer */}
      {selectedRecord && (
        <VaultFileDetailDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}