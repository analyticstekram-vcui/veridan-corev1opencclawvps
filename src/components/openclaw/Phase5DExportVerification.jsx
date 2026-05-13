import React, { useState } from 'react';
import { Upload, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Phase5DExportVerification() {
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // Generate SHA-256 hash (same algorithm as Phase 5C)
  const generateHash = async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Validate required structure
  const validateStructure = (obj) => {
    const required = [
      'exportedAt',
      'note',
      'phase',
      'bridgeMode',
      'executionStatusBoundary',
      'metrics',
      'records',
      'filtersApplied',
      'exportHash',
    ];

    const missing = required.filter(field => !(field in obj));
    return {
      isValid: missing.length === 0,
      missing,
    };
  };

  // Validate field values
  const validateValues = (obj) => {
    const errors = [];

    if (obj.phase !== 'PHASE_5C_OBSERVATION_EXPORT') {
      errors.push(`phase must be PHASE_5C_OBSERVATION_EXPORT, got ${obj.phase}`);
    }

    if (obj.bridgeMode !== 'OPENCLAW_DRY_RUN_PREVIEW') {
      errors.push(`bridgeMode must be OPENCLAW_DRY_RUN_PREVIEW, got ${obj.bridgeMode}`);
    }

    const expectedBoundary = JSON.stringify(['PREVIEW_ONLY', 'REJECTED_NOT_EXECUTED']);
    const actualBoundary = JSON.stringify(obj.executionStatusBoundary);
    if (actualBoundary !== expectedBoundary) {
      errors.push(`executionStatusBoundary mismatch`);
    }

    if (!Array.isArray(obj.records)) {
      errors.push('records must be an array');
    }

    if (typeof obj.metrics !== 'object' || obj.metrics === null) {
      errors.push('metrics must be an object');
    }

    if (typeof obj.filtersApplied !== 'object' || obj.filtersApplied === null) {
      errors.push('filtersApplied must be an object');
    }

    if (typeof obj.exportHash !== 'string' || obj.exportHash.length !== 64) {
      errors.push('exportHash must be a 64-character hex string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Handle file upload
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setVerifying(true);
    setVerification(null);
    setSummary(null);
    setError(null);

    try {
      // Read file
      const fileContent = await file.text();
      let parsed;

      try {
        parsed = JSON.parse(fileContent);
      } catch (err) {
        setError(`Failed to parse JSON: ${err.message}`);
        setVerification({
          result: 'INVALID_FORMAT',
          message: 'File is not valid JSON',
        });
        setVerifying(false);
        return;
      }

      // Validate structure
      const structureValidation = validateStructure(parsed);
      if (!structureValidation.isValid) {
        setError(`Missing required fields: ${structureValidation.missing.join(', ')}`);
        setVerification({
          result: 'INVALID_FORMAT',
          message: `Missing fields: ${structureValidation.missing.join(', ')}`,
        });
        setVerifying(false);
        return;
      }

      // Validate field values
      const valueValidation = validateValues(parsed);
      if (!valueValidation.isValid) {
        setError(`Validation errors: ${valueValidation.errors.join('; ')}`);
        setVerification({
          result: 'INVALID_FORMAT',
          message: `Invalid values: ${valueValidation.errors.join('; ')}`,
        });
        setVerifying(false);
        return;
      }

      // Extract hash from file
      const fileHash = parsed.exportHash;

      // Remove hash from object for recalculation
      const payloadCopy = { ...parsed };
      delete payloadCopy.exportHash;

      // Recalculate hash with consistent formatting
      const payloadString = JSON.stringify(payloadCopy, null, 2);
      const recalculatedHash = await generateHash(payloadString);

      // Compare hashes
      const isTampered = fileHash !== recalculatedHash;
      const result = isTampered ? 'TAMPERED' : 'VALID';

      // Build summary
      const summaryData = {
        exportedAt: parsed.exportedAt,
        phase: parsed.phase,
        bridgeMode: parsed.bridgeMode,
        recordCount: parsed.records.length,
        totalDryRunAttempts: parsed.metrics.total,
        acceptedCount: parsed.metrics.accepted,
        rejectedCount: parsed.metrics.rejected,
        filtersApplied: parsed.filtersApplied,
        fileHash: fileHash,
        recalculatedHash: recalculatedHash,
      };

      setSummary(summaryData);
      setVerification({
        result,
        message:
          result === 'VALID'
            ? 'File integrity verified. No tampering detected.'
            : 'File integrity check FAILED. File may have been tampered with.',
      });
    } catch (err) {
      console.error('Verification error:', err);
      setError(`Verification failed: ${err.message}`);
      setVerification({
        result: 'INVALID_FORMAT',
        message: `Error: ${err.message}`,
      });
    } finally {
      setVerifying(false);
    }
  };

  const resultColor =
    verification?.result === 'VALID'
      ? 'green'
      : verification?.result === 'TAMPERED'
        ? 'red'
        : 'orange';

  const resultIcon =
    verification?.result === 'VALID'
      ? CheckCircle2
      : verification?.result === 'TAMPERED'
        ? XCircle
        : AlertTriangle;

  const ResultIcon = resultIcon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-purple-500/20 bg-purple-500/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-purple-500/20 bg-purple-500/10">
          <div>
            <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
              Phase 5D: Export Verification
            </div>
            <div className="text-[8px] text-purple-400/70 mt-1">
              Verify Phase 5C observation exports for tampering using SHA-256 hash integrity checks.
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[8px] text-amber-600">
            Export verification checks file integrity only. It does not call OpenClaw or execute actions.
          </span>
        </div>

        {/* Status Badges */}
        <div className="px-4 py-2 border-b border-purple-500/20 flex items-center gap-1.5">
          <span className="text-[7px] font-semibold text-purple-400 px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded">
            VERIFY_ONLY
          </span>
          <span className="text-[7px] font-semibold text-purple-400 px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded">
            OPENCLAW_NOT_CONNECTED
          </span>
          <span className="text-[7px] font-semibold text-purple-400 px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded">
            EXECUTION_DISABLED
          </span>
        </div>
      </div>

      {/* File Upload */}
      <div className="border border-purple-500/20 bg-purple-500/5 rounded p-3">
        <label className="flex items-center justify-center gap-2 cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            disabled={verifying}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="text-[8px] h-8"
            disabled={verifying}
            onClick={() => document.querySelector('input[type="file"]')?.click()}
          >
            {verifying ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Verifying...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1" />
                Select JSON File
              </>
            )}
          </Button>
          <span className="text-[7px] text-slate-400">Phase 5C observation export JSON</span>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/5 rounded p-3">
          <div className="text-[8px] font-semibold text-red-600 mb-1">Error</div>
          <div className="text-[7px] text-red-600/70">{error}</div>
        </div>
      )}

      {/* Verification Result */}
      {verification && (
        <div
          className={`border rounded p-3 ${
            resultColor === 'green'
              ? 'border-green-500/20 bg-green-500/5'
              : resultColor === 'red'
                ? 'border-red-500/20 bg-red-500/5'
                : 'border-amber-500/20 bg-amber-500/5'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <ResultIcon
              className={`w-4 h-4 ${
                resultColor === 'green'
                  ? 'text-green-600'
                  : resultColor === 'red'
                    ? 'text-red-600'
                    : 'text-amber-600'
              }`}
            />
            <span
              className={`text-[8px] font-semibold uppercase ${
                resultColor === 'green'
                  ? 'text-green-600'
                  : resultColor === 'red'
                    ? 'text-red-600'
                    : 'text-amber-600'
              }`}
            >
              {verification.result}
            </span>
          </div>
          <div className="text-[7px] text-slate-400">{verification.message}</div>
        </div>
      )}

      {/* File Summary */}
      {summary && (
        <div className="border border-slate-500/20 bg-slate-500/5 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-500/20 bg-slate-500/10">
            <div className="text-[8px] font-semibold text-slate-400 uppercase">File Summary</div>
          </div>

          <div className="px-4 py-3 space-y-2">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-[7px]">
              <div>
                <div className="text-slate-500 mb-0.5">Exported At</div>
                <div className="text-foreground font-mono">{new Date(summary.exportedAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-0.5">Phase</div>
                <div className="text-foreground font-mono">{summary.phase}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-0.5">Bridge Mode</div>
                <div className="text-foreground font-mono">{summary.bridgeMode}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-0.5">Record Count</div>
                <div className="text-foreground font-mono">{summary.recordCount}</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="border-t border-slate-500/20 pt-2">
              <div className="text-slate-500 text-[7px] mb-1">Metrics</div>
              <div className="grid grid-cols-3 gap-2 text-[7px]">
                <div>
                  <div className="text-slate-500 mb-0.5">Total</div>
                  <div className="text-foreground font-mono">{summary.totalDryRunAttempts}</div>
                </div>
                <div>
                  <div className="text-green-600 mb-0.5">Accepted</div>
                  <div className="text-green-600 font-mono font-bold">{summary.acceptedCount}</div>
                </div>
                <div>
                  <div className="text-red-600 mb-0.5">Rejected</div>
                  <div className="text-red-600 font-mono font-bold">{summary.rejectedCount}</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            {Object.keys(summary.filtersApplied).length > 0 && (
              <div className="border-t border-slate-500/20 pt-2">
                <div className="text-slate-500 text-[7px] mb-1">Filters Applied</div>
                <div className="text-[7px] text-foreground font-mono">
                  {JSON.stringify(summary.filtersApplied, null, 2).split('\n').slice(0, 5).join('\n')}
                  {Object.keys(summary.filtersApplied).length > 5 && '...'}
                </div>
              </div>
            )}

            {/* Hash Verification */}
            <div className="border-t border-slate-500/20 pt-2">
              <div className="text-slate-500 text-[7px] mb-1">SHA-256 Hash Integrity</div>
              <div className="space-y-1">
                <div>
                  <div className="text-slate-500 text-[6px] mb-0.5">File Hash</div>
                  <code className="text-[6px] font-mono bg-secondary p-1.5 rounded border border-border block truncate">
                    {summary.fileHash}
                  </code>
                </div>
                <div>
                  <div className="text-slate-500 text-[6px] mb-0.5">Recalculated Hash</div>
                  <code className="text-[6px] font-mono bg-secondary p-1.5 rounded border border-border block truncate">
                    {summary.recalculatedHash}
                  </code>
                </div>
                <div
                  className={`text-[7px] p-1.5 rounded border ${
                    summary.fileHash === summary.recalculatedHash
                      ? 'border-green-500/20 bg-green-500/10 text-green-600'
                      : 'border-red-500/20 bg-red-500/10 text-red-600'
                  }`}
                >
                  {summary.fileHash === summary.recalculatedHash
                    ? '✓ Hashes match - file integrity verified'
                    : '✗ Hashes do not match - file may be tampered'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}