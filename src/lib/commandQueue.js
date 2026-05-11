// Governance helpers shared across Command Queue components

export const BLOCKED_PATTERNS = [
  /^(?!https:\/\/)/i,
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /192\.168\./,
  /^https?:\/\/10\./,
  /172\.(1[6-9]|2\d|3[01])\./,
  /\.local(\/|$)/i,
  /\.internal(\/|$)/i,
  /file:\/\//i,
  /javascript:/i,
  /data:/i,
];

export function validateUrl(url) {
  if (!url || typeof url !== 'string') return 'URL is required';
  if (!url.startsWith('https://')) return 'URL must start with https://';
  for (const re of BLOCKED_PATTERNS) {
    if (re.test(url)) return 'URL contains a blocked pattern (localhost, private IP, or unsafe scheme)';
  }
  return null;
}

export const RISK_LEVEL = {
  OPEN_URL_AND_READ_TITLE:  'low',
  OPEN_URL_AND_SCREENSHOT:  'low',
};

export const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'text-muted-foreground',   bg: 'bg-muted/30',               border: 'border-border',               dot: 'bg-muted-foreground/40' },
  pending:   { label: 'Pending',   color: 'text-amber-400',          bg: 'bg-amber-500/5',             border: 'border-amber-500/30',         dot: 'bg-amber-400' },
  approved:  { label: 'Approved',  color: 'text-primary',            bg: 'bg-primary/5',               border: 'border-primary/30',           dot: 'bg-primary' },
  denied:    { label: 'Denied',    color: 'text-destructive',        bg: 'bg-destructive/5',           border: 'border-destructive/30',       dot: 'bg-destructive' },
  executing: { label: 'Executing', color: 'text-blue-400',           bg: 'bg-blue-400/5',              border: 'border-blue-400/30',          dot: 'bg-blue-400' },
  executed:  { label: 'Executed',  color: 'text-primary',            bg: 'bg-primary/5',               border: 'border-primary/30',           dot: 'bg-primary' },
  failed:    { label: 'Failed',    color: 'text-red-400',            bg: 'bg-red-400/5',               border: 'border-red-400/30',           dot: 'bg-red-400' },
  blocked:   { label: 'Blocked',   color: 'text-amber-500',          bg: 'bg-amber-500/5',             border: 'border-amber-500/30',         dot: 'bg-amber-500' },
};

export const TABS = ['all', 'draft', 'pending', 'approved', 'denied', 'executing', 'executed', 'failed', 'blocked'];

export function appendAudit(existingLog, event, actor) {
  const log = Array.isArray(existingLog) ? existingLog : [];
  return [...log, {
    timestamp: new Date().toISOString(),
    event,
    actor: actor || 'system',
  }];
}