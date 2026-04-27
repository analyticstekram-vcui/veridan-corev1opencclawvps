import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Capability Registry (mirror of lib/capabilityRegistry.js) ─────────────
const CAPABILITY_REGISTRY = {
  'system.status': { riskLevel: 'low',    requiredScopes: ['vcm', 'gfm_admin', 'genesis_trust'] },
  'logs.fetch':    { riskLevel: 'low',    requiredScopes: ['vcm', 'gfm_admin'] },
  'session.list':  { riskLevel: 'medium', requiredScopes: ['gfm_admin'] },
  'browser.open':  { riskLevel: 'medium', requiredScopes: ['gfm_admin'] },
  'browser.click': { riskLevel: 'medium', requiredScopes: ['gfm_admin'] },
  'browser.type':  { riskLevel: 'medium', requiredScopes: ['gfm_admin'] },
  'workflow.run':  { riskLevel: 'high',   requiredScopes: [] },
};

// Reverse capability map for rollback
const ROLLBACK_MAP = {
  'browser.open': null, // no rollback
};

// ── Guards ────────────────────────────────────────────────────────────────
const SCOPE_RATE_WINDOW_MS = 60_000;
const SCOPE_RATE_LIMIT = 3;
const scopeRateStore = new Map();
function checkScopeRate(scope, email) {
  const key = `${scope}:${email}`;
  const now = Date.now();
  const times = (scopeRateStore.get(key) || []).filter(t => now - t < SCOPE_RATE_WINDOW_MS);
  if (times.length >= SCOPE_RATE_LIMIT) return false;
  times.push(now);
  scopeRateStore.set(key, times);
  return true;
}

const CB_WINDOW_MS = 30_000;
const CB_THRESHOLD = 3;
const failures = [];
let circuitOpen = false;
function recordFailure() {
  const now = Date.now();
  failures.push(now);
  const recent = failures.filter(t => now - t < CB_WINDOW_MS);
  if (recent.length >= CB_THRESHOLD) circuitOpen = true;
}
function resetCircuit() { failures.length = 0; circuitOpen = false; }

