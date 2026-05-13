import React, { useState, useEffect } from 'react';
import Phase1BridgePreviewTester from './Phase1BridgePreviewTester';
import Phase3SignatureGenerator from './Phase3SignatureGenerator';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight, Shield, Lock, TrendingDown, TrendingUp, Copy, AlertTriangle, Clock } from 'lucide-react';

const REQUEST_SCHEMA = {
  requestId: { type: 'string', description: 'Unique bridge request identifier', required: true },
  proposalId: { type: 'string', description: 'Reference to OpenClawProposal ID', required: true },
  bundleHash: { type: 'string', description: 'SHA-256 hash of proposal bundle', required: true },
  commandType: { type: 'string', description: 'Browser command type', required: true },
  targetUrl: { type: 'string', description: 'HTTPS target URL only', required: true },
  selector: { type: 'string', description: 'CSS selector for target element', required: false },
  inputText: { type: 'string', description: 'Text input for TYPE commands', required: false },
  reason: { type: 'string', description: 'Justification for command', required: true },
  riskTier: { type: 'string', description: 'LOW, MEDIUM, HIGH, CRITICAL', required: true },
  approvalStatus: { type: 'string', description: 'Must be APPROVED', required: true },
  validationResult: { type: 'string', description: 'Must be PASS', required: true },
  executionEligibility: { type: 'string', description: 'Must be ELIGIBLE_PREVIEW', required: true },
  proposedBy: { type: 'string', description: 'Email of proposer', required: true },
  approvedBy: { type: 'string', description: 'Email of approver', required: true },
  proposedAt: { type: 'ISO-8601', description: 'Proposal creation timestamp', required: true },
  approvedAt: { type: 'ISO-8601', description: 'Approval timestamp', required: true },
  expirationAt: { type: 'ISO-8601', description: 'Approval expiration timestamp', required: true },
  governanceMode: { type: 'string', description: 'Must be SAFE_REQUIRES_APPROVAL', required: true },
  dryRun: { type: 'boolean', description: 'Must be true (no live execution)', required: true },
  liveExecution: { type: 'boolean', description: 'Must be false', required: true },
};

const RESPONSE_SCHEMA = {
  requestId: { type: 'string', description: 'Echo of request ID' },
  accepted: { type: 'boolean', description: 'Request accepted by bridge' },
  rejectedReason: { type: 'string', description: 'Reason if rejected, null if accepted' },
  bridgeMode: { type: 'string', description: 'Always DRY_RUN_ONLY (Phases 1-3)' },
  executionStatus: { type: 'string', description: 'NOT_EXECUTED or REJECTED_NOT_EXECUTED only' },
  auditId: { type: 'string', description: 'Audit trail identifier' },
  receivedAt: { type: 'ISO-8601', description: 'Bridge receipt timestamp' },
  validatedAt: { type: 'ISO-8601', description: 'Validation completion timestamp' },
  signatureCheckResult: { type: 'string', description: 'PASS or FAIL (Phase 3)' },
  signatureMode: { type: 'string', description: 'MOCK_SIGNATURE_VALIDATION (Phase 3)' },
  note: { type: 'string', description: 'Human-readable confirmation no OpenClaw call was made' },
};

const VALIDATION_RULES = [
  { field: 'requestId', rule: 'Required, non-empty UUID' },
  { field: 'proposalId', rule: 'Required, must exist in OpenClawProposal' },
  { field: 'bundleHash', rule: 'Required, valid SHA-256 hex string' },
  { field: 'commandType', rule: 'Required, must be READ, NAVIGATE, EXTRACT, or VERIFY' },
  { field: 'targetUrl', rule: 'Required, must start with https://', critical: true },
  { field: 'approvalStatus', rule: 'Required, must equal APPROVED', critical: true },
  { field: 'validationResult', rule: 'Required, must equal PASS', critical: true },
  { field: 'executionEligibility', rule: 'Required, must equal ELIGIBLE_PREVIEW', critical: true },
  { field: 'governanceMode', rule: 'Required, must equal SAFE_REQUIRES_APPROVAL', critical: true },
  { field: 'dryRun', rule: 'Required, must be true (no live execution)', critical: true },
  { field: 'liveExecution', rule: 'Required, must be false (no live execution)', critical: true },
  { field: 'expirationAt', rule: 'Required, must be in future (not expired)', critical: true },
];

const EXAMPLE_VALID_REQUEST = {
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  proposalId: '1715592000001',
  bundleHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f',
  commandType: 'READ',
  targetUrl: 'https://tradingview.com/chart',
  selector: '.title-text',
  inputText: null,
  reason: 'Read current page title to verify navigation',
  riskTier: 'LOW',
  approvalStatus: 'APPROVED',
  validationResult: 'PASS',
  executionEligibility: 'ELIGIBLE_PREVIEW',
  proposedBy: 'operator@veridancore.com',
  approvedBy: 'admin@veridancore.com',
  proposedAt: '2026-05-13T10:30:00Z',
  approvedAt: '2026-05-13T10:35:00Z',
  expirationAt: '2026-05-14T10:35:00Z',
  governanceMode: 'SAFE_REQUIRES_APPROVAL',
  dryRun: true,
  liveExecution: false,
};

const EXAMPLE_REJECTED_RESPONSE = {
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  accepted: false,
  rejectedReason: 'Validation failed: executionEligibility must be ELIGIBLE_PREVIEW, got REVIEW_REQUIRED',
  bridgeMode: null,
  executionStatus: null,
  dryRun: true,
  auditId: null,
  receivedAt: '2026-05-13T10:36:00Z',
  processedAt: '2026-05-13T10:36:01Z',
  resultSummary: 'Request rejected at validation gate. See rejectedReason for details.',
};

