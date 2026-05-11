import React from 'react';
import { CheckCircle2, XCircle, Camera } from 'lucide-react';
import ElementInspectionPanel from './ElementInspectionPanel';

function resolveScreenshot(result) {
  const screenshotBase64 = result.screenshotBase64 || result.screenshot_base64 || null;
  const screenshotUrl    = result.screenshotUrl    || result.screenshot_url    || null;
  const mimeType         = result.screenshotMimeType || 'image/png';

  let src  = null;
  let type = 'none';

  if (screenshotBase64) {
    src  = `data:${mimeType};base64,${screenshotBase64}`;
    type = 'base64';
  } else if (screenshotUrl && !screenshotUrl.startsWith('http') && !screenshotUrl.startsWith('data:')) {
    if (screenshotUrl.startsWith('iVBOR') || /^[A-Za-z0-9+/=]+$/.test(screenshotUrl)) {
      src  = `data:${mimeType};base64,${screenshotUrl}`;
      type = 'base64';
    }
  } else if (screenshotUrl?.startsWith('data:image')) {
    src  = screenshotUrl;
    type = 'data-url';
  } else if (screenshotUrl?.startsWith('http')) {
    src  = screenshotUrl;
    type = 'http-url';
  }

  return {
    src,
    type,
    mimeType,
    base64Length: screenshotBase64?.length || screenshotUrl?.length || 0,
    captured: result.screenshotCaptured,
  };
}

export default function BridgeResponsePanel({ result }) {
  if (!result) return null;
  const isSuccess = result.status === 'success';
  const ss = resolveScreenshot(result);
  const isScreenshotCmd = result.commandType === 'OPEN_URL_AND_SCREENSHOT';

  return (
    <div className="space-y-3">
      {/* ── Bridge Response ── */}
      <div className="bg-card border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Bridge Response</span>
          <span className={`text-[9px] px-2 py-0.5 border uppercase tracking-wider ${
            isSuccess ? 'border-primary/30 text-primary bg-primary/5' : 'border-destructive/30 text-destructive bg-destructive/5'
          }`}>{result.executionMode || (isSuccess ? 'REAL' : 'FAILED')}</span>
        </div>

        <div className="flex items-center gap-2">
          {isSuccess
            ? <CheckCircle2 className="w-4 h-4 text-primary" />
            : <XCircle className="w-4 h-4 text-destructive" />}
          <span className={`text-[13px] font-semibold uppercase ${isSuccess ? 'text-primary' : 'text-destructive'}`}>
            {result.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {result.commandType && (
            <div className="bg-secondary/30 border border-border px-3 py-2">
              <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Command</div>
              <div className="text-foreground font-mono truncate">{result.commandType}</div>
            </div>
          )}
          {result.raw?.session_active !== undefined && (
            <div className="bg-secondary/30 border border-border px-3 py-2">
              <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Session Active</div>
              <div className={result.raw.session_active ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                {String(result.raw.session_active)}
              </div>
            </div>
          )}
          {result.raw?.online !== undefined && (
            <div className="bg-secondary/30 border border-border px-3 py-2">
              <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Online</div>
              <div className={result.raw.online ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
                {String(result.raw.online)}
              </div>
            </div>
          )}
          {(result.targetUrl || result.raw?.current_url) && (
            <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
              <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">URL</div>
              <div className="text-blue-400 font-mono truncate">{result.raw?.current_url || result.targetUrl}</div>
            </div>
          )}
          {result.pageTitle && (
            <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
              <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Page Title</div>
              <div className="text-foreground">{result.pageTitle}</div>
            </div>
          )}
          {result.error && (
            <div className="col-span-2 bg-destructive/5 border border-destructive/20 px-3 py-2">
              <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Error</div>
              <div className="text-destructive text-[11px] font-mono break-all">{result.error}</div>
            </div>
          )}
        </div>

        {/* Diagnostics summary */}
        {result.diagnostics?.length > 0 && (
          <div className="bg-secondary/30 border border-border px-3 py-2 space-y-0.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-1">Diagnostics</div>
            {result.diagnostics.map((d, i) => {
              const ok   = d.includes(': YES') || d.includes(': REAL') || d.includes('OK') || d.includes('true');
              const fail = d.includes('FAILED') || d.includes('MISSING') || d.includes('MOCK') || d.includes('exception');
              return (
                <div key={i} className={`font-mono text-[10px] ${fail ? 'text-amber-400' : ok ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  › {d}
                </div>
              );
            })}
          </div>
        )}

        {/* Raw JSON */}
        {result.raw && (
          <details className="text-[10px]">
            <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground uppercase tracking-widest text-[9px]">
              Raw JSON Response
            </summary>
            <pre className="mt-2 bg-secondary/30 border border-border px-3 py-2 overflow-auto max-h-48 text-muted-foreground/70 leading-relaxed">
              {JSON.stringify(result.raw, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* ── Element Inspection Panel ── */}
      {result.commandType === 'INSPECT_ELEMENTS' && (
        <ElementInspectionPanel result={result} />
      )}

      {/* ── Screenshot Preview Panel ── */}
      {isScreenshotCmd && (
        <div className="bg-card border border-border p-4 space-y-3">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Screenshot Preview Panel</div>

          {/* Debug info */}
          <div className="bg-secondary/20 border border-amber-500/20 px-3 py-2.5 space-y-1">
            <div className="text-[9px] uppercase tracking-widest text-amber-500/60 mb-1">Debug Info</div>
            {[
              ['screenshotCaptured', String(ss.captured ?? false)],
              ['image source type',  ss.type],
              ['base64 length',      String(ss.base64Length)],
              ['MIME type',          ss.mimeType],
            ].map(([label, val]) => (
              <div key={label} className="font-mono text-[10px] text-muted-foreground/70">
                <span className="text-muted-foreground/40">{label}: </span>
                <span className="text-foreground">{val}</span>
              </div>
            ))}
          </div>

          {/* Image */}
          {ss.src ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="w-3 h-3 text-primary" />
                <span className="text-[9px] uppercase tracking-widest text-primary font-semibold">Browser Screenshot Preview</span>
              </div>
              <img
                src={ss.src}
                alt="OpenClaw browser screenshot"
                className="w-full rounded border border-border/50 max-h-[500px] object-contain"
              />
            </div>
          ) : ss.captured ? (
            <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-400 font-mono">
              Screenshot was captured but no image data was returned by the bridge.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}