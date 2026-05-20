import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { BRIDGE_CONTRACT } from './tvMcpContracts';

export default function TvMcpBridgeContract() {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(BRIDGE_CONTRACT, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-secondary/20">
        <span className="text-[9px] font-bold uppercase text-slate-300">Local Bridge Contract Preview</span>
        <button type="button" onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/30 border border-border/40 text-slate-400 text-[7px] rounded-sm hover:text-slate-200 transition-colors">
          <Copy className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-3">
        <pre className="text-[9px] font-mono text-slate-300 bg-secondary/30 border border-border/30 rounded-sm p-3 overflow-x-auto whitespace-pre leading-relaxed">
          {json}
        </pre>
      </div>
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <div className="bg-secondary/20 border border-primary/20 rounded-sm p-2">
          <div className="text-[7px] uppercase text-slate-500 mb-1 font-bold">Allowed Commands</div>
          <div className="flex flex-wrap gap-1">
            {BRIDGE_CONTRACT.allowedCommands.map(c => (
              <span key={c} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[7px] rounded-sm font-mono">{c}</span>
            ))}
          </div>
        </div>
        <div className="bg-secondary/20 border border-destructive/20 rounded-sm p-2">
          <div className="text-[7px] uppercase text-slate-500 mb-1 font-bold">Blocked Commands</div>
          <div className="flex flex-wrap gap-1">
            {BRIDGE_CONTRACT.blockedCommands.map(c => (
              <span key={c} className="px-1.5 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-[7px] rounded-sm font-mono">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}