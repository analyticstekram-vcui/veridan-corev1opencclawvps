import React, { useRef, useEffect } from 'react';

const TYPE_STYLE = {
  'gateway.ping':     'text-primary',
  'command.sent':     'text-blue-400',
  'command.result':   'text-primary',
  'error':            'text-destructive',
  'circuit_breaker_trip': 'text-destructive',
};

function eventLabel(e) {
  if (e.type === 'gateway.ping')   return `gateway.ping  status=${e.statusCode ?? '—'}  latency=${e.latency ?? '—'}ms`;
  if (e.type === 'command.sent')   return `command.sent  id=${e.commandId?.slice(0,8) ?? '—'}`;
  if (e.type === 'command.result') return `command.result  id=${e.commandId?.slice(0,8) ?? '—'}  ${e.success ? 'OK' : 'FAIL'}  ${e.latency ?? '—'}ms`;
  if (e.type === 'error')          return `error  code=${e.code ?? '—'}  ${e.message ?? ''}`;
  return e.type;
}

export default function TelemetryLiveStream({ events = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div className="h-48 overflow-auto bg-background border border-border p-3 font-mono text-[10px] space-y-0.5">
      {events.length === 0 && (
        <div className="text-muted-foreground/30 text-center mt-8">Awaiting telemetry events...</div>
      )}
      {[...events].reverse().map((e, i) => (
        <div key={i} className="flex items-start gap-3 leading-relaxed">
          <span className="text-muted-foreground/30 shrink-0 tabular-nums">
            {e.tsIso ? new Date(e.tsIso).toLocaleTimeString() : '—'}
          </span>
          <span className={`shrink-0 w-24 truncate ${TYPE_STYLE[e.type] || 'text-muted-foreground'}`}>
            {e.type}
          </span>
          <span className="text-muted-foreground/70 break-all">{eventLabel(e)}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}