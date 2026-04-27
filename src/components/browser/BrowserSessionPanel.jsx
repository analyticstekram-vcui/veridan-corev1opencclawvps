import React from 'react';
import { Monitor, Play, Square, Globe, Loader2, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG = {
  OFFLINE: { color: 'text-muted-foreground', dot: 'bg-muted-foreground', bg: 'bg-secondary/30 border-border' },
  READY:   { color: 'text-primary',          dot: 'bg-primary',          bg: 'bg-primary/5 border-primary/20' },
  ACTIVE:  { color: 'text-blue-400',         dot: 'bg-blue-400',         bg: 'bg-blue-400/5 border-blue-400/20' },
  ERROR:   { color: 'text-destructive',      dot: 'bg-destructive',      bg: 'bg-destructive/5 border-destructive/20' },
};

export default function BrowserSessionPanel({ session, loading, onStart, onStop, onScreenshot }) {
  const cfg = STATUS_CONFIG[session?.status || 'OFFLINE'];

  return (
    <div className="bg-card border border-border p-4 font-mono space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Browser Session</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 border ${cfg.bg}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${session?.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
          <span className={`text-[10px] uppercase tracking-wider ${cfg.color}`}>{session?.status || 'OFFLINE'}</span>
          {session?.mock && <span className="text-[9px] text-muted-foreground/50 ml-1">[MOCK]</span>}
        </div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Session ID</div>
          <div className="text-foreground truncate">{session?.id || '—'}</div>
        </div>
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Started</div>
          <div className="text-foreground">{session?.startedAt ? new Date(session.startedAt).toLocaleTimeString() : '—'}</div>
        </div>
      </div>

      {/* Current URL */}
      <div className="bg-secondary/30 border border-border px-3 py-2">
        <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Globe className="w-2.5 h-2.5" /> Current URL
        </div>
        <div className="text-[11px] text-blue-400 truncate">
          {session?.currentUrl || <span className="text-muted-foreground/30 italic">No URL loaded</span>}
        </div>
      </div>

      {/* Mock notice */}
      {session?.status !== 'OFFLINE' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="text-[10px] text-amber-500/80">MOCK MODE — Real browser agent not connected. Commands are simulated.</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 pt-1">
        {session?.status === 'OFFLINE' || session?.status === 'ERROR' ? (
          <button
            onClick={onStart}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-[11px] hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Start Session
          </button>
        ) : (
          <>
            <button
              onClick={onStop}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-[11px] hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
              Stop Session
            </button>
            <button
              onClick={onScreenshot}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 border border-border text-muted-foreground text-[11px] hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
            >
              Screenshot
            </button>
          </>
        )}
      </div>
    </div>
  );
}