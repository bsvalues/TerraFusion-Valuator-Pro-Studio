# TFPS_OS_SHELL_DESIGN_SPEC

**Deliverable 2 of 3** — TFPS OS Shell Design Recon  
**Repo:** TerraFusion-Valuator-Pro-Studio · **Base:** `origin/main` @ `52f3f41`  
**Status:** Approved design — do not implement until WO (Deliverable 3) is also approved.  
**Companion docs:** `TFPS_OS_SHELL_GAP_REVIEW.md`, `TFPS_OS_SHELL_WO.md`

---

## Operator decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Dock model | Mirror TerraForge's **shell contract exactly** (architecture, truth-state doctrine, OS navigation pattern). Adapt only the suite module taxonomy to fee appraisal. |
| 2 | Launch pad | `/` = OS launch pad: attention-queues bento top + all active assignments below. Not last-active-only. |
| 3 | MUSE placement | Both — top bar pill (global ⌘K-adjacent) **and** dock slot (module-level entry). |
| 4 | MarketPulse | Visible in dock as `live · workfile-derived`. Honest badge. R2 external data is a future lane, not a prerequisite for visibility. |
| 5 | Legacy `/workbench` | 307 redirect → `/` (already wired in `next.config.ts`). Keep. No `/legacy/*` namespace needed. |
| 6 | Default theme | Follow `prefers-color-scheme`. Professional Light on day machines; TerraFusion Night on configured dark-mode machines. Both themes ship together. |
| 7 | OS identity | Top bar: **`TERRAFUSION PROFESSIONAL OS`** · subtitle: `Commercial Appraisal Suite`. |

---

## A. Product hierarchy

```
TerraFusion Professional OS
  Top bar identity: "TERRAFUSION PROFESSIONAL OS"
  Subtitle: "Commercial Appraisal Suite"
  Shell chrome: top system bar + bottom suite dock

  OS Launch Pad  (/)
    Needs-your-attention bento queues
    Active assignments list
    Suite module tiles (quick-launch)

  Active Assignments  (/assignments)
    [Assignment list, same as launch pad but full-screen]

  Assignment Command Center  (/assignments/[id])
    Subject strip (address · type · effective date · workfile status badges)
    Find → Decide → Act → Defend doctrine columns
    ReviewForge findings sidebar
    MUSE drafts sidebar
    Audit trace sidebar

  Module Surface  (/assignments/[id]/modules/[module])
    Module surface frame: identity chip · workfile context · write-lane indicator · trace status
    Module-specific content (unchanged analytical engine)

  Audit Trace  (/assignments/[id]/audit)
    Read-only append-only event log

  Redirect  (/workbench* → / via 307)
  Redirect  (/report* → / via 307)
```

---

## B. Route model

| Route | Surface | Notes |
|---|---|---|
| `/` | OS Launch Pad | Attention queues + assignments + quick-launch |
| `/assignments` | Assignments list | Alias / overflow; may redirect to `/` |
| `/assignments/[id]` | Assignment Command Center | The primary per-assignment surface |
| `/assignments/[id]/modules/cost` | CostForge surface | Module key = `cost` |
| `/assignments/[id]/modules/sales` | CompForge surface | Module key = `sales` |
| `/assignments/[id]/modules/income` | IncomeForge surface | Module key = `income` |
| `/assignments/[id]/modules/subject` | Subject / Dossier surface | Module key = `subject` |
| `/assignments/[id]/modules/evidence` | Evidence ledger surface | Module key = `evidence` |
| `/assignments/[id]/modules/reconcile` | Valuator reconciliation surface | Module key = `reconcile` |
| `/assignments/[id]/modules/certify` | Certify surface | Module key = `certify` |
| `/assignments/[id]/modules/report` | ReportForge surface | Module key = `report` |
| `/assignments/[id]/modules/review` | ReviewForge surface | Module key = `review` |
| `/assignments/[id]/modules/market` | MarketPulse surface | Module key = `market` |
| `/assignments/[id]/modules/muse` | MUSE surface | Module key = `muse` |
| `/assignments/[id]/audit` | Audit trace | Read-only |
| `/workbench*` | → 307 `/` | Legacy redirect, keep |
| `/report*` | → 307 `/` | Legacy redirect, keep |

**Note on old routes:** Current `/assignments/[id]/[module]` (flat segment) already works. Migrate to `/assignments/[id]/modules/[module]` in Slice 7; add redirects from old segments so existing bookmarks survive.

---

## C. Top system bar

Persistent across every route. One component, never re-instantiated.

### Layout (left → right)

```
[OS identity] [sep] [Active context] [spacer] [Search] [sep] [MUSE] [sep] [Theme] [Trace] [Profile]
```

### Fields

