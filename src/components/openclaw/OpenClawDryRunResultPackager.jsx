/**
 * OpenClawDryRunResultPackager
 * Local-only result packager that packages the latest VALID_PREVIEW validation
 * result and latest simulation preview into a dry-run result artifact.
 *
 * Reads:  openclawDryRunSimulationPreviewValidationResults
 *         openclawDryRunSimulationPreviews
 *         openclawDryRunActionDrafts
 *         openclawDryRunActionDraftValidationResults
 *
 * Writes: openclawDryRunResultPackages (ONLY)
 *
 * No fetch, no axios, no SDK, no OpenClaw, no API, no execution, no credentials.
 * This packager only creates a local dry-run result artifact from validated preview data.
 */
import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, AlertCircle, Package,
  Download, Copy, RefreshCw, ChevronDown, XCircle
} from 'lucide-react';

// ── Storage keys ───────────────────────────────────────────────────────────────
const PREVIEW_VALIDATIONS_KEY  = 'openclawDryRunSimulationPreviewValidationResults';
const PREVIEWS_KEY             = 'openclawDryRunSimulationPreviews';
const DRAFTS_KEY               = 'openclawDryRunActionDrafts';
const DRAFT_VALIDATIONS_KEY    = 'openclawDryRunActionDraftValidationResults';
const PACKAGES_KEY             = 'openclawDryRunResultPackages';

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function loadSourceData() {
  const previewValidations = (() => { const r = loadJSON(PREVIEW_VALIDATIONS_KEY, []); return Array.isArray(r) ? r : []; })();
  const previews           = (() => { const r = loadJSON(PREVIEWS_KEY,             []); return Array.isArray(r) ? r : []; })();
  const drafts             = (() => { const r = loadJSON(DRAFTS_KEY,               []); return Array.isArray(r) ? r : []; })();
  const draftValidations   = (() => { const r = loadJSON(DRAFT_VALIDATIONS_KEY,    []); return Array.isArray(r) ? r : []; })();
  return { previewValidations, previews, drafts, draftValidations };
}

// ── Readiness evaluation (12 rules) ───────────────────────────────────────────
function evalReadiness(source) {
  const { previewValidations, previews } = source;
  const latestVal     = previewValidations[0] ?? null;
  const latestPreview = previews[0]           ?? null;

  const rule1  = previewValidations.length > 0;
  const rule2  = latestVal?.validationStatus    === 'VALID_PREVIEW';
  const rule3  = latestVal?.executionStatus     === 'NOT_EXECUTED';
  const rule4  = latestVal?.simulationStatus    === 'PREVIEW_ONLY';
  const rule5  = latestVal?.liveExecutionStatus === 'DISABLED';
  const rule6  = latestVal?.tradingStatus       === 'DISABLED';
  const rule7  = latestVal?.browserAutomationStatus === 'DISABLED';
  const rule8  = latestVal?.apiCallStatus       === 'DISABLED';
  const rule9  = latestVal?.credentialStatus    === 'NOT_ACCESSED';
  const rule10 = latestVal?.moneyMovementStatus === 'DISABLED';
  const rule11 = previews.length > 0;
  const rule12 = latestPreview?.previewStatus   === 'PREVIEW_READY';

  const ready = rule1 && rule2 && rule3 && rule4 && rule5 && rule6 &&
                rule7 && rule8 && rule9 && rule10 && rule11 && rule12;

  return {
    latestVal,
    latestPreview,
    rules: { rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8, rule9, rule10, rule11, rule12 },
    ready,
    status: ready ? 'PACKAGE_READY' : 'HOLD',
  };
}

