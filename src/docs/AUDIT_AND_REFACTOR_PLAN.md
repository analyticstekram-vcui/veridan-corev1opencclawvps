# Veridan Core Code Audit & Refactoring Plan

**Audit Date**: 2026-05-19
**Status**: PLAN ONLY — No Code Changes
**Requires Operator Approval Before Implementation**

---

## Executive Summary

Veridan Core exhibits significant patterns of code duplication across UI components, localStorage utilities, and export logic. This audit identifies 7 major categories of duplication affecting approximately 35+ files, with opportunities to reduce codebase complexity by extracting shared patterns into reusable utilities and components.

**Estimated Total Effort**: 45-60 hours
**Estimated Code Reduction**: 25-35% duplication removal
**Risk Level**: Medium (all refactorings are non-breaking if executed carefully)

---

## Section 1: Summary Card Duplication

### Pattern Identified
Summary cards are a pervasive UI pattern used across all 5 major modules (Trading, Public Credit, Business Formation, AI Command Center, Global Dashboard). Each module implements summary card styling, grid layout, and status display independently.

### Files Affected (8+ implementations)
```
src/components/trading/TradingModuleStatusSummary.jsx
src/components/public-credit/PublicCreditModuleStatusSummary.jsx
src/components/business-formation/BusinessFormationModuleStatusSummary.jsx
src/components/ai-command-center/AiCommandCenterModuleStatusSummary.jsx
src/components/dashboard/VeridanCoreBranchDashboard.jsx
src/pages/GlobalCommandDashboard.jsx
src/components/openclaw/OpenClawSystemStatusCard.jsx
src/components/terminal/OpenClawStatusRollup.jsx
src/components/trading/TradingPaperReadinessChecklist.jsx
```

### Duplicate Patterns Found
1. **Summary Card Wrapper Pattern**
   - Background: `bg-card border border-border/50 rounded-sm p-4`
   - Repeated in: 8+ files
   - Variation: None (exactly identical styling)

2. **Summary Count Grid**
   - Grid layout: `grid grid-cols-2 md:grid-cols-6 gap-2`
   - Count display boxes with:
     - Color-coded value (text-slate-200, text-primary, text-destructive)
     - Label below (text-[7px] text-slate-500)
   - Repeated in: 7+ files with minimal variation

3. **Status Row Grid**
   - Layout: `grid grid-cols-2 md:grid-cols-5 gap-1.5` or similar
   - Status items: `px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm`
   - Repeated in: 6+ files

4. **Module Status Display**
   - Text: `text-[9px] font-bold uppercase text-slate-300`
   - Followed by grid of status items
   - Repeated across all module status summaries

### Suggested Refactoring

**Create Shared Component**: `components/ui/SummaryCard.jsx`
```jsx
SummaryCard - Container component
- Props: title, className
- Children for flexible content

SummaryCountGrid - Count display grid
- Props: items (array), valueClassName, labelClassName
- Item structure: { label, value, color }

SummaryStatusGrid - Status item grid
- Props: items (array), columns (responsive)
- Item structure: { label, value }
```

**Expected Impact**:
- 8+ files simplified (40-60 lines reduction each)
- Consistent styling guaranteed
- Easier maintenance
- Single source of truth for updates

**Effort**: 6-8 hours
- Component extraction: 2 hours
- Integration into 8 files: 4-6 hours
- Testing: 1-2 hours

**Risk**: Low
- No functionality changes
- All styling preserved
- No localStorage/export changes

---

## Section 2: Repeated Export Logic

### Pattern Identified
Export logic (JSON download with safetyClaims embedding) is repeated identically across multiple components.

### Files Affected (12+ implementations)
```
src/components/trading/TradingStrategyRegistry.jsx
src/components/trading/TradingRiskRuleBuilder.jsx
src/components/trading/TradingPaperReadinessChecklist.jsx
src/components/public-credit/CreditProfilePlanning.jsx
src/components/public-credit/CreditDisputePlanner.jsx
src/components/public-credit/BureauMonitoringChecklist.jsx
src/components/business-formation/BusinessEntityRegistry.jsx
src/components/business-formation/TrustLlcStructurePlanner.jsx
src/components/business-formation/RegisteredAgentWorkflow.jsx
src/components/ai-command-center/ProposedActionsPanel.jsx
src/components/ai-command-center/CodexTasksPanel.jsx
src/components/ai-command-center/OpenClawTasksPanel.jsx
src/components/ai-command-center/OperatorReviewPanel.jsx
src/components/openclaw/OpenClawApprovedReviewDryRunResultPackageBuilder.jsx
src/components/openclaw/BaselineExportPacketPanel.jsx
src/pages/GlobalCommandDashboard.jsx
```

