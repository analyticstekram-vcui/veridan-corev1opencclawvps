import React from 'react';
import { PanelRightClose, PanelRightOpen, ShieldAlert } from 'lucide-react';

const inspectorData = [
  { label: 'Active Module', value: 'AI Command', color: 'text-primary' },
  { label: 'Active Vault', value: 'VRD-PRIMARY', color: 'text-foreground' },
  { label: 'Current Agent', value: 'CreditAudit-v3', color: 'text-blue-400' },
  { label: 'System State', value: 'NOMINAL', color: 'text-primary' },
  { label: 'Risk State', value: 'LOW', color: 'text-primary' },
  { label: 'Last Command', value: 'credit_audit VRD-0042', color: 'text-muted-foreground' },
];

const InspectorRow = ({ label, value, color }) => (
  <div className="px-3 py-2 border-b border-border/50">
    <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">{label}</div>
    <div className={`text-[11px] font-mono ${color}`}>{value}</div>
  </div>
);

export default function InspectorPanel({ collapsed, onToggle }) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-8 bg-card border-l border-border flex items-start pt-3 justify-center shrink-0 hover:bg-secondary/30 transition-colors"
        title="Open Inspector"
      >
        <PanelRightOpen className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="w-56 bg-card border-l border-border flex flex-col shrink-0 select-none">
      {/* Header */}
      <div className="h-8 border-b border-border flex items-center justify-between px-3 shrink-0">
        <span className="text-[11px] font-mono text-muted-foreground">INSPECTOR</span>
        <button
          onClick={onToggle}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelRightClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inspector Data */}
      <div className="flex-1 overflow-y-auto">
        {inspectorData.map((item, i) => (
          <InspectorRow key={i} {...item} />
        ))}

        {/* Pending Approval Section */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-1.5">
            Pending Approval
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-500/5 border border-amber-500/20">
            <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] font-mono text-amber-500">Dispute TL-8812</div>
              <div className="text-[9px] font-mono text-muted-foreground/50">Experian submission</div>
            </div>
          </div>
        </div>

        {/* Queue */}
        <div className="px-3 py-2">
          <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-1.5">
            Queue
          </div>
          <div className="space-y-1">
            {['Credit pull VRD-0043', 'Vault sync #47'].map((item, i) => (
              <div key={i} className="text-[10px] font-mono text-muted-foreground/50 pl-2 border-l border-border">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-muted-foreground/40">UPTIME</span>
          <span className="text-[9px] font-mono text-muted-foreground/60">4h 23m 11s</span>
        </div>
      </div>
    </div>
  );
}