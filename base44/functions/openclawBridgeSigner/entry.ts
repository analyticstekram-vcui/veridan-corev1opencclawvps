import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_DOMAINS = [
  'veridancore.com',
  'openclaw.veridancore.com',
  'base44.com',
  'tradingview.com',
  'tradovate.com',
];

const ALLOWED_COMMAND_TYPES = ['READ', 'NAVIGATE', 'EXTRACT', 'VERIFY'];
const ALLOWED_RISK_TIERS = ['LOW', 'MEDIUM'];
const SUSPICIOUS_PATH_KEYWORDS = ['delete', 'transfer', 'withdraw', 'password', 'settings/security', 'api-key', 'billing', 'checkout', 'trade', 'order', 'execute'];

const generateSignerAuditId = () => `signer_audit_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 9)}`;

const buildCanonicalPayload = (requestId, proposalId, previewHash, operatorId, submittedAt, signedAt, commandType, targetUrl, riskTier, governanceMode, dryRun, liveExecution) => {
  return [
    requestId,
    proposalId,
    previewHash,
    operatorId,
    submittedAt,
    signedAt,
    commandType,
    targetUrl,
    riskTier,
    governanceMode,
    String(dryRun),
    String(liveExecution),
  ].join('|');
};

const generateHmacSignature = async (canonical, secret) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBuffer = encoder.encode(canonical);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataBuffer);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const isUrlAllowlisted = (urlString) => {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    const domain = url.hostname;
    return ALLOWED_DOMAINS.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
  } catch {
    return false;
  }
};

const containsSuspiciousKeywords = (urlString) => {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    const urlLower = (url.pathname + url.search).toLowerCase();
    return SUSPICIOUS_PATH_KEYWORDS.some(keyword => urlLower.includes(keyword));
  } catch {
    return false;
  }
};

