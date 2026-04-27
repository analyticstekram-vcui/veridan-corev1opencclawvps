import React, { useRef, useEffect } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';

const LEVEL_STYLES = {
  info:  'text-primary',
  warn:  'text-amber-500',
  error: 'text-destructive',
  debug: 'text-muted-foreground/50',
};

const SOURCE_STYLES = {
  SESSION:    'text-blue-400',
  CMD:        'text-primary',
  SECURITY:   'text-destructive',
  APPROVAL:   'text-amber-500',
  SCREENSHOT: 'text-purple-400',
  SYSTEM:     'text-muted-foreground/60',
};

export default function BrowserActivityLog({ logs, loading, onRefresh }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-card border border-border font-mono flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <ScrollText className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Activity Log</span>
          <span className="text-[9px] text-muted-foreground/40">({logs.length} entries)</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-auto max-h-64 py-1">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-[11px] text-muted-foreground/30">
            No activity yet
          </div>
        ) : (
          <div className="space-y-0">
            {[...logs].reverse().map((entry, i) => (
              <div key={i} className="group flex gap-2 px-3 py-1 hover:bg-secondary/20 transition-colors">
                <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0 w-14">{entry.time}</span>
                <span className={`text-[10px] font-mono shrink-0 w-20 ${SOURCE_STYLES[entry.source] || 'text-muted-foreground/60'}`}>
                  [{entry.source}]
                </span>
                <span className={`text-[11px] font-mono ${LEVEL_STYLES[entry.level] || 'text-foreground'} flex-1 min-w-0 break-words`}>
                  {entry.message}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}