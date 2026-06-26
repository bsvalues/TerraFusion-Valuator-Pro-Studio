/**
 * TFPR Runtime — wiring.
 *
 * Server-only. Assembles the v0 runtime singletons and exposes them to API
 * routes. Modules never import this; they only see contracts.
 */
import "server-only";
import type {
  AuditTrace,
  Entitlement,
  MuseService,
  ReportPackage,
  SovereignAIProvider,
  WorkfileStore,
} from "../contracts";
import { PostgresWorkfileStore } from "./postgres-workfile-store";
import { PostgresAuditTrace } from "./postgres-audit-trace";
import { SovereignAIProviderImpl } from "./sovereign-ai-provider";
import { MuseServiceImpl } from "./muse-service";
import { StubEntitlement } from "./entitlement";
import { HtmlReportPackage } from "./report-package";

export interface Runtime {
  store: WorkfileStore;
  audit: AuditTrace;
  ai: SovereignAIProvider;
  muse: MuseService;
  entitlement: Entitlement;
  report: ReportPackage;
}

let _runtime: Runtime | null = null;

export function getRuntime(): Runtime {
  if (!_runtime) {
    const store = new PostgresWorkfileStore();
    const audit = new PostgresAuditTrace();
    const ai = new SovereignAIProviderImpl();
    const muse = new MuseServiceImpl(store, ai, audit);
    const entitlement = new StubEntitlement();
    const report = new HtmlReportPackage(store);
    _runtime = { store, audit, ai, muse, entitlement, report };
  }
  return _runtime;
}

export { resolveContext } from "./context";
export { certifyOpinionOfValue, CertifyValidationError } from "./certify";