Deno.serve(async (req) => {
  const signerAuditId = generateSignerAuditId();
  let requestId = null;
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
      return Response.json(
        {
          signingAllowed: false,
          rejectedReason: 'HTTP method must be POST',
          signerAuditId,
          signedRequest: null,
          signatureMode: 'REAL_HMAC_VALIDATION',
          note: 'Signing rejected. No OpenClaw call was made.',
        },
        { status: 405 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        {
          signingAllowed: false,
          rejectedReason: 'request body is not valid JSON',
          signerAuditId,
          signedRequest: null,
          signatureMode: 'REAL_HMAC_VALIDATION',
          note: 'Signing rejected. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    if (!body) {
      return Response.json(
        {
          signingAllowed: false,
          rejectedReason: 'request body does not exist',
          signerAuditId,
          signedRequest: null,
          signatureMode: 'REAL_HMAC_VALIDATION',
          note: 'Signing rejected. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // Extract fields
    if (!body.bridgeRequest || !body.previewHash || !body.operatorId || !body.submittedAt) {
      return Response.json(
        {
          signingAllowed: false,
          rejectedReason: 'Missing required fields: bridgeRequest, previewHash, operatorId, submittedAt',
          signerAuditId,
          signedRequest: null,
          signatureMode: 'REAL_HMAC_VALIDATION',
          note: 'Signing rejected. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    requestId = body.bridgeRequest.requestId;
    const br = body.bridgeRequest;

    // Check HMAC secret is configured
    const hmacSecret = Deno.env.get('OPENCLAW_BRIDGE_HMAC_SECRET');
    if (!hmacSecret || hmacSecret.length === 0) {
      try {
        await base44.asServiceRole.entities.OpenClawSignerAudit.create({
          signerAuditId,
          requestId,
          proposalId: br.proposalId || null,
          operatorId: body.operatorId,
          signingAllowed: false,
          rejectedReason: 'HMAC_SECRET_NOT_CONFIGURED',
          commandType: br.commandType || null,
          riskTier: br.riskTier || null,
          targetUrl: br.targetUrl || null,
          previewHash: body.previewHash,
          signingVersion: null,
          signatureMode: 'REAL_HMAC_VALIDATION',
          signedAt: null,
          secretExposed: false,
          inputTextPresent: !!br.inputText,
          note: 'HMAC secret not configured. No OpenClaw call was made.',
        });
      } catch (err) {
        console.error('Failed to create signer audit:', err.message);
      }

      return Response.json(
        {
          signingAllowed: false,
          rejectedReason: 'HMAC_SECRET_NOT_CONFIGURED',
          signerAuditId,
          signedRequest: null,
          signatureMode: 'REAL_HMAC_VALIDATION',
          note: 'HMAC secret not configured. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // Validation checks
    const rejectionReasons = [];

    // Check expiration
    if (br.expirationAt) {
      try {
        const expirationDate = new Date(br.expirationAt);
        if (expirationDate <= new Date()) {
          rejectionReasons.push('expirationAt expired');
        }
      } catch {
        rejectionReasons.push('expirationAt invalid');
      }
    }

    // Check dryRun and liveExecution
    if (br.dryRun !== true) rejectionReasons.push('dryRun must be true');
    if (br.liveExecution !== false) rejectionReasons.push('liveExecution must be false');

    // Check governance mode
    if (br.governanceMode !== 'SAFE_REQUIRES_APPROVAL') rejectionReasons.push('governanceMode must be SAFE_REQUIRES_APPROVAL');

    // Check approval status
    if (br.approvalStatus !== 'APPROVED') rejectionReasons.push('approvalStatus must be APPROVED');

    // Check validation result
    if (br.validationResult !== 'PASS') rejectionReasons.push('validationResult must be PASS');

    // Check execution eligibility
    if (br.executionEligibility !== 'ELIGIBLE_PREVIEW') rejectionReasons.push('executionEligibility must be ELIGIBLE_PREVIEW');

    // Check command type
    if (!ALLOWED_COMMAND_TYPES.includes(br.commandType)) rejectionReasons.push(`commandType not allowed: ${br.commandType}`);

    // Check risk tier
    if (!ALLOWED_RISK_TIERS.includes(br.riskTier)) rejectionReasons.push(`riskTier not allowed: ${br.riskTier}`);

    // Check URL
    if (!br.targetUrl) {
      rejectionReasons.push('targetUrl missing');
    } else {
      if (!br.targetUrl.toLowerCase().startsWith('https://')) {
        rejectionReasons.push('targetUrl must use https://');
      } else if (!isUrlAllowlisted(br.targetUrl)) {
        rejectionReasons.push('targetUrl domain not allowlisted');
      } else if (containsSuspiciousKeywords(br.targetUrl)) {
        rejectionReasons.push('targetUrl contains suspicious keywords');
      }
    }

    if (rejectionReasons.length > 0) {
      const rejectedReason = rejectionReasons.join('; ');
      try {
        await base44.asServiceRole.entities.OpenClawSignerAudit.create({
          signerAuditId,
          requestId,
          proposalId: br.proposalId || null,
          operatorId: body.operatorId,
          signingAllowed: false,
          rejectedReason: rejectedReason,
          commandType: br.commandType || null,
          riskTier: br.riskTier || null,
          targetUrl: br.targetUrl || null,
          previewHash: body.previewHash,
          signingVersion: null,
          signatureMode: 'REAL_HMAC_VALIDATION',
          signedAt: null,
          secretExposed: false,
          inputTextPresent: !!br.inputText,
          note: 'Signing rejected. No OpenClaw call was made.',
        });
      } catch (err) {
        console.error('Failed to create signer audit:', err.message);
      }

      return Response.json(
        {
          signingAllowed: false,
          rejectedReason: rejectedReason,
          signerAuditId,
          signedRequest: null,
          signatureMode: 'REAL_HMAC_VALIDATION',
          note: 'Signing rejected. No OpenClaw call was made.',
        },
        { status: 400 }
      );
    }

    // All validations passed - sign the request
    const signedAt = new Date().toISOString();
    const signingVersion = 'OPENCLAW_BRIDGE_V1';

    const canonical = buildCanonicalPayload(
      br.requestId,
      br.proposalId,
      body.previewHash,
      body.operatorId,
      body.submittedAt,
      signedAt,
      br.commandType,
      br.targetUrl,
      br.riskTier,
      br.governanceMode,
      br.dryRun,
      br.liveExecution
    );

    const signature = await generateHmacSignature(canonical, hmacSecret);

    // Canonical debug hash (first 16 chars of HMAC of the canonical string itself — never the secret)
    const canonicalDebugHash = (await generateHmacSignature(canonical, 'canonical-debug-only')).slice(0, 16);

    const signedRequest = {
      ...body,
      signature,
      signedAt,
      signingVersion,
    };

    // Create audit record
    try {
      await base44.asServiceRole.entities.OpenClawSignerAudit.create({
        signerAuditId,
        requestId: br.requestId,
        proposalId: br.proposalId,
        operatorId: body.operatorId,
        signingAllowed: true,
        rejectedReason: null,
        commandType: br.commandType,
        riskTier: br.riskTier,
        targetUrl: br.targetUrl,
        previewHash: body.previewHash,
        signingVersion,
        signatureMode: 'REAL_HMAC_VALIDATION',
        signedAt,
        secretExposed: false,
        inputTextPresent: !!br.inputText,
        note: 'Signing allowed. No OpenClaw call was made.',
      });
    } catch (err) {
      console.error('Failed to create signer audit:', err.message);
    }

    return Response.json(
      {
        signingAllowed: true,
        rejectedReason: null,
        signerAuditId,
        signature,
        signingVersion,
        signatureMode: 'REAL_HMAC_VALIDATION',
        signedAt,
        operatorId: body.operatorId,
        previewHash: body.previewHash,
        expirationAt: body.expirationAt,
        executionStatus: 'NOT_EXECUTED',
        mode: 'DRY_RUN_ONLY',
        signedRequest,
        signaturePresent: Boolean(signature),
        signatureLength: signature?.length || 0,
        // Canonical debug — allows frontend to verify signer vs preview used same inputs
        canonicalDebug: {
          signerCanonicalHash: canonicalDebugHash,
          requestId: br.requestId,
          proposalId: br.proposalId,
          previewHash: body.previewHash,
          operatorId: body.operatorId,
          submittedAt: body.submittedAt,
          signedAt,
          commandType: br.commandType,
          targetUrl: br.targetUrl,
          riskTier: br.riskTier,
          governanceMode: br.governanceMode,
          dryRun: br.dryRun,
          liveExecution: br.liveExecution,
        },
        note: 'Signing only. No OpenClaw call was made.',
      },
      { status: 200 }
    );

  } catch (error) {
    return Response.json(
      {
        signingAllowed: false,
        rejectedReason: `Server error: ${error.message}`,
        signerAuditId,
        signedRequest: null,
        signatureMode: 'REAL_HMAC_VALIDATION',
        note: 'Signing rejected. No OpenClaw call was made.',
      },
      { status: 500 }
    );
  }
});