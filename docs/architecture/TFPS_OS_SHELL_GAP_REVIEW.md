# TFPS_OS_SHELL_GAP_REVIEW

**Deliverable 1 of 3** — TFPS OS Shell Design Recon
**Repo:** TerraFusion-Valuator-Pro-Studio · **Base:** `origin/main` @ `52f3f41`
**Status:** Recon only. No code changes. Companion docs: `TFPS_OS_SHELL_DESIGN_SPEC.md`, `TFPS_OS_SHELL_WO.md`.

---

## Purpose

Compare the **current** TerraFusion Professional Suite (TFPS) implementation against the **actual** TerraFusion OS shell model, and state plainly where TFPS departs from the OS shell contract. The honest summary: TFPS has a real governed runtime underneath (TFPR) and real workflow data, but the **shell, layout, and navigation are a generic SaaS dashboard wearing shadcn defaults**. It does not look or operate like TerraFusion OS.

## Grounding sources read

**TerraFusion OS shell (canonical):**
- `frontend/apps/os-shell/src/shell/desktop/Desktop.tsx` — root orchestrator (top system bar, dock, window manager, command palette, control center, scenes)
- `frontend/apps/os-shell/src/shell/desktop/Taskbar.tsx` — bottom dock (TerraSphere home + constitutional suites + running indicators)
- `frontend/apps/os-shell/src/config/suiteRegistry.ts` — suite registry + surface contract
- `frontend/apps/os-shell/src/contracts/shellMode.ts` — shell mode state machine (home/desktop/application/fullscreen)
- `frontend/apps/os-shell/src/styles/terrafusion-tokens.css` — canonical token system (Lumin Bridge: linen/terracotta/sage + night)
- `docs/SHELL_NAV_CONTRACT.md`, `docs/bsDesign/*` (Design Governance Framework, Masterclass in Material Design)

**Current TFPS:**
- `app/page.tsx` (launch pad, Slice 6), `app/(runtime)/layout.tsx`, `app/(runtime)/assignments/[id]/layout.tsx` (command-center chrome = tab bar), `app/(runtime)/assignments/[id]/[module]/page.tsx`
- `app/layout.tsx` (root — single hardcoded dark theme), `next.config.ts` (redirects), `lib/tfps/suiteRegistry.ts`, `lib/tfpr/**`, `components/**`

---

## The core finding

TerraFusion OS is a **spatial operating environment**: a persistent **top system bar** (identity + global context + global actions), a persistent **bottom dock** (home + suites with honest running/attention state), a **command-center surface** that answers "what needs me," and **modules that open as surfaces inside the OS frame** — governed by the **Find → Decide → Act → Defend** doctrine and a warm liquid-glass material system with **light + night** themes.

Current TFPS is a **document/dashboard app**: a centered-column page with a thin link-header, a vertical stack of (hero → queues → list → cards), and modules reached through a **horizontal tab strip**. There is no top system bar, no dock, no surface frame, no theme system, and the skin is anonymous shadcn (cold black + emerald), not TerraFusion (linen/terracotta/sage glass).

---

## Gap table

