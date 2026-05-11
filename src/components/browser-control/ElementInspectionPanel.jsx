import React, { useState } from 'react';
import { Search, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

function StatCard({ label, value }) {
  return (
    <div className="bg-secondary/30 border border-border px-3 py-2">
      <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-foreground font-mono">{value ?? '—'}</div>
    </div>
  );
}

function ElementRow({ el }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-border/30 last:border-0">
      <div
        className="grid grid-cols-[16px_80px_1fr_auto_auto] gap-2 px-3 py-2 text-[10px] font-mono hover:bg-secondary/20 cursor-pointer items-center"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="text-muted-foreground/30">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
        <div className="text-accent uppercase tracking-wider text-[9px]">{el.type || '—'}</div>
        <div className="text-foreground truncate">{el.text || <span className="text-muted-foreground/30 italic">no text</span>}</div>
        <div className={`text-[9px] px-1.5 py-0.5 border ${el.visible ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-muted-foreground/40'}`}>
          {el.visible ? 'VISIBLE' : 'HIDDEN'}
        </div>
        <div className={`text-[9px] px-1.5 py-0.5 border ${el.enabled !== false ? 'border-primary/20 text-primary/70' : 'border-border text-muted-foreground/30'}`}>
          {el.enabled !== false ? 'ENABLED' : 'DISABLED'}
        </div>
      </div>
      {expanded && (
        <div className="mx-3 mb-2 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
          {[
            ['Selector', el.selector],
            ['Type',     el.type],
            ['Text',     el.text],
            ['href',     el.href],
            ['Visible',  String(el.visible ?? '—')],
            ['Enabled',  String(el.enabled ?? '—')],
          ].map(([label, val]) => val ? (
            <div key={label} className="bg-secondary/20 border border-border/50 px-2 py-1.5 col-span-1">
              <div className="text-muted-foreground/40 uppercase tracking-wider text-[8px] mb-0.5">{label}</div>
              <div className="text-foreground break-all">{val}</div>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

export default function ElementInspectionPanel({ result }) {
  if (!result) return null;

  // Backend not yet supporting INSPECT_ELEMENTS — show clean message
  if (result.error && result.error.includes('not supported')) {
    return (
      <div className="bg-card border border-border p-4">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-3">Element Inspection Results</div>
        <div className="text-[11px] text-muted-foreground/50 font-mono">Backend command not available yet.</div>
      </div>
    );
  }

  const inspection = result.raw?.inspection || result.inspection || null;

  // No inspection data in response at all
  if (!inspection && result.commandType === 'INSPECT_ELEMENTS' && result.status !== 'success') {
    return (
      <div className="bg-card border border-border p-4">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-3">Element Inspection Results</div>
        <div className="text-[11px] text-muted-foreground/50 font-mono">Backend command not available yet.</div>
      </div>
    );
  }

  if (!inspection) return null;

  const elements = inspection.elements || [];

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <Search className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Element Inspection Results</span>
        <span className="text-[9px] text-muted-foreground/30 ml-1">read-only</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatCard label="Total Elements"   value={inspection.totalElements} />
          <StatCard label="Visible Buttons"  value={inspection.visibleButtons} />
          <StatCard label="Visible Links"    value={inspection.visibleLinks} />
          <StatCard label="Visible Inputs"   value={inspection.visibleInputs} />
          <StatCard label="Detected Forms"   value={inspection.detectedForms} />
          {inspection.pageTitle && <StatCard label="Page Title"  value={inspection.pageTitle} />}
          {inspection.currentUrl && (
            <div className="bg-secondary/30 border border-border px-3 py-2 col-span-2">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Current URL</div>
              <div className="text-[11px] text-blue-400 font-mono truncate">{inspection.currentUrl}</div>
            </div>
          )}
        </div>

        {/* Elements table */}
        {elements.length > 0 ? (
          <div className="border border-border">
            <div className="grid grid-cols-[16px_80px_1fr_auto_auto] gap-2 px-3 py-1.5 text-[8px] uppercase tracking-widest text-muted-foreground/30 bg-secondary/10 border-b border-border/30">
              <div /><div>Type</div><div>Text</div><div>Visible</div><div>Enabled</div>
            </div>
            <div className="max-h-80 overflow-auto divide-y divide-border/20">
              {elements.map((el, i) => <ElementRow key={i} el={el} />)}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/40 font-mono py-2">No elements returned.</div>
        )}
      </div>
    </div>
  );
}