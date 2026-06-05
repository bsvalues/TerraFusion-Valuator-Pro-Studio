# Sovereign AI Alignment — Valuator Pro

The v0 build wired narrative drafting **directly to OpenAI** (`OPENAI_API_KEY` required). That's a fine
prototype shortcut — but not TerraFusion architecture. This pass puts narrative behind a
**TerraFusion-controlled provider interface** so the product is **sovereign by design.**

## What sovereign means here
- The product **works with NO external AI** (default).
- AI is behind a **TerraFusion-controlled interface**, not a direct vendor import.
- External providers are **optional and explicit**; data egress is a **deliberate, configured** choice.
- The **core workfile / evidence / report pipeline never depends on any external model.**

## The gateway
`lib/ai/narrative-provider.ts` — `generateNarrative()`. The narrative API route
(`app/api/narrative/route.ts`) no longer imports OpenAI; it calls the gateway. OpenAI is **lazy-loaded
only** when explicitly selected.

| `AI_PROVIDER` | Behavior | External key? |
|---|---|---|
| `template` *(default)* | Deterministic structured **scaffold** from the workfile — no external call | none |
| `terrafusion` | POSTs to `TERRAFUSION_AI_ENDPOINT` (sovereign); **falls back to template** if unset | `TERRAFUSION_AI_API_KEY` (optional) |
| `openai` | Optional fallback (gpt-4.1-mini) | **`OPENAI_API_KEY` — only in this mode** |
| `disabled` | No drafting; clear message, never crashes | none |

Any external-provider failure **degrades to a template scaffold with disclosure** — it never crashes.

## Environment
```
AI_PROVIDER=template            # template | terrafusion | openai | disabled
TERRAFUSION_AI_ENDPOINT=        # sovereign endpoint (terrafusion mode)
TERRAFUSION_AI_API_KEY=         # optional bearer for the sovereign endpoint
OPENAI_API_KEY=                 # OPTIONAL — only when AI_PROVIDER=openai
```
`/api/health` now reports `ai.provider`, `ai.externalConfigured`, and `ai.sovereign`.

## Disclosure
Every narrative response carries `provider`, `mode` (`scaffold` | `generated`), and `isTemplate`, so the
UI and report can honestly disclose how a section was produced. Template scaffolds are explicitly
labeled "you remain the author of record."

## Already sovereign (no change needed)
The valuation engines — cost, sales/regression, income, reconciliation (168/168 tests) — are
**deterministic** and use **no external AI**. The workfile, evidence, governed runs, and report
generation have **zero external-AI dependency.** Narrative was the only external coupling; it is now
gated and optional.

## Roadmap (not this pass)
The `terrafusion` provider is a working **adapter stub** (HTTP POST to the sovereign endpoint). When a
TerraFusion sovereign/local model is ready, point `TERRAFUSION_AI_ENDPOINT` at it — **no app code
changes**, just env. Building the model itself is out of scope here.

## Bottom line
Valuator Pro is now **"powered by TerraFusion Core with configurable AI providers,"** not "an
OpenAI-powered appraisal app." `OPENAI_API_KEY` is **no longer a launch blocker** — it's an optional mode.