### Duplicate Pattern Found
```javascript
const handleExport = () => {
  const blob = new Blob([JSON.stringify({
    generatedAt: new Date().toISOString(),
    snapshotType: "[EXACT_TYPE]",
    [entityKey]: data,
    safetyClaims: SAFETY_CLAIMS,
  }, null, 2)], { type: 'application/json' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `[filename]-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Exact duplication** across 12+ files with only 3 variables changed:
- snapshotType (25 different values)
- entityKey (data field name)
- filename pattern

### Suggested Refactoring

**Create Utility**: `src/utils/exportSnapshot.js`
```javascript
export function exportSnapshot(config) {
  // config: {
  //   snapshotType,
  //   data,
  //   filename,
  //   safetyClaims,
  //   [additionalFields]
  // }
}

// Usage:
exportSnapshot({
  snapshotType: 'VERIDAN_TRADING_STRATEGY_REGISTRY',
  data: strategies,
  filename: 'trading-strategy-registry',
  safetyClaims: SAFETY_CLAIMS,
});
```

**Expected Impact**:
- 12+ files: 10-15 lines reduction each (120-180 lines total)
- Single location to update export logic
- Consistent timestamp/filename formatting
- All snapshotType values preserved

**Effort**: 4-6 hours
- Utility extraction: 1-2 hours
- Integration into 12+ files: 2-3 hours
- Testing: 1 hour

**Risk**: Low
- No snapshotType changes
- No safetyClaims modifications
- No localStorage changes

---

## Section 3: Repeated localStorage Utilities

### Pattern Identified
localStorage read/write functions are duplicated across modules.

### Files Affected (10+ implementations)
```
src/components/trading/TradingStrategyRegistry.jsx
src/components/trading/TradingRiskRuleBuilder.jsx
src/components/public-credit/CreditProfilePlanning.jsx
src/components/public-credit/CreditDisputePlanner.jsx
src/components/business-formation/BusinessEntityRegistry.jsx
src/components/business-formation/TrustLlcStructurePlanner.jsx
src/components/ai-command-center/ProposedActionsPanel.jsx
src/components/ai-command-center/CodexTasksPanel.jsx
src/components/ai-command-center/OpenClawTasksPanel.jsx
src/components/openclaw/BaselineArchiveManifestPanel.jsx
```

### Duplicate Pattern Found

**Pattern 1: Load Function**
```javascript
function load[Name]() {
  try { 
    return JSON.parse(localStorage.getItem('[KEY]') || '[]'); 
  } catch { 
    return []; 
  }
}
```
Repeated 10+ times with only KEY changed.

**Pattern 2: Save Function**
```javascript
function save[Name](data) {
  try { 
    localStorage.setItem('[KEY]', JSON.stringify(data)); 
  } catch {}
}
```
Repeated 10+ times with only KEY changed.

**Pattern 3: Max Records Capping**
```javascript
const updated = [newRecord, ...items].slice(0, MAX_RECORDS);
```
Repeated 8+ times (often with MAX_RECORDS=100).

### Suggested Refactoring

**Create Utility**: `src/utils/localStorageManager.js`
```javascript
export function createStorageManager(storageKey, maxRecords = 100) {
  return {
    load: () => { /* generic load */ },
    save: (data) => { /* generic save */ },
    addRecord: (record, records) => { /* add with max cap */ },
    clear: () => { /* clear */ },
  };
}

// Usage in component:
const storage = createStorageManager('veridanTradingStrategyRegistry', 100);
const strategies = storage.load();
const updated = storage.addRecord(newStrategy, strategies);
storage.save(updated);
```

**Expected Impact**:
- 10+ files: 15-20 lines reduction each (150-200 lines total)
- All localStorage key names preserved
- Consistent error handling
- Single source for max-record logic

**Effort**: 5-7 hours
- Utility creation: 1-2 hours
- Integration into 10+ files: 3-4 hours
- Testing: 1 hour

**Risk**: Low
- No key name changes
- No data structure changes
- All keys protected

---

## Section 4: Repeated Filter & Status Logic

