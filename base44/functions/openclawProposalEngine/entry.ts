import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Capability Registry (mirror) ──────────────────────────────────────────
const CAPABILITY_REGISTRY = {
  'system.status': { riskLevel: 'low',    requiredScopes: ['vcm', 'gfm_admin', 'genesis_trust'], description: 'Query health/status of the OpenClaw gateway.' },
  'logs.fetch':    { riskLevel: 'low',    requiredScopes: ['vcm', 'gfm_admin'],                  description: 'Retrieve recent log entries.' },
  'session.list':  { riskLevel: 'medium', requiredScopes: ['gfm_admin'],                          description: 'List active browser sessions.' },
  'browser.open':  { riskLevel: 'medium', requiredScopes: ['gfm_admin'],                          description: 'Open a new browser session to a URL.' },
  'browser.click': { riskLevel: 'medium', requiredScopes: ['gfm_admin'],                          description: 'Click a DOM element in a session.' },
  'browser.type':  { riskLevel: 'medium', requiredScopes: ['gfm_admin'],                          description: 'Type text into a DOM element.' },
  // workflow.run intentionally excluded — HIGH risk, always blocked
};

const ALLOWED_CAPABILITIES = Object.entries(CAPABILITY_REGISTRY)
  .filter(([, v]) => v.riskLevel !== 'high')
  .map(([id, v]) => ({ id, ...v }));

