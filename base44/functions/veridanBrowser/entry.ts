import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Domain Allowlist ──────────────────────────────────────────────────────────
const ALLOWED_DOMAINS = [
  'app.openclaw.io',
  '142.93.206.36',
  'localhost',
  'tradingview.com',
  'www.tradingview.com',
  'tradovate.com',
  'www.tradovate.com',
  'app.tradovate.com',
  'base44.com',
  'www.base44.com',
  'cloudflare.com',
  'www.cloudflare.com',
  'dash.cloudflare.com',
  '1.1.1.1',
];

// ── Sensitive action patterns (require approval) ──────────────────────────────
const SENSITIVE_ACTIONS = [
  { pattern: /login|sign.?in|authenticate/i,    label: 'login' },
  { pattern: /submit|send form/i,               label: 'submit_form' },
  { pattern: /place.?order|buy|sell|trade/i,    label: 'place_order' },
  { pattern: /approve.?transaction|confirm.?pay/i, label: 'approve_transaction' },
  { pattern: /send.?message|email|message/i,    label: 'send_message' },
  { pattern: /delete|remove|wipe|clear/i,       label: 'delete_data' },
];

// ── In-memory state ───────────────────────────────────────────────────────────
let session = {
  id: null,
  status: 'OFFLINE',    // OFFLINE | READY | ACTIVE | ERROR
  currentUrl: null,
  startedAt: null,
  stoppedAt: null,
  mock: true,           // Real browser not yet connected
};

const activityLog = [];
const approvalQueue = new Map(); // actionId → { command, label, resolvedBy, status }

function nowIso() { return new Date().toISOString(); }
function timeStr() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function log(level, source, message, meta = {}) {
  // Scrub passwords from logs
  const safeMsg = message.replace(/(password|passwd|pwd|secret|token)[=:]\s*\S+/gi, '$1=[REDACTED]');
  const entry = { time: timeStr(), timestamp: nowIso(), level, source, message: safeMsg, ...meta };
  activityLog.unshift(entry);
  if (activityLog.length > 500) activityLog.pop();
  return entry;
}

function checkDomain(url) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, '');
    return ALLOWED_DOMAINS.some(d => {
      const clean = d.replace(/^www\./, '');
      return host === clean || host.endsWith('.' + clean);
    });
  } catch (_) {
    return false;
  }
}

function detectSensitiveAction(command) {
  for (const rule of SENSITIVE_ACTIONS) {
    if (rule.pattern.test(command)) return rule.label;
  }
  return null;
}

