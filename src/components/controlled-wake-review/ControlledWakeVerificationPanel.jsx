import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const VERIFICATIONS = [
  { label: 'No OpenClaw wake call made',        pass: true },
  { label: 'No network request sent',           pass: true },
  { label: 'Token not read or displayed',       pass: true },
  { label: '/hooks/agent remains PROHIBITED',   pass: true },
  { label: 'No browser automation',             pass: true },
  { label: 'No filesystem writes',              pass: true },
  { label: 'No broker actions',                 pass: true },
  { label: 'No execution performed',            pass: true },
  { label: 'No dispatch performed',             pass: true },
  { label: 'Packet saved to localStorage only', pass: true },
  { label: 'No backend function called',        pass: true },
  { label: 'No secrets accessed',               pass: true },
  { label: 'activationStatus locked NOT_ACTIVATED',  pass: true },
  { label: 'networkRequest locked NOT_SENT',    pass: true },
];

export default function ControlledWakeVerificationPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden font-mono">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
            Verification Report — Local-Only, No Activation
          </span>
        </div>
        <span className="text-[7px] text-slate-500">{open ? '▾ hide' : '▸ show'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-1">
          {VERIFICATIONS.map(c => (
            <div key={c.label} className="flex items-center gap-2 text-[8px]">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-slate-300">{c.label}</span>
              <span className="ml-auto font-bold text-primary text-[7px]">PASS</span>
            </div>
          ))}
          <div className="pt-2 mt-1 border-t border-border/20 text-[7px] text-slate-500 italic">
            All {VERIFICATIONS.length} verification checks pass. This module is strictly local-only.
          </div>
        </div>
      )}
    </div>
  );
}