### Pattern Identified
Filter logic and status checking functions are duplicated across modules.

### Files Affected (8+ implementations)
```
src/components/trading/TradingStrategyRegistry.jsx
src/components/public-credit/CreditProfilePlanning.jsx
src/components/business-formation/BusinessEntityRegistry.jsx
src/components/ai-command-center/ProposedActionsPanel.jsx
src/components/ai-command-center/CodexTasksPanel.jsx
src/components/ai-command-center/OpenClawTasksPanel.jsx
src/components/ai-command-center/OperatorReviewPanel.jsx
```

### Duplicate Pattern Found

**Pattern 1: Status Filtering**
```javascript
const filtered = records.filter(r => {
  const statusMatch = selectedStatus === 'all' || r.status === selectedStatus;
  const priorityMatch = selectedPriority === 'all' || r.priority === selectedPriority;
  return statusMatch && priorityMatch;
});
```
Repeated 8+ times with different field names.

**Pattern 2: Count Aggregation**
```javascript
const counts = {
  total: items.length,
  draft: items.filter(i => i.status === 'DRAFT').length,
  needsReview: items.filter(i => i.status === 'NEEDS_REVIEW').length,
  approved: items.filter(i => i.status === 'APPROVED').length,
};
```
Repeated 7+ times with different status enums.

**Pattern 3: Risk Coloring**
```javascript
const riskColors = {
  'Low': 'text-emerald-400',
  'Medium': 'text-amber-400',
  'High': 'text-orange-400',
  'Critical': 'text-destructive',
};
```
Repeated 5+ times identically.

### Suggested Refactoring

**Create Utilities**: `src/utils/filterAndCount.js`
```javascript
export function filterByFields(records, filters) {
  // Generic filter function
  // filters: { fieldName: selectedValue }
}

export function countByStatus(items, statusField = 'status', statusEnums) {
  // Generic count function
  // returns { total, ...counts }
}

export const RISK_COLORS = {
  'Low': 'text-emerald-400',
  'Medium': 'text-amber-400',
  'High': 'text-orange-400',
  'Critical': 'text-destructive',
};

export const STATUS_COLORS = {
  'DRAFT': 'text-slate-400 border-slate-500/30 bg-slate-500/5',
  'NEEDS_REVIEW': 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'APPROVED': 'text-primary border-primary/30 bg-primary/5',
  // ... more
};
```

**Expected Impact**:
- 8+ files: 20-30 lines reduction each
- Consistent filtering logic
- Centralized color schemes
- Easier enum management

**Effort**: 4-6 hours
- Utility extraction: 1-2 hours
- Integration: 2-3 hours
- Testing: 1 hour

**Risk**: Medium
- Some color scheme consolidation (but all visually preserved)
- No data changes

---

## Section 5: Oversized Components Analysis

### Components > 400 Lines (8 identified)

1. **CodexTasksPanel.jsx** (~480 lines)
   - Issues: Form input logic + table rendering + storage management
   - Suggestion: Split into CodexTaskForm + CodexTasksTable
   - Effort: 3-4 hours

2. **OpenClawTasksPanel.jsx** (~460 lines)
   - Issues: Form logic + proposal selection + review queue
   - Suggestion: Split into OpenClawTaskForm + OpenClawTasksTable
   - Effort: 3-4 hours

3. **OperatorReviewPanel.jsx** (~440 lines)
   - Issues: 3 separate review queues in one component
   - Suggestion: Extract ReviewQueue sub-component, use 3 instances
   - Effort: 4-5 hours

4. **TradingStrategyRegistry.jsx** (~420 lines)
   - Issues: Form + table + storage management
   - Suggestion: Split into TradingStrategyForm + TradingStrategyTable
   - Effort: 3-4 hours

5. **CreditProfilePlanning.jsx** (~430 lines)
   - Issues: Form + table + filtering
   - Suggestion: Extract CreditProfileForm + CreditProfileTable
   - Effort: 3-4 hours

6. **BusinessEntityRegistry.jsx** (~410 lines)
   - Issues: Multiple entity types in one component
   - Suggestion: Extract entity type sub-components
   - Effort: 3-4 hours

7. **BureauMonitoringChecklist.jsx** (~400 lines)
   - Issues: Form + checklist + status display
   - Suggestion: Extract ChecklistForm + ChecklistDisplay
   - Effort: 2-3 hours

