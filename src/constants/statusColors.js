/**
 * statusColors — Shared status/risk/color constants.
 * Centralized color schemes for consistent UI.
 */

export const STATUS_COLORS = {
  'PLANNING_ONLY': 'text-amber-400',
  'DRAFT': 'text-slate-400',
  'NEEDS_REVIEW': 'text-amber-400',
  'APPROVED': 'text-primary',
  'DISABLED': 'text-destructive',
  'ACTIVE': 'text-primary',
  'INACTIVE': 'text-slate-500',
  'PENDING': 'text-slate-400',
  'READY': 'text-emerald-400',
  'FAILED': 'text-destructive',
};

export const RISK_COLORS = {
  'Low': 'text-emerald-400',
  'Medium': 'text-amber-400',
  'High': 'text-orange-400',
  'Critical': 'text-destructive',
};

export const PRIORITY_COLORS = {
  'Low': 'text-slate-400',
  'Medium': 'text-amber-400',
  'High': 'text-orange-400',
  'Critical': 'text-destructive',
};

export const MODULE_COLORS = {
  'TRADING': 'text-blue-400',
  'PUBLIC_CREDIT': 'text-emerald-400',
  'BUSINESS_FORMATION': 'text-purple-400',
  'AI_COMMAND_CENTER': 'text-primary',
  'OPENCLAW': 'text-slate-300',
};

// Value color for count displays
export const VALUE_COLORS = {
  'total': 'text-slate-200',
  'active': 'text-primary',
  'pending': 'text-amber-400',
  'ready': 'text-emerald-400',
  'disabled': 'text-destructive',
};