function sanitizeParams(params) {
  if (!params || typeof params !== 'object') return params;
  const safe = { ...params };
  for (const key of Object.keys(safe)) {
    if (/password|passwd|pwd|secret|token/i.test(key)) {
      safe[key] = '[REDACTED]';
    }
  }
  return safe;
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── STATUS ──────────────────────────────────────────────────────────────
    if (action === 'status') {
      return Response.json({
        session: { ...session },
        queueLength: approvalQueue.size,
        allowedDomains: ALLOWED_DOMAINS,
        mock: session.mock,
      });
    }

    // ── SESSION START ───────────────────────────────────────────────────────
    if (action === 'session_start') {
      if (session.status !== 'OFFLINE' && session.status !== 'ERROR') {
        return Response.json({ error: `Session already ${session.status}` }, { status: 409 });
      }
      session = {
        id: `vsess_${Date.now()}`,
        status: 'READY',
        currentUrl: null,
        startedAt: nowIso(),
        stoppedAt: null,
        mock: true,
      };
      log('info', 'SESSION', `Browser session started [MOCK] by ${user.email}`, { sessionId: session.id });
      return Response.json({ success: true, session });
    }

    // ── SESSION STOP ────────────────────────────────────────────────────────
    if (action === 'session_stop') {
      if (session.status === 'OFFLINE') {
        return Response.json({ error: 'No active session' }, { status: 409 });
      }
      const prev = { ...session };
      session = { id: null, status: 'OFFLINE', currentUrl: null, startedAt: null, stoppedAt: nowIso(), mock: true };
      log('info', 'SESSION', `Browser session stopped by ${user.email}`, { sessionId: prev.id });
      return Response.json({ success: true, session });
    }

    // ── COMMAND ─────────────────────────────────────────────────────────────
    if (action === 'command') {
      if (session.status === 'OFFLINE') {
        return Response.json({ error: 'No active session. Start a browser session first.' }, { status: 409 });
      }

      const { command, commandType = 'navigate', params = {} } = body;
      if (!command?.trim()) return Response.json({ error: 'command required' }, { status: 400 });

      // Check domain allowlist for navigate commands
      if (commandType === 'navigate' || /navigate|go to|open|visit/i.test(command)) {
        const urlMatch = command.match(/https?:\/\/[^\s]+/) || command.match(/([a-z0-9-]+\.[a-z]{2,}[^\s]*)/i);
        if (urlMatch && !checkDomain(urlMatch[0])) {
          log('warn', 'SECURITY', `Domain blocked: ${urlMatch[0]}`, { command, user: user.email });
          return Response.json({
            blocked: true,
            reason: `Domain '${urlMatch[0]}' is not in the allowed domains list.`,
            allowedDomains: ALLOWED_DOMAINS,
          }, { status: 403 });
        }
      }

      // Check for sensitive action requiring approval
      const sensitiveLabel = detectSensitiveAction(command);
      if (sensitiveLabel) {
        const actionId = `bact_${Date.now()}`;
        approvalQueue.set(actionId, {
          actionId,
          command,
          commandType,
          params: sanitizeParams(params),
          label: sensitiveLabel,
          requestedBy: user.email,
          requestedAt: nowIso(),
          status: 'PENDING',
          resolvedBy: null,
          resolvedAt: null,
        });
        log('warn', 'APPROVAL', `Action queued for approval: ${sensitiveLabel}`, { actionId, command: command.slice(0, 80), user: user.email });
        return Response.json({
          requiresApproval: true,
          actionId,
          label: sensitiveLabel,
          message: `Action '${sensitiveLabel}' requires manual approval before execution.`,
        });
      }

      // Execute (MOCK)
      session.status = 'ACTIVE';
      const safeParams = sanitizeParams(params);

      let result = {};
      if (commandType === 'navigate' || /navigate|go to|open|visit/i.test(command)) {
        const url = command.match(/https?:\/\/[^\s]+/)?.[0] || command.match(/([a-z0-9-]+\.[a-z]{2,}[^\s]*)/i)?.[0];
        if (url) {
          const fullUrl = url.startsWith('http') ? url : `https://${url}`;
          session.currentUrl = fullUrl;
          result = { navigatedTo: fullUrl, status: 'MOCK_SUCCESS' };
        } else {
          result = { status: 'MOCK_SUCCESS', note: 'Navigation command processed (mock)' };
        }
      } else if (commandType === 'screenshot' || /screenshot|capture|snapshot/i.test(command)) {
        result = { screenshotUrl: null, status: 'MOCK_SUCCESS', note: 'Screenshot: real browser not connected' };
      } else if (commandType === 'click' || /click/i.test(command)) {
        result = { status: 'MOCK_SUCCESS', note: `Click action simulated on: ${command}` };
      } else if (commandType === 'type' || /type|enter|fill/i.test(command)) {
        result = { status: 'MOCK_SUCCESS', note: 'Type action simulated (content not logged)' };
      } else {
        result = { status: 'MOCK_SUCCESS', note: `Command acknowledged: ${command.slice(0, 60)}` };
      }

      session.status = 'READY';
      log('info', 'CMD', `Executed [MOCK]: ${commandType} — ${command.slice(0, 60)}`, { user: user.email, result });
      return Response.json({ success: true, mock: true, result, session });
    }

    // ── SCREENSHOT ──────────────────────────────────────────────────────────
    if (action === 'screenshot') {
      if (session.status === 'OFFLINE') {
        return Response.json({ error: 'No active session' }, { status: 409 });
      }
      log('info', 'SCREENSHOT', `Screenshot requested by ${user.email}`);
      return Response.json({
        success: true,
        mock: true,
        screenshotUrl: null,
        note: 'Real browser not connected. Screenshot capture requires live browser agent.',
        session,
      });
    }

    // ── APPROVE ─────────────────────────────────────────────────────────────
    if (action === 'approve') {
      const { actionId, approved } = body;
      if (!actionId) return Response.json({ error: 'actionId required' }, { status: 400 });
      const pending = approvalQueue.get(actionId);
      if (!pending) return Response.json({ error: 'Action not found or already resolved' }, { status: 404 });
      if (pending.status !== 'PENDING') return Response.json({ error: `Action already ${pending.status}` }, { status: 409 });

      pending.status = approved ? 'APPROVED' : 'DENIED';
      pending.resolvedBy = user.email;
      pending.resolvedAt = nowIso();
      approvalQueue.set(actionId, pending);

      log(
        approved ? 'info' : 'warn',
        'APPROVAL',
        `Action ${approved ? 'APPROVED' : 'DENIED'}: ${pending.label} by ${user.email}`,
        { actionId, command: pending.command?.slice(0, 60) }
      );

      if (!approved) {
        return Response.json({ success: true, status: 'DENIED', actionId });
      }

      // Execute approved action (MOCK)
      const result = { status: 'MOCK_SUCCESS', note: `Approved action executed (mock): ${pending.label}` };
      log('info', 'CMD', `Approved action executed [MOCK]: ${pending.label}`, { actionId, user: user.email });
      return Response.json({ success: true, status: 'APPROVED', actionId, result, mock: true });
    }

    // ── LOGS ────────────────────────────────────────────────────────────────
    if (action === 'logs') {
      const { limit = 100 } = body;
      return Response.json({ logs: activityLog.slice(0, limit) });
    }

    // ── QUEUE ───────────────────────────────────────────────────────────────
    if (action === 'queue') {
      const queue = Array.from(approvalQueue.values());
      return Response.json({ queue });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});