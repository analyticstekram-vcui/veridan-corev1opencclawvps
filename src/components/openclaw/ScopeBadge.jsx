import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const ENTITY_SCOPES = ['vcm', 'gfm_admin', 'genesis_trust'];

// Per-entity allowed commands (default deny — only these pass)
export const SCOPE_ALLOWLIST = {
  vcm:          ['system.status', 'logs.fetch'],
  gfm_admin:    ['system.status', 'logs.fetch', 'session.list'],
  genesis_trust: ['system.status'],
};

const SCOPE_COLORS = {
  vcm:          'text-blue-400 border-blue-400/30 bg-blue-400/8',
  gfm_admin:    'text-purple-400 border-purple-400/30 bg-purple-400/8',
  genesis_trust:'text-amber-500 border-amber-500/30 bg-amber-500/8',
};

export function isScopePermitted(entityScope, commandText) {
  if (!entityScope) return false;
  const allowed = SCOPE_ALLOWLIST[entityScope] || [];
  return allowed.includes(commandText?.trim());
}

export default function ScopeBadge({ entityScope, commandText }) {
  if (!entityScope) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 border border-destructive/30 bg-destructive/8 text-destructive text-[9px] uppercase tracking-wider">
        <ShieldAlert className="w-2.5 h-2.5" /> no scope
      </span>
    );
  }

  const permitted = isScopePermitted(entityScope, commandText);
  const colorCls  = SCOPE_COLORS[entityScope] || 'text-muted-foreground border-border bg-secondary/50';

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 border text-[9px] uppercase tracking-wider font-mono ${colorCls} ${!permitted ? 'opacity-60' : ''}`}>
      {entityScope.replace('_', ' ')}
      {!permitted && <ShieldAlert className="w-2.5 h-2.5 text-destructive ml-0.5" />}
    </span>
  );
}