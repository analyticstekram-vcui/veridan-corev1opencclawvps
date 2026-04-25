import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, ArrowDownCircle } from 'lucide-react';

function centsToDisplay(cents) {
  if (cents == null) return '$0';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

const inputCls = "w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors";

export default function DrawCreditModal({ facility, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [sourceAccount, setSourceAccount] = useState(facility.cashAccount || '');
  const [destAccount, setDestAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const maxDrawCents = facility.availableCreditCents || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!amountCents || amountCents <= 0) { setError('Enter a valid amount.'); return; }
    if (amountCents > maxDrawCents) { setError(`Exceeds available credit of ${centsToDisplay(maxDrawCents)}.`); return; }

    setLoading(true);
    setError(null);

    // Optimistic: call onSuccess immediately, then persist ledger event
    try {
      const newBalance = (facility.currentBalanceCents || 0) + amountCents;
      const newAvailable = (facility.availableCreditCents || 0) - amountCents;

      // Update facility balance
      await base44.entities.CreditFacility.update(facility.id, {
        currentBalanceCents: newBalance,
        availableCreditCents: newAvailable,
      });

      // Create ledger event
      await base44.entities.CreditLedgerEvent.create({
        creditFacilityId: facility.id,
        eventDate: new Date().toISOString().slice(0, 10),
        eventType: 'draw',
        description: description || `Draw from ${facility.facilityName}`,
        amountCents,
        balanceAfterCents: newBalance,
        availableAfterCents: newAvailable,
        sourceAccount: sourceAccount || facility.cashAccount || '',
        destinationAccount: destAccount,
      });

      onSuccess(amountCents);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-blue-400" />
            <h2 className="text-[13px] font-mono font-semibold">Draw Credit</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-3 bg-secondary/30 border-b border-border text-[11px] font-mono space-y-0.5">
          <div className="text-muted-foreground/60">Facility: <span className="text-foreground">{facility.facilityName}</span></div>
          <div className="text-muted-foreground/60">Available: <span className="text-primary">{centsToDisplay(facility.availableCreditCents)}</span></div>
          <div className="text-muted-foreground/60">Current Balance: <span className="text-amber-500">{centsToDisplay(facility.currentBalanceCents)}</span></div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">
              Draw Amount ($)<span className="text-destructive">*</span>
            </label>
            <input
              type="number" step="0.01" min="0.01"
              className={inputCls}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Description</label>
            <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="Purpose of draw..." />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Source Account</label>
            <input className={inputCls} value={sourceAccount} onChange={e => setSourceAccount(e.target.value)} placeholder="Account reference" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Destination Account</label>
            <input className={inputCls} value={destAccount} onChange={e => setDestAccount(e.target.value)} placeholder="Account reference" />
          </div>
          {error && <div className="text-[11px] font-mono text-destructive">{error}</div>}
        </form>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white text-[11px] font-mono hover:bg-blue-600 transition-colors disabled:opacity-50">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />} Confirm Draw
          </button>
        </div>
      </div>
    </div>
  );
}