| Area | TerraFusion OS expected behavior | Current TFPS behavior | Gap | Severity | Recommendation |
|---|---|---|---|---|---|
| **Top system bar** | Persistent bar: OS identity, county/role/profile context, active assignment/workfile context, ⌘K search, MUSE/TerraPilot entry, theme toggle, trace/system status. | `(runtime)/layout.tsx` renders a thin centered header: wordmark + "Slice 1 · Valuator Pro". Launch pad has its own one-off header. No global context, search, MUSE, theme, or status. | No system bar at all; per-page headers instead of one persistent chrome. | **Critical** | Build one persistent `TopSystemBar` in the runtime layout: identity · active-assignment context · ⌘K · MUSE · theme · trace status. |
| **Bottom suite dock** | Persistent dock: Home/TerraSphere + suites, each with honest state (live/queued/preview/running/needs-attention) and a running indicator. | None. Modules are a horizontal tab strip inside the assignment; suite catalog is a static card grid on `/`. | No dock; no persistent module launcher; no running/attention state surfaced. | **Critical** | Build a persistent bottom `SuiteDock` from `suiteRegistry`, with truth-state + attention badges fed by the launchpad signals. |
| **Launch pad surface** | OS command center answering: what am I on / what needs attention / what's ready / what's blocked. Bento, not flat scroll. | `app/page.tsx` (Slice 6): header → hero ("Your appraisal operating environment") → queue row → assignments list → 9 module cards. Honest data, but **flat SaaS dashboard shape**. | Right *content*, wrong *form*: reads as a marketing-ish dashboard, not an OS surface. No persistent chrome around it. | **High** | Re-seat the same honest signals inside the OS frame (top bar + dock) as a Bento command center; drop the hero framing. |
| **Assignment Command Center** | A surface that summarizes subject/scope, workfile readiness, module status, evidence, approaches, MUSE drafts, ReviewForge findings, ReportForge readiness, certify state, audit access. | `assignments/[id]/page.tsx` exists but the assignment chrome is a **horizontal tab bar** (`Command Center | Subject | CostForge | …`). Tabs, not a command surface. | Command center is a tab label, not a real status-and-next-action surface. | **High** | Make `/assignments/[id]` a true command center (readiness + module status + queues for *this* workfile); demote tabs in favor of dock/module-surface navigation. |
| **Module surfaces** | Modules open as surfaces *within* the OS frame, each aware of assignment/workfile/evidence/review/audit/write-lane context. | Modules are sub-routes rendered inside the tab strip; they share workfile state via `SubjectWorkbenchProvider` (good) but render as plain pages, not framed surfaces. | Modules feel like separate pages, not OS surfaces; no consistent surface header (context, write-lane, trace). | **High** | Introduce a `ModuleSurface` frame (surface header: module · workfile context · write-lane · trace) wrapping each module route. |
| **Module routing** | Registry-driven; clear `surface` contract. | `/assignments/[id]/[module]` (e.g. `/cost`, `/sales`). Works, but flat segment and label/route mismatch (CompForge→`sales`, IncomeForge→`income`, MarketPulse→`market`). | Route shape `/[module]` vs target `/modules/[module]`; segment names leak legacy tab ids. | **Medium** | Move to `/assignments/[id]/modules/[module]` with stable module keys mapped in the registry; redirect old segments. |
| **Module truth-state** | Dock + cards show honest live/queued/preview/unavailable/running/needs-attention. No fake-live. | `lib/tfps/suiteRegistry.ts` has truth states (live / candidate-live / queued) and the launch pad renders them. **This is a strength.** | Truth-state exists but isn't surfaced in a dock or wired to per-workfile "running/needs-attention". | **Low** | Keep the registry; extend states with `running`/`needs-attention` derived from launchpad signals; render in the dock. |
| **Workfile context** | Globally pinned (top bar) + per surface. | Held in `SubjectWorkbenchProvider` per assignment; not shown in any global chrome. The active workfile is invisible once you're deep in a module. | No global "you are working on X" indicator. | **High** | Pin active-assignment/workfile context in the top system bar across all `/assignments/[id]/**` routes. |
| **MUSE / TerraPilot access** | First-class, reachable everywhere (top-bar action and/or dock). | MUSE exists as write_low drafting **inside** specific modules (reconcile/certify); there is no global MUSE entry. | MUSE is buried per-module; not an OS-level presence. | **High** | Add a global MUSE entry (top bar and/or dock) that is workfile-aware; keep per-module drafting. |
| **ReviewForge queues** | Attention queues visible at OS level. | Launchpad aggregates review/blocker signals (Slice 6) — good — but only on `/`; not in chrome. | Queues live on one screen, not in the persistent frame. | **Medium** | Surface "review required" as a dock/top-bar attention badge, not just on the launch pad. |
| **ReportForge readiness** | Readiness visible where you work. | Report is workfile-bound (`/api/.../report`) and readiness is computed (launchpad + report banner) — good. | Readiness shown on `/` and inside report only; no persistent signal. | **Low** | Add a readiness chip to the command center + dock. |
| **Evidence / audit visibility** | Evidence ledger + audit trace are first-class, reachable from the frame. | Evidence is a module; audit trace is `/assignments/[id]/audit` reachable via a per-assignment link. | Functional but not framed as Defend-phase surfaces. | **Medium** | Treat Evidence + Audit as Defend surfaces with a persistent trace-status indicator in the top bar. |
| **Theme model** | Two themes (Professional Light / TerraFusion Night) from one shared token set; user-toggleable. | `app/layout.tsx` hardcodes `className="dark"`; generic shadcn tokens (`--background: 240 6% 4%`, emerald `--primary`); no toggle. | No theme system; not the TerraFusion palette; no light mode. | **Critical** | Port `terrafusion-tokens.css` (Lumin light + Night) into the app; add a theme toggle and `data-theme` switching; map shadcn vars to TF tokens. |
| **Navigation model** | Spatial: dock + ⌘K + scenes; "3 clicks to value." | Link-based: header links, tab strip, in-page links. | No command palette, no dock, no spatial model. | **High** | Add dock + ⌘K command palette (scenes optional later); make every critical action ≤3 clicks. |
| **Route authority** | `/` is the only product entry; legacy demoted. | `next.config.ts` redirects `/workbench*` + `/report*` → `/` (307); no `/studio`. **Strength.** | Solid. Module route naming is the only loose end. | **Low** | Keep redirects; add `/legacy/*` namespace only if a legacy surface must remain reachable internally. |
| **Legacy route / component exposure** | Legacy not in product navigation. | Routes are clean, but `components/` still holds swarm/AI-dashboard theater: `swarm-*`, `dispatch-center`, `command-terminal`, `network-topology`, `risk-*`, `metrics-grid`, `appraiser-dashboard`, `region-radar`, `live-ticker`, plus `comp-grid.tsx.bak`. | Dead/legacy generic components linger; risk of accidental reuse and confusion. | **Medium** | Inventory and quarantine/remove orphaned legacy components in a dedicated cleanup (not this slice unless they block navigation). |
| **Generic SaaS patterns still present** | OS command center, Bento, surfaces. | Hero line ("Your appraisal operating environment"), centered `max-w-5xl` column, decorative card grid, tab strip. | The dominant visual grammar is SaaS dashboard, not OS. | **High** | Replace hero/column/tab grammar with top-bar + dock + command-center + module-surface grammar. |
| **Material / brand** | Liquid-glass surfaces, golden-ratio type, Switzer/Inter, ambient gradient, suite accent colors. | Flat bordered cards, Geist font, no glass, no ambient, single cyan accent. | No TerraFusion material identity. | **High** | Adopt liquid-glass surface + ambient background + type scale + suite accents from the token system. |