// Idempotency: workflowId+paramsHash → timestamp
const idempotencyStore = new Map();
const IDEMPOTENCY_WINDOW_MS = 60_000;
async function idempotencyKey(workflowId, steps) {
  const data = new TextEncoder().encode(workflowId + JSON.stringify(steps));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// ── Audit ─────────────────────────────────────────────────────────────────
async function sha256(obj) {
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function appendAudit(base44, workflow, entry) {
  const log = Array.isArray(workflow.auditLog) ? [...workflow.auditLog] : [];
  const prevHash = log.length > 0 ? (log[log.length - 1].hash || 'genesis') : 'genesis';
  const newEntry = { ...entry, prevHash, timestamp: new Date().toISOString() };
  newEntry.hash = await sha256(newEntry);
  const updated = [...log, newEntry];
  await base44.entities.OpenClawWorkflow.update(workflow.id, { auditLog: updated });
  workflow.auditLog = updated; // mutate local ref for chaining
}

// ── Step executor ──────────────────────────────────────────────────────────
async function executeStep(step, workflow, user, executionMode) {
  const capDef = CAPABILITY_REGISTRY[step.capabilityId];
  const stepResult = {
    stepId: step.stepId,
    capabilityId: step.capabilityId,
    startedAt: new Date().toISOString(),
  };

  // 1. Registry check
  if (!capDef) {
    stepResult.status = 'FAILED';
    stepResult.error = `Capability '${step.capabilityId}' not in registry`;
    return stepResult;
  }

  // 2. Risk guard — high always blocked
  if (capDef.riskLevel === 'high') {
    stepResult.status = 'FAILED';
    stepResult.error = `HIGH risk capability '${step.capabilityId}' is blocked`;
    return stepResult;
  }

  // 3. Scope guard
  if (capDef.requiredScopes.length > 0 && !capDef.requiredScopes.includes(step.entityScope)) {
    stepResult.status = 'FAILED';
    stepResult.error = `Scope '${step.entityScope}' not authorized for '${step.capabilityId}'`;
    return stepResult;
  }

  // 4. Circuit breaker
  if (circuitOpen) {
    stepResult.status = 'FAILED';
    stepResult.error = 'Circuit breaker open';
    return stepResult;
  }

  // 5. Scope rate limit
  if (!checkScopeRate(step.entityScope, user.email)) {
    stepResult.status = 'FAILED';
    stepResult.error = `Scope rate limit exceeded for '${step.entityScope}'`;
    return stepResult;
  }

  // 6. Execute (SIMULATED or LIVE)
  const t0 = Date.now();
  const timeoutMs = step.timeoutMs || 5000;

  if (executionMode === 'LIVE') {
    const gatewayUrl = Deno.env.get('OPENCLAW_GATEWAY_URL');
    if (gatewayUrl) {
      try {
        const resp = await fetch(`${gatewayUrl}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-veridan-mode': 'LIVE' },
          body: JSON.stringify({ command: step.capabilityId, params: step.params }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        stepResult.latency = Date.now() - t0;
        stepResult.status = resp.ok ? 'SUCCESS' : 'FAILED';
        stepResult.response = await resp.text();
        if (!resp.ok) recordFailure(); else resetCircuit();
        stepResult.simulated = false;
        stepResult.completedAt = new Date().toISOString();
        return stepResult;
      } catch (e) {
        recordFailure();
        stepResult.status = 'FAILED';
        stepResult.error = e.message;
        stepResult.latency = Date.now() - t0;
        stepResult.simulated = false;
        stepResult.completedAt = new Date().toISOString();
        return stepResult;
      }
    }
  }

  // Simulated
  await new Promise(r => setTimeout(r, 150 + Math.random() * 100));
  stepResult.latency = Date.now() - t0;
  stepResult.status = 'SUCCESS';
  stepResult.simulated = true;
  stepResult.response = `[SIMULATED] ${step.capabilityId} executed successfully`;
  stepResult.completedAt = new Date().toISOString();
  return stepResult;
}

// ── Rollback ──────────────────────────────────────────────────────────────
async function rollbackStep(step, user, executionMode) {
  const reverseCap = ROLLBACK_MAP[step.capabilityId];
  if (!reverseCap) return { stepId: step.stepId, status: 'NO_ROLLBACK', note: 'No reverse capability defined' };
  // Execute reverse with same params
  return await executeStep({ ...step, capabilityId: reverseCap }, { id: 'rollback', auditLog: [] }, user, executionMode);
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, workflowId, executionMode = 'SIMULATED' } = body;

    // ── CREATE ─────────────────────────────────────────────────────────────
    if (action === 'create') {
      const { name, description, steps } = body;
      if (!name || !steps?.length) return Response.json({ error: 'name and steps required' }, { status: 400 });

      // Validate all steps against registry
      const errors = [];
      for (const step of steps) {
        if (!CAPABILITY_REGISTRY[step.capabilityId]) {
          errors.push(`Step '${step.stepId}': capability '${step.capabilityId}' not in registry`);
        }
        if (CAPABILITY_REGISTRY[step.capabilityId]?.riskLevel === 'high') {
          errors.push(`Step '${step.stepId}': HIGH risk capability blocked`);
        }
      }
      if (errors.length) return Response.json({ error: errors.join('; ') }, { status: 422 });

      const iKey = await idempotencyKey(`new-${user.email}-${name}`, steps);
      const workflow = await base44.entities.OpenClawWorkflow.create({
        name,
        description: description || '',
        steps,
        status: 'pending_approval',
        createdBy: user.email,
        approvedBy: [],
        executionMode,
        idempotencyKey: iKey,
        auditLog: [{
          eventType: 'OPENCLAW_WORKFLOW_REQUESTED',
          requestedBy: user.email,
          stepCount: steps.length,
          timestamp: new Date().toISOString(),
          hash: 'genesis',
          prevHash: 'genesis',
        }],
      });
      return Response.json({ success: true, workflow });
    }

    // ── APPROVE ────────────────────────────────────────────────────────────
    if (action === 'approve') {
      if (!workflowId) return Response.json({ error: 'workflowId required' }, { status: 400 });
      // Fetch all, find by id (built-in field not filterable via filter())
      const allWfs = await base44.entities.OpenClawWorkflow.list('-created_date', 200);
      const wf = allWfs.find(w => w.id === workflowId);
      if (!wf) return Response.json({ error: 'Workflow not found', workflowId }, { status: 404 });
      if (wf.status !== 'pending_approval') {
        return Response.json({ error: `Cannot approve workflow in status '${wf.status}'` }, { status: 422 });
      }
      const approvedBy = [...new Set([...(wf.approvedBy || []), user.email])];
      await base44.entities.OpenClawWorkflow.update(workflowId, { status: 'approved', approvedBy });
      await appendAudit(base44, { ...wf, id: workflowId }, { eventType: 'OPENCLAW_WORKFLOW_APPROVED', approvedBy: user.email });
      return Response.json({ success: true, status: 'approved' });
    }

    // ── EXECUTE ────────────────────────────────────────────────────────────
    if (action === 'execute') {
      if (!workflowId) return Response.json({ error: 'workflowId required' }, { status: 400 });
      const allWfs = await base44.entities.OpenClawWorkflow.list('-created_date', 200);
      const wf = allWfs.find(w => w.id === workflowId);
      if (!wf) return Response.json({ error: 'Workflow not found', workflowId }, { status: 404 });
      if (wf.status !== 'approved') return Response.json({ error: `Workflow must be approved, current: ${wf.status}` }, { status: 422 });

      // Idempotency check
      const iKey = await idempotencyKey(workflowId, wf.steps);
      const lastRun = idempotencyStore.get(iKey);
      if (lastRun && Date.now() - lastRun < IDEMPOTENCY_WINDOW_MS) {
        return Response.json({ success: false, deduplicated: true, reason: 'Duplicate workflow execution within 60s window' }, { status: 409 });
      }
      idempotencyStore.set(iKey, Date.now());

      await base44.entities.OpenClawWorkflow.update(workflowId, { status: 'running' });
      await appendAudit(base44, wf, { eventType: 'OPENCLAW_WORKFLOW_STEP_EXECUTED', phase: 'START', executedBy: user.email, executionMode });

      const results = [];
      const completedStepIds = new Set();
      let workflowFailed = false;
      let rollbackLog = [];

      for (const step of wf.steps) {
        // Respect dependsOn
        if (step.dependsOn?.length) {
          const unmet = step.dependsOn.filter(dep => !completedStepIds.has(dep));
          if (unmet.length > 0) {
            results.push({ stepId: step.stepId, status: 'SKIPPED', reason: `Deps not met: ${unmet.join(', ')}` });
            continue;
          }
        }

        const stepResult = await executeStep(step, wf, user, executionMode);
        results.push(stepResult);

        // Persist incremental results
        await base44.entities.OpenClawWorkflow.update(workflowId, { executionResults: results });
        await appendAudit(base44, wf, {
          eventType: 'OPENCLAW_WORKFLOW_STEP_EXECUTED',
          stepId: step.stepId,
          capabilityId: step.capabilityId,
          status: stepResult.status,
          latency: stepResult.latency,
          simulated: stepResult.simulated,
        });

        if (stepResult.status === 'SUCCESS') {
          completedStepIds.add(step.stepId);
        } else {
          recordFailure();
          if (step.onFailure === 'STOP') {
            workflowFailed = true;
            break;
          } else if (step.onFailure === 'ROLLBACK') {
            workflowFailed = true;
            // Rollback completed steps in reverse
            const toRollback = wf.steps.filter(s => completedStepIds.has(s.stepId)).reverse();
            for (const rs of toRollback) {
              const rb = await rollbackStep(rs, user, executionMode);
              rollbackLog.push(rb);
            }
            break;
          }
          // CONTINUE — keep going
        }
      }

      const finalStatus = workflowFailed ? 'failed' : 'completed';
      const allResults = { executionResults: results, status: finalStatus };
      if (rollbackLog.length) allResults.rollbackLog = rollbackLog;
      await base44.entities.OpenClawWorkflow.update(workflowId, allResults);
      await appendAudit(base44, wf, {
        eventType: workflowFailed ? 'OPENCLAW_WORKFLOW_FAILED' : 'OPENCLAW_WORKFLOW_COMPLETED',
        stepCount: results.length,
        successCount: results.filter(r => r.status === 'SUCCESS').length,
        executionMode,
      });

      return Response.json({ success: true, status: finalStatus, results, rollbackLog });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});