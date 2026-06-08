# TFPR Contracts

Shared contracts of **TerraFusion Professional Runtime (TFPR)** — the commercial
OS substrate that product modules (Valuator Pro, later Housing Truth Pro,
Legislative Pulse Pro) run inside.

**These files are pure TypeScript types with ZERO behavior and no dependencies.**

## The boundary rule

```
modules/*            may import     lib/tfpr/contracts   (allowed)
modules/*            may NOT import  lib/tfpr/runtime     (forbidden)
lib/tfpr/runtime     implements      lib/tfpr/contracts
```

A product is "inside TFPR" only when it talks to the world exclusively through
these contracts — shell, workfile, audit, MUSE, AI gateway, entitlement, export.

## Contracts (mirror COMMERCIAL_TERRAFUSION_OS_SPEC §4 / TFPR_IMPLEMENTATION_PLAN §3)

| File | Contract |
|---|---|
| `common.ts` | ids, time, `RiskClass`, `Classification`, `PilotMode`, `AiProviderId`, `RuntimeContext` |
| `write-lane.ts` | `WriteLane`, `GovernedAction` |
| `evidence.ts` | `EvidenceRef`, `EvidenceItem` |
| `run-record.ts` | `RunStatus`, `RunRecord` |
| `workfile.ts` | `Assignment`, `Workfile`, `CertifiedValue`, `WorkfileSubject` |
| `workfile-store.ts` | `WorkfileStore` (Supabase v0 impl later) |
| `audit-trace.ts` | `TraceEvent`, `AuditTrace` (append-only) |
| `sovereign-ai.ts` | `SovereignAIProvider` (sovereign default) |
| `muse.ts` | `MuseService`, `DraftArtifact` (write_low, non-final) |
| `entitlement.ts` | `EntitlementTier`, `Entitlement` |
| `report-package.ts` | `ReportPackage` (stub in Slice 1) |
| `product-module.ts` | `ProductModule` |

## Two contractual guarantees worth repeating

- **WorkfileStore fails loud** if its backing store is unconfigured — no silent
  in-memory fallback, no fake reload success.
- **`tenantId` is required on every persisted row/event**, stamped from
  `RuntimeContext` — single-tenant stub is fine, but the scoping shape is real now.

_Status: Slice 1, step 1 — contracts only. No runtime implementation yet._
