# TFPS_OS_SHELL_WO

**Deliverable 3 of 3** — TFPS OS Shell Design Recon  
**Repo:** TerraFusion-Valuator-Pro-Studio · **Base:** `origin/main` @ `52f3f41`  
**Status:** Ready for operator approval. No code until approved.  
**Companion docs:** `TFPS_OS_SHELL_GAP_REVIEW.md`, `TFPS_OS_SHELL_DESIGN_SPEC.md`

---

## Slice 7 — OS Shell + Dock + Command Center

### Goal

Make TFPS open and operate like TerraFusion Professional OS, not a generic SaaS dashboard.  
After Slice 7, the first authenticated experience is a persistent-chrome OS surface with a top system bar, a bottom suite dock, a bento command-center launch pad, and assignment command centers organized by the Find → Decide → Act → Defend doctrine.

The existing TFPR governed runtime, all analytical engines, and all module logic are **unchanged**. This slice wraps them in the OS shell.

---

### In scope

1. **Top system bar** — persistent across all routes; OS identity + active assignment context + ⌘K pill + MUSE pill + theme toggle + trace status + profile pill.
2. **Bottom suite dock** — persistent; Home + 9 module slots; truth-state dots; needs-attention badges; running indicators; navigates to `/assignments/[id]/modules/[module]` within current assignment context.
3. **OS launch pad** (`/`) — bento attention-queues + active assignments list + suite quick-launch tiles; all data from existing `GET /api/tfpr/launchpad`; no hero copy.
4. **Assignment Command Center** (`/assignments/[id]`) — subject strip + four doctrine columns (Find/Decide/Act/Defend) + right sidebar (ReviewForge findings, MUSE drafts, audit trace); data from existing workfile + ReviewForge engine.
5. **Module surface frame** — 36px surface header on every `/assignments/[id]/modules/[module]` route; shows module name, workfile context, write lane, trace status.
6. **Route migration** — `/assignments/[id]/[module]` → `/assignments/[id]/modules/[module]`; old segment redirects preserved.
7. **Theme system** — `data-theme` on `<html>`; CSS variable blocks for Professional Light + TerraFusion Night; `prefers-color-scheme` initial value; localStorage persistence; theme toggle in top bar; remove hardcoded `className="dark"`.
8. **Token file** — `styles/tf-tokens.css` with all `--bg`, `--bg2`, `--border`, `--text`, `--sub`, `--accent`, `--accent2`, `--glass`, `--dock`, `--bar` variables for both themes (per design spec Section H); shadcn variable remaps inside each `[data-theme]` block.
9. **Dock state wiring** — truth-state and needs-attention badge counts derived from launchpad signals per module domain.
10. **Route authority** — keep existing `next.config.ts` redirects (`/workbench*`, `/report*` → `/`); add redirects from old module segments to new `/modules/[module]` path.

---

### Out of scope (do not touch)

- Stripe, pricing, commercial launch wrapper, PR #8
- `/studio` surface
- Any analytical engine (CostForge, CompForge, IncomeForge, MarketPulse, ReviewForge, ReportForge logic)
- TFPR runtime contracts or database schema
- REC backlog (REC-003, 004, 007, 009, 010, 011, 012)
- External market data wiring
- Auth / multi-tenant
- Deep visual redesign beyond what the OS shell token system requires
- Deleting legacy components unless they actively break navigation (quarantine only)

---

### Files to create

| File | Purpose |
|---|---|
| `styles/tf-tokens.css` | Full token set, both themes, shadcn remaps |
| `components/shell/TopSystemBar.tsx` | Persistent top bar component |
| `components/shell/SuiteDock.tsx` | Persistent bottom dock component |
| `components/shell/ModuleSurfaceFrame.tsx` | 36px surface header for module routes |
| `components/shell/ShellProvider.tsx` | Context: active assignment, theme, trace status, dock states |

---

### Files to modify

| File | Change |
|---|---|
| `app/layout.tsx` | Remove `className="dark"`; add `<ShellProvider>`; mount `<TopSystemBar>` + `<SuiteDock>` as persistent shell chrome; import `tf-tokens.css` |
| `app/(runtime)/layout.tsx` | Remove thin header ("Slice 1 · Valuator Pro"); shell chrome is now in root layout |
| `app/page.tsx` | Rewrite launch pad to bento queues + assignments list + quick-launch tiles; remove hero copy; wire to existing `/api/tfpr/launchpad` |
| `app/(runtime)/assignments/[id]/layout.tsx` | Replace horizontal tab bar with `<ModuleSurfaceFrame>` pattern; wire assignment context to `ShellProvider` |
| `app/(runtime)/assignments/[id]/page.tsx` | Rewrite to doctrine-column command center with right sidebar; wire to workfile + ReviewForge data |
| `next.config.ts` | Add redirects from `/assignments/[id]/cost` → `/assignments/[id]/modules/cost` etc. for all module segments |

