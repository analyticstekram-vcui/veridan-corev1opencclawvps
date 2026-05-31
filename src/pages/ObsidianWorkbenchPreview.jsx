/**
 * ObsidianWorkbenchPreview
 * Production operator workflow: Create notes by category and type, generate approved tasks,
 * send through OpenClaw preview bridge, approve drafts, write to vault, save audit records.
 */

import React, { useState, useEffect } from 'react';
import { Shield, Plus, WifiOff, Trash2, ChevronDown, FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ModuleNav from '../components/navigation/ModuleNav';
import ObsidianSystemStatusCard from '../components/obsidian-vault/ObsidianSystemStatusCard';
import SafeTestWritePanel from '../components/obsidian-vault/SafeTestWritePanel';
import CoreVaultPackWorkflow from '../components/obsidian-vault/CoreVaultPackWorkflow';
import DailyVaultHealthCheckPanel from '../components/vault-index/DailyVaultHealthCheckPanel';
import StorageReconciliationPanel from '../components/obsidian-vault/StorageReconciliationPanel';
import ManualDraftForm from '../components/obsidian-vault/ManualDraftForm';
import TemplateDraftGenerator from '../components/obsidian-vault/TemplateDraftGenerator';
import CoreVaultPackGenerator from '../components/obsidian-vault/CoreVaultPackGenerator';
import { API_MODE_CONFIG } from '../lib/apiMode';

const VAULT_CATEGORIES = [
  { id: 'system', label: 'Veridan Core System', emoji: '📋' },
  { id: 'openclaw', label: 'OpenClaw', emoji: '🔐' },
  { id: 'trading', label: 'Trading', emoji: '📈' },
  { id: 'credit', label: 'Credit', emoji: '💳' },
  { id: 'business', label: 'Business Formation', emoji: '🏢' },
  { id: 'entities', label: 'Trust / Entities', emoji: '📑' },
  { id: 'sops', label: 'SOPs', emoji: '📖' },
  { id: 'operations', label: 'Daily Operations', emoji: '⚙️' },
];

const NOTE_TYPES = {
  system: [
    { type: 'overview', label: 'System Overview', outline: '# Overview\n## Key Components\n## Integration Points\n## Risk Assessment' },
    { type: 'architecture', label: 'Architecture Doc', outline: '# Architecture\n## System Design\n## Data Flow\n## Security Boundaries' },
  ],
  openclaw: [
    { type: 'sop', label: 'Standard Operating Procedure', outline: '# OpenClaw SOP\n## Prerequisites\n## Steps\n## Approval Gates\n## Rollback' },
    { type: 'bridge_guide', label: 'Bridge Integration Guide', outline: '# Bridge Guide\n## Setup\n## Request Format\n## Response Handling\n## Error Cases' },
  ],
  trading: [
    { type: 'risk_rules', label: 'Risk Rules', outline: '# Risk Rules\n## Position Limits\n## Loss Thresholds\n## Execution Constraints\n## Monitoring' },
    { type: 'sop', label: 'Trading SOP', outline: '# Trading SOP\n## Signal Entry\n## Trade Execution\n## Position Management\n## Exit Rules' },
  ],
  credit: [
    { type: 'facility_doc', label: 'Credit Facility Doc', outline: '# Credit Facility\n## Terms\n## Covenants\n## Drawdown Schedule\n## Repayment' },
    { type: 'policy', label: 'Credit Policy', outline: '# Credit Policy\n## Origination\n## Servicing\n## Default Handling\n## Monitoring' },
  ],
  business: [
    { type: 'entity_plan', label: 'Entity Formation Plan', outline: '# Entity Formation\n## Structure\n## Formation Steps\n## Registrations\n## Compliance' },
    { type: 'operation_plan', label: 'Operational Plan', outline: '# Operations\n## Management\n## Banking\n## Compliance\n## Reporting' },
  ],
  entities: [
    { type: 'trust_doc', label: 'Trust Document', outline: '# Trust\n## Trustee Duties\n## Beneficiary Rights\n## Asset Management\n## Succession' },
    { type: 'llc_doc', label: 'LLC Documentation', outline: '# LLC\n## Operating Agreement\n## Member Rights\n## Distributions\n## Dissolution' },
  ],
  sops: [
    { type: 'general_sop', label: 'General SOP', outline: '# Standard Operating Procedure\n## Purpose\n## Prerequisites\n## Steps\n## Verification\n## Escalation' },
  ],
  operations: [
    { type: 'daily_checklist', label: 'Daily Checklist', outline: '# Daily Checklist\n## Morning Tasks\n## Throughout Day\n## End of Day\n## Escalations' },
  ],
};

function clearNonApprovedDrafts() {
  try {
    const stored = localStorage.getItem('veridan_obsidian_drafts') || '[]';
    const drafts = JSON.parse(stored);
    if (!Array.isArray(drafts)) return { removed: 0, kept: 0 };
    const kept = drafts.filter(d => {
      const isApproved = d.approvalStatus === 'APPROVED' || d.approvalState === 'APPROVED_DRAFT';
      const isReadyToWrite = isApproved && d.riskLevel === 'LOW' && d.executionStatus === 'NOT_EXECUTED';
      return isApproved || isReadyToWrite;
    });
    localStorage.setItem('veridan_obsidian_drafts', JSON.stringify(kept));
    const removed = drafts.length - kept.length;
    console.log('[OBSIDIAN_DRAFT_STORAGE] Cleared', removed, 'non-approved drafts, kept', kept.length);
    return { removed, kept: kept.length };
  } catch (err) {
    console.error('[OBSIDIAN_DRAFT_STORAGE] Clear failed:', err);
    return { removed: 0, kept: 0 };
  }
}

export default function ObsidianWorkbenchPreview() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedNoteType, setSelectedNoteType] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [taskCreated, setTaskCreated] = useState(false);
  const [clearResult, setClearResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [checkBridgeLoading, setCheckBridgeLoading] = useState(false);
  const [checkBridgeResult, setCheckBridgeResult] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('veridan_obsidian_selected_category');
    if (saved) setSelectedCategory(saved);
  }, []);

  const handleCheckBridge = async () => {
    setCheckBridgeLoading(true);
    setCheckBridgeResult(null);
    
    try {
      const response = await base44.functions.invoke('obsidianBridgeHealthCheck', {});
      const data = response?.data;
      
      // Store result
      const result = {
        timestamp: new Date().toISOString(),
        success: data?.success ?? true,
        status: data?.status || 'unknown',
        gatewayUrl: data?.url || 'not detected',
        health: data?.health || 'unknown',
        message: data?.message || 'Bridge check completed',
        error: null,
      };
      
      setCheckBridgeResult(result);
      try {
        localStorage.setItem('veridan_obsidian_bridge_health', JSON.stringify(result));
      } catch { /* quota */ }
    } catch (err) {
      const errorData = err?.response?.data;
      const result = {
        timestamp: new Date().toISOString(),
        success: false,
        status: errorData?.status || 'ERROR',
        message: errorData?.message || err?.message || 'Bridge check failed',
        error: errorData?.error || errorData?.detail || JSON.stringify(errorData) || 'Unknown error',
        gatewayUrl: errorData?.url || 'unknown',
      };
      
      setCheckBridgeResult(result);
      try {
        localStorage.setItem('veridan_obsidian_bridge_health', JSON.stringify(result));
      } catch { /* quota */ }
    } finally {
      setCheckBridgeLoading(false);
    }
  };

  const handleCreateTask = () => {
    if (!selectedCategory || !selectedNoteType || !purpose) return;

    const noteTypeConfig = NOTE_TYPES[selectedCategory].find(t => t.type === selectedNoteType);
    if (!noteTypeConfig) return;

    const taskId = `TASK-${Date.now().toString(36).toUpperCase()}-OBS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const categoryConfig = VAULT_CATEGORIES.find(c => c.id === selectedCategory);
    const filename = `${purpose.toLowerCase().replace(/\s+/g, '_')}.md`;
    const folderPath = `Veridan Core/${categoryConfig.label}`;

    const task = {
      taskId,
      source: 'OBSIDIAN_WORKBENCH',
      taskType: 'CREATE_NOTE',
      title: `${noteTypeConfig.label}: ${purpose}`,
      description: purpose,
      category: selectedCategory,
      noteType: selectedNoteType,
      folder: folderPath,
      filename,
      markdownOutline: noteTypeConfig.outline,
      riskLevel: 'LOW',
      approvalStatus: 'REVIEW_READY',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      openclawCall: 'NOT_SENT',
      filesystemWrite: 'DISABLED',
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem('veridan_openclaw_task_queue') || '[]';
      const tasks = JSON.parse(stored);
      tasks.unshift(task);
      if (tasks.length > 100) tasks.length = 100;
      localStorage.setItem('veridan_openclaw_task_queue', JSON.stringify(tasks));
      localStorage.setItem('veridan_obsidian_selected_category', selectedCategory);

      setTaskCreated(true);
      setTimeout(() => setTaskCreated(false), 3000);
      
      setSelectedNoteType(null);
      setPurpose('');
    } catch { /* quota */ }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
            Veridan Core · Production Workflow
          </div>
          <h1 className="text-lg font-bold text-foreground">Obsidian Workbench</h1>
          <p className="text-[9px] text-slate-400 mt-1">
            Create and approve Obsidian note tasks for controlled vault writes
          </p>
        </div>
      </div>

      {/* Safety banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-6 py-2 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wide">
          APPROVED NOTES ONLY · LOW RISK · NOT EXECUTED · NO EXTERNAL CALLS
        </span>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5">

        {/* STATUS OVERVIEW */}
        <ObsidianSystemStatusCard />

        {/* NEXT ACTION GUIDE */}
        <div className="border border-primary/30 bg-primary/5 rounded-sm p-4">
          <div className="text-[8px] font-bold uppercase tracking-widest text-primary mb-3">Next Steps</div>
          <div className="space-y-2 text-[8px] font-mono text-slate-300">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <div><span className="text-primary font-bold">Check Bridge</span> — Confirm vault is connected</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <div><span className="text-primary font-bold">Write Test File</span> — Verify write works</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <div><span className="text-primary font-bold">Build Vault Pack</span> — Write approved files</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">4.</span>
              <div><span className="text-primary font-bold">Check Vault Health</span> — Verify all succeeded</div>
            </div>
          </div>
        </div>

        {/* ── FOUR MAIN ACTIONS ── */}

        {/* 1. CHECK BRIDGE */}
        <div className="border-l-4 border-l-primary border border-border/40 bg-card rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-primary/10 border-b border-border/30 flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">1. Check Bridge</div>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-[7px] font-mono text-slate-500">Verify the Obsidian vault bridge is working.</div>
            <button
              type="button"
              onClick={handleCheckBridge}
              disabled={checkBridgeLoading}
              className="w-full px-4 py-2.5 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              {checkBridgeLoading ? 'Checking bridge…' : 'Check Bridge Status'}
            </button>

            {/* Result display */}
            {checkBridgeResult && (
              <div className={`border rounded-sm p-3 space-y-2 ${
                checkBridgeResult.success
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-destructive/30 bg-destructive/5'
              }`}>
                <div className="flex items-center gap-2">
                  {checkBridgeResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  )}
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${
                    checkBridgeResult.success ? 'text-primary' : 'text-destructive'
                  }`}>
                    {checkBridgeResult.status}
                  </span>
                </div>
                <div className="text-[8px] font-mono space-y-1 text-slate-400">
                  <div>{checkBridgeResult.message}</div>
                  {checkBridgeResult.gatewayUrl && checkBridgeResult.gatewayUrl !== 'not detected' && checkBridgeResult.gatewayUrl !== 'unknown' && (
                    <div>URL: <span className="text-slate-300">{checkBridgeResult.gatewayUrl}</span></div>
                  )}
                  {checkBridgeResult.health && checkBridgeResult.health !== 'unknown' && (
                    <div>Health: <span className="text-slate-300">{checkBridgeResult.health}</span></div>
                  )}
                  {checkBridgeResult.timestamp && (
                    <div className="text-slate-600">Checked: {new Date(checkBridgeResult.timestamp).toLocaleTimeString()}</div>
                  )}
                </div>
                {checkBridgeResult.error && (
                  <div className="text-[7px] font-mono text-destructive/80 bg-destructive/10 rounded-sm px-2 py-1.5 break-all">
                    {checkBridgeResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. WRITE TEST FILE */}
        <div className="border-l-4 border-l-accent border border-border/40 bg-card rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-accent/10 border-b border-border/30 flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-accent">2. Write Test File</div>
          </div>
          <div className="p-4">
            <SafeTestWritePanel />
          </div>
        </div>

        {/* 3. BUILD VAULT PACK */}
        <div className="border-l-4 border-l-primary border border-border/40 bg-card rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-primary/10 border-b border-border/30 flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">3. Build Vault Pack</div>
          </div>
          <div className="p-4">
            <CoreVaultPackWorkflow />
          </div>
        </div>

        {/* 4. CHECK VAULT HEALTH */}
        <div className="border-l-4 border-l-accent border border-border/40 bg-card rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-accent/10 border-b border-border/30 flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-accent">4. Check Vault Health</div>
          </div>
          <div className="p-4">
            <DailyVaultHealthCheckPanel />
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="flex flex-wrap gap-2 justify-between pt-2">
          <Link
            to="/vault-file-index"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-mono font-bold border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors"
          >
            <FolderOpen className="w-3 h-3" /> View Written Files
          </Link>
          <button
            type="button"
            onClick={() => {
              const result = clearNonApprovedDrafts();
              setClearResult(result);
              setTimeout(() => setClearResult(null), 3000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest border border-destructive/30 text-destructive/80 bg-destructive/5 hover:bg-destructive/10 rounded-sm transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear Old Drafts
          </button>
          {clearResult && (
            <span className="text-[7px] font-mono text-primary self-center">✓ {clearResult.removed} removed, {clearResult.kept} kept</span>
          )}
        </div>

        {/* ── ADVANCED MAINTENANCE ── */}
        <div className="border border-destructive/30 bg-destructive/5 rounded-sm overflow-hidden mt-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-destructive/10 transition-colors"
          >
            <span className="text-[8px] font-bold uppercase text-destructive/80 tracking-widest">
              ⚠ Advanced Maintenance — Do Not Use Unless Needed
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-destructive/60 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          {showAdvanced && (
            <div className="border-t border-destructive/20 p-4 space-y-4 bg-destructive/5">
              <div className="text-[7px] font-mono text-destructive/70">
                These tools are for advanced metadata repair and orphan audit reconciliation. Use only if normal workflow fails. All operations are read-only or metadata-only.
              </div>

              {/* Storage Reconciliation & Repair */}
              <StorageReconciliationPanel />

              {/* Optional Generators for Advanced Users */}
              <div className="border-t border-destructive/20 pt-4 space-y-4">
                <div className="text-[8px] font-bold uppercase text-destructive/70 tracking-widest">Optional Generators</div>
                <CoreVaultPackGenerator onBatchCreated={() => {}} />
                <TemplateDraftGenerator onDraftCreated={() => {}} />

                {/* Legacy Task Creation */}
                <div className="border border-destructive/20 bg-destructive/5 rounded-sm p-4 space-y-4">
                  <div className="text-[9px] font-bold uppercase text-destructive/80">Create Custom Task</div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold uppercase text-destructive/70">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {VAULT_CATEGORIES.map(cat => (
                        <button key={cat.id} type="button"
                          onClick={() => { setSelectedCategory(cat.id); setSelectedNoteType(null); }}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-sm border transition-colors text-[8px] ${
                            selectedCategory === cat.id ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border/30 bg-card hover:bg-secondary/20 text-slate-400'
                          }`}>
                          <span>{cat.emoji}</span>
                          <span className="font-mono text-center">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedCategory && (
                    <div className="space-y-2">
                      <label className="text-[8px] font-bold uppercase text-destructive/70">Type</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {NOTE_TYPES[selectedCategory].map(nt => (
                          <button key={nt.type} type="button" onClick={() => setSelectedNoteType(nt.type)}
                            className={`p-2.5 text-left rounded-sm border transition-colors text-[8px] ${
                              selectedNoteType === nt.type ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border/30 bg-card hover:bg-secondary/20 text-slate-400'
                            }`}>
                            {nt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedNoteType && (
                    <div className="space-y-2">
                      <label className="text-[8px] font-bold uppercase text-destructive/70">Purpose</label>
                      <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)}
                        placeholder="Task title"
                        className="w-full px-3 py-2 text-[8px] bg-card border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-destructive/40"
                      />
                    </div>
                  )}
                  {selectedCategory && selectedNoteType && purpose && (
                    <button type="button" onClick={handleCreateTask}
                      className="w-full px-4 py-2 bg-destructive/20 border border-destructive/40 text-destructive/80 hover:bg-destructive/30 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-colors">
                      <Plus className="w-3 h-3 inline mr-1" /> Create
                    </button>
                  )}
                  {taskCreated && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-2 text-[8px] font-mono text-destructive">
                      ✓ Task created
                    </div>
                  )}
                </div>

                {/* Manual Markdown Draft */}
                <ManualDraftForm onDraftCreated={() => {}} />
              </div>
            </div>
          )}
        </div>



      </div>
    </div>
  );
}