---

## Severity rollup

- **Critical (4):** top system bar, bottom dock, theme model, (and the absence of any persistent OS chrome these three imply).
- **High (8):** launch-pad form, command center, module surfaces, workfile context, MUSE access, navigation model, generic-SaaS grammar, material/brand.
- **Medium (4):** module routing, ReviewForge queue surfacing, evidence/audit framing, legacy component exposure.
- **Low (3):** truth-state wiring, report readiness chip, route authority polish.

## What is already right (keep, do not rebuild)

- TFPR governed runtime (fail-loud store, write-lanes, audit, MUSE write_low, certify write_high).
- Honest data everywhere: launchpad queues derived from real workfiles via ReviewForge; no fabricated counts.
- Truth-state registry in `lib/tfps/suiteRegistry.ts`.
- Route authority redirects (`/workbench`, `/report` → `/`).
- Workfile state sharing via `SubjectWorkbenchProvider`.

## Bottom line

The plumbing is sound; the **shell is the problem**. The corrective work is to wrap the existing honest content in the TerraFusion OS frame — **top system bar + bottom dock + command-center surface + module-surface frame + light/night themes** — and retire the SaaS-dashboard grammar. That design is specified in `TFPS_OS_SHELL_DESIGN_SPEC.md`; the build is scoped in `TFPS_OS_SHELL_WO.md` (Slice 7).
