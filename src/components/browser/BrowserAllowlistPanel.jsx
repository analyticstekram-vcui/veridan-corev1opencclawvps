import React, { useState } from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';

const ALLOWLIST = [
  { domain: '142.93.206.36', label: 'OpenClaw Gateway', approved: true },
  { domain: 'app.openclaw.io', label: 'OpenClaw Control UI', approved: true },
  { domain: 'tradingview.com', label: 'TradingView', approved: true },
  { domain: 'tradovate.com', label: 'Tradovate', approved: true },
  { domain: 'app.tradovate.com', label: 'Tradovate App', approved: true },
  { domain: 'base44.com', label: 'Base44', approved: true },
  { domain: 'cloudflare.com', label: 'Cloudflare', approved: true },
  { domain: 'dash.cloudflare.com', label: 'Cloudflare Dashboard', approved: true },
  { domain: 'gmail.com', label: 'Gmail', approved: false, note: 'Requires explicit approval' },
];

export default function BrowserAllowlistPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border font-mono">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-b border-border hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Domain Allowlist</span>
          <span className="text-[9px] text-primary/70">{ALLOWLIST.filter(d => d.approved).length} approved</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="divide-y divide-border/30">
          {ALLOWLIST.map((item) => (
            <div key={item.domain} className="flex items-center gap-3 px-4 py-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.approved ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-foreground/80">{item.label}</div>
                <div className="text-[9px] text-muted-foreground/50 font-mono">{item.domain}</div>
              </div>
              <div className="shrink-0">
                {item.approved ? (
                  <span className="text-[9px] text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 uppercase">ALLOWED</span>
                ) : (
                  <span className="text-[9px] text-muted-foreground border border-border px-1.5 py-0.5 uppercase" title={item.note}>PENDING</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}