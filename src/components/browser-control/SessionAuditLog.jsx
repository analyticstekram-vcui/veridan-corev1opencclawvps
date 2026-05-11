import React, { useState } from 'react';
import { ScrollText, ChevronDown, ChevronRight, Shield, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';

const GOVERNANCE_MODE = 'SAFE_READ_ONLY';

function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString('en-US', { hour12: false }); }
  catch { return iso; }
}

function StatusBadge({ status }) {
  if (status === 'success') return (
    <span className="flex items-center gap-1 px-2 py-0.5 border border-primary/30 bg-primary/5 text-primary text-[9px] uppercase tracking-wider font-semibold whitespace-nowrap">
      <CheckCircle2 className="w-2.5 h-2.5" /> SUCCESS
    </span>
  );
  if (status === 'failed') return (
    <span className="flex items-center gap-1 px-2 py-0.5 border border-destructive/30 bg-destructive/5 text-destructive text-[9px] uppercase tracking-wider font-semibold whitespace-nowrap">
      <XCircle className="w-2.5 h-2.5" /> FAILED
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 border border-amber-500/30 bg-amber-500/5 text-amber-400 text-[9px] uppercase tracking-wider font-semibold whitespace-nowrap">
      <Loader2 className="w-2.5 h-2.5 animate-spin" /> PENDING
    </span>
  );
}

function AuditRow({ entry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/30 last:border-0">
      {/* Summary */}
      <div
        className="grid grid-cols-[16px_72px_1fr_2fr_auto] gap-2 px-4 py-2.5 text-[10px] font-mono hover:bg-secondary/20 cursor-pointer items-center"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="text-muted-foreground/30">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
        <div className="text-muted-foreground/40 tabular-nums">{fmtTime(entry.timestamp)}</div>
        <div className="text-foreground uppercase truncate">{entry.commandType}</div>
        <div className="text-blue-400/60 truncate">{entry.targetUrl || '—'}</div>
        <StatusBadge status={entry.status} />
      </div>

      {/* Subtitle line */}
      {(entry.pageTitle || entry.error) && !expanded && (
        <div className="px-4 pb-2 text-[10px] font-mono">
          {entry.pageTitle && <span className="text-muted-foreground/50 ml-6">↳ {entry.pageTitle}</span>}
          {entry.error    && <span className="text-destructive/70 ml-6">↳ {entry.error}</span>}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mx-4 mb-3 space-y-2 text-[10px] font-mono">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['Timestamp',           entry.timestamp],
              ['Mode',                entry.mode],
              ['Governance',          entry.governanceMode],
              ['Session Active',      entry.sessionActive !== null ? String(entry.sessionActive) : '—'],
              ['Screenshot Captured', String(entry.screenshotCaptured)],
              ['Screenshot MIME',     entry.screenshotMimeType],
              ['Base64 Length',       entry.base64Length > 0 ? String(entry.base64Length) : '—'],
            ].map(([label, val]) => (
              <div key={label} className="bg-secondary/20 border border-border/50 px-2 py-1.5">
                <div className="text-muted-foreground/40 uppercase tracking-wider text-[8px] mb-0.5">{label}</div>
                <div className="text-foreground">{val || '—'}</div>
              </div>
            ))}
          </div>

          {entry.pageTitle && (
            <div className="bg-secondary/20 border border-border/50 px-2 py-1.5">
              <div className="text-muted-foreground/40 uppercase tracking-wider text-[8px] mb-0.5">Page Title</div>
              <div className="text-foreground">{entry.pageTitle}</div>
            </div>
          )}

          {entry.error && (
            <div className="bg-destructive/5 border border-destructive/20 px-2 py-1.5">
              <div className="text-muted-foreground/40 uppercase tracking-wider text-[8px] mb-0.5">Error</div>
              <div className="text-destructive break-all">{entry.error}</div>
            </div>
          )}

          {entry.safeDiag && (
            <div className="bg-secondary/20 border border-amber-500/20 px-2 py-1.5 space-y-0.5">
              <div className="text-amber-500/60 uppercase tracking-wider text-[8px] mb-0.5 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Bridge Token Safety
              </div>
              <div className="text-muted-foreground/60">hasBridgeToken: <span className="text-foreground">{String(entry.safeDiag.hasBridgeToken ?? '—')}</span></div>
              <div className="text-muted-foreground/60">bridgeTokenLength: <span className="text-foreground">{entry.safeDiag.bridgeTokenLength ?? '—'}</span></div>
            </div>
          )}

          {entry.diagnostics?.length > 0 && (
            <details>
              <summary className="cursor-pointer text-muted-foreground/40 hover:text-muted-foreground text-[9px] uppercase tracking-widest">
                Diagnostics ({entry.diagnostics.length})
              </summary>
              <div className="mt-1 bg-secondary/20 border border-border/50 px-2 py-1.5 space-y-0.5">
                {entry.diagnostics.map((d, i) => {
                  const ok   = d.includes(': YES') || d.includes(': REAL') || d.includes('OK') || d.includes('true');
                  const fail = d.includes('FAILED') || d.includes('MISSING') || d.includes('MOCK') || d.includes('exception');
                  return (
                    <div key={i} className={`${fail ? 'text-amber-400' : ok ? 'text-primary' : 'text-muted-foreground/60'}`}>
                      › {d}
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          {entry.raw && (
            <details>
              <summary className="cursor-pointer text-muted-foreground/40 hover:text-muted-foreground text-[9px] uppercase tracking-widest">
                Raw JSON Response
              </summary>
              <pre className="mt-1 bg-secondary/20 border border-border/50 px-2 py-1.5 overflow-auto max-h-40 text-muted-foreground/60 leading-relaxed text-[9px]">
                {JSON.stringify(entry.raw, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionAuditLog({ entries, onClear }) {
  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <ScrollText className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Session Activity</span>
        <span className="text-[9px] text-muted-foreground/30 ml-1">({entries.length})</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground/40">
            <Shield className="w-2.5 h-2.5" /> {GOVERNANCE_MODE}
          </span>
          {entries.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2 py-0.5 border border-border text-[9px] text-muted-foreground/50 hover:text-destructive hover:border-destructive/40 transition-colors uppercase tracking-wider"
              title="Clear audit log"
            >
              <Trash2 className="w-2.5 h-2.5" /> Clear
            </button>
          )}
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="flex items-center justify-center h-12 text-[11px] text-muted-foreground/30">No activity yet</div>
      ) : (
        <div className="max-h-[480px] overflow-auto">
          <div className="grid grid-cols-[16px_72px_1fr_2fr_auto] gap-2 px-4 py-1.5 text-[8px] uppercase tracking-widest text-muted-foreground/30 bg-secondary/10 border-b border-border/30">
            <div /><div>Time</div><div>Command</div><div>URL</div><div>Status</div>
          </div>
          {[...entries].reverse().map(entry => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}