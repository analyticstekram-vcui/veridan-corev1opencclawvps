import React from 'react';
import { Settings, ChevronDown, Zap, Shield, Database } from 'lucide-react';

const StatusDot = ({ color, label, sublabel }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 border border-border/50 bg-secondary/50">
    <div className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse-glow`} />
    <span className="text-[11px] font-mono text-muted-foreground">{label}</span>
    {sublabel && <span className="text-[10px] font-mono text-muted-foreground/60">{sublabel}</span>}
  </div>
);

export default function TopToolbar({ mode, onModeToggle }) {
  return (
    <div className="h-10 bg-card border-b border-border flex items-center justify-between px-3 shrink-0 select-none">
      {/* Left: Logo + Module Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-foreground">VERIDAN CORE</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <button className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          AI Command Module
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Center: Status Indicators */}
      <div className="flex items-center gap-1.5">
        <StatusDot color="bg-green-500" label="AI" sublabel="ACTIVE" />
        <StatusDot color="bg-amber-500" label="OPENCLAW" sublabel="SYNC" />
        <StatusDot color="bg-blue-500" label="OBSIDIAN" sublabel="LINKED" />
      </div>

      {/* Right: Mode Toggle + Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={onModeToggle}
          className="flex items-center gap-1.5 px-2 py-1 border border-border/50 text-[11px] font-mono transition-colors"
        >
          <div className={`w-1.5 h-1.5 rounded-full ${mode === 'auto' ? 'bg-primary' : 'bg-amber-500'}`} />
          <span className={mode === 'auto' ? 'text-primary' : 'text-amber-500'}>
            {mode === 'auto' ? 'AUTO' : 'MANUAL'}
          </span>
        </button>

        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}