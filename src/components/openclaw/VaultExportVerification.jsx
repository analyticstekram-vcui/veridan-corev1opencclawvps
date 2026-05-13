import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Download, Trash2 } from 'lucide-react';

export default function VaultExportVerification() {
  const [evidenceRecords, setEvidenceRecords] = useState([]);
  const [exportHistory, setExportHistory] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Load evidence records and export history on mount
  useEffect(() => {
    loadEvidenceRecords();
    loadExportHistory();
  }, []);

  const loadEvidenceRecords = () => {
    try {
      const stored = localStorage.getItem('auditEvidenceVault');
      if (stored) {
        const records = JSON.parse(stored);
        setEvidenceRecords(records);
      }
    } catch (err) {
      console.error('Error loading evidence records:', err);
    }
  };

  const loadExportHistory = () => {
    try {
      const stored = localStorage.getItem('vaultExportHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setExportHistory(history);
      }
    } catch (err) {
      console.error('Error loading export history:', err);
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

  const calculateSummary = (records) => {
    const summary = {
      countByEvidenceType: {},
      countByVerificationStatus: {},
      countBySourceModule: {},
      validCount: 0,
      tamperedCount: 0,
      invalidFormatCount: 0,
      notVerifiedCount: 0,
    };

    records.forEach(r => {
      summary.countByEvidenceType[r.evidenceType] = (summary.countByEvidenceType[r.evidenceType] || 0) + 1;
      summary.countByVerificationStatus[r.verificationStatus] = (summary.countByVerificationStatus[r.verificationStatus] || 0) + 1;
      summary.countBySourceModule[r.sourceModule] = (summary.countBySourceModule[r.sourceModule] || 0) + 1;

      if (r.verificationStatus === 'VALID') summary.validCount++;
      if (r.verificationStatus === 'TAMPERED') summary.tamperedCount++;
      if (r.verificationStatus === 'INVALID_FORMAT') summary.invalidFormatCount++;
      if (r.verificationStatus === 'NOT_VERIFIED') summary.notVerifiedCount++;
    });

    return summary;
  };

  const handleExportVault = async () => {
    const summary = calculateSummary(evidenceRecords);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      exportType: 'EVIDENCE_VAULT_METADATA_EXPORT',
      note: 'Evidence metadata export only. No full files stored. No actions executed.',
      maximumCapability: 'PREVIEW_ONLY',
      executionEnabled: false,
      recordCount: evidenceRecords.length,
      evidenceRecords: evidenceRecords.slice(0, 500),
      summary,
      disabledCapabilities: [
        'LIVE_EXECUTION',
        'BROWSER_AUTOMATION',
        'TRADING_ORDERS',
        'CREDENTIAL_ENTRY',
        'COMMAND_EXECUTION',
        'FULL_FILE_STORAGE',
      ],
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const vaultExportHash = await generateSHA256Hash(jsonStr);

    const exportWithHash = {
      ...exportPayload,
      vaultExportHash,
    };

    const finalJsonStr = JSON.stringify(exportWithHash, null, 2);
    const blob = new Blob([finalJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Save metadata to export history
    const historyEntry = {
      vaultExportHash,
      exportedAt: new Date().toISOString(),
      recordCount: evidenceRecords.length,
      validCount: summary.validCount,
      tamperedCount: summary.tamperedCount,
      notVerifiedCount: summary.notVerifiedCount,
    };

    const updated = [historyEntry, ...exportHistory].slice(0, 10);
    localStorage.setItem('vaultExportHistory', JSON.stringify(updated));
    setExportHistory(updated);
  };

  const handleClearExportHistory = () => {
    if (confirm('Clear all vault export history from local storage? This cannot be undone.')) {
      localStorage.removeItem('vaultExportHistory');
      setExportHistory([]);
    }
  };

  const handleVerifyExport = async (file) => {
    setVerifyLoading(true);
    setVerifyResult(null);

    try {
      const fileContent = await file.text();
      let exportData;

      try {
        exportData = JSON.parse(fileContent);
      } catch (err) {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: `JSON parsing failed: ${err.message}`,
        });
        setVerifyLoading(false);
        return;
      }

      // Validate required fields
      if (!exportData.exportType || exportData.exportType !== 'EVIDENCE_VAULT_METADATA_EXPORT') {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: 'Invalid or missing exportType. Expected EVIDENCE_VAULT_METADATA_EXPORT.',
        });
        setVerifyLoading(false);
        return;
      }

      if (exportData.maximumCapability !== 'PREVIEW_ONLY') {
        setVerifyResult({
          status: 'TAMPERED',
          message: 'SAFETY VIOLATION: maximumCapability is not PREVIEW_ONLY',
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      if (exportData.executionEnabled !== false) {
        setVerifyResult({
          status: 'TAMPERED',
          message: 'SAFETY VIOLATION: executionEnabled is not false',
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      if (!Array.isArray(exportData.evidenceRecords)) {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: 'evidenceRecords must be an array',
        });
        setVerifyLoading(false);
        return;
      }

      if (!exportData.summary || typeof exportData.summary !== 'object') {
        setVerifyResult({
          status: 'INVALID_FORMAT',
          message: 'summary must be an object',
        });
        setVerifyLoading(false);
        return;
      }

      // Validate disabled capabilities
      const requiredDisabledCaps = [
        'LIVE_EXECUTION',
        'BROWSER_AUTOMATION',
        'TRADING_ORDERS',
        'CREDENTIAL_ENTRY',
        'COMMAND_EXECUTION',
        'FULL_FILE_STORAGE',
      ];

      const missingCaps = requiredDisabledCaps.filter(
        cap => !exportData.disabledCapabilities.includes(cap)
      );

      if (missingCaps.length > 0) {
        setVerifyResult({
          status: 'TAMPERED',
          message: `SAFETY VIOLATION: Missing disabled capabilities: ${missingCaps.join(', ')}`,
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Safety check: no sensitive data in records
      const forbiddenFields = ['fullFileContent', 'rawInputText', 'hmacSecret', 'apiKey', 'token', 'credential', 'password'];
      const unsafeRecords = exportData.evidenceRecords.filter(r =>
        forbiddenFields.some(field => r[field] !== undefined)
      );

      if (unsafeRecords.length > 0) {
        setVerifyResult({
          status: 'TAMPERED',
          message: `SAFETY VIOLATION: ${unsafeRecords.length} record(s) contain sensitive fields`,
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Safety check: all records must have executionEnabled: false
      const execEnabledRecords = exportData.evidenceRecords.filter(r => r.executionEnabled !== false);

      if (execEnabledRecords.length > 0) {
        setVerifyResult({
          status: 'TAMPERED',
          message: `SAFETY VIOLATION: ${execEnabledRecords.length} record(s) have executionEnabled !== false`,
          isTampered: true,
        });
        setVerifyLoading(false);
        return;
      }

      // Hash verification
      const storedHash = exportData.vaultExportHash;
      const exportForHash = { ...exportData };
      delete exportForHash.vaultExportHash;

      const jsonStr = JSON.stringify(exportForHash, null, 2);
      const recalculatedHash = await generateSHA256Hash(jsonStr);

      const isValid = storedHash === recalculatedHash;

      setVerifyResult({
        status: isValid ? 'VALID' : 'TAMPERED',
        isValid,
        storedHash,
        recalculatedHash,
        summary: {
          exportedAt: exportData.exportedAt,
          recordCount: exportData.recordCount,
          validCount: exportData.summary?.validCount || 0,
          tamperedCount: exportData.summary?.tamperedCount || 0,
          notVerifiedCount: exportData.summary?.notVerifiedCount || 0,
        },
        message: isValid ? 'Export is VALID and unmodified.' : 'Export has been TAMPERED with after creation.',
      });
    } catch (err) {
      setVerifyResult({
        status: 'ERROR',
        message: `Error reading file: ${err.message}`,
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleVerifyExport(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Vault Operations</div>
          <div className="text-[13px] font-semibold text-foreground">Evidence Vault Export & Verification</div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-1">⚠️ VAULT EXPORT/VERIFICATION ONLY</div>
          <div className="text-[9px] text-destructive/70">
            Evidence Vault export and verification only. Metadata only. No full files stored. No actions executed. Baseline non-execution is locked.
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          VAULT_EXPORT
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          METADATA_ONLY
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          NO_FULL_FILE_STORAGE
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded font-semibold uppercase tracking-wider">
          EXECUTION_DISABLED
        </span>
      </div>

      {/* Export Section */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Export Vault Metadata</div>
        <div className="text-[9px] text-muted-foreground mb-3">
          Export latest {evidenceRecords.length} evidence records as JSON. Includes SHA-256 hash for integrity verification.
        </div>
        <button
          type="button"
          onClick={handleExportVault}
          className="px-4 py-2 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export Vault Metadata
        </button>
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Export History (Latest 10)</div>
            <button
              type="button"
              onClick={handleClearExportHistory}
              className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors font-semibold rounded"
            >
              Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead className="border-b border-border/30">
                <tr className="text-muted-foreground/60 uppercase tracking-widest">
                  <th className="text-left px-3 py-2 font-semibold">Exported At</th>
                  <th className="text-center px-3 py-2 font-semibold">Records</th>
                  <th className="text-center px-3 py-2 font-semibold">Valid</th>
                  <th className="text-center px-3 py-2 font-semibold">Tampered</th>
                  <th className="text-center px-3 py-2 font-semibold">Not Verified</th>
                  <th className="text-left px-3 py-2 font-semibold">Hash</th>
                </tr>
              </thead>
              <tbody>
                {exportHistory.map((entry, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-2 text-foreground/80">{new Date(entry.exportedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-center text-foreground">{entry.recordCount}</td>
                    <td className="px-3 py-2 text-center text-primary font-semibold">{entry.validCount}</td>
                    <td className="px-3 py-2 text-center text-destructive font-semibold">{entry.tamperedCount}</td>
                    <td className="px-3 py-2 text-center text-slate-400 font-semibold">{entry.notVerifiedCount}</td>
                    <td className="px-3 py-2 text-foreground/60 font-mono text-[8px] truncate">{entry.vaultExportHash.substring(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Section */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Verify Vault Export</div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            disabled={verifyLoading}
            className="flex-1 text-[10px] file:px-3 file:py-1.5 file:border file:border-primary/50 file:bg-primary/10 file:text-primary file:hover:bg-primary/20 file:transition-colors file:rounded file:font-semibold file:text-[9px] file:cursor-pointer disabled:opacity-50"
          />
          {verifyLoading && <span className="text-[9px] text-primary/70 whitespace-nowrap">Verifying...</span>}
        </div>
      </div>

      {/* Verification Result */}
      {verifyResult && (
        <div className="space-y-3">
          {verifyResult.status === 'VALID' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[10px] text-primary/90">
                <div className="font-semibold mb-0.5">✓ Export is VALID</div>
                <div className="text-[9px] text-primary/70">{verifyResult.message}</div>
              </div>
            </div>
          )}

          {verifyResult.status === 'TAMPERED' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-[10px] text-destructive/90">
                <div className="font-semibold mb-0.5">✗ Export is TAMPERED or INVALID</div>
                <div className="text-[9px] text-destructive/70">{verifyResult.message}</div>
              </div>
            </div>
          )}

          {verifyResult.status === 'INVALID_FORMAT' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-500/90">
                <div className="font-semibold mb-0.5">⚠ Invalid Format</div>
                <div className="text-[9px] text-amber-500/70">{verifyResult.message}</div>
              </div>
            </div>
          )}

          {verifyResult.status === 'ERROR' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-[10px] text-destructive/90">
                <div className="font-semibold mb-0.5">Error Reading File</div>
                <div className="text-[9px] text-destructive/70">{verifyResult.message}</div>
              </div>
            </div>
          )}

          {/* Summary */}
          {verifyResult.summary && (
            <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 space-y-2">
              <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2">Export Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[9px]">
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Exported</div>
                  <div className="text-foreground/70 font-mono text-[8px]">{new Date(verifyResult.summary.exportedAt).toLocaleString()}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Records</div>
                  <div className="text-[14px] font-semibold text-foreground">{verifyResult.summary.recordCount}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Valid</div>
                  <div className="text-[14px] font-semibold text-primary">{verifyResult.summary.validCount}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Tampered</div>
                  <div className="text-[14px] font-semibold text-destructive">{verifyResult.summary.tamperedCount}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Not Verified</div>
                  <div className="text-[14px] font-semibold text-slate-400">{verifyResult.summary.notVerifiedCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* Hash Comparison */}
          {verifyResult.storedHash && (
            <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 space-y-2">
              <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2">Hash Verification</div>
              <div className="space-y-2">
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5 font-semibold">Stored Hash</div>
                  <code className="text-[8px] font-mono text-foreground/70 break-all">{verifyResult.storedHash}</code>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5 font-semibold">Recalculated Hash</div>
                  <code className="text-[8px] font-mono text-foreground/70 break-all">{verifyResult.recalculatedHash}</code>
                </div>
                <div className="border-t border-border/30 pt-2">
                  <div className={`text-[8px] uppercase tracking-widest font-semibold mb-0.5 ${verifyResult.isValid ? 'text-primary' : 'text-destructive'}`}>
                    {verifyResult.isValid ? '✓ Hashes Match' : '✗ Hashes Do Not Match'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Metadata-Only Export & Verification</div>
          <div className="text-[9px] text-primary/70">This tool exports and verifies vault metadata only. No full files, no execution code, no credential access. Baseline non-execution is locked. All exports include executionEnabled: false.</div>
        </div>
      </div>
    </div>
  );
}