| Zone | Content | Notes |
|---|---|---|
| **OS identity** | `TERRAFUSION PROFESSIONAL OS` · `Commercial Appraisal Suite` | Terracotta/cyan accent; always visible |
| **Sep** | 1px divider | |
| **Active context** | When on `/`: blank or `n assignments active`. When on `/assignments/[id]/**`: assignment name + address + workfile ID | Pulled from route params + workfile store |
| **Spacer** | flex: 1 | |
| **⌘K Search** | `⌘K  Search or jump…` pill | Opens command palette; jumps to assignments, modules, help |
| **Sep** | | |
| **✦ MUSE** | Accent pill; always visible | Opens MUSE surface for current workfile context (or prompts to select assignment if on `/`) |
| **Sep** | | |
| **Theme toggle** | ☀ / ◑ icon | Switches between Professional Light and TerraFusion Night; persists to localStorage |
| **Trace status** | ⚑ dot indicator; red if blockers | Tooltip shows review blocker count; click → ReviewForge for current assignment |
| **Profile** | `[Initials] · [County/Role]` pill | e.g., `B.S. · Benton Co.` |

### Behavior rules

- Top bar is **never removed or re-rendered** during navigation. It is a shell-level component above the Next.js page tree.
- Active context updates via a context/store, not a page-level prop.
- On routes without an active assignment, active context zone is empty.
- Theme toggle applies `data-theme="light"` or `data-theme="night"` to `<html>`. All other styling via CSS variables.

---

## D. Bottom suite dock

Mirrors TerraForge's dock contract exactly in architecture, truth-state doctrine, and navigation pattern. Adapts the suite module taxonomy to fee appraisal.

### Persistent layout

```
[Home] [sep] [Valuator] [CostForge] [CompForge] [IncomeForge] [sep] [ReportForge] [ReviewForge] [MarketPulse] [sep] [Dossier] [✦ MUSE]
```

Height: 52px. Background: `--dock` token. Always visible.

### Module entries

| Slot | Label | Icon concept | Module key | Route opens |
|---|---|---|---|---|
| Home | Home | ⌂ | — | `/` |
| sep | — | — | — | — |
| Valuator Pro | Valuator | ⊞ | `reconcile` | `/assignments/[id]/modules/reconcile` |
| CostForge Pro | CostForge | ▦ | `cost` | `/assignments/[id]/modules/cost` |
| CompForge | CompForge | ≋ | `sales` | `/assignments/[id]/modules/sales` |
| IncomeForge Pro | IncomeForge | ∿ | `income` | `/assignments/[id]/modules/income` |
| sep | — | — | — | — |
| ReportForge | ReportForge | 📄 | `report` | `/assignments/[id]/modules/report` |
| ReviewForge | ReviewForge | 🔍 | `review` | `/assignments/[id]/modules/review` |
| MarketPulse | MarketPulse | ◉ | `market` | `/assignments/[id]/modules/market` |
| sep | — | — | — | — |
| Dossier | Dossier | 🗂 | `subject` | `/assignments/[id]/modules/subject` |
| MUSE | MUSE | ✦ | `muse` | `/assignments/[id]/modules/muse` |

When no assignment is active (user is on `/`), dock module clicks navigate to `/assignments` to select an assignment first. Do not open a module surface with no assignment context.

### Truth states (per module, per slot)

| State | Indicator | Meaning |
|---|---|---|
| `live` | Green dot | Module is navigable, actionable, persistence-proven |
| `running` | Animated green dot | Module is currently processing (a drain, a review run, a report build) |
| `needs-attention` | Amber/red badge (count) | ReviewForge blocker or warning in this module's domain |
| `preview` | Grey dot | Module is bound but not yet proven live in suite |
| `queued` | Grey dot, italic | Module is planned, not yet mounted |
| `unavailable` | Hidden or muted | Not in current entitlement plan |

**Rules:**
- State is **derived from real workfile data**, not from a hardcoded truth-state constant alone.
- `needs-attention` count is the count of ReviewForge findings scoped to that module's domain.
- Never show a module as `live` unless it is navigable AND actionable AND persistence is proven in the suite.
- Home slot has no truth-state indicator; it is always reachable.

---

## E. Launch pad layout (`/`)

The launch pad is an OS command center, not a dashboard. It answers:  
*What needs me? What am I working on? What can I do right now?*

### Layout

```
[TOP SYSTEM BAR — persistent]

[Needs your attention — bento grid]
  [Evidence gaps: N]  [Review required: N]  [Cert pending: N]
  [MUSE drafts: N pending review        ]   [Reports ready: N/M]

[Active assignments — list]
  [↗ Assignment name · address]  [status chip]
  [↗ ...]

[Suite modules — mini tile row (quick-launch only)]
  Valuator · CostForge · CompForge · IncomeForge · ReportForge · ReviewForge · MarketPulse · Dossier · MUSE

[BOTTOM DOCK — persistent]
```

