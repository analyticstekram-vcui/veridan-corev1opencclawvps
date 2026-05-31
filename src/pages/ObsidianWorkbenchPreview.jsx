/**
 * ObsidianWorkbenchPreview
 * Production operator workflow: Create notes by category and type, generate approved tasks,
 * send through OpenClaw preview bridge, approve drafts, write to vault, save audit records.
 */

import React, { useState, useEffect } from 'react';
import { Shield, Plus, WifiOff, Trash2, ChevronDown, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import ModuleNav from '../components/navigation/ModuleNav';
import ObsidianWorkflowStatusCard from '../components/obsidian-vault/ObsidianWorkflowStatusCard';
import ManualDraftForm from '../components/obsidian-vault/ManualDraftForm';
import TemplateDraftGenerator from '../components/obsidian-vault/TemplateDraftGenerator';
import CoreVaultPackGenerator from '../components/obsidian-vault/CoreVaultPackGenerator';
import CoreVaultPackWorkflow from '../components/obsidian-vault/CoreVaultPackWorkflow';
import ObsidianBridgeHealthPanel from '../components/obsidian-vault/ObsidianBridgeHealthPanel';
import ObsidianBridgeConnectorContract from '../components/obsidian-vault/ObsidianBridgeConnectorContract';
import StorageStatusPanel from '../components/obsidian-vault/StorageStatusPanel';
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
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('veridan_obsidian_selected_category');
    if (saved) setSelectedCategory(saved);
  }, []);

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

        {/* Workflow Progress */}
        <ObsidianWorkflowStatusCard />

        {/* View Written Files shortcut */}
        <div className="flex justify-end">
          <Link
            to="/vault-file-index"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-mono font-bold border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors"
          >
            <FolderOpen className="w-3 h-3" /> View Written Files
          </Link>
        </div>

        {/* ── BRIDGE HEALTH CHECK ── */}
        <ObsidianBridgeHealthPanel />
        <ObsidianBridgeConnectorContract />

        {/* ── ONE-CLICK: Core Vault Pack Workflow ── */}
        <CoreVaultPackWorkflow />

        {/* ── BATCH: Core Vault Pack Generator (standalone) ── */}
        <CoreVaultPackGenerator onBatchCreated={() => {}} />

        {/* ── PRIMARY: Template Draft Generator ── */}
        <TemplateDraftGenerator onDraftCreated={() => {}} />

        {/* Storage Status */}
        <StorageStatusPanel />

        {/* API Mode Warning */}
        <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-3 flex items-start gap-2">
          <WifiOff className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-[8px] font-bold uppercase text-destructive tracking-wide">API MODE: {API_MODE_CONFIG.mode}</div>
            <div className="text-[7px] font-mono text-slate-400">{API_MODE_CONFIG.disabledMessage}</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {API_MODE_CONFIG.disabledFeatures.map(f => (
                <span key={f} className="px-2 py-0.5 text-[6px] font-mono font-bold uppercase bg-destructive/10 text-destructive/70 border border-destructive/20 rounded-sm line-through">{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Storage Management */}
        <div className="border border-border/40 bg-card rounded-sm p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <div className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">Storage Management</div>
            <div className="text-[7px] font-mono text-slate-500">Removes only non-approved, not-yet-written drafts. Approved drafts are preserved.</div>
            {clearResult && (
              <div className="text-[7px] font-mono text-primary mt-1">
                ✓ Removed {clearResult.removed} draft(s) · {clearResult.kept} approved draft(s) kept
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const result = clearNonApprovedDrafts();
              setClearResult(result);
              setTimeout(() => setClearResult(null), 4000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest border border-destructive/30 text-destructive/80 bg-destructive/5 hover:bg-destructive/10 rounded-sm transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3 h-3" /> Clear Old Non-Approved Drafts
          </button>
        </div>

        {/* ── FALLBACK: Advanced / Manual ── */}
        <div className="border border-border/40 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFallback(v => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-card hover:bg-secondary/20 transition-colors"
          >
            <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">
              Advanced / Fallback Options
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showFallback ? 'rotate-180' : ''}`} />
          </button>
          {showFallback && (
            <div className="border-t border-border/30 p-4 space-y-4 bg-card/50">
              <div className="text-[7px] font-mono text-slate-500">
                Use these options only when templates do not cover your use case.
              </div>

              {/* Legacy Task Creation */}
              <div className="border border-border/40 bg-card rounded-sm p-4 space-y-4">
                <div className="text-[9px] font-bold uppercase text-slate-400">Create Legacy Obsidian Task</div>
                <div className="space-y-2">
                  <label className="text-[8px] font-bold uppercase text-slate-400">Vault Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {VAULT_CATEGORIES.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => { setSelectedCategory(cat.id); setSelectedNoteType(null); }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-sm border transition-colors ${
                          selectedCategory === cat.id ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/30 bg-card hover:bg-secondary/20 text-slate-400'
                        }`}>
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-[7px] font-mono text-center">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {selectedCategory && (
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold uppercase text-slate-400">Note Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {NOTE_TYPES[selectedCategory].map(nt => (
                        <button key={nt.type} type="button" onClick={() => setSelectedNoteType(nt.type)}
                          className={`p-3 text-left rounded-sm border transition-colors ${
                            selectedNoteType === nt.type ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/30 bg-card hover:bg-secondary/20 text-slate-400'
                          }`}>
                          <div className="text-[8px] font-bold">{nt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedNoteType && (
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold uppercase text-slate-400">Purpose / Title</label>
                    <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g., Weekly Operations Review"
                      className="w-full px-3 py-2 text-[9px] bg-card border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
                    />
                  </div>
                )}
                {selectedCategory && selectedNoteType && purpose && (
                  <button type="button" onClick={handleCreateTask}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors">
                    <Plus className="w-4 h-4" /> Create Task
                  </button>
                )}
                {taskCreated && (
                  <div className="bg-primary/10 border border-primary/30 rounded-sm p-2.5 text-[8px] font-mono text-primary">
                    ✓ Task created and queued for approval
                  </div>
                )}
              </div>

              {/* Manual Markdown Draft */}
              <ManualDraftForm onDraftCreated={() => {}} />
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="border border-border/40 bg-card rounded-sm p-4 space-y-2">
          <div className="text-[9px] font-bold uppercase text-slate-400">Production Workflow Steps</div>
          <div className="text-[8px] text-slate-400 space-y-1 font-mono">
            <div>1. Task created with riskLevel: LOW, approvalStatus: REVIEW_READY</div>
            <div>2. Sent through OpenClaw Task Preview Bridge (no execution)</div>
            <div>3. Draft generated with markdown outline</div>
            <div>4. Operator approves draft in Draft Review</div>
            <div>5. Controlled write to allowlisted vault folder only</div>
            <div>6. Audit record saved with taskId, draftId, filePath, auditHash</div>
          </div>
        </div>

      </div>
    </div>
  );
}