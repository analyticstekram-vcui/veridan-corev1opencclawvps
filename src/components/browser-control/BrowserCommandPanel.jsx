import React from 'react';
import { Globe, Camera, Play, RefreshCw, AlertTriangle, Ban, Loader2, Search } from 'lucide-react';

const TRADINGVIEW_URL = 'https://www.tradingview.com';

function blockReason(url) {
  if (!url) return null;
  if (!url.startsWith('https://')) return 'URL must start with https://';
  const blocked = [/localhost/i, /127\.0\.0\.1/, /0\.0\.0\.0/, /192\.168\./, /^https?:\/\/10\./, /172\.(1[6-9]|2\d|3[01])\./, /file:\/\//i, /javascript:/i];
  for (const re of blocked) if (re.test(url)) return 'Blocked: private or unsafe URL pattern';
  return null;
}

const COMMANDS = [
  { id: 'SESSION_STATUS',          label: 'Check Session',         icon: RefreshCw, fixedUrl: TRADINGVIEW_URL },
  { id: 'START_SESSION',           label: 'Start Session',          icon: Play,       fixedUrl: TRADINGVIEW_URL, primary: true },
  { id: 'OPEN_URL_AND_READ_TITLE', label: 'Navigate & Read Title',  icon: Globe,      fixedUrl: null },
  { id: 'OPEN_URL_AND_SCREENSHOT', label: 'Capture Screenshot',     icon: Camera,     fixedUrl: null },
  { id: 'INSPECT_ELEMENTS',        label: 'Inspect Page Elements',  icon: Search,     fixedUrl: null },
];

export default function BrowserCommandPanel({ targetUrl, onUrlChange, onInvoke, running }) {
  const urlErr   = blockReason(targetUrl);
  const isRunning = !!running;

  return (
    <div className="bg-card border border-border p-4 space-y-4">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40">
        Command Panel · All calls via openclawSafeBridge · Token server-side only
      </div>

      {/* URL Input */}
      <div>
        <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5 mb-1.5">
          <Globe className="w-2.5 h-2.5" /> Target URL
        </label>
        <input
          type="text"
          value={targetUrl}
          onChange={e => onUrlChange(e.target.value)}
          className={`w-full px-3 py-2 bg-secondary/50 border text-[12px] text-blue-400 font-mono outline-none transition-colors ${
            urlErr ? 'border-amber-500/50' : 'border-border focus:border-primary/50'
          }`}
          placeholder="https://example.com"
        />
        {urlErr && (
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-amber-500">
            <Ban className="w-3 h-3" /> {urlErr}
          </div>
        )}
      </div>

      {/* Command Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {COMMANDS.map(({ id, label, icon: Icon, fixedUrl, primary }) => (
          <button
            key={id}
            onClick={() => onInvoke(id, fixedUrl || targetUrl)}
            disabled={isRunning || (!!urlErr && !fixedUrl)}
            className={`flex items-center justify-center gap-2 px-4 py-3 border text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              running === id
                ? 'border-primary bg-primary/10 text-primary'
                : primary
                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {running === id
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Governance Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/70 leading-relaxed">
          Current mode is <span className="text-amber-500 font-semibold">SAFE_READ_ONLY</span>. This module may open pages, read titles,
          and capture screenshots only. Write actions require future governance approval.
        </p>
      </div>
    </div>
  );
}