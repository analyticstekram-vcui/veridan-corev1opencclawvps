import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROLE_METADATA, ROLE_PERMISSIONS } from '@/lib/rbac';
import { ChevronDown, ChevronRight, Shield, AlertTriangle, CheckCircle2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

function AccessReviewCard({ review, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(review?.reviewStatus || 'PENDING');
  const [notes, setNotes] = useState(review?.reviewNotes || '');
  const [saving, setSaving] = useState(false);
  const roleMeta = ROLE_METADATA[review?.assignedRole];
  const rolePerms = ROLE_PERMISSIONS[review?.assignedRole] || [];

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        userEmail: review.userEmail,
        assignedRole: review.assignedRole,
        grantedPermissions: rolePerms,
        reviewStatus: status,
        reviewNotes: notes,
        reviewedBy: (await base44.auth.me())?.email || 'system',
        reviewedAt: new Date().toISOString(),
      };

      if (review.id) {
        await base44.entities.OpenClawAccessReview.update(review.id, payload);
      } else {
        await base44.entities.OpenClawAccessReview.create(payload);
      }

      setEditing(false);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    PENDING: { color: 'text-amber-500 border-amber-500/30 bg-amber-500/5', label: 'Pending Review' },
    APPROVED: { color: 'text-primary border-primary/30 bg-primary/5', label: 'Approved' },
    DENIED: { color: 'text-destructive border-destructive/30 bg-destructive/5', label: 'Denied' },
    UNDER_REVIEW: { color: 'text-blue-400 border-blue-400/30 bg-blue-400/5', label: 'Under Review' },
  };

  const cfg = statusConfig[status] || statusConfig.PENDING;

  return (
    <div className="border border-border/50 bg-card/50 rounded-lg overflow-hidden">
      {/* Summary row */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-200 truncate">{review.userEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] px-1.5 py-0.5 border border-border bg-secondary/30 text-slate-300 rounded font-semibold">{roleMeta?.displayName || review.assignedRole}</span>
              <span className={`text-[8px] px-1.5 py-0.5 border font-semibold rounded ${cfg.color}`}>{cfg.label}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          {review.reviewedAt && (
            <div className="text-[8px] text-slate-400 font-mono">{format(new Date(review.reviewedAt), 'MMM dd')}</div>
          )}
          <div className="text-[8px] text-slate-500 font-semibold">{rolePerms.length} permissions</div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-4 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-card border border-border/30 px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">User Email</div>
              <div className="text-slate-200 font-mono">{review.userEmail}</div>
            </div>
            <div className="bg-card border border-border/30 px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Assigned Role</div>
              <div className="text-slate-200">{roleMeta?.displayName || review.assignedRole}</div>
            </div>
            {review.reviewedAt && (
              <>
                <div className="bg-card border border-border/30 px-2 py-1.5">
                  <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Last Reviewed</div>
                  <div className="text-slate-200 font-mono">{format(new Date(review.reviewedAt), 'yyyy-MM-dd HH:mm')}</div>
                </div>
                <div className="bg-card border border-border/30 px-2 py-1.5">
                  <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Reviewed By</div>
                  <div className="text-slate-200 text-[9px]">{review.reviewedBy || '—'}</div>
                </div>
              </>
            )}
            {review.expiresAt && (
              <div className="col-span-2 bg-card border border-border/30 px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Access Expires</div>
                <div className="text-slate-200 font-mono">{format(new Date(review.expiresAt), 'yyyy-MM-dd')}</div>
              </div>
            )}
            {review.lastAccessedAt && (
              <div className="col-span-2 bg-card border border-border/30 px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">Last Accessed</div>
                <div className="text-slate-200 font-mono">{format(new Date(review.lastAccessedAt), 'yyyy-MM-dd HH:mm')}</div>
              </div>
            )}
          </div>

          {/* Granted permissions */}
          <div>
            <div className="text-[9px] font-semibold text-slate-200 mb-2 uppercase tracking-wider">Permissions</div>
            <div className="space-y-1">
              {rolePerms.length > 0 ? (
                rolePerms.map((perm, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] px-2 py-1 bg-card border border-primary/20 rounded">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-slate-300">{perm}</span>
                  </div>
                ))
              ) : (
                <div className="text-[9px] text-slate-500 px-2 py-1 font-semibold">No permissions granted</div>
              )}
            </div>
          </div>

          {/* Review status and notes (edit mode) */}
          {editing ? (
            <div className="border border-primary/20 bg-primary/5 p-3 space-y-3">
              <div>
                <label className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1 font-semibold">Review Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-card border border-border text-[10px] font-mono text-slate-200 px-2 py-1.5 outline-none focus:border-primary/50"
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DENIED">Denied</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1 font-semibold">Review Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add justification, findings, or notes..."
                  rows={2}
                  className="w-full bg-card border border-border text-[10px] font-mono text-slate-200 px-2 py-1.5 outline-none focus:border-primary/50 placeholder:text-slate-500 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setStatus(review?.reviewStatus || 'PENDING');
                    setNotes(review?.reviewNotes || '');
                  }}
                  disabled={saving}
                  className="px-3 py-1.5 text-[9px] border border-border text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-[9px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 font-semibold"
                >
                  {saving ? 'Saving…' : 'Save Review'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Review status display */}
              <div className={`border px-3 py-2 rounded space-y-1.5 ${cfg.color}`}>
                <div className="text-[9px] font-semibold uppercase tracking-wider">{cfg.label}</div>
                {review.reviewNotes && (
                  <div className="text-[9px] border-t pt-1 mt-1">{review.reviewNotes}</div>
                )}
              </div>

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full px-3 py-2 text-[9px] border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors rounded font-semibold"
              >
                Edit Review
              </button>
            </>
          )}

          {/* Denial reason (if denied) */}
          {status === 'DENIED' && review.accessDenialReason && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded">
          <AlertTriangle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
          <div className="text-[9px] text-destructive/80">
            <div className="font-semibold mb-0.5">Denial Reason</div>
            <div className="text-slate-300">{review.accessDenialReason}</div>
          </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UserAccessReviewPanel() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentUser, setCurrentUser] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [user, allReviews] = await Promise.all([
        base44.auth.me(),
        base44.entities.OpenClawAccessReview.list('-reviewedAt', 500),
      ]);
      setCurrentUser(user);
      setReviews(allReviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedReviews = async () => {
    setSeeding(true);
    try {
      const response = await base44.functions.invoke('seedAccessReviews', {});
      setSeedResult(response.data);
      if (response.data.status === 'success') {
        setTimeout(() => fetchReviews(), 500);
      }
    } catch (err) {
      setSeedResult({ status: 'error', message: err.message });
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filtered = reviews.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'APPROVED') return r.reviewStatus === 'APPROVED';
    if (filter === 'DENIED') return r.reviewStatus === 'DENIED';
    if (filter === 'PENDING') return r.reviewStatus === 'PENDING' || r.reviewStatus === 'UNDER_REVIEW';
    return true;
  });

  const summaryStats = {
    total: reviews.length,
    approved: reviews.filter(r => r.reviewStatus === 'APPROVED').length,
    denied: reviews.filter(r => r.reviewStatus === 'DENIED').length,
    pending: reviews.filter(r => r.reviewStatus === 'PENDING' || r.reviewStatus === 'UNDER_REVIEW').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-1">Access Management</div>
          <div className="text-[13px] font-semibold text-foreground">User Access Reviews</div>
        </div>
        <Shield className="w-5 h-5 text-primary" />
      </div>

      {/* Seed button (if no reviews) */}
      {reviews.length === 0 && !seedResult && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] text-amber-500/80">
              <div className="font-semibold mb-1">No access reviews yet.</div>
              <div className="text-[9px] text-amber-500/70 mb-2">Initialize default seed reviews for OWNER, ADMIN, OPERATOR, AUDITOR, and READ_ONLY roles.</div>
            </div>
            <button
              type="button"
              onClick={handleSeedReviews}
              disabled={seeding}
              className="px-3 py-1.5 text-[9px] border border-amber-500 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors disabled:opacity-50 font-semibold rounded"
            >
              {seeding ? 'Initializing...' : '+ Initialize Default Reviews'}
            </button>
          </div>
        </div>
      )}

      {/* Seed result message */}
      {seedResult && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
          seedResult.status === 'success'
            ? 'bg-primary/5 border-primary/20'
            : seedResult.status === 'already_seeded'
            ? 'bg-blue-400/5 border-blue-400/20'
            : 'bg-destructive/5 border-destructive/20'
        }`}>
          <div className="text-[10px]">
            <div className={`font-semibold mb-0.5 ${
              seedResult.status === 'success' ? 'text-primary' :
              seedResult.status === 'already_seeded' ? 'text-blue-400' :
              'text-destructive'
            }`}>
              {seedResult.status === 'success' ? '✓ Seed reviews created' :
               seedResult.status === 'already_seeded' ? 'ℹ Seed reviews exist' :
               '✗ Error initializing'}
            </div>
            <div className={`text-[9px] ${
              seedResult.status === 'success' ? 'text-primary/70' :
              seedResult.status === 'already_seeded' ? 'text-blue-400/70' :
              'text-destructive/70'
            }`}>
              {seedResult.message}
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Access reviews are persistent and audit-tracked.</div>
          <div className="text-[9px] text-primary/70">Each access review is saved with reviewer identity, timestamp, and notes. Reviews can be approved, denied, or marked for further review.</div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Total Users</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">Approved</div>
          <div className="text-[14px] font-semibold text-primary">{summaryStats.approved}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">Pending</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.pending}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">Denied</div>
          <div className="text-[14px] font-semibold text-destructive">{summaryStats.denied}</div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-1.5">
        {['ALL', 'APPROVED', 'PENDING', 'DENIED'].map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[9px] border transition-colors whitespace-nowrap rounded font-semibold ${
              filter === f
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-slate-400 hover:text-slate-200 hover:bg-secondary/50'
            }`}
          >
            {f} ({f === 'ALL' ? summaryStats.total : f === 'APPROVED' ? summaryStats.approved : f === 'PENDING' ? summaryStats.pending : summaryStats.denied})
          </button>
        ))}
      </div>

      {/* Role guidance */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[11px] font-semibold text-foreground mb-3 uppercase tracking-wider">Role Assignment Guidance</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px]">
          <div className="border border-border/50 bg-card/30 px-3 py-2 rounded space-y-1">
            <div className="font-semibold text-foreground">OWNER</div>
            <div className="text-slate-400">Full platform access including connector management, checklist reviews, command approvals, and audit access. Live execution remains disabled.</div>
          </div>
          <div className="border border-border/50 bg-card/30 px-3 py-2 rounded space-y-1">
            <div className="font-semibold text-foreground">ADMIN</div>
            <div className="text-slate-400">System administration: connectors, approvals, checklist reviews, audits. No execution privileges. Governance constraints always enforced.</div>
          </div>
          <div className="border border-border/50 bg-card/30 px-3 py-2 rounded space-y-1">
            <div className="font-semibold text-foreground">OPERATOR</div>
            <div className="text-slate-400">Command approvals, read-only tests, checklist reviews, audit access. Cannot manage connectors or system settings.</div>
          </div>
          <div className="border border-border/50 bg-card/30 px-3 py-2 rounded space-y-1">
            <div className="font-semibold text-foreground">AUDITOR</div>
            <div className="text-slate-400">Read-only audit and monitoring. View logs, commands, workflows, and historical execution records. No approvals or system changes.</div>
          </div>
          <div className="border border-border/50 bg-card/30 px-3 py-2 rounded space-y-1">
            <div className="font-semibold text-foreground">READ_ONLY</div>
            <div className="text-slate-400">System visibility only. View panels, status, and overview data. No audit access, no execution, no modifications.</div>
          </div>
          <div className="border border-border/50 bg-destructive/5 border-destructive/20 px-3 py-2 rounded space-y-1">
            <div className="font-semibold text-destructive">LIVE EXECUTION</div>
            <div className="text-destructive/80">Disabled for all roles. All operations remain in SIMULATED or READ_ONLY mode. No role can enable live execution.</div>
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-2">
        {loading ? (
          <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-semibold">Loading access reviews…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-semibold">No {filter.toLowerCase()} access reviews found</div>
        ) : (
          filtered.map(review => (
            <AccessReviewCard
              key={review.id}
              review={review}
              onSaved={fetchReviews}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-[9px] text-slate-300">
        <Shield className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <div>
          <div className="font-semibold mb-0.5 text-foreground">Access control is enforced server-side.</div>
          <div className="text-[8px] text-slate-400">Reviews are persistent records of access approvals and denials. Denials prevent panel access. Live execution is globally disabled. All governance and safety constraints are applied at the backend level.</div>
        </div>
      </div>
    </div>
  );
}