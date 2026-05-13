import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Plus, Trash2, Search, Filter } from 'lucide-react';

export default function AuditEvidenceVault() {
  const [evidenceRecords, setEvidenceRecords] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    evidenceType: 'SYSTEM_VERIFY',
    sourceModule: '',
    hash: '',
    notes: '',
    tags: '',
  });

  // Load from localStorage on mount
  useEffect(() => {
    loadEvidenceRecords();
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

  const saveEvidenceRecords = (records) => {
    try {
      localStorage.setItem('auditEvidenceVault', JSON.stringify(records));
      setEvidenceRecords(records);
    } catch (err) {
      console.error('Error saving evidence records:', err);
    }
  };

  const handleAddEvidence = (e) => {
    e.preventDefault();
    const newRecord = {
      evidenceId: `evidence-${Date.now()}`,
      evidenceType: formData.evidenceType,
      sourceModule: formData.sourceModule,
      hash: formData.hash,
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      verifiedAt: null,
      verificationStatus: 'NOT_VERIFIED',
      recordCount: 0,
      proposalCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      readinessStatus: 'UNKNOWN',
      maximumCapability: 'PREVIEW_ONLY',
      executionEnabled: false,
      notes: formData.notes,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
    };

    const updated = [newRecord, ...evidenceRecords].slice(0, 500); // Keep latest 500
    saveEvidenceRecords(updated);
    
    setFormData({
      evidenceType: 'SYSTEM_VERIFY',
      sourceModule: '',
      hash: '',
      notes: '',
      tags: '',
    });
    setShowAddForm(false);
  };

  const handleMarkVerified = (recordId) => {
    const updated = evidenceRecords.map(r =>
      r.evidenceId === recordId
        ? { ...r, verificationStatus: 'VALID', verifiedAt: new Date().toISOString() }
        : r
    );
    saveEvidenceRecords(updated);
  };

  const handleMarkTampered = (recordId) => {
    const updated = evidenceRecords.map(r =>
      r.evidenceId === recordId
        ? { ...r, verificationStatus: 'TAMPERED', verifiedAt: new Date().toISOString() }
        : r
    );
    saveEvidenceRecords(updated);
  };

  const handleDeleteRecord = (recordId) => {
    const updated = evidenceRecords.filter(r => r.evidenceId !== recordId);
    saveEvidenceRecords(updated);
  };

  const handleClearHistory = () => {
    if (confirm('Clear all evidence metadata records from local storage? This cannot be undone.')) {
      localStorage.removeItem('auditEvidenceVault');
      setEvidenceRecords([]);
    }
  };

  // Filtering and searching
  const filteredRecords = useMemo(() => {
    return evidenceRecords.filter(r => {
      const typeMatch = filterType === 'all' || r.evidenceType === filterType;
      const statusMatch = filterStatus === 'all' || r.verificationStatus === filterStatus;
      const moduleMatch = filterModule === 'all' || r.sourceModule === filterModule;
      const searchMatch = !searchQuery || 
        r.evidenceId.includes(searchQuery) || 
        r.hash.includes(searchQuery) ||
        r.tags.some(t => t.includes(searchQuery));
      
      return typeMatch && statusMatch && moduleMatch && searchMatch;
    });
  }, [evidenceRecords, filterType, filterStatus, filterModule, searchQuery]);

  // Summary counts
  const summary = useMemo(() => {
    const typeCount = {};
    const statusCount = {};
    const moduleCount = {};

    evidenceRecords.forEach(r => {
      typeCount[r.evidenceType] = (typeCount[r.evidenceType] || 0) + 1;
      statusCount[r.verificationStatus] = (statusCount[r.verificationStatus] || 0) + 1;
      moduleCount[r.sourceModule] = (moduleCount[r.sourceModule] || 0) + 1;
    });

    return { typeCount, statusCount, moduleCount };
  }, [evidenceRecords]);

  const evidenceTypes = [
    'SYSTEM_VERIFY',
    'DEPLOYMENT_SNAPSHOT',
    'OBSERVATION_EXPORT',
    'PROPOSAL_PACKET_EXPORT',
    'PACKET_VERIFICATION',
    'GATEWAY_READ_LOG',
    'DRY_RUN_AUDIT',
  ];

  const statusConfig = {
    'VALID': { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
    'TAMPERED': { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
    'INVALID_FORMAT': { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
    'NOT_VERIFIED': { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-500/5 border-slate-500/20' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Audit Evidence</div>
          <div className="text-[13px] font-semibold text-foreground">Evidence Metadata Vault</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Add Evidence
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={evidenceRecords.length === 0}
            className="px-3 py-1.5 text-[10px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 font-semibold rounded flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-1">⚠️ AUDIT METADATA ONLY</div>
          <div className="text-[9px] text-destructive/70">
            This vault stores metadata only. It does not store full files, execute actions, or enable any execution capability. Baseline non-execution is locked.
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          AUDIT_METADATA_ONLY
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          NO_FULL_FILE_STORAGE
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-slate-400/30 bg-slate-400/10 text-slate-400 rounded font-semibold uppercase tracking-wider">
          PREVIEW_ONLY
        </span>
        <span className="px-2.5 py-1.5 text-[8px] border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded font-semibold uppercase tracking-wider">
          EXECUTION_DISABLED
        </span>
      </div>

      {/* Add Evidence Form */}
      {showAddForm && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <form onSubmit={handleAddEvidence} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-semibold text-foreground block mb-1">Evidence Type</label>
                <select
                  value={formData.evidenceType}
                  onChange={(e) => setFormData({ ...formData, evidenceType: e.target.value })}
                  className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground"
                >
                  {evidenceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-foreground block mb-1">Source Module</label>
                <input
                  type="text"
                  value={formData.sourceModule}
                  onChange={(e) => setFormData({ ...formData, sourceModule: e.target.value })}
                  placeholder="e.g., SystemVerify, ProposalExporter"
                  className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-semibold text-foreground block mb-1">Hash (SHA-256)</label>
              <input
                type="text"
                value={formData.hash}
                onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
                placeholder="SHA-256 hash of artifact"
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground placeholder:text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[9px] font-semibold text-foreground block mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Metadata about this evidence"
                rows={2}
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground placeholder:text-slate-500 resize-none"
              />
            </div>

            <div>
              <label className="text-[9px] font-semibold text-foreground block mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., production, critical, phase-7"
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground placeholder:text-slate-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-[10px] border border-border text-foreground hover:bg-secondary/50 transition-colors font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded"
              >
                Add Evidence
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Counts */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 space-y-2">
        <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2">Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Total Records</div>
            <div className="text-[14px] font-semibold text-foreground">{evidenceRecords.length}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Valid</div>
            <div className="text-[14px] font-semibold text-primary">{summary.statusCount['VALID'] || 0}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Tampered</div>
            <div className="text-[14px] font-semibold text-destructive">{summary.statusCount['TAMPERED'] || 0}</div>
          </div>
          <div className="bg-card border border-border/30 px-2 py-1.5 rounded">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Not Verified</div>
            <div className="text-[14px] font-semibold text-slate-400">{summary.statusCount['NOT_VERIFIED'] || 0}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-3 bg-secondary/10 border border-border/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider">Filters & Search</div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[8px] font-semibold text-foreground block mb-1 uppercase">Search (Hash/ID/Tags)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[8px] font-semibold text-foreground block mb-1 uppercase">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground"
              >
                <option value="all">All Types</option>
                {Object.entries(summary.typeCount).map(([type, count]) => (
                  <option key={type} value={type}>{type} ({count})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8px] font-semibold text-foreground block mb-1 uppercase">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground"
              >
                <option value="all">All Status</option>
                {Object.entries(summary.statusCount).map(([status, count]) => (
                  <option key={status} value={status}>{status} ({count})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8px] font-semibold text-foreground block mb-1 uppercase">Module</label>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card rounded text-foreground"
              >
                <option value="all">All Modules</option>
                {Object.entries(summary.moduleCount).map(([module, count]) => (
                  <option key={module} value={module}>{module || 'Unknown'} ({count})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg overflow-auto">
        <div className="text-[9px] font-semibold text-foreground uppercase tracking-wider p-3 border-b border-border/30">
          Evidence Records ({filteredRecords.length})
        </div>
        
        {filteredRecords.length === 0 ? (
          <div className="p-4 text-center text-[10px] text-muted-foreground">No evidence records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground/60 uppercase tracking-widest">
                  <th className="px-3 py-2 text-left font-semibold">Evidence ID</th>
                  <th className="px-3 py-2 text-left font-semibold">Type</th>
                  <th className="px-3 py-2 text-left font-semibold">Module</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Hash</th>
                  <th className="px-3 py-2 text-left font-semibold">Created</th>
                  <th className="px-3 py-2 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 50).map(record => {
                  const cfg = statusConfig[record.verificationStatus];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={record.evidenceId} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-2 text-foreground/80 font-mono text-[8px]">{record.evidenceId.substring(0, 12)}...</td>
                      <td className="px-3 py-2 text-foreground">{record.evidenceType}</td>
                      <td className="px-3 py-2 text-foreground/70">{record.sourceModule || '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={`w-3 h-3 ${cfg.color}`} />
                          <span className={`text-[8px] font-semibold ${cfg.color}`}>
                            {record.verificationStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-foreground/60 font-mono text-[8px] truncate">{record.hash.substring(0, 16)}...</td>
                      <td className="px-3 py-2 text-foreground/70 text-[8px]">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-center space-x-1">
                        {record.verificationStatus === 'NOT_VERIFIED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMarkVerified(record.evidenceId)}
                              className="px-1.5 py-0.5 text-[8px] border border-primary/30 text-primary hover:bg-primary/10 transition-colors rounded font-semibold"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkTampered(record.evidenceId)}
                              className="px-1.5 py-0.5 text-[8px] border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors rounded font-semibold"
                            >
                              ✗
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(record.evidenceId)}
                          className="px-1.5 py-0.5 text-[8px] border border-slate-400/30 text-slate-400 hover:bg-slate-400/10 transition-colors rounded font-semibold"
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Metadata-Only Vault</div>
          <div className="text-[9px] text-primary/70">This vault stores metadata references only. No full files are stored. No execution capability exists. Baseline non-execution is locked. All records include executionEnabled: false.</div>
        </div>
      </div>
    </div>
  );
}