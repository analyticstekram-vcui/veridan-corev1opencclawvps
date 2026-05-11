import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, AlertTriangle, Code2 } from 'lucide-react';

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

function VpsPendingWarning() {
  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <Search className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Element Inspection Results</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-[11px] text-amber-500 font-semibold">Frontend is ready. VPS bridge needs INSPECT_ELEMENTS support.</div>
            <div className="text-[10px] text-amber-500/70 font-mono">
              Add handler in{' '}
              <code className="px-1 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400">
                /opt/veridan-safe-bridge/server.js
              </code>
            </div>
          </div>
        </div>
        <div className="bg-secondary/30 border border-border px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-1.5">
            <Code2 className="w-3 h-3" /> Expected handler signature
          </div>
          <pre className="text-[10px] text-muted-foreground/70 font-mono leading-relaxed overflow-auto">{`case 'INSPECT_ELEMENTS':
  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll('button,a,input,select,textarea,form')]
      .map(el => ({
        type:    el.tagName.toLowerCase(),
        text:    el.innerText?.slice(0, 80) || el.value || '',
        selector: el.id ? '#'+el.id : el.className?.split(' ')[0] || el.tagName,
        visible: el.offsetParent !== null,
        enabled: !el.disabled,
        href:    el.href || null,
      }));
  });
  res.json({ status: 'success', inspection: {
    totalElements:  elements.length,
    visibleButtons: elements.filter(e => e.type==='button' && e.visible).length,
    visibleLinks:   elements.filter(e => e.type==='a'      && e.visible).length,
    visibleInputs:  elements.filter(e => e.type==='input'  && e.visible).length,
    detectedForms:  elements.filter(e => e.type==='form').length,
    elements,
  }});
  break;`}</pre>
        </div>
      </div>
    </div>
  );
}

function isVpsPending(result) {
  if (!result) return false;
  const errMsg = (result.error || '').toLowerCase();
  if (errMsg.includes('unsupported command') || errMsg.includes('not supported') || errMsg.includes('backend command not available')) return true;
  // Also catches blocked/failed with no inspection payload
  if (result.commandType === 'INSPECT_ELEMENTS' && result.status !== 'success' && !result.raw?.inspection && !result.inspection) return true;
  return false;
}

export default function ElementInspectionPanel({ result }) {
  if (!result) return null;

  if (isVpsPending(result)) return <VpsPendingWarning />;

  const inspection = result.raw?.inspection || result.inspection || null;

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