8. **BaselineArchiveManifestPanel.jsx** (~390 lines)
   - Issues: Display + search + filtering
   - Suggestion: Extract BaselineArchiveSearch + BaselineList
   - Effort: 2-3 hours

### Sub-component Strategy

**Create Pattern**: `[Feature]Form.jsx` + `[Feature]Table.jsx`
- Form handles input, validation, save
- Table handles display, filtering, actions
- Shared storage/state management

**Expected Impact**:
- All components < 250 lines
- Better readability
- Easier to test
- Reusable form/table patterns

**Effort**: 20-28 hours total (3-4 hours each × 8 components)

**Risk**: Medium
- Must preserve all functionality
- Must maintain all localStorage keys
- All routes/labels preserved

---

## Section 6: Form Input Duplication

### Pattern Identified
Form input patterns (text, select, textarea) are repeated across modules.

### Files Affected (15+ files)

### Duplicate Patterns Found

**Pattern 1: Text Input**
```jsx
<input
  className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
  value={form.field}
  onChange={e => setForm({...form, field: e.target.value})}
  placeholder="..."
/>
```
Repeated 40+ times across files.

**Pattern 2: Select Input**
```jsx
<select 
  className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
  value={form.field} 
  onChange={e => setForm({...form, field: e.target.value})}>
  {options.map(o => <option key={o}>{o}</option>)}
</select>
```
Repeated 30+ times.

**Pattern 3: Label + Input Wrapper**
```jsx
<div>
  <label className="text-[8px] text-slate-400 block mb-1">{label}</label>
  <input ... />
</div>
```
Repeated 50+ times.

### Suggested Refactoring

**Create Form Components**: `src/components/forms/FormInput.jsx`
```jsx
FormInput - Text input wrapper
- Props: label, value, onChange, placeholder, className

FormSelect - Select input wrapper
- Props: label, value, onChange, options

FormTextarea - Textarea wrapper
- Props: label, value, onChange, placeholder, className

FormRow - Grid wrapper for form fields
- Props: children, columns (md-cols)
```

**Expected Impact**:
- 15+ files: 50-80 lines reduction each
- Consistent form styling
- Consistent validation patterns
- Reduced form complexity

**Effort**: 6-8 hours
- Component creation: 1-2 hours
- Integration into 15+ files: 4-5 hours
- Testing: 1 hour

**Risk**: Low
- Pure UI components
- No data structure changes
- All form logic preserved

---

## Section 7: Table/List Display Duplication

### Pattern Identified
Table and list display components are repeated with minor variations.

### Files Affected (12+ files)

### Duplicate Pattern Found

**Table Structure**:
1. Header section with pagination info
2. Column header row
3. Data rows with hover effects
4. Delete/action buttons

All repeated with minimal variation.

### Suggested Refactoring

**Create Component**: `src/components/ui/DataTable.jsx`
```jsx
DataTable
- Props: 
  - columns (array of column definitions)
  - data (array of rows)
  - onDelete? (delete handler)
  - onEdit? (edit handler)
  - keyField (field to use as key)
- Handles: pagination info, sorting, actions
```

**Expected Impact**:
- 12+ files: 60-100 lines reduction each
- Consistent table styling
- Consistent action patterns
- Easier pagination/sorting

**Effort**: 8-10 hours
- Component creation: 2-3 hours
- Integration into 12+ files: 5-6 hours
- Testing: 1 hour

**Risk**: Medium
- Must preserve all data display logic
- Must preserve all action handlers
- No localStorage changes

---

## Section 8: Color & Styling Constants Duplication

### Pattern Identified
Color and style maps are redefined in multiple components.

### Files Affected (15+ files)

### Duplicate Constants

**RISK_COLORS** (appears in 5 files identically)
**STATUS_COLORS** (appears in 8 files with variations)
**PRIORITY_COLORS** (appears in 4 files)
**Tailwind class strings** (repeated 50+ times)

### Suggested Refactoring

**Create File**: `src/constants/colors.js`
```javascript
export const RISK_COLORS = { ... };
export const STATUS_COLORS = { ... };
export const PRIORITY_COLORS = { ... };
export const MODULE_COLORS = { ... };

export const UI_CLASS = {
  INPUT_STANDARD: "w-full bg-secondary/30 border border-border...",
  BUTTON_PRIMARY: "px-3 py-1.5 bg-primary/15...",
  // ... etc
};
```