### Bento queue rules

- Each bento card shows a real count from `GET /api/tfpr/launchpad`.
- If count is 0: card renders with `—` and muted styling. No card is hidden.
- Cards are not decorative; each has a `→ [action]` link that navigates to the relevant surface.
- No hero text. No marketing copy. No "Your appraisal operating environment" headline.

### Assignment list rules

- Most recently modified first.
- Each row: arrow · name · address · effective date · status chip (Cert Pending / Review Required / In Progress / Ready).
- Click navigates to `/assignments/[id]` (Command Center).
- Empty state: `No active assignments. → New assignment` link.

### Suite module quick-launch tiles

- Below the assignment list.
- Small tiles: dot indicator (truth state) + label.
- Click with active assignment → opens that module in the current assignment context.
- Click without active assignment → navigates to assignments list first.
- This is not the primary navigation (that is the dock); it is a convenience row for keyboard-free workflows.

---

## F. Assignment Command Center (`/assignments/[id]`)

The command center is a status-and-next-action surface for one assignment. It does not contain analytical engines directly — those are in module surfaces.

### Layout

```
[TOP SYSTEM BAR — persistent, now shows assignment context]

[Subject strip — 38px]
  [Address · property type · effective date]  [Cert status]  [# approaches]  [Evidence: N]  [Audit: N events]

[Main area]
  [Find column]  [Decide column]  [Act column]  [Defend column]  | [Right sidebar]

[BOTTOM DOCK — persistent, current assignment's active module highlighted]
```

### Subject strip

- One line. Not a card. Background: `--bg2` token.
- Pulls from workfile: address, property type, effective date, cert status, approach count, evidence count, audit event count.
- Status badges: `Cert Pending` (warn) / `Certified` (ok) / `In Progress` (info).

### Doctrine columns

Four equal-width columns: Find · Decide · Act · Defend.  
Each column has a header (phase name + phase dot color) and a tile list.

**Find**
- Subject tile: UAD completeness summary → links to `subject` module
- Evidence tile: evidence count + gap count → links to `evidence` module
- MarketPulse tile: support level + comp count → links to `market` module
- Dossier tile: workfile entry count → links to `subject` or `audit`

**Decide**
- CostForge tile: indicated value or "not run" → links to `cost` module
- CompForge tile: comp count + price range or "not run" → links to `sales` module
- IncomeForge tile: cap rate + indicated value or "not run" → links to `income` module

**Act**
- Valuator tile: reconciliation status → links to `reconcile` module
- MUSE tile: draft count + lane (write_low) → links to `muse` module
- Certify tile: cert status + locked/unlocked → links to `certify` module

**Defend**
- ReviewForge tile: blocker count + warning count → links to `review` module
- ReportForge tile: readiness status → links to `report` module
- Audit trace tile: event count → links to `/assignments/[id]/audit`

### Tile states

| Visual | Meaning |
|---|---|
| Green dot | Done / value present |
| Amber/red dot | Needs attention / blocker |
| Grey dot | Not yet run / idle |
| Locked label | Cannot proceed until dependency resolved |

### Right sidebar

Three stacked sections (scrollable):

1. **ReviewForge findings** — severity-labeled list (BLOCK / WARN / INFO). Each finding links to the module to fix it.
2. **MUSE drafts (write_low)** — list of pending drafts with capability ID and "non-final, review required" label.
3. **Recent audit trace** — last N events with timestamp. Link to full audit trace.

Sidebar width: ~200px. Not collapsible in Slice 7 (optional later).

---

## G. Find → Decide → Act → Defend mapping

| Phase | User question | Surface | Module(s) | Required input | Output | Audit / evidence |
|---|---|---|---|---|---|---|
| **Find** | What is the subject? What evidence do I have? What does the market show? | Command Center / module surfaces | Subject, Evidence, MarketPulse, Dossier | Address, UAD fields, evidence items | Subject record, evidence ledger, market support level | `subject_save`, `evidence_add` trace events |
| **Decide** | Which approaches apply? What do comparables show? | Command Center / module surfaces | CostForge, CompForge, IncomeForge | Subject characteristics, comps, income data | Indicated values by approach | `cost_run`, `comp_save`, `income_run` trace events |
| **Act** | What is the reconciled value? What language should the report contain? How do I certify? | Module surfaces | Valuator (reconcile), MUSE (write_low), Certify (write_high) | Indicated values, appraiser judgment | Reconciled value, draft narratives (non-final), certified opinion of value | `reconciliation_run`, `muse_draft` (write_low), `certify` (write_high, appraiser-confirmed) |
| **Defend** | Does the report pass review? Is the evidence sufficient? Can I deliver? | Module surfaces | ReviewForge, ReportForge, Audit | All prior phase outputs | Review findings, report package, audit bundle | `review_run` (read_only), `report_assembled` |

