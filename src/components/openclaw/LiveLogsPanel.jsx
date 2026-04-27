import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Terminal, Play, Square, Trash2, Download, ChevronDown } from 'lucide-react';

// ── Level styling ──────────────────────────────────────────────────────────
const LEVEL_CFG = {
  info:  { color: 'text-foreground',        badge: 'text-blue-400  border-blue-400/30',  prefix: 'INFO ' },
  warn:  { color: 'text-amber-500',         badge: 'text-amber-500 border-amber-500/30', prefix: 'WARN ' },
  error: { color: 'text-destructive',       badge: 'text-destructive border-destructive/30', prefix: 'ERR  ' },
  debug: { color: 'text-muted-foreground',  badge: 'text-muted-foreground border-border', prefix: 'DBG  ' },
};

const POLL_MS = 2000;

function LogLine({ entry }) {
  const cfg = LEVEL_CFG[entry.level] || LEVEL_CFG.info;
  return (
    <div className={`flex items-start gap-2 py-0.5 px-1 hover:bg-secondary/20 group font-mono text-[11px] ${cfg.color}`}>
      <span className="text-muted-foreground/30 shrink-0 select-none tabular-nums w-[80px] truncate">
        {entry.ts ? new Date(entry.ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
      </span>
      <span className={`shrink-0 w-[50px] text-[9px] uppercase tracking-widest font-semibold ${cfg.color}`}>
        {cfg.prefix}
      </span>
      <span className="text-muted-foreground/50 shrink-0 w-[80px] truncate text-[10px]">{entry.source}</span>
      <span className="flex-1 break-all">{entry.message}</span>
      {(entry.workflowId || entry.commandId || entry.nodeId) && (
        <span className="shrink-0 text-[9px] text-muted-foreground/30 hidden group-hover:inline">
          {[entry.workflowId && `wf:${entry.workflowId.slice(-6)}`, entry.commandId && `cmd:${entry.commandId.slice(-6)}`, entry.nodeId && `node:${entry.nodeId}`].filter(Boolean).join(' · ')}
        </span>
      )}
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, onClear, onExport, running, onToggle }) {
  const set = (k, v) => onChange({ ...filters, [k]: v || null });
  const inputCls = "px-2 py-1 bg-secondary/50 border border-border text-[10px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors w-36";

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/60 flex-wrap">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Filters:</span>
      <input className={inputCls} placeholder="workflow ID" value={filters.workflowId || ''} onChange={e => set('workflowId', e.target.value.trim())} />
      <input className={inputCls} placeholder="command ID"  value={filters.commandId  || ''} onChange={e => set('commandId',  e.target.value.trim())} />
      <input className={inputCls} placeholder="node ID"     value={filters.nodeId     || ''} onChange={e => set('nodeId',     e.target.value.trim())} />

      <div className="ml-auto flex items-center gap-1.5">
        {/* Level filter */}
        <select className="px-2 py-1 bg-secondary/50 border border-border text-[10px] font-mono text-muted-foreground outline-none focus:border-primary/50"
          value={filters.level || 'all'} onChange={e => set('level', e.target.value === 'all' ? null : e.target.value)}>
          <option value="all">All Levels</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
          <option value="debug">debug</option>
        </select>

        <button onClick={onClear} title="Clear console"
          className="p-1.5 border border-border text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onExport} title="Export logs"
          className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={onToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] transition-colors ${running ? 'border-destructive/40 text-destructive bg-destructive/10 hover:bg-destructive/20' : 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'}`}>
          {running ? <><Square className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Stream</>}
        </button>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────
export default function LiveLogsPanel() {
  const [logs, setLogs]           = useState([]);
  const [running, setRunning]     = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filters, setFilters]     = useState({ workflowId: null, commandId: null, nodeId: null, level: null });
  const [lineCount, setLineCount] = useState(0);
  const pollRef   = useRef(null);
  const bottomRef = useRef(null);
  const seenIds   = useRef(new Set());

  const fetchTail = useCallback(async () => {
    const res = await base44.functions.invoke('openclawLiveLogs', {
      action: 'tail',
      limit: 200,
      workflowId: filters.workflowId,
      commandId:  filters.commandId,
      nodeId:     filters.nodeId,
    });
    const entries = res.data?.entries || [];
    const fresh = entries.filter(e => !seenIds.current.has(e.id));
    if (fresh.length > 0) {
      fresh.forEach(e => seenIds.current.add(e.id));
      setLogs(prev => {
        const merged = [...prev, ...fresh];
        return merged.slice(-500); // keep last 500 in DOM
      });
      setLineCount(c => c + fresh.length);
    }
  }, [filters]);

  // Poll when running
  useEffect(() => {
    if (!running) { clearInterval(pollRef.current); return; }
    fetchTail(); // immediate
    pollRef.current = setInterval(fetchTail, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [running, fetchTail]);

  // Reset on filter change
  useEffect(() => {
    seenIds.current.clear();
    setLogs([]);
    setLineCount(0);
    if (running) fetchTail();
  }, [filters.workflowId, filters.commandId, filters.nodeId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const visibleLogs = filters.level ? logs.filter(e => e.level === filters.level) : logs;

  const handleClear = () => { setLogs([]); seenIds.current.clear(); setLineCount(0); };

  const handleExport = () => {
    const text = visibleLogs.map(e =>
      `${e.ts} [${e.level.toUpperCase()}] [${e.source}] ${e.message}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `openclaw-logs-${Date.now()}.txt`;
    a.click();
  };

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  return (
    <div className="flex flex-col h-full font-mono bg-background">
      {/* Header */}
      <div className="shrink-0 px-4 py-2.5 border-b border-border bg-card flex items-center gap-3">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-[12px] font-semibold text-foreground">Live Logs</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40">tail -f · {lineCount} lines received</span>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">{running ? 'STREAMING' : 'PAUSED'}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onClear={handleClear}
        onExport={handleExport}
        running={running}
        onToggle={() => setRunning(v => !v)}
      />

      {/* Console */}
      <div
        className="flex-1 overflow-auto bg-background py-1"
        onScroll={handleScroll}
      >
        {visibleLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <Terminal className="w-6 h-6 text-muted-foreground/20" />
            <span className="text-[11px] text-muted-foreground/40">Waiting for log entries…</span>
          </div>
        ) : (
          <>
            {visibleLogs.map(entry => <LogLine key={entry.id} entry={entry} />)}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border bg-card/60 px-3 py-1.5 flex items-center gap-3">
        <span className="text-[9px] text-muted-foreground/40">{visibleLogs.length} lines shown</span>
        {!autoScroll && (
          <button onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
            className="flex items-center gap-1 text-[9px] text-primary hover:underline ml-auto">
            <ChevronDown className="w-3 h-3" /> Jump to bottom
          </button>
        )}
        <span className="text-[9px] text-muted-foreground/30 ml-auto uppercase tracking-widest">
          Polling every {POLL_MS / 1000}s · max 500 lines · SSE-ready
        </span>
      </div>
    </div>
  );
}