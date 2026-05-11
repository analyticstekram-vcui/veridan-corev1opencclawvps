import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { validateUrl, RISK_LEVEL, appendAudit } from '@/lib/commandQueue';
import { X, Plus, Globe, AlertTriangle, FileText, Camera } from 'lucide-react';

const COMMAND_TYPES = [
  { id: 'OPEN_URL_AND_READ_TITLE', label: 'Read Page Title', icon: FileText },
  { id: 'OPEN_URL_AND_SCREENSHOT', label: 'Screenshot',       icon: Camera },
];

export default function CreateCommandModal({ currentUser, onCreated, onClose }) {
  const [commandType, setCommandType] = useState('OPEN_URL_AND_READ_TITLE');
  const [targetUrl,   setTargetUrl]   = useState('https://');
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [urlError,    setUrlError]    = useState(null);

  const urlErr = validateUrl(targetUrl);

  const handleSubmit = async (asDraft) => {
    const err = validateUrl(targetUrl);
    if (err) { setUrlError(err); return; }

    setSaving(true);
    const riskLevel = RISK_LEVEL[commandType] || 'low';
    const status = asDraft ? 'draft' : 'pending';
    const commandId = 'cmd_' + Date.now();
    const now = new Date().toISOString();

    const auditLog = appendAudit([], asDraft ? 'CREATED_AS_DRAFT' : 'SUBMITTED_FOR_APPROVAL', currentUser?.email);

    await base44.entities.OpenClawCommand.create({
      commandId,
      commandType,
      targetUrl,
      requestedBy: currentUser?.email || 'unknown',
      status,
      riskLevel,
      approvalRequired: true,
      notes,
      auditLog,
    });

    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-card border border-border w-full max-w-lg font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-semibold text-foreground">New Command</span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Command Type */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1.5">Command Type</label>
            <div className="flex gap-2">
              {COMMAND_TYPES.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setCommandType(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 border text-[10px] transition-colors flex-1 justify-center ${
                    commandType === id
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}>
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target URL */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1 mb-1.5">
              <Globe className="w-2.5 h-2.5" /> Target URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={e => { setTargetUrl(e.target.value); setUrlError(null); }}
              className={`w-full px-3 py-2 bg-secondary/50 border text-[12px] text-blue-400 font-mono outline-none transition-colors ${
                urlErr ? 'border-amber-500/50' : 'border-border focus:border-primary/50'
              }`}
              placeholder="https://example.com"
            />
            {urlErr && (
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-amber-500">
                <AlertTriangle className="w-3 h-3" /> {urlErr}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1.5">Notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/50 border border-border text-[11px] text-foreground font-mono outline-none focus:border-primary/50 transition-colors resize-none"
              placeholder="Reason for this command..."
            />
          </div>

          {/* Governance notice */}
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-500/70 leading-relaxed">
              All commands require approval before execution. Unsafe URLs are blocked at queue submission and again before execution. CF credentials are never sent to the browser.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border">
          <button onClick={onClose} disabled={saving}
            className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            Cancel
          </button>
          <button onClick={() => handleSubmit(true)} disabled={saving || !!urlErr}
            className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-40">
            Save Draft
          </button>
          <button onClick={() => handleSubmit(false)} disabled={saving || !!urlErr}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40">
            {saving ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}