---

## H. Theme model

Two themes, one shared token set, one `data-theme` attribute on `<html>`.

### Professional Light (`data-theme="light"` or `prefers-color-scheme: light`)

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `hsl(35 28% 95%)` | Page / shell background (warm linen) |
| `--bg2` | `hsl(35 20% 90%)` | Secondary surfaces (strips, rails) |
| `--border` | `hsl(35 15% 82%)` | Borders, dividers |
| `--text` | `hsl(30 30% 15%)` | Primary text |
| `--sub` | `hsl(30 15% 45%)` | Secondary text, labels |
| `--accent` | `hsl(16 55% 46%)` | Terracotta — primary CTA, identity, active indicators |
| `--accent2` | `hsl(140 18% 45%)` | Sage — positive/live states |
| `--glass` | `rgba(255,255,255,0.72)` | Card surfaces, glass panels |
| `--dock` | `hsl(35 20% 88%)` | Bottom dock background |
| `--bar` | `hsl(35 22% 90%)` | Top bar background |

### TerraFusion Night (`data-theme="night"` or `prefers-color-scheme: dark`)

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `hsl(222 24% 7%)` | Void — page / shell background |
| `--bg2` | `hsl(220 22% 10%)` | Secondary surfaces |
| `--border` | `hsl(218 20% 16%)` | Borders, dividers |
| `--text` | `hsl(210 30% 92%)` | Primary text |
| `--sub` | `hsl(205 20% 55%)` | Secondary text, labels |
| `--accent` | `hsl(192 58% 60%)` | Quantum cyan — primary CTA, identity, active indicators |
| `--accent2` | `hsl(140 20% 48%)` | Sage — positive/live states |
| `--glass` | `rgba(14 22 36 / 0.82)` | Card surfaces with backdrop-filter: blur(18px) |
| `--dock` | `hsl(222 26% 5%)` | Bottom dock background |
| `--bar` | `hsl(222 24% 8%)` | Top bar background |

### Theme rules

- Theme is applied as `data-theme="light"` or `data-theme="night"` on `<html>`.
- CSS uses `[data-theme="light"] { ... }` and `[data-theme="night"] { ... }` blocks.
- Initial value from `localStorage.getItem('tf-theme')` → fall back to `prefers-color-scheme` → fall back to `light`.
- All shadcn variable overrides (`--background`, `--foreground`, `--primary`, etc.) are remapped inside these blocks — no hardcoded `className="dark"` on the root layout.
- Glass effect (backdrop-filter: blur) is applied in Night mode only; Light mode uses flat surfaces.
- The theme toggle in the top bar writes to localStorage and updates `<html>` attribute in-place (no full page reload).

---

## I. What not to do

These patterns are explicitly forbidden in Slice 7 and all subsequent TFPS UI work.

| Forbidden pattern | Why |
|---|---|
| Hero / marketing headline on `/` | Signals SaaS product, not OS surface. The OS frame is the identity. |
| Generic SaaS centered-column layout (`max-w-5xl mx-auto`) | TFPS has a persistent top bar + dock; centering implies a standalone page. Use full-bleed layout inside the OS frame. |
| Decorative cards with no workflow action | Every card must link to a surface. No decoration. |
| Fake live modules | If a module is not navigable + actionable + persistence-proven, it is `preview` or `queued`. Never show a dot that lies. |
| AI-dashboard / swarm theater | No swarm metrics, no "1008 agents active," no fake real-time feeds. |
| Dashboard polish as substitute for workflow | The gap review found this. The problem was never missing charts; it was missing OS chrome. |
| `className="dark"` hardcoded on root layout | Breaks both themes. Use `data-theme` + CSS variables only. |
| `/workbench`, `/studio` in product nav | These routes either redirect or do not exist. They are never linked from shell navigation. |
| "Powered by TerraFusion OS" claim | Not until the shell behavior (top bar + dock + doctrine surfaces) is shipped and runtime-proven. |
| Report-first workflow | Report is a Defend output, not the primary entry point. |
| Form-filler framing | Appraisal is a knowledge workflow. The OS frame must reflect Find → Decide → Act → Defend, not a form wizard. |

---

## Module surface frame (applies to all `/assignments/[id]/modules/[module]` routes)

Every module surface shares a surface header (inside the main layout, below the top bar):

```
[Module name + icon]  [Workfile: #ID · Assignment name]  [Write lane: write_low / write_high]  [Trace status dot]
```

Height: 36px. Background: `--bg2`. Bottom border: `--border`.

This frame communicates: what you are in, what workfile you are in, what you can do (write lane), and whether the audit trace is active. It is the module's claim on the OS surface.

The analytical engine below it is unchanged from current implementation.

---

*End of design spec. Proceed to `TFPS_OS_SHELL_WO.md` for the implementation work order.*