---

### Files to create (route migration)

| New route | Old route (redirect source) |
|---|---|
| `app/(runtime)/assignments/[id]/modules/[module]/page.tsx` | `app/(runtime)/assignments/[id]/[module]/page.tsx` (keep as redirect shell or remove after redirects confirmed) |

---

### Acceptance tests

All must pass before Slice 7 is considered complete.

| # | Test | Pass condition |
|---|---|---|
| 1 | `/` opens OS launch pad | HTTP 200; top bar visible; bottom dock visible; no hero copy |
| 2 | Top bar visible on every route | Present and consistent on `/`, `/assignments`, `/assignments/[id]`, `/assignments/[id]/modules/cost` |
| 3 | Bottom dock visible on every route | Same |
| 4 | Theme toggle works | Click ☀/◑ in top bar → `<html data-theme>` switches → color changes without page reload |
| 5 | Professional Light theme correct | Linen background, terracotta accent, no black/emerald |
| 6 | TerraFusion Night theme correct | Void dark background, cyan accent, glass panels; no cold-black + emerald |
| 7 | `prefers-color-scheme` respected on first load | Dark OS → Night theme; Light OS → Light theme (no localStorage override yet) |
| 8 | Active assignment context in top bar | On `/assignments/[id]/**`, top bar shows assignment name + address |
| 9 | Attention queues on launch pad | Counts from `/api/tfpr/launchpad`; 0-counts render muted (not hidden) |
| 10 | Assignment list on launch pad | Real assignments, most-recent-first, status chips |
| 11 | Dock module click → correct route | Valuator → `/assignments/[id]/modules/reconcile`; CostForge → `/assignments/[id]/modules/cost` etc. |
| 12 | Dock click with no active assignment | Navigates to `/assignments` to select first; does not open a module with null context |
| 13 | Doctrine columns in command center | Four columns visible; Find/Decide/Act/Defend headers; tiles show real workfile status |
| 14 | ReviewForge findings in sidebar | Correct blockers/warnings from ReviewForge engine; each links to the module to fix |
| 15 | Module surface frame on module routes | 36px frame visible; shows module name, workfile ID, write lane |
| 16 | Old module routes redirect | `/assignments/[id]/cost` → 307 → `/assignments/[id]/modules/cost` |
| 17 | No product nav exposes `/workbench` or `/studio` | Link grep: none |
| 18 | `next build` exits 0 | No TypeScript errors, no broken imports |
| 19 | Visual smoke — Professional Light | Screenshot of `/` and `/assignments/[id]` in Light theme |
| 20 | Visual smoke — TerraFusion Night | Screenshot of `/` and `/assignments/[id]` in Night theme |

---

### Build sequence

Implement in this order to keep the build passing at every step:

```
1. styles/tf-tokens.css + app/layout.tsx theme wiring
   → Build passes; visual change: colors shift from emerald to terracotta/cyan

2. components/shell/ShellProvider.tsx
   → Context available; no visual change yet

3. components/shell/TopSystemBar.tsx + mount in app/layout.tsx
   → Top bar appears; thin per-page headers still present (overlap briefly)

4. components/shell/SuiteDock.tsx + mount in app/layout.tsx
   → Dock appears; module clicks go to existing old-segment routes for now

5. Remove thin per-page headers from (runtime)/layout.tsx
   → Shell chrome is now the only persistent chrome

6. app/page.tsx — launch pad rewrite
   → Bento queues + assignments list; existing launchpad endpoint unchanged

7. app/(runtime)/assignments/[id]/page.tsx — command center rewrite
   → Doctrine columns + right sidebar; existing workfile + ReviewForge data

8. components/shell/ModuleSurfaceFrame.tsx + wire into (runtime)/assignments/[id]/layout.tsx
   → Surface frame appears on all module routes

9. Route migration: create /modules/[module] routes + add redirects from old segments
   → Dock clicks land on new routes; old bookmarks redirect

10. Dock state wiring: truth-state + attention badge counts from launchpad signals
    → Dock shows real module states

11. next build + acceptance tests + visual smokes
```

---

### Definition of done

- All 20 acceptance tests pass.
- `next build` exits 0.
- Visual smoke screenshots committed to `docs/architecture/mockups/` (4 images: launch pad light, launch pad night, command center light, command center night — from the live build, not wireframes).
- No product nav exposes `/workbench`, `/studio`, or marketing wrapper.
- No fake live modules.
- No hero copy on `/`.
- Analytical engines are **unchanged** — every existing module still works as before.

---

*End of work order. Await operator approval before implementation.*