// ── Result summary builder ─────────────────────────────────────────────────────
function buildResultSummary(preview, draft) {
  const actionType = preview?.sourceActionType ?? draft?.actionType ?? 'UNKNOWN';
  const riskTier   = preview?.sourceRiskTier   ?? draft?.riskTier  ?? 'UNKNOWN';
  return {
    packageType:       'DRY_RUN_RESULT_PACKAGE',
    actionType,
    riskTier,
    intendedEffect:    preview?.intendedEffectPreview   ?? draft?.intendedEffect   ?? '(not specified)',
    expectedInputs:    preview?.expectedInputsPreview   ?? draft?.expectedInputs   ?? '(not specified)',
    expectedOutputs:   preview?.expectedOutputsPreview  ?? draft?.expectedOutputs  ?? '(not specified)',
    stepCount:         Array.isArray(preview?.simulatedStepsPreview) ? preview.simulatedStepsPreview.length : 0,
    blockedCount:      Array.isArray(preview?.blockedCapabilities)   ? preview.blockedCapabilities.length   : 0,
    packageConclusion: 'DRY_RUN_COMPLETED_PREVIEW_ONLY — no execution, no simulation against real systems',
  };
}

// ── Package builder ────────────────────────────────────────────────────────────
function buildPackage(source, readiness) {
  const { drafts } = source;
  const { latestVal, latestPreview, status } = readiness;
  const latestDraft = drafts[0] ?? null;

  const packagedSteps       = latestPreview?.simulatedStepsPreview  ?? [];
  const packagedBlocked     = latestPreview?.blockedCapabilities     ?? [];
  const resultSummary       = buildResultSummary(latestPreview, latestDraft);

  return {
    dryRunResultPackageId: `dry-run-result-pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    packagedAt:            new Date().toISOString(),
    packageMode:           'DRY_RUN_RESULT_PACKAGE',
    packageStatus:         status,

    executionStatus:         'NOT_EXECUTED',
    simulationStatus:        'RESULT_PACKAGE_ONLY',
    liveExecutionStatus:     'DISABLED',
    tradingStatus:           'DISABLED',
    browserAutomationStatus: 'DISABLED',
    apiCallStatus:           'DISABLED',
    credentialStatus:        'NOT_ACCESSED',
    moneyMovementStatus:     'DISABLED',

    sourcePreviewValidationResultId: latestVal?.previewValidationResultId ?? null,
    sourcePreviewValidationStatus:   latestVal?.validationStatus           ?? null,
    sourceSimulationPreviewId:       latestPreview?.simulationPreviewId    ?? null,
    sourcePreviewStatus:             latestPreview?.previewStatus          ?? null,
    sourceDraftActionId:             latestPreview?.sourceDraftActionId    ?? latestDraft?.draftActionId  ?? null,
    sourceActionType:                latestPreview?.sourceActionType       ?? latestDraft?.actionType     ?? null,
    sourceRiskTier:                  latestPreview?.sourceRiskTier         ?? latestDraft?.riskTier       ?? null,

    packagedSimulationSteps:   packagedSteps,
    packagedBlockedCapabilities: packagedBlocked,
    resultSummary,

    packageReadinessRules: {
      rule1_atLeastOnePreviewValidationResultExists:                 readiness.rules.rule1,
      rule2_latestValidationStatusIsVALID_PREVIEW:                  readiness.rules.rule2,
      rule3_latestValidationExecutionStatusIsNOT_EXECUTED:          readiness.rules.rule3,
      rule4_latestValidationSimulationStatusIsPREVIEW_ONLY:         readiness.rules.rule4,
      rule5_latestValidationLiveExecutionStatusIsDISABLED:          readiness.rules.rule5,
      rule6_latestValidationTradingStatusIsDISABLED:                readiness.rules.rule6,
      rule7_latestValidationBrowserAutomationStatusIsDISABLED:      readiness.rules.rule7,
      rule8_latestValidationApiCallStatusIsDISABLED:                readiness.rules.rule8,
      rule9_latestValidationCredentialStatusIsNOT_ACCESSED:         readiness.rules.rule9,
      rule10_latestValidationMoneyMovementStatusIsDISABLED:         readiness.rules.rule10,
      rule11_atLeastOneSimulationPreviewExists:                     readiness.rules.rule11,
      rule12_latestPreviewPreviewStatusIsPREVIEW_READY:             readiness.rules.rule12,
      allRulesPass:      readiness.ready,
      resultingPackageStatus: status,
    },

    safetyBoundary: {
      statement: 'This result package does NOT authorize any of the following.',
      packageExecutesActions:          false,
      packageSimulatesAgainstRealData: false,
      packageCallsExternalAPIs:        false,
      liveExecutionAuthorized:         false,
      tradingAuthorized:               false,
      browserAutomationAuthorized:     false,
      apiCallsAuthorized:              false,
      credentialAccessAuthorized:      false,
      moneyMovementAuthorized:         false,
      scheduledRunnerAuthorized:       false,
      secretValueExposureAuthorized:   false,
      rawResponseExposureAuthorized:   false,
      nextRequiredStep:
        status === 'PACKAGE_READY'
          ? 'OPERATOR_MAY_REVIEW_THIS_RESULT_PACKAGE_AS_DRY_RUN_EVIDENCE'
          : 'RESOLVE_ALL_HOLD_CONDITIONS_BEFORE_PACKAGE_GENERATION_IS_ALLOWED',
    },

    nonExecutionProof: {
      fetchCalled:                            false,
      axiosCalled:                            false,
      base44SdkCalled:                        false,
      openClawCalled:                         false,
      apiCalled:                              false,
      browserAutomationPerformed:             false,
      tradingPerformed:                       false,
      credentialHandled:                      false,
      processEnvAccessed:                     false,
      denoEnvAccessed:                        false,
      networkCallsMade:                       false,
      executionDispatched:                    false,
      customEventsFired:                      false,
      previewValidationResultsModified:       false,
      simulationPreviewsModified:             false,
      draftsModified:                         false,
      draftValidationResultsModified:         false,
      writeTargetKey:                         PACKAGES_KEY,
    },
  };
}

// ── UI sub-components ──────────────────────────────────────────────────────────
function RuleRow({ label, pass, failNote }) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 bg-secondary/20 rounded">
      {pass
        ? <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        : <XCircle className="w-3 h-3 shrink-0 mt-0.5 text-destructive" />}
      <div className="flex-1">
        <span className="text-[8px] text-slate-300">{label}</span>
        {!pass && failNote && <div className="text-[7px] text-destructive/80 mt-0.5">{failNote}</div>}
      </div>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${pass ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
        {pass ? 'PASS' : 'HOLD'}
      </span>
    </div>
  );
}

function PackageRecord({ record, idx }) {
  const [expanded, setExpanded] = useState(false);
  const isReady = record.packageStatus === 'PACKAGE_READY';
  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[7px] font-mono text-slate-600">#{idx + 1}</span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${isReady ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
              {record.packageStatus}
            </span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-slate-400 border-slate-400/20 bg-slate-400/5">
              {record.sourceActionType ?? '—'}
            </span>
          </div>
          <div className="text-[7px] font-mono text-slate-500">{record.dryRunResultPackageId}</div>
          <div className="text-[7px] text-slate-600">{new Date(record.packagedAt).toLocaleString()} · risk: {record.sourceRiskTier ?? '—'}</div>
        </div>
        <button type="button" onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[7px] text-primary font-bold hover:text-primary/80 shrink-0">
          JSON <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3">
          <pre className="text-[7px] font-mono text-slate-400 bg-secondary/20 rounded p-2 border border-border/40 overflow-auto max-h-48">
            {JSON.stringify(record, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OpenClawDryRunResultPackager() {
  const [source, setSource]         = useState(() => loadSourceData());
  const [packages, setPackages]     = useState(() => loadJSON(PACKAGES_KEY, []));
  const [lastAction, setLastAction] = useState(null);
  const [copied, setCopied]         = useState(false);

  const latestPackage = packages[0] ?? null;
  const recent5       = packages.slice(0, 5);

  const readiness = useMemo(() => evalReadiness(source), [source]);
  const { latestVal, latestPreview, rules, status } = readiness;
  const latestDraft = source.drafts[0] ?? null;
  const isReady = status === 'PACKAGE_READY';

  const handleRefresh = () => {
    setSource(loadSourceData());
    setPackages(loadJSON(PACKAGES_KEY, []));
    setLastAction('Source data refreshed from localStorage.');
  };

  const handleGenerate = () => {
    const pkg     = buildPackage(source, readiness);
    const updated = [pkg, ...packages].slice(0, 20);
    try { localStorage.setItem(PACKAGES_KEY, JSON.stringify(updated)); } catch {}
    setPackages(updated);
    setLastAction(`Package generated — ${pkg.dryRunResultPackageId} — ${pkg.packageStatus}`);
  };

  const handleCopy = () => {
    if (!latestPackage) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(latestPackage, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Latest result package JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  const handleDownload = () => {
    if (!latestPackage) return;
    try {
      const blob = new Blob([JSON.stringify(latestPackage, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `openclaw-dry-run-result-pkg-${latestPackage.dryRunResultPackageId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Result package JSON downloaded.');
    } catch { setLastAction('Download failed.'); }
  };

  const statusCfg = isReady
    ? { border: 'border-primary/30',   bg: 'bg-primary/5',   icon: CheckCircle2, iconColor: 'text-primary',   text: 'text-primary',   badge: 'text-primary border-primary/30 bg-primary/5' }
    : { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: AlertCircle,  iconColor: 'text-amber-500', text: 'text-amber-500', badge: 'text-amber-500 border-amber-500/30 bg-amber-500/5' };
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Local-Only Result Packager</div>
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Dry-Run Result Packager
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Packages the latest VALID_PREVIEW result and simulation preview into a dry-run result artifact.
            Does not execute or simulate. Writes only to <span className="font-mono">openclawDryRunResultPackages</span>.
          </div>
        </div>
        <button type="button" onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Source
        </button>
      </div>

      {/* Readiness status banner */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${statusCfg.border} ${statusCfg.bg}`}>
        <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${statusCfg.iconColor}`} />
        <div className="flex-1">
          <div className={`text-[11px] font-bold uppercase tracking-wider ${statusCfg.text}`}>
            {isReady
              ? 'PACKAGE_READY — All 12 readiness rules satisfied'
              : 'HOLD — One or more readiness rules not satisfied'}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            {source.previewValidations.length} preview validation result(s) · {source.previews.length} simulation preview(s) · {source.drafts.length} draft(s)
          </div>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusCfg.badge}`}>{status}</span>
      </div>

      {/* Source reference strip */}
      <div className="bg-card border border-border/60 rounded-lg px-4 py-3 space-y-1.5">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Source References</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8px]">
          <div>
            <span className="text-slate-500">Preview Validation Result ID: </span>
            <span className={`font-mono text-[7px] ${latestVal ? 'text-slate-300' : 'text-slate-600'}`}>{latestVal?.previewValidationResultId ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Validation Status: </span>
            <span className={`font-bold font-mono ${latestVal?.validationStatus === 'VALID_PREVIEW' ? 'text-primary' : 'text-destructive'}`}>
              {latestVal?.validationStatus ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Simulation Preview ID: </span>
            <span className={`font-mono text-[7px] ${latestPreview ? 'text-slate-300' : 'text-slate-600'}`}>{latestPreview?.simulationPreviewId ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Preview Status: </span>
            <span className={`font-bold font-mono ${latestPreview?.previewStatus === 'PREVIEW_READY' ? 'text-primary' : 'text-amber-500'}`}>
              {latestPreview?.previewStatus ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Source Draft Action ID: </span>
            <span className={`font-mono text-[7px] ${latestPreview?.sourceDraftActionId ?? latestDraft?.draftActionId ? 'text-slate-300' : 'text-slate-600'}`}>
              {latestPreview?.sourceDraftActionId ?? latestDraft?.draftActionId ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Action Type / Risk: </span>
            <span className="font-mono text-[7px] text-slate-300">
              {latestPreview?.sourceActionType ?? latestDraft?.actionType ?? '—'} · {latestPreview?.sourceRiskTier ?? latestDraft?.riskTier ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Readiness rules */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Package Readiness Rules</div>
        <div className="space-y-1.5">
          <RuleRow label="Rule 1 — At least one preview validation result exists"
            pass={rules.rule1} failNote="Generate a preview validation result first." />
          <RuleRow label='Rule 2 — Latest preview validationStatus === "VALID_PREVIEW"'
            pass={rules.rule2} failNote={`Found: ${latestVal?.validationStatus ?? 'none'}`} />
          <RuleRow label='Rule 3 — Latest preview validation executionStatus === "NOT_EXECUTED"'
            pass={rules.rule3} failNote={`Found: ${latestVal?.executionStatus ?? 'none'}`} />
          <RuleRow label='Rule 4 — Latest preview validation simulationStatus === "PREVIEW_ONLY"'
            pass={rules.rule4} failNote={`Found: ${latestVal?.simulationStatus ?? 'none'}`} />
          <RuleRow label='Rule 5 — Latest preview validation liveExecutionStatus === "DISABLED"'
            pass={rules.rule5} failNote={`Found: ${latestVal?.liveExecutionStatus ?? 'none'}`} />
          <RuleRow label='Rule 6 — Latest preview validation tradingStatus === "DISABLED"'
            pass={rules.rule6} failNote={`Found: ${latestVal?.tradingStatus ?? 'none'}`} />
          <RuleRow label='Rule 7 — Latest preview validation browserAutomationStatus === "DISABLED"'
            pass={rules.rule7} failNote={`Found: ${latestVal?.browserAutomationStatus ?? 'none'}`} />
          <RuleRow label='Rule 8 — Latest preview validation apiCallStatus === "DISABLED"'
            pass={rules.rule8} failNote={`Found: ${latestVal?.apiCallStatus ?? 'none'}`} />
          <RuleRow label='Rule 9 — Latest preview validation credentialStatus === "NOT_ACCESSED"'
            pass={rules.rule9} failNote={`Found: ${latestVal?.credentialStatus ?? 'none'}`} />
          <RuleRow label='Rule 10 — Latest preview validation moneyMovementStatus === "DISABLED"'
            pass={rules.rule10} failNote={`Found: ${latestVal?.moneyMovementStatus ?? 'none'}`} />
          <RuleRow label="Rule 11 — At least one simulation preview exists"
            pass={rules.rule11} failNote="Generate a simulation preview first." />
          <RuleRow label='Rule 12 — Latest simulation preview previewStatus === "PREVIEW_READY"'
            pass={rules.rule12} failNote={`Found: ${latestPreview?.previewStatus ?? 'none'}`} />
        </div>
      </div>

      {/* Packaged simulation steps preview */}
      {latestPreview?.simulatedStepsPreview?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Packaged Simulation Steps ({latestPreview.simulatedStepsPreview.length})
            <span className="ml-2 text-[8px] text-primary/60 normal-case font-normal">(local text only — no execution)</span>
          </div>
          <div className="space-y-1.5">
            {latestPreview.simulatedStepsPreview.map((s, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-1.5 bg-secondary/20 rounded">
                <span className="text-[7px] font-mono text-slate-500 shrink-0 mt-0.5 w-28">{s.step}</span>
                <span className="text-[8px] text-slate-300 flex-1">{s.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packaged blocked capabilities preview */}
      {latestPreview?.blockedCapabilities?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Packaged Blocked Capabilities ({latestPreview.blockedCapabilities.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {latestPreview.blockedCapabilities.map(cap => (
              <div key={cap} className="flex items-center gap-1.5 px-2 py-1 bg-destructive/5 border border-destructive/20 rounded text-[8px]">
                <XCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="font-mono text-destructive/70">{cap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last action */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded">
          <Package className="w-3.5 h-3.5" />
          Generate Dry-Run Result Package
        </button>
        <button type="button" onClick={handleCopy} disabled={!latestPackage}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Result Package JSON'}
        </button>
        <button type="button" onClick={handleDownload} disabled={!latestPackage}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          Download Latest Result Package JSON
        </button>
      </div>

      {/* Latest package JSON */}
      {latestPackage && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Result Package</span>
            <span className="text-[7px] font-mono text-slate-500">{new Date(latestPackage.packagedAt).toLocaleString()}</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { k: 'Package Mode',    v: latestPackage.packageMode,              mono: true },
              { k: 'Package Status',  v: latestPackage.packageStatus,            mono: true },
              { k: 'Action Type',     v: latestPackage.sourceActionType ?? '—',  mono: true },
              { k: 'Risk Tier',       v: latestPackage.sourceRiskTier   ?? '—',  mono: true },
              { k: 'Exec Status',     v: latestPackage.executionStatus,          mono: true },
              { k: 'Simulation',      v: latestPackage.simulationStatus,         mono: true },
              { k: 'Live Execution',  v: latestPackage.liveExecutionStatus,      mono: true },
              { k: 'Trading',         v: latestPackage.tradingStatus,            mono: true },
              { k: 'Browser Auto',    v: latestPackage.browserAutomationStatus,  mono: true },
              { k: 'API Calls',       v: latestPackage.apiCallStatus,            mono: true },
              { k: 'Credentials',     v: latestPackage.credentialStatus,         mono: true },
              { k: 'Money Movement',  v: latestPackage.moneyMovementStatus,      mono: true },
            ].map(({ k, v, mono }) => (
              <div key={k} className="bg-card border border-border/40 px-3 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5 font-semibold">{k}</div>
                <div className={`font-bold text-foreground ${mono ? 'font-mono text-[7px] break-all' : 'text-[9px]'}`}>{String(v)}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 space-y-1.5">
            <div className="text-[8px] text-slate-400"><span className="font-semibold text-slate-500 uppercase tracking-wider">Intended Effect: </span>{latestPackage.resultSummary?.intendedEffect}</div>
            <div className="text-[8px] text-slate-400"><span className="font-semibold text-slate-500 uppercase tracking-wider">Conclusion: </span>{latestPackage.resultSummary?.packageConclusion}</div>
            <div className="text-[7px] font-mono text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1 mt-1">
              nextRequiredStep: {latestPackage.safetyBoundary?.nextRequiredStep}
            </div>
          </div>
        </div>
      )}

      {/* Last 5 package records */}
      {recent5.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Recent Result Packages ({recent5.length} of {packages.length})
            </span>
          </div>
          <div>
            {recent5.map((rec, i) => <PackageRecord key={rec.dryRunResultPackageId || i} record={rec} idx={i} />)}
          </div>
        </div>
      )}

      {/* Safety block */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Result Packager Safety Guarantee</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 text-[8px] text-slate-400">
          {[
            'No fetch or axios',
            'No Base44 SDK call',
            'No OpenClaw call',
            'No API or network call',
            'No browser automation',
            'No trading logic',
            'No credential handling',
            'No process.env or Deno.env',
            'No execution dispatch',
            'No CustomEvent or dispatchEvent',
            'No real system executed or simulated',
            'Preview validation results never modified',
            'Simulation previews never modified',
            'Drafts never modified',
            'Draft validation results never modified',
            'Writes only to openclawDryRunResultPackages',
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <Package className="w-3 h-3 shrink-0" />
        packageMode = DRY_RUN_RESULT_PACKAGE · executionStatus = NOT_EXECUTED · simulationStatus = RESULT_PACKAGE_ONLY · liveExecutionStatus = DISABLED · No network · No dispatch
      </div>
    </div>
  );
}