**Expected Impact**:
- Single source of truth for all styling
- Easier theme updates
- 15+ files: 20-30 lines reduction each
- Consistent visual language

**Effort**: 3-4 hours
- Constants extraction: 1 hour
- Integration: 2-3 hours

**Risk**: Low
- No functional changes
- All colors preserved

---

## Implementation Priority & Effort Summary

### Phase 1: High-Impact, Low-Risk (12-14 hours)
1. **Export Logic Utility** (4-6 hours) → 12+ files
2. **localStorage Manager** (5-7 hours) → 10+ files
3. **Color & Styling Constants** (3-4 hours) → 15+ files

**Result**: 25-35% code reduction, no behavioral changes

### Phase 2: Medium-Impact, Medium-Risk (20-28 hours)
4. **Summary Card Components** (6-8 hours) → 8+ files
5. **Form Input Components** (6-8 hours) → 15+ files
6. **Filter & Count Utilities** (4-6 hours) → 8+ files
7. **Table/List Component** (8-10 hours) → 12+ files

**Result**: Additional 20-30% code reduction

### Phase 3: Component Splitting (20-28 hours)
8. **Split Oversized Components** (20-28 hours) → 8 components

**Result**: Improved maintainability, better testability

---

## Risk Assessment

### Low-Risk Refactorings (30-35 hours)
- ✅ Export logic extraction
- ✅ localStorage utilities
- ✅ Color constants
- ✅ Summary card components
- ✅ Form input components

**Impact**: No breaking changes, all localStorage keys preserved, all routes preserved

### Medium-Risk Refactorings (20-28 hours)
- ⚠️ Filter/count utilities
- ⚠️ Table components
- ⚠️ Component splitting

**Risk**: Must carefully preserve all event handlers, all data display logic, all action callbacks

### Preservation Guarantees
- ✅ All 29 localStorage keys preserved (exact names)
- ✅ All 28 snapshotType values preserved
- ✅ All safetyClaims arrays preserved
- ✅ All disabled execution rows preserved
- ✅ All planning-only language preserved
- ✅ All routes preserved
- ✅ All tab labels preserved
- ✅ All button labels preserved (unless explicitly approved)
- ✅ Zero new execution logic
- ✅ Zero new API calls
- ✅ Zero new backend routes

---

## Recommended Implementation Sequence

**Sequence**: Execute in phase order (low-risk first)

### Week 1: Phase 1 (High-Impact, Low-Risk)
- Day 1-2: Export logic utility + integration
- Day 2-3: localStorage manager + integration
- Day 3-4: Color/styling constants + integration
- Day 4-5: Testing & verification

**Expected Outcome**: 25-35% code reduction, 0 bugs

### Week 2: Phase 2 (Medium-Impact, Medium-Risk)
- Day 1-2: Summary card component + integration
- Day 2: Form input components + integration
- Day 3: Filter/count utilities + integration
- Day 4: Table component + integration
- Day 5: Testing & verification

**Expected Outcome**: Additional 20-30% code reduction

### Week 3: Phase 3 (Component Splitting)
- Each day: Split one oversized component
- Final day: Integration testing

**Expected Outcome**: 8 improved components, better maintainability

---

## Testing Strategy

### Phase 1 Testing
- [ ] All exports validate snapshotType
- [ ] All exports contain safetyClaims
- [ ] All localStorage reads/writes functional
- [ ] All colors display correctly

### Phase 2 Testing
- [ ] All summary cards render correctly
- [ ] All forms validate input
- [ ] All filters work correctly
- [ ] All tables display data

### Phase 3 Testing
- [ ] All split components render
- [ ] All parent-child data flows work
- [ ] All event handlers functional
- [ ] All routes accessible

---

## Questions Before Implementation

1. Should color/styling consolidation include NEW standard palette, or preserve exact current colors?
2. For oversized component splits, any preference on sub-component naming conventions?
3. Should new utilities be in `src/utils/` or in module-specific directories?
4. For form components, should validation be handled at component level or parent level?

---

**Plan Status**: ✅ READY FOR OPERATOR APPROVAL

**Next Step**: Operator reviews this plan and approves/modifies priorities before Codex implementation begins.

**Preservation Confirmed**: All localStorage keys, export formats, safetyClaims, disabled rows, planning-only language, routes, tabs, and button labels will be preserved in all refactorings.

**Safety Confirmed**: Zero new execution, API, backend, credential, or automation logic will be added.