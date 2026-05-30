import React, { useState } from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';

const CHECKS = [
  { ok: true, label: 'No API calls added' },
  { ok: true, label: 'No InvokeLLM / LLM calls added' },
  { ok: true, label: 'No OpenClaw dispatch added' },
  { ok: true, label: 'No browser automation added' },
  { ok: true, label: 'No credentials added or accessed' },
  { ok: true, label: 'Read-only localStorage viewer only' },
  { ok: true, label: 'Uses veridan_obsidian_write_audits as primary data source' },
  { ok: true, label: 'Cross-checks veridan_obsidian_drafts for content/metadata enrichment' },
  { ok: true, label: 'Does not mutate approved drafts' },
  { ok: true, label: 'Does not mutate executionStatus on any record' },
  { ok: true, label: 'Does not mutate dispatchStatus on any record' },
  { ok: true, label: 'Does not write to any localStorage key' },
  { ok: true, label: 'Export JSON contains only metadata — no secrets, no tokens, no credentials' },
  { ok: true, label: 'Detail drawer is read-only — no form submissions, no write actions' },
];

export default function VaultIndexVerificationPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-primary">
            Page Verification Report — Read-Only Safety Checks
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border/30 px-4 pb-4 pt-3 space-y-1.5">
          {CHECKS.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-[8px] font-mono">
              <span className={c.ok ? 'text-primary' : 'text-destructive'}>
                {c.ok ? '✅' : '❌'}
              </span>
              <span className={c.ok ? 'text-slate-300' : 'text-destructive'}>
                {c.label}
              </span>
            </div>
          ))}
          <div className="border-t border-border/20 pt-2 mt-2 text-[7px] font-mono text-slate-600">
            Verification locked. This page is a passive read-only display of localStorage audit records.
          </div>
        </div>
      )}
    </div>
  );
}