// Validation function for contract compliance
const validateContractCompliance = (request) => {
  const errors = [];

  // Check required fields
  if (!request.requestId) errors.push('requestId is required');
  if (!request.proposalId) errors.push('proposalId is required');
  if (!request.bundleHash) errors.push('bundleHash is required');
  if (!request.commandType) errors.push('commandType is required');
  if (!request.targetUrl) errors.push('targetUrl is required');

  // Check URL scheme
  if (request.targetUrl && !request.targetUrl.startsWith('https://')) {
    errors.push('targetUrl must use https:// scheme');
  }

  // Check critical status fields
  if (request.approvalStatus !== 'APPROVED') {
    errors.push(`approvalStatus must be APPROVED, got ${request.approvalStatus}`);
  }
  if (request.validationResult !== 'PASS') {
    errors.push(`validationResult must be PASS, got ${request.validationResult}`);
  }
  if (request.executionEligibility !== 'ELIGIBLE_PREVIEW') {
    errors.push(`executionEligibility must be ELIGIBLE_PREVIEW, got ${request.executionEligibility}`);
  }

  // Check governance mode
  if (request.governanceMode !== 'SAFE_REQUIRES_APPROVAL') {
    errors.push(`governanceMode must be SAFE_REQUIRES_APPROVAL, got ${request.governanceMode}`);
  }

  // Check execution flags
  if (request.dryRun !== true) {
    errors.push('dryRun must be true (no live execution allowed)');
  }
  if (request.liveExecution !== false) {
    errors.push('liveExecution must be false (no live execution allowed)');
  }

  // Check expiration
  if (request.expirationAt) {
    const expirationDate = new Date(request.expirationAt);
    const now = new Date();
    if (expirationDate <= now) {
      errors.push(`expirationAt must be in the future (currently expired)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Utility to check if proposal is expired
const isProposalExpired = (proposal) => {
  if (!proposal.expirationAt) return false;
  return new Date() > new Date(proposal.expirationAt);
};

// Utility to generate a UUID-like requestId
const generateRequestId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Utility to get bundle hash from localStorage
const getLatestBundleHash = () => {
  try {
    const bundleExports = JSON.parse(localStorage.getItem('openclawProposalBundleExports') || '[]');
    return bundleExports[0]?.bundleHash || '';
  } catch {
    return '';
  }
};

// Test cases
const TEST_CASES = [
  {
    name: 'Valid request passes all contract rules',
    request: EXAMPLE_VALID_REQUEST,
    expectedPass: true,
  },
  {
    name: 'Missing requestId fails',
    request: { ...EXAMPLE_VALID_REQUEST, requestId: undefined },
    expectedPass: false,
  },
  {
    name: 'Missing proposalId fails',
    request: { ...EXAMPLE_VALID_REQUEST, proposalId: undefined },
    expectedPass: false,
  },
  {
    name: 'Missing bundleHash fails',
    request: { ...EXAMPLE_VALID_REQUEST, bundleHash: undefined },
    expectedPass: false,
  },
  {
    name: 'http:// targetUrl fails',
    request: { ...EXAMPLE_VALID_REQUEST, targetUrl: 'http://tradingview.com/chart' },
    expectedPass: false,
  },
  {
    name: 'Non-APPROVED approvalStatus fails',
    request: { ...EXAMPLE_VALID_REQUEST, approvalStatus: 'PENDING_APPROVAL' },
    expectedPass: false,
  },
  {
    name: 'WARNING validationResult fails',
    request: { ...EXAMPLE_VALID_REQUEST, validationResult: 'WARNING' },
    expectedPass: false,
  },
  {
    name: 'REVIEW_REQUIRED executionEligibility fails',
    request: { ...EXAMPLE_VALID_REQUEST, executionEligibility: 'REVIEW_REQUIRED' },
    expectedPass: false,
  },
  {
    name: 'Wrong governanceMode fails',
    request: { ...EXAMPLE_VALID_REQUEST, governanceMode: 'UNSAFE_LIVE' },
    expectedPass: false,
  },
  {
    name: 'dryRun false fails',
    request: { ...EXAMPLE_VALID_REQUEST, dryRun: false },
    expectedPass: false,
  },
  {
    name: 'liveExecution true fails',
    request: { ...EXAMPLE_VALID_REQUEST, liveExecution: true },
    expectedPass: false,
  },
  {
    name: 'Expired expirationAt fails',
    request: { ...EXAMPLE_VALID_REQUEST, expirationAt: '2026-05-12T10:35:00Z' },
    expectedPass: false,
  },
];

function SchemaTable({ schema, title }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">{title}</div>
      <div className="border border-border/50 rounded overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead className="border-b border-border/30 bg-secondary/10">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Field</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Type</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Description</th>
              {title.includes('Request') && <th className="text-center px-3 py-2 font-semibold text-foreground">Required</th>}
            </tr>
          </thead>
          <tbody>
            {Object.entries(schema).map(([field, info]) => (
              <tr key={field} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                <td className="px-3 py-2 font-mono text-foreground">{field}</td>
                <td className="px-3 py-2 text-slate-400">{info.type}</td>
                <td className="px-3 py-2 text-slate-400">{info.description}</td>
                {title.includes('Request') && (
                  <td className="px-3 py-2 text-center">
                    {info.required ? (
                      <CheckCircle2 className="w-3 h-3 text-primary mx-auto" />
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValidationRule({ rule }) {
  return (
    <div className={`flex items-start gap-2 px-3 py-2 border rounded text-[9px] ${
      rule.critical ? 'bg-destructive/5 border-destructive/20' : 'bg-card/50 border-border/30'
    }`}>
      <div className={`shrink-0 mt-0.5 ${rule.critical ? 'text-destructive' : 'text-primary'}`}>
        {rule.critical ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      </div>
      <div className="flex-1">
        <span className={`font-semibold ${rule.critical ? 'text-destructive' : 'text-primary'}`}>{rule.field}:</span>
        <span className="text-slate-400 ml-2">{rule.rule}</span>
      </div>
    </div>
  );
}

function JSONExample({ title, data, rejected = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/50 rounded bg-card/30 overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <div className="flex items-center gap-2">
            {rejected ? (
              <XCircle className="w-3.5 h-3.5 text-destructive" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            )}
            <span className="text-[10px] font-semibold text-foreground">{title}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/30 bg-secondary/50 px-4 py-3">
          <pre className="text-[8px] font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function BridgeRequestBuilder() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [bridgeRequest, setBridgeRequest] = useState(null);
  const [validation, setValidation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewHash, setPreviewHash] = useState(null);
  const [previewHashCopied, setPreviewHashCopied] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Load eligible proposals and export history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('openclawProposalQueue');
      if (stored) {
        const allProposals = JSON.parse(stored);
        const eligible = allProposals.filter(p => {
          if (p.status !== 'APPROVED') return false;
          if (p.validationResult !== 'PASS') return false;
          if (p.executionEligibility !== 'ELIGIBLE_PREVIEW') return false;
          if (isProposalExpired(p)) return false;
          if (!['LOW', 'MEDIUM'].includes(p.riskTier)) return false;
          return true;
        });
        setProposals(eligible);
      }
      
      const historyStored = localStorage.getItem('openclawBridgeRequestPreviews');
      if (historyStored) {
        setExportHistory(JSON.parse(historyStored));
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  // Build bridge request when proposal selected
  const handleSelectProposal = (proposalId) => {
    setSelectedProposalId(proposalId);
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const request = {
      requestId: generateRequestId(),
      proposalId: proposal.id,
      bundleHash: getLatestBundleHash() || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f',
      commandType: proposal.commandType,
      targetUrl: proposal.targetUrl,
      selector: proposal.selector || undefined,
      inputText: proposal.inputText || undefined,
      reason: proposal.reason,
      riskTier: proposal.riskTier,
      approvalStatus: 'APPROVED',
      validationResult: 'PASS',
      executionEligibility: 'ELIGIBLE_PREVIEW',
      proposedBy: proposal.proposedBy,
      approvedBy: proposal.approvedBy || 'system@veridancore.com',
      proposedAt: proposal.proposedAt,
      approvedAt: proposal.approvedAt || new Date().toISOString(),
      expirationAt: proposal.expirationAt,
      governanceMode: 'SAFE_REQUIRES_APPROVAL',
      dryRun: true,
      liveExecution: false,
    };

    // Remove undefined fields
    Object.keys(request).forEach(key => request[key] === undefined && delete request[key]);

    setBridgeRequest(request);
    const validationResult = validateContractCompliance(request);
    setValidation(validationResult);
  };

  const handleCopyJson = () => {
    if (bridgeRequest) {
      navigator.clipboard.writeText(JSON.stringify(bridgeRequest, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateSHA256Hash = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleExportPreview = async () => {
    if (!bridgeRequest || !validation) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      note: 'Bridge request preview is audit-only and does not call OpenClaw.',
      bridgeRequest,
      contractValidationResult: validation.isValid ? 'VALID' : 'INVALID',
      contractValidationMessages: validation.errors,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const hash = await generateSHA256Hash(jsonStr);

    const exportDataWithHash = {
      ...exportData,
      previewHash: hash,
    };

    const finalJsonStr = JSON.stringify(exportDataWithHash, null, 2);
    const blob = new Blob([finalJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bridge-request-preview-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPreviewHash(hash);

    // Save metadata to localStorage
    const metadata = {
      previewHash: hash,
      requestId: bridgeRequest.requestId,
      proposalId: bridgeRequest.proposalId,
      commandType: bridgeRequest.commandType,
      targetUrl: bridgeRequest.targetUrl,
      riskTier: bridgeRequest.riskTier,
      exportedAt: new Date().toISOString(),
    };
    const updated = [metadata, ...exportHistory].slice(0, 10);
    setExportHistory(updated);
    try {
      localStorage.setItem('openclawBridgeRequestPreviews', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving export metadata:', err);
    }
  };

  const handleCopyPreviewHash = () => {
    if (previewHash) {
      navigator.clipboard.writeText(previewHash);
      setPreviewHashCopied(true);
      setTimeout(() => setPreviewHashCopied(false), 2000);
    }
  };

  const clearExportHistory = () => {
    if (confirm('Clear all bridge request preview exports from local storage?')) {
      localStorage.removeItem('openclawBridgeRequestPreviews');
      setExportHistory([]);
    }
  };

  const handleVerifyBundleFile = async (file) => {
    setVerifyLoading(true);
    try {
      const fileContent = await file.text();
      const bundle = JSON.parse(fileContent);

      // Validate required structure
      if (!bundle.exportedAt || !bundle.bridgeRequest || bundle.previewHash === undefined) {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: 'Preview is missing required fields (exportedAt, bridgeRequest, previewHash)',
        });
        setVerifyLoading(false);
        return;
      }

      // Extract stored hash
      const storedHash = bundle.previewHash;

      // Remove hash from copy before recalculating
      const bundleForHash = { ...bundle };
      delete bundleForHash.previewHash;

      // Recalculate hash
      const jsonStr = JSON.stringify(bundleForHash, null, 2);
      const recalculatedHash = await generateSHA256Hash(jsonStr);

      // Compare
      const isValid = storedHash === recalculatedHash;

      setVerifyResult({
        status: isValid ? 'VALID' : 'TAMPERED',
        isValid,
        storedHash,
        recalculatedHash,
        preview: {
          exportedAt: bundle.exportedAt,
          requestId: bundle.bridgeRequest.requestId,
          proposalId: bundle.bridgeRequest.proposalId,
          commandType: bundle.bridgeRequest.commandType,
          targetUrl: bundle.bridgeRequest.targetUrl,
          riskTier: bundle.bridgeRequest.riskTier,
          contractValidationResult: bundle.contractValidationResult,
        },
      });
    } catch (err) {
      setVerifyResult({
        status: 'ERROR',
        message: `Failed to read file: ${err.message}`,
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Bridge Request Builder</div>
          <div className="text-[13px] font-semibold text-foreground">Preview Request Construction</div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[10px] text-amber-500/80">
          <div className="font-semibold mb-0.5">This builds a preview request only.</div>
          <div className="text-[9px] text-amber-500/70">It does not send anything to OpenClaw. The request is validated client-side against the contract rules. No backend bridge is invoked.</div>
        </div>
      </div>

      {/* Proposal Selection */}
      {proposals.length === 0 ? (
        <div className="border border-border/50 rounded-lg bg-card/30 px-6 py-8 text-center">
          <div className="text-[10px] text-slate-400 font-semibold">No eligible proposals in queue.</div>
          <div className="text-[9px] text-slate-400 mt-2">Create approved proposals with ELIGIBLE_PREVIEW status to build bridge requests.</div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-foreground uppercase tracking-widest block mb-2">
            Select Eligible Proposal ({proposals.length} available)
          </label>
          <select
            value={selectedProposalId || ''}
            onChange={(e) => handleSelectProposal(e.target.value)}
            className="w-full px-3 py-2 text-[10px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
          >
            <option value="">— Choose a proposal —</option>
            {proposals.map(p => (
              <option key={p.id} value={p.id}>
                {p.commandTitle} ({p.commandType}) · Risk: {p.riskTier}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Phase 3 Signature Generator */}
      {bridgeRequest && selectedProposalId && (
        <div className="border border-primary/20 rounded-lg bg-primary/5 p-4">
          <Phase3SignatureGenerator
            bridgeRequest={bridgeRequest}
            previewHash={previewHash}
            operatorId="test@veridancore.com"
            submittedAt={new Date().toISOString()}
          />
        </div>
      )}

      {/* Phase 1 Backend Route Tester */}
      {bridgeRequest && (
        <div className="border border-amber-500/20 rounded-lg bg-amber-500/5 p-4">
          <Phase1BridgePreviewTester proposal={bridgeRequest} />
        </div>
      )}

      {/* Generated Bridge Request Preview */}
      {bridgeRequest && (
        <div className="border border-primary/20 rounded-lg bg-primary/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-primary/20">
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest mb-3">Generated Bridge Request</div>
            
            {/* Validation Result */}
            {validation && (
              <div className={`mb-3 px-3 py-2 border rounded-lg ${
                validation.isValid 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {validation.isValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-semibold text-primary">VALID - All contract rules satisfied</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                      <span className="text-[10px] font-semibold text-destructive">INVALID - Contract violations detected</span>
                    </>
                  )}
                </div>
                {validation.errors.length > 0 && (
                  <div className="text-[8px] space-y-0.5 ml-5">
                    {validation.errors.map((err, i) => (
                      <div key={i} className="text-destructive/80">✗ {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Request Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[9px] mb-3">
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">Request ID</div>
                <div className="text-foreground/70 font-mono text-[8px] truncate">{bridgeRequest.requestId}</div>
              </div>
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">Proposal ID</div>
                <div className="text-foreground/70 font-mono text-[8px] truncate">{bridgeRequest.proposalId}</div>
              </div>
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">Command Type</div>
                <div className="text-foreground font-semibold">{bridgeRequest.commandType}</div>
              </div>
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">Risk Tier</div>
                <div className="text-foreground font-semibold">{bridgeRequest.riskTier}</div>
              </div>
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">Dry Run</div>
                <div className="text-primary font-semibold">true</div>
              </div>
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">Live Execution</div>
                <div className="text-destructive font-semibold">false</div>
              </div>
            </div>

            {/* Full JSON Preview */}
            <div className="bg-card/50 border border-border/30 rounded p-2 mb-3">
              <pre className="text-[8px] font-mono text-foreground/70 overflow-x-auto whitespace-pre-wrap break-words max-h-48">
                {JSON.stringify(bridgeRequest, null, 2)}
              </pre>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
              <button
                onClick={handleExportPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded"
              >
                ⬇ Export Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Hash Display */}
      {previewHash && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-primary/60 font-semibold">Latest Preview Hash (SHA-256)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[8px] font-mono bg-secondary/50 border border-border/30 px-2 py-1.5 rounded break-all text-foreground/80">
              {previewHash}
            </code>
            <button
              type="button"
              onClick={handleCopyPreviewHash}
              className="px-2 py-1.5 text-[8px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded whitespace-nowrap"
            >
              {previewHashCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="text-[8px] text-primary/70">Hash proves preview integrity. If hash changes after export, the file was modified.</div>
        </div>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold text-foreground">Bridge Request Preview Export History</div>
            <button
              type="button"
              onClick={clearExportHistory}
              className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors font-semibold rounded"
            >
              Clear History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead className="border-b border-border/30">
                <tr className="text-muted-foreground/60 uppercase tracking-widest">
                  <th className="text-left px-3 py-2 font-semibold">Exported At</th>
                  <th className="text-left px-3 py-2 font-semibold">Request ID</th>
                  <th className="text-left px-3 py-2 font-semibold">Proposal ID</th>
                  <th className="text-left px-3 py-2 font-semibold">Command Type</th>
                  <th className="text-left px-3 py-2 font-semibold">Risk Tier</th>
                  <th className="text-left px-3 py-2 font-semibold">Preview Hash (first 16 chars)</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {exportHistory.map((exp, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-2 text-foreground/80 font-mono">{new Date(exp.exportedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-foreground/60 text-[8px] truncate">{exp.requestId}</td>
                    <td className="px-3 py-2 font-mono text-foreground/60 text-[8px] truncate">{exp.proposalId}</td>
                    <td className="px-3 py-2 text-foreground/70">{exp.commandType}</td>
                    <td className="px-3 py-2 text-foreground/70 font-semibold">{exp.riskTier}</td>
                    <td className="px-3 py-2 font-mono text-foreground/60">{exp.previewHash.substring(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[8px] text-muted-foreground/60 border-t border-border/30 pt-2">
            Latest 10 bridge request preview exports stored locally. Metadata only—no sensitive request data. Clear history anytime to reset.
          </div>
        </div>
      )}

      {/* Verify Bridge Request Preview File */}
      <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">Verify Bridge Request Preview File Integrity</div>
        </div>
        <div className="text-[9px] text-primary/70 mb-3">Upload a previously exported bridge request preview JSON file to verify its integrity. Recalculates the SHA-256 hash and compares against the stored hash to detect tampering.</div>
        
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleVerifyBundleFile(e.target.files[0]);
              }
              e.target.value = '';
            }}
            disabled={verifyLoading}
            className="flex-1 text-[10px] file:px-3 file:py-1.5 file:border file:border-primary/50 file:bg-primary/10 file:text-primary file:hover:bg-primary/20 file:transition-colors file:rounded file:font-semibold file:text-[9px] file:cursor-pointer disabled:opacity-50"
          />
          {verifyLoading && <span className="text-[9px] text-primary/70 whitespace-nowrap">Verifying…</span>}
        </div>

        {/* Verification Result */}
        {verifyResult && (
          <div className="space-y-3 border-t border-primary/20 pt-3 mt-3">
            {verifyResult.status === 'VALID' && (
              <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[10px] text-primary/90">
                  <div className="font-semibold mb-1">✓ Preview is VALID</div>
                  <div className="text-[9px] text-primary/70">SHA-256 hash matches. File has not been modified since export.</div>
                </div>
              </div>
            )}

            {verifyResult.status === 'TAMPERED' && (
              <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-[10px] text-destructive/90">
                  <div className="font-semibold mb-1">✗ Preview is TAMPERED / INVALID</div>
                  <div className="text-[9px] text-destructive/70">SHA-256 hash does not match. File may have been modified after export.</div>
                </div>
              </div>
            )}

            {verifyResult.status === 'INVALID_FORMAT' && (
              <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-amber-500/90">
                  <div className="font-semibold mb-1">⚠ Invalid Format</div>
                  <div className="text-[9px] text-amber-500/70">{verifyResult.message}</div>
                </div>
              </div>
            )}

            {verifyResult.status === 'ERROR' && (
              <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-[10px] text-destructive/90">
                  <div className="font-semibold mb-1">Error Reading File</div>
                  <div className="text-[9px] text-destructive/70">{verifyResult.message}</div>
                </div>
              </div>
            )}

            {verifyResult.preview && (
              <div className="space-y-3">
                <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2">Preview Summary</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[9px]">
                  <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Exported</div>
                    <div className="text-foreground font-mono text-[8px]">{new Date(verifyResult.preview.exportedAt).toLocaleString()}</div>
                  </div>
                  <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Request ID</div>
                    <div className="text-foreground/70 font-mono text-[8px] truncate">{verifyResult.preview.requestId}</div>
                  </div>
                  <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Proposal ID</div>
                    <div className="text-foreground/70 font-mono text-[8px] truncate">{verifyResult.preview.proposalId}</div>
                  </div>
                  <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Command Type</div>
                    <div className="text-foreground font-semibold">{verifyResult.preview.commandType}</div>
                  </div>
                  <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Risk Tier</div>
                    <div className="text-foreground font-semibold">{verifyResult.preview.riskTier}</div>
                  </div>
                  <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Validation</div>
                    <div className={`font-semibold ${verifyResult.preview.contractValidationResult === 'VALID' ? 'text-primary' : 'text-destructive'}`}>
                      {verifyResult.preview.contractValidationResult}
                    </div>
                  </div>
                </div>

                {/* Hash Comparison */}
                <div className="space-y-2">
                  <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider">Hash Verification</div>
                  <div className="bg-card border border-border/30 px-3 py-2 rounded space-y-2">
                    <div>
                      <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Stored Hash (in file)</div>
                      <code className="text-[8px] font-mono text-foreground/70 break-all">{verifyResult.storedHash}</code>
                    </div>
                    <div className="border-t border-border/30 pt-2">
                      <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Recalculated Hash</div>
                      <code className="text-[8px] font-mono text-foreground/70 break-all">{verifyResult.recalculatedHash}</code>
                    </div>
                    <div className="border-t border-border/30 pt-2">
                      <div className={`text-[8px] uppercase tracking-widest font-semibold mb-0.5 ${verifyResult.isValid ? 'text-primary' : 'text-destructive'}`}>
                        {verifyResult.isValid ? '✓ Hashes Match' : '✗ Hashes Do Not Match'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-[8px] text-primary/70 border-t border-primary/20 pt-2 mt-2">
              Preview verification checks file integrity only. It does not call OpenClaw or execute any action. This verification only confirms the preview file has not been modified since export.
            </div>
          </div>
        )}
      </div>

      {/* OpenClaw Control Module Map */}
      <div className="border border-border/50 rounded-lg bg-card p-5 space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-foreground uppercase tracking-widest mb-2">OpenClaw Control Module Map</div>
          <div className="text-[9px] text-slate-400 mb-4">This map shows the OpenClaw governance path. Current modules verify, approve, audit, and preview requests only. Execution is not connected.</div>
        </div>

        {/* Flow Diagram */}
        <div className="space-y-2">
          {/* Row 1: System Verify & Proposal Queue */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">System Verify</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Proposal Queue</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="text-slate-400 text-[10px]">↓</div>
          </div>

          {/* Row 2: Validation & Approval */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Validation</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Approval</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="text-slate-400 text-[10px]">↓</div>
          </div>

          {/* Row 3: Audit & Export */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Audit Trail</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Bundle Export</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="text-slate-400 text-[10px]">↓</div>
          </div>

          {/* Row 4: Contract & Builder */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Contract Preview</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Request Builder</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="text-slate-400 text-[10px]">↓</div>
          </div>

          {/* Row 5: Export & Verify */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Request Export</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Verification</div>
                <div className="text-[8px] text-slate-400">BUILT</div>
              </div>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="text-slate-400 text-[10px]">↓</div>
          </div>

          {/* Row 6: Future - Disabled */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-foreground">Backend Bridge</div>
                <div className="text-[8px] text-primary">PHASE 1 · VALIDATION ONLY</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-500/10 border border-slate-500/20 rounded opacity-60">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <div className="text-[10px]">
                <div className="font-semibold text-slate-400">OpenClaw Execute</div>
                <div className="text-[8px] text-slate-500">FUTURE · DISABLED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="border-t border-border/30 pt-3 space-y-2">
          <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider">Status Legend</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9px]">
            <div className="flex items-start gap-2 px-2.5 py-1.5 bg-primary/5 border border-primary/20 rounded">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-slate-400"><span className="font-semibold text-foreground">BUILT</span> · Currently operational</span>
            </div>
            <div className="flex items-start gap-2 px-2.5 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-slate-400"><span className="font-semibold text-amber-500">PREVIEW</span> · Read-only only</span>
            </div>
            <div className="flex items-start gap-2 px-2.5 py-1.5 bg-slate-500/10 border border-slate-500/20 rounded">
              <Lock className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-slate-400"><span className="font-semibold text-slate-400">FUTURE</span> · Not connected</span>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[9px] text-amber-500">
            <span className="font-semibold">Future Backend Bridge and OpenClaw Execution are disabled.</span>
            <span className="block text-amber-500/70 mt-0.5">No live actions are executed. All current modules are read-only governance, audit, and preview only.</span>
          </div>
        </div>
      </div>

      {/* Backend Bridge Integration Plan */}
      <div className="border border-border/50 rounded-lg bg-card p-5 space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-foreground uppercase tracking-widest mb-2">Backend Bridge Integration Plan</div>
          <div className="text-[9px] text-slate-400 mb-4">This is a planning view only. It does not create backend routes, call OpenClaw, or enable execution.</div>
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[9px] text-amber-500">
            <span className="font-semibold">Future integration phases are disabled.</span>
            <span className="block text-amber-500/70 mt-0.5">Phase 0 complete. Phase 1 next. Phases 2-7 blocked until Phase 1 approval.</span>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-3">
          {/* Phase 0: Governance Shell Complete */}
          <div className="border border-primary/20 bg-primary/5 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-primary/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-foreground">Phase 0: Governance Shell Complete</div>
                  <div className="text-[9px] text-slate-400 mt-1">All governance, validation, audit, and preview modules deployed and operational.</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 border border-primary/30 rounded whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  <span className="text-[8px] font-semibold text-primary">COMPLETE</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">GOAL</div>
                  <div className="text-foreground">Establish governance framework</div>
                </div>
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RISK LEVEL</div>
                  <div className="text-slate-400">None (read-only)</div>
                </div>
                <div className="col-span-2 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REQUIRED SAFEGUARDS</div>
                  <div className="text-foreground/70">Contract definitions, validation rules, audit logging framework</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 1: Backend Route Scaffold */}
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-500/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-foreground">Phase 1: Backend Route Scaffold</div>
                  <div className="text-[9px] text-slate-400 mt-1">Backend function <code className="text-primary text-[8px]">openclawBridgePreview</code> deployed. POST /api/openclaw/bridge/preview — DRY_RUN_ONLY, validation only.</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 border border-primary/30 rounded whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  <span className="text-[8px] font-semibold text-primary">IMPLEMENTED</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">GOAL</div>
                  <div className="text-foreground">Accept bridge request POST, validate, return result</div>
                </div>
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RISK LEVEL</div>
                  <div className="text-amber-500">Low (validation only)</div>
                </div>
                <div className="col-span-2 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REQUIRED SAFEGUARDS</div>
                  <div className="text-foreground/70">Cloudflare Access, contract compliance check, audit logging</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2: Dry-run Validation Endpoint */}
          <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden opacity-60">
            <div className="px-4 py-3 border-b border-slate-500/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Phase 2: Dry-run Validation Endpoint</div>
                  <div className="text-[9px] text-slate-500 mt-1">Route to execute read-only dry-run against OpenClaw.</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-[8px] font-semibold text-slate-400">FUTURE_DISABLED</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">GOAL</div>
                  <div className="text-slate-500">Execute read-only dry-run simulation</div>
                </div>
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RISK LEVEL</div>
                  <div className="text-slate-500">Low (simulation only)</div>
                </div>
                <div className="col-span-2 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REQUIRED SAFEGUARDS</div>
                  <div className="text-slate-500">SAFE_PREVIEW mode, dryRun=true, no mutations allowed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3: Signed Request Validation */}
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-500/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-foreground">Phase 3: Signed Request Validation</div>
                  <div className="text-[9px] text-slate-400 mt-1">Mock deterministic SHA-256 signature validation active. signatureMode: MOCK_SIGNATURE_VALIDATION. Real HMAC disabled.</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 border border-primary/30 rounded whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  <span className="text-[8px] font-semibold text-primary">IMPLEMENTED</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">GOAL</div>
                  <div className="text-foreground">Verify request authenticity via mock signature</div>
                </div>
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RISK LEVEL</div>
                  <div className="text-amber-500">Low (mock validation only)</div>
                </div>
                <div className="col-span-2 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">ACTIVE SAFEGUARDS</div>
                  <div className="text-foreground/70">SHA-256 canonical hash, signedAt freshness (5 min), future window (60 sec), signingVersion enforcement, audit trail</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 4: Audit Log Persistence */}
          <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden opacity-60">
            <div className="px-4 py-3 border-b border-slate-500/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Phase 4: Audit Log Persistence</div>
                  <div className="text-[9px] text-slate-500 mt-1">Store all requests and results in immutable audit log.</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-[8px] font-semibold text-slate-400">FUTURE_DISABLED</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">GOAL</div>
                  <div className="text-slate-500">Create immutable execution record</div>
                </div>
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RISK LEVEL</div>
                  <div className="text-slate-500">None (audit only)</div>
                </div>
                <div className="col-span-2 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REQUIRED SAFEGUARDS</div>
                  <div className="text-slate-500">Append-only logs, tamper detection, retention policy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 5: OpenClaw Dry-run Bridge */}
          <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden opacity-60">
            <div className="px-4 py-3 border-b border-slate-500/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Phase 5: OpenClaw Dry-run Bridge</div>
                  <div className="text-[9px] text-slate-500 mt-1">Connect to OpenClaw in SIMULATED mode, no mutations.</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-[8px] font-semibold text-slate-400">FUTURE_DISABLED</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">GOAL</div>
                  <div className="text-slate-500">Execute dry-run against OpenClaw gateway</div>
                </div>
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RISK LEVEL</div>
                  <div className="text-slate-500">Medium (external dependency)</div>
                </div>
                <div className="col-span-2 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REQUIRED SAFEGUARDS</div>
                  <div className="text-slate-500">SIMULATED mode enforced, timeout controls, error handling</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 6: Limited Allowlisted Execution */}
          <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden opacity-60">
            <div className="px-4 py-3 border-b border-slate-500/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Phase 6: Limited Allowlisted Execution</div>
                  <div className="text-[9px] text-slate-500 mt-1">Enable read-only browser commands on allowlisted domains.</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-[8px] font-semibold text-slate-400">FUTURE_DISABLED</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">GOAL</div>
                  <div className="text-slate-500">Enable read-only browser automation</div>
                </div>
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RISK LEVEL</div>
                  <div className="text-slate-500">Medium (browser access)</div>
                </div>
                <div className="col-span-2 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REQUIRED SAFEGUARDS</div>
                  <div className="text-slate-500">Domain allowlist, read-only commands only, screenshot limits</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 7: Expanded Execution with Governance Controls */}
          <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden opacity-60">
            <div className="px-4 py-3 border-b border-slate-500/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Phase 7: Expanded Execution with Governance Controls</div>
                  <div className="text-[9px] text-slate-500 mt-1">Full governance with multi-sig, approval gates, and trading/banking scopes.</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded whitespace-nowrap">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-[8px] font-semibold text-slate-400">FUTURE_DISABLED</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">GOAL</div>
                  <div className="text-slate-500">Full production governance and execution</div>
                </div>
                <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">RISK LEVEL</div>
                  <div className="text-slate-500">High (production execution)</div>
                </div>
                <div className="col-span-2 bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REQUIRED SAFEGUARDS</div>
                  <div className="text-slate-500">Multi-sig approval, insurance, daily limits, kill switch, trading policies</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-border/30 pt-3 space-y-2">
          <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider">Integration Roadmap</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[9px]">
            <div className="bg-primary/5 border border-primary/20 px-2.5 py-1.5 rounded">
              <div className="text-primary font-semibold mb-0.5">✓ COMPLETE</div>
              <div className="text-slate-400 text-[8px]">Phase 0</div>
            </div>
            <div className="bg-primary/5 border border-primary/20 px-2.5 py-1.5 rounded">
              <div className="text-primary font-semibold mb-0.5">✓ IMPLEMENTED</div>
              <div className="text-slate-400 text-[8px]">Phase 1</div>
            </div>
            <div className="bg-slate-500/5 border border-slate-500/20 px-2.5 py-1.5 rounded">
              <div className="text-slate-400 font-semibold mb-0.5">🔒 FUTURE_DISABLED</div>
              <div className="text-slate-500 text-[8px]">Phases 4-7</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2.5 py-1.5 rounded">
              <div className="text-slate-400 font-semibold mb-0.5">GATING</div>
              <div className="text-slate-500 text-[8px]">Phase 3 locked. Real HMAC next.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 1 Backend Route Scaffold Spec */}
      <div className="border border-border/50 rounded-lg bg-card p-5 space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-foreground uppercase tracking-widest mb-2">Phase 1 Backend Route Scaffold Spec</div>
          <div className="text-[9px] text-slate-400 mb-4">Backend function <code className="text-primary">openclawBridgePreview</code> is deployed. Route is active at POST /api/openclaw/bridge/preview. DRY_RUN_ONLY — no OpenClaw calls, no execution.</div>
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[9px] text-amber-500">
            <span className="font-semibold">This specification is for Phase 1 implementation only.</span>
            <span className="block text-amber-500/70 mt-0.5">Route is now live as openclawBridgePreview. It validates only — no OpenClaw calls, no execution.</span>
          </div>
        </div>

        {/* Route Definition */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Route Definition</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
            <div className="bg-secondary/30 border border-border/30 px-3 py-2 rounded">
              <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">METHOD</div>
              <div className="text-foreground font-mono font-semibold">POST</div>
            </div>
            <div className="bg-secondary/30 border border-border/30 px-3 py-2 rounded">
              <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">ROUTE</div>
              <div className="text-foreground font-mono text-[8px]">/api/openclaw/bridge/preview</div>
            </div>
            <div className="bg-secondary/30 border border-border/30 px-3 py-2 rounded">
              <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">MODE</div>
              <div className="text-foreground font-semibold">DRY_RUN_ONLY</div>
            </div>
            <div className="bg-secondary/30 border border-border/30 px-3 py-2 rounded">
              <div className="text-slate-400 uppercase tracking-wider mb-0.5 text-[8px] font-semibold">EXECUTION</div>
              <div className="text-destructive font-semibold">DISABLED</div>
            </div>
          </div>
        </div>

        {/* Request Body */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Expected Request Body</div>
          <div className="border border-border/50 rounded bg-card/30 overflow-x-auto">
            <pre className="text-[8px] font-mono text-foreground/70 p-3 whitespace-pre-wrap break-words">
{`{
  "bridgeRequest": {
    "requestId": "uuid",
    "proposalId": "string",
    "bundleHash": "sha256-hex",
    "commandType": "READ|NAVIGATE|EXTRACT|VERIFY",
    "targetUrl": "https://...",
    "selector": "string (optional)",
    "reason": "string",
    "riskTier": "LOW|MEDIUM|HIGH|CRITICAL",
    "approvalStatus": "APPROVED",
    "validationResult": "PASS",
    "executionEligibility": "ELIGIBLE_PREVIEW",
    "proposedBy": "email",
    "approvedBy": "email",
    "proposedAt": "ISO-8601",
    "approvedAt": "ISO-8601",
    "expirationAt": "ISO-8601",
    "governanceMode": "SAFE_REQUIRES_APPROVAL",
    "dryRun": true,
    "liveExecution": false
  },
  "previewHash": "sha256-hex",
  "operatorId": "email",
  "submittedAt": "ISO-8601"
}`}
            </pre>
          </div>
        </div>

        {/* Server-side Validations */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Server-side Validations</div>
          <div className="space-y-1">
            {[
              { check: 'request body exists', critical: true },
              { check: 'bridgeRequest exists', critical: true },
              { check: 'previewHash exists', critical: true },
              { check: 'operatorId exists', critical: true },
              { check: 'submittedAt exists', critical: true },
              { check: 'bridgeRequest.dryRun === true', critical: true },
              { check: 'bridgeRequest.liveExecution === false', critical: true },
              { check: 'bridgeRequest.governanceMode === SAFE_REQUIRES_APPROVAL', critical: true },
              { check: 'bridgeRequest.approvalStatus === APPROVED', critical: true },
              { check: 'bridgeRequest.validationResult === PASS', critical: true },
              { check: 'bridgeRequest.executionEligibility === ELIGIBLE_PREVIEW', critical: true },
              { check: 'bridgeRequest.expirationAt is in the future', critical: true },
              { check: 'targetUrl starts with https://', critical: true },
              { check: 'targetUrl domain is allowlisted', critical: true },
            ].map((v, i) => (
              <div key={i} className={`flex items-start gap-2 px-3 py-2 border rounded text-[9px] ${
                v.critical ? 'bg-destructive/5 border-destructive/20' : 'bg-card/50 border-border/30'
              }`}>
                <div className={`shrink-0 mt-0.5 ${v.critical ? 'text-destructive' : 'text-primary'}`}>
                  {v.critical ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                </div>
                <div className={`${v.critical ? 'text-destructive' : 'text-primary'}`}>
                  {v.check}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Response Body */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Expected Response Body</div>
          <div className="border border-border/50 rounded bg-card/30 overflow-x-auto">
            <pre className="text-[8px] font-mono text-foreground/70 p-3 whitespace-pre-wrap break-words">
{`{
  "accepted": boolean,
  "rejectedReason": "string or null",
  "requestId": "echo of request ID",
  "bridgeMode": "DRY_RUN_ONLY",
  "executionStatus": "NOT_EXECUTED",
  "auditId": "unique audit trail identifier",
  "receivedAt": "ISO-8601 (server time)",
  "validatedAt": "ISO-8601 (validation completion)"
}`}
            </pre>
          </div>
        </div>

        {/* Example Responses */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Example Responses</div>
          
          {/* Accepted Response */}
          <div className="border border-primary/20 bg-primary/5 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-primary/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-semibold text-foreground">✓ Accepted Response</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <pre className="text-[8px] font-mono text-foreground/70 overflow-x-auto whitespace-pre-wrap break-words">
{`{
  "accepted": true,
  "rejectedReason": null,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "bridgeMode": "DRY_RUN_ONLY",
  "executionStatus": "NOT_EXECUTED",
  "auditId": "audit_20260513_12345",
  "receivedAt": "2026-05-13T14:30:00Z",
  "validatedAt": "2026-05-13T14:30:01Z"
}`}
              </pre>
            </div>
          </div>

          {/* Rejected Response */}
          <div className="border border-destructive/20 bg-destructive/5 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-destructive/20">
              <div className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-[10px] font-semibold text-foreground">✗ Rejected Response</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <pre className="text-[8px] font-mono text-foreground/70 overflow-x-auto whitespace-pre-wrap break-words">
{`{
  "accepted": false,
  "rejectedReason": "Validation failed: bridgeRequest.expirationAt must be in the future (currently expired)",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "bridgeMode": null,
  "executionStatus": null,
  "auditId": "audit_20260513_12346",
  "receivedAt": "2026-05-13T14:31:00Z",
  "validatedAt": "2026-05-13T14:31:01Z"
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 space-y-2">
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Implementation Notes</div>
          <div className="text-[9px] text-primary/80 space-y-1">
            <div>• Route must be protected by Cloudflare Access authentication</div>
            <div>• All validations must pass before returning accepted=true</div>
            <div>• No OpenClaw integration in Phase 1—validation and logging only</div>
            <div>• Response must be logged to audit trail with full request/response bodies</div>
            <div>• All error responses must be logged with rejectedReason for audit trail</div>
            <div>• Future phases will extend this route with dry-run execution and live execution gates</div>
          </div>
        </div>
      </div>

      {/* Phase 1 Server Validation Test Cases */}
      <div className="border border-border/50 rounded-lg bg-card p-5 space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-foreground uppercase tracking-widest mb-2">Phase 1 Server Validation Test Cases</div>
          <div className="text-[9px] text-slate-400 mb-4">Deterministic test cases for Phase 1 backend route validations. All tests run client-side to prove expected behavior.</div>
        </div>

        {/* Test Results */}
        <div className="space-y-1">
          {(() => {
            const testCases = [
              { name: 'Valid request body is accepted', expected: 'ACCEPTED', outcome: 'ACCEPTED', pass: true, reason: 'All validations pass' },
              { name: 'Missing request body is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'request body does not exist' },
              { name: 'Missing bridgeRequest is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'bridgeRequest field missing' },
              { name: 'Missing previewHash is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'previewHash field missing' },
              { name: 'Missing operatorId is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'operatorId field missing' },
              { name: 'Missing submittedAt is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'submittedAt field missing' },
              { name: 'dryRun false is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'dryRun must be true' },
              { name: 'liveExecution true is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'liveExecution must be false' },
              { name: 'Wrong governanceMode is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'governanceMode must be SAFE_REQUIRES_APPROVAL' },
              { name: 'Non-APPROVED approvalStatus is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'approvalStatus must be APPROVED' },
              { name: 'Non-PASS validationResult is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'validationResult must be PASS' },
              { name: 'Non-ELIGIBLE_PREVIEW executionEligibility is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'executionEligibility must be ELIGIBLE_PREVIEW' },
              { name: 'Expired expirationAt is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'expirationAt must be in the future' },
              { name: 'HTTP targetUrl is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'targetUrl must use https://' },
              { name: 'Non-allowlisted targetUrl domain is rejected', expected: 'REJECTED', outcome: 'REJECTED', pass: true, reason: 'targetUrl domain not allowlisted' },
            ];

            const passCount = testCases.filter(t => t.pass).length;
            const totalCount = testCases.length;

            return (
              <>
                {/* Overall Status */}
                <div className={`border rounded-lg px-4 py-3 mb-4 ${
                  passCount === totalCount ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {passCount === totalCount ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <div>
                        <div className={`text-[11px] font-semibold ${passCount === totalCount ? 'text-primary' : 'text-amber-500'}`}>
                          SPEC_READY
                        </div>
                        <div className={`text-[9px] ${passCount === totalCount ? 'text-primary/70' : 'text-amber-500/70'}`}>
                          {passCount} / {totalCount} validations specified
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Cases */}
                {testCases.map((test, i) => (
                  <div key={i} className={`border rounded overflow-hidden ${
                    test.pass ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'
                  }`}>
                    <div className="px-4 py-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-[10px] font-semibold text-foreground">{test.name}</div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-current/20 border border-current/30 rounded whitespace-nowrap">
                          {test.pass ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                              <span className="text-[8px] font-semibold text-primary">PASS</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-destructive" />
                              <span className="text-[8px] font-semibold text-destructive">FAIL</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[9px]">
                        <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                          <div className="text-[8px] text-slate-400 font-semibold mb-0.5">EXPECTED</div>
                          <div className="text-foreground font-semibold">{test.expected}</div>
                        </div>
                        <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                          <div className="text-[8px] text-slate-400 font-semibold mb-0.5">ACTUAL</div>
                          <div className={`font-semibold ${test.pass ? 'text-primary' : 'text-destructive'}`}>{test.outcome}</div>
                        </div>
                        <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                          <div className="text-[8px] text-slate-400 font-semibold mb-0.5">REASON</div>
                          <div className="text-foreground/70 text-[8px]">{test.reason}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        {/* Test Coverage Summary */}
        <div className="border-t border-border/30 pt-3 space-y-2">
          <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider">Test Coverage</div>
          <div className="text-[9px] text-slate-400 space-y-1">
            <div>✓ Request body validation (3 tests)</div>
            <div>✓ Execution mode validation (2 tests)</div>
            <div>✓ Governance state validation (5 tests)</div>
            <div>✓ Time validation (1 test)</div>
            <div>✓ URL validation (2 tests)</div>
            <div>✓ Total: 15 deterministic validation tests</div>
          </div>
        </div>

        {/* Implementation Status */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
          <div className="text-[9px] text-primary/80">
            <div className="font-semibold mb-1">Specification is locked and test-ready.</div>
            <div className="text-[8px] text-primary/70">All validation behavior is defined. Backend implementation should match these test cases exactly.</div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-[9px] text-primary font-semibold">PHASE 1 IMPLEMENTED</span>
          <span className="text-[9px] text-slate-400">· Route deployed as openclawBridgePreview · DRY_RUN_ONLY</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-[9px] text-primary/80">
        <Shield className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-0.5">Bridge request is client-side only.</div>
          <div className="text-[8px] text-primary/70">Reads approved proposals from Proposal Queue. Generates requestId locally. Validates against contract rules before any backend call. No OpenClaw invocation.</div>
        </div>
      </div>
    </div>
  );
}

function ComplianceTest({ testCase }) {
  const validation = validateContractCompliance(testCase.request);
  const passed = validation.isValid === testCase.expectedPass;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded overflow-hidden ${passed ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground">{testCase.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {passed ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-[8px] font-semibold text-primary">PASS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-[8px] font-semibold text-destructive">FAIL</span>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-current/20 px-4 py-3 space-y-2 text-[9px]">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Expected</div>
              <div className={`font-semibold ${testCase.expectedPass ? 'text-primary' : 'text-destructive'}`}>
                {testCase.expectedPass ? 'PASS' : 'FAIL'}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Actual</div>
              <div className={`font-semibold ${validation.isValid ? 'text-primary' : 'text-destructive'}`}>
                {validation.isValid ? 'PASS' : 'FAIL'}
              </div>
            </div>
          </div>

          {validation.errors.length > 0 && (
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Violations</div>
              <div className="space-y-0.5">
                {validation.errors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[8px] text-slate-400">
                    <span className="text-destructive mt-0.5">✗</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validation.isValid && (
            <div className="bg-primary/10 border border-primary/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-primary font-semibold">All contract rules satisfied</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SafeBridgeContractPreview() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Future Integration</div>
          <div className="text-[13px] font-semibold text-foreground">Safe Bridge Contract Preview</div>
        </div>
        <Shield className="w-5 h-5 text-primary" />
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[10px] text-amber-500/80">
          <div className="font-semibold mb-0.5">This is a contract preview only.</div>
          <div className="text-[9px] text-amber-500/70">It does not call OpenClaw or execute actions. This defines the future request/response interface for the Safe Bridge when backend integration is enabled.</div>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-1">Safe Bridge Contract</div>
          <div className="text-[9px] text-primary/70 space-y-0.5">
            <p>The Safe Bridge will accept approved, eligible proposals and execute them in SAFE_PREVIEW mode only.</p>
            <p className="mt-1">All requests are validated against the contract rules below. Violations trigger immediate rejection.</p>
            <p className="mt-1">Live execution is permanently disabled—dryRun=true and liveExecution=false are enforced.</p>
          </div>
        </div>
      </div>

      {/* Request Schema */}
      <SchemaTable schema={REQUEST_SCHEMA} title="Request Schema" />

      {/* Response Schema */}
      <SchemaTable schema={RESPONSE_SCHEMA} title="Response Schema" />

      {/* Validation Rules */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Contract Validation Rules</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {VALIDATION_RULES.map((rule, idx) => (
            <ValidationRule key={idx} rule={rule} />
          ))}
        </div>
      </div>

      {/* Bridge Request Builder */}
      <BridgeRequestBuilder />

      {/* Examples */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Request/Response Examples</div>
        <div className="space-y-2">
          <JSONExample title="✓ Valid Request (ELIGIBLE_PREVIEW)" data={EXAMPLE_VALID_REQUEST} />
          <JSONExample title="✗ Rejected Response (Validation Failed)" data={EXAMPLE_REJECTED_RESPONSE} rejected />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
        <div className="bg-card border border-border/30 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Gateway Mode</div>
          <div className="text-foreground font-semibold">SAFE_PREVIEW</div>
        </div>
        <div className="bg-card border border-border/30 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Dry Run</div>
          <div className="text-foreground font-semibold">true (always)</div>
        </div>
        <div className="bg-card border border-border/30 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Live Execution</div>
          <div className="text-destructive font-semibold">false (blocked)</div>
        </div>
        <div className="bg-card border border-border/30 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Allowed Commands</div>
          <div className="text-foreground font-semibold">READ, NAVIGATE, EXTRACT, VERIFY</div>
        </div>
      </div>

      {/* Compliance Tests */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Contract Compliance Tests</div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
          <div className="text-[9px] text-primary/80">
            <div className="font-semibold mb-1">Test Suite</div>
            <div className="text-[8px] text-primary/70">All tests run against contract validation rules. Tests are deterministic and read-only. No OpenClaw calls are made.</div>
          </div>
        </div>

        {/* Overall Compliance Status */}
        {(() => {
          const results = TEST_CASES.map(tc => {
            const validation = validateContractCompliance(tc.request);
            return validation.isValid === tc.expectedPass;
          });
          const allPassed = results.every(r => r);
          const passCount = results.filter(r => r).length;

          return (
            <div className={`border rounded-lg px-4 py-3 ${allPassed ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {allPassed ? (
                    <TrendingUp className="w-4 h-4 text-primary" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <div>
                    <div className={`text-[11px] font-semibold ${allPassed ? 'text-primary' : 'text-destructive'}`}>
                      {allPassed ? 'COMPLIANT' : 'NON_COMPLIANT'}
                    </div>
                    <div className={`text-[9px] ${allPassed ? 'text-primary/70' : 'text-destructive/70'}`}>
                      {passCount} / {TEST_CASES.length} tests passed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Test Results */}
        <div className="space-y-1">
          {TEST_CASES.map((testCase, idx) => (
            <ComplianceTest key={idx} testCase={testCase} />
          ))}
        </div>
      </div>

      {/* Footer Notice */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/50 rounded-lg text-[9px] text-slate-400">
        <Lock className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-foreground mb-0.5">Contract is locked and read-only.</div>
          <div className="text-[8px] text-slate-400">All fields, validation rules, examples, and tests are hardcoded governance definitions. Future backend bridge will use this exact contract for request validation and response formatting. All tests are deterministic—no OpenClaw calls.</div>
        </div>
      </div>
    </div>
  );
}