// ── Audit helper ──────────────────────────────────────────────────────────
async function sha256(obj) {
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function buildAuditEntry(existing, eventType, extra = {}) {
  const log = Array.isArray(existing) ? [...existing] : [];
  const prevHash = log.length > 0 ? (log[log.length - 1].hash || 'genesis') : 'genesis';
  const entry = { eventType, ...extra, prevHash, timestamp: new Date().toISOString() };
  entry.hash = await sha256(entry);
  return [...log, entry];
}

// ── Step validation ───────────────────────────────────────────────────────
function validateStep(step) {
  const errors = [];
  const cap = CAPABILITY_REGISTRY[step.capabilityId];
  if (!cap) errors.push(`'${step.capabilityId}' not in registry`);
  else {
    if (cap.riskLevel === 'high') errors.push(`HIGH risk blocked: '${step.capabilityId}'`);
    if (cap.requiredScopes.length > 0 && !cap.requiredScopes.includes(step.entityScope)) {
      errors.push(`Scope '${step.entityScope}' not valid for '${step.capabilityId}'`);
    }
  }
  if (!step.stepId) errors.push('stepId required');
  return errors;
}

// ── Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── PROPOSE ───────────────────────────────────────────────────────────
    if (action === 'propose') {
      const { prompt, context = {} } = body;
      if (!prompt?.trim()) return Response.json({ error: 'prompt required' }, { status: 400 });

      const capList = ALLOWED_CAPABILITIES.map(c =>
        `- id: "${c.id}" | risk: ${c.riskLevel} | scopes: [${c.requiredScopes.join(', ')}] | ${c.description}`
      ).join('\n');

      const entityScopeHint = context.entityScope ? `Prefer entityScope: "${context.entityScope}".` : '';

      const llmPrompt = `You are an OpenClaw workflow planner. Given a user's goal, produce a workflow plan using ONLY the capabilities listed below.

RULES:
- Use ONLY capabilities from the registry below. Do not invent new ones.
- Never include "workflow.run" (HIGH risk, always blocked).
- Every step must have: stepId (snake_case, unique), capabilityId, entityScope (must be in the capability's allowed scopes), params (object, may be {}), dependsOn (array of stepIds), onFailure ("STOP"|"CONTINUE"|"ROLLBACK"), timeoutMs (number, 1000-15000), riskLevel (match the capability).
- estimatedRisk must be "LOW" or "MEDIUM" (never HIGH).
- requiredApprovals: 1 for all-LOW steps, 2 if any MEDIUM step.
- requiredApprovals must be an integer, not an array.
- estimatedLatency: sum of timeoutMs across steps (number in ms).
- rationale: 2-3 sentences explaining why these steps were chosen.
${entityScopeHint}

CAPABILITY REGISTRY:
${capList}

USER GOAL: ${prompt}

Respond ONLY with valid JSON:
{
  "steps": [
    {
      "stepId": "string",
      "capabilityId": "string",
      "params": {},
      "entityScope": "string",
      "riskLevel": "low"|"medium",
      "dependsOn": [],
      "onFailure": "STOP"|"CONTINUE"|"ROLLBACK",
      "timeoutMs": number
    }
  ],
  "rationale": "string",
  "estimatedRisk": "LOW"|"MEDIUM",
  "estimatedLatency": number,
  "requiredApprovals": number
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stepId:       { type: 'string' },
                  capabilityId: { type: 'string' },
                  params:       { type: 'object' },
                  entityScope:  { type: 'string' },
                  riskLevel:    { type: 'string' },
                  dependsOn:    { type: 'array', items: { type: 'string' } },
                  onFailure:    { type: 'string' },
                  timeoutMs:    { type: 'number' },
                }
              }
            },
            rationale:         { type: 'string' },
            estimatedRisk:     { type: 'string' },
            estimatedLatency:  { type: 'number' },
            requiredApprovals: { type: 'number' },
          }
        },
      });

      // Validate all steps against registry
      const allErrors = [];
      for (const step of (result.steps || [])) {
        const errs = validateStep(step);
        errs.forEach(e => allErrors.push(`[${step.stepId}] ${e}`));
      }
      if (allErrors.length) {
        return Response.json({ error: 'AI proposal failed validation', details: allErrors }, { status: 422 });
      }

      const proposalId = `prop_${Date.now()}`;
      const auditLog = await buildAuditEntry([], 'OPENCLAW_AI_PROPOSAL_CREATED', {
        proposalId, createdBy: user.email, stepCount: result.steps?.length,
        estimatedRisk: result.estimatedRisk,
      });

      const proposal = await base44.entities.OpenClawProposal.create({
        prompt,
        context,
        proposalId,
        steps: result.steps || [],
        rationale: result.rationale || '',
        estimatedRisk: result.estimatedRisk || 'LOW',
        estimatedLatency: result.estimatedLatency || 0,
        requiredApprovals: typeof result.requiredApprovals === 'number' ? result.requiredApprovals : 1,
        status: 'REVIEW',
        createdBy: user.email,
        auditLog,
      });

      return Response.json({ success: true, proposal });
    }

    // ── APPROVE ───────────────────────────────────────────────────────────
    if (action === 'approve') {
      const { proposalId } = body;
      const proposals = await base44.entities.OpenClawProposal.filter({ id: proposalId });
      const proposal = proposals[0];
      if (!proposal) return Response.json({ error: 'Proposal not found' }, { status: 404 });

      const auditLog = await buildAuditEntry(proposal.auditLog, 'OPENCLAW_AI_PROPOSAL_APPROVED', {
        reviewedBy: user.email,
      });
      await base44.entities.OpenClawProposal.update(proposalId, { status: 'APPROVED', reviewedBy: user.email, auditLog });
      return Response.json({ success: true });
    }

    // ── REJECT ────────────────────────────────────────────────────────────
    if (action === 'reject') {
      const { proposalId } = body;
      const proposals = await base44.entities.OpenClawProposal.filter({ id: proposalId });
      const proposal = proposals[0];
      if (!proposal) return Response.json({ error: 'Proposal not found' }, { status: 404 });

      const auditLog = await buildAuditEntry(proposal.auditLog, 'OPENCLAW_AI_PROPOSAL_REJECTED', {
        reviewedBy: user.email,
      });
      await base44.entities.OpenClawProposal.update(proposalId, { status: 'REJECTED', reviewedBy: user.email, auditLog });
      return Response.json({ success: true });
    }

    // ── CONVERT → OpenClawWorkflow ────────────────────────────────────────
    if (action === 'convert') {
      const { proposalId, name, description } = body;
      const proposals = await base44.entities.OpenClawProposal.filter({ id: proposalId });
      const proposal = proposals[0];
      if (!proposal) return Response.json({ error: 'Proposal not found' }, { status: 404 });
      if (proposal.status !== 'APPROVED') return Response.json({ error: 'Proposal must be APPROVED before conversion' }, { status: 422 });

      const workflow = await base44.entities.OpenClawWorkflow.create({
        name: name || proposal.prompt.slice(0, 60),
        description: description || `AI-generated from proposal ${proposal.proposalId}`,
        steps: proposal.steps,
        version: 1,
        status: 'pending_approval',
        createdBy: user.email,
        approvedBy: [],
        executionMode: 'SIMULATED',
        auditLog: [{
          eventType: 'OPENCLAW_WORKFLOW_REQUESTED',
          source: 'AI_PROPOSAL',
          proposalId: proposal.proposalId,
          requestedBy: user.email,
          timestamp: new Date().toISOString(),
          hash: 'genesis',
          prevHash: 'genesis',
        }],
      });

      const auditLog = await buildAuditEntry(proposal.auditLog, 'OPENCLAW_AI_PROPOSAL_CONVERTED', {
        convertedBy: user.email,
        workflowId: workflow.id,
      });
      await base44.entities.OpenClawProposal.update(proposalId, {
        status: 'CONVERTED',
        convertedWorkflowId: workflow.id,
        auditLog,
      });

      return Response.json({ success: true, workflowId: workflow.id });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});