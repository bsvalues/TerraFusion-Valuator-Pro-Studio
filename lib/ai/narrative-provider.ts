/**
 * TerraFusion AI Gateway — narrative provider abstraction (sovereign by design).
 *
 * Valuator Pro must NOT depend directly on OpenAI. Narrative generation goes through this
 * TerraFusion-controlled interface. The product works with NO external AI (template default);
 * external providers are optional and explicit; data egress is a deliberate, configured choice.
 *
 *   AI_PROVIDER=template     (DEFAULT) — structured scaffold from the workfile, no external call.
 *   AI_PROVIDER=terrafusion  — TerraFusion sovereign endpoint (TERRAFUSION_AI_ENDPOINT); graceful fallback.
 *   AI_PROVIDER=openai       — optional fallback; OPENAI_API_KEY only required in THIS mode.
 *   AI_PROVIDER=disabled     — no drafting; returns a clear, non-crashing message.
 *
 * The core workfile / evidence / report pipeline never depends on any external model.
 */

export type NarrativeType =
  | "property_description" | "scope_of_work" | "market_conditions" | "highest_best_use"
  | "cost_approach" | "sales_comparison" | "income_approach" | "reconciliation";

export interface NarrativeRequest {
  type: NarrativeType;
  systemPrompt: string;
  userPrompt: string;
  /** Raw parsed body — structured fields the template provider scaffolds from. */
  fields: Record<string, unknown>;
}

export interface NarrativeResult {
  narrative: string;
  type: NarrativeType;
  /** Which provider answered: template | terrafusion | openai | disabled */
  provider: string;
  /** "scaffold" (deterministic, no model) | "generated" (a model wrote it) */
  mode: "scaffold" | "generated" | "disabled";
  /** True when output is a template scaffold for the appraiser to complete, not model prose. */
  isTemplate: boolean;
}

export type ProviderMode = "template" | "terrafusion" | "openai" | "disabled";

export function resolveProviderMode(): ProviderMode {
  const raw = (process.env.AI_PROVIDER || "template").toLowerCase().trim();
  if (raw === "terrafusion" || raw === "openai" || raw === "disabled") return raw;
  return "template";
}

// ── Section labels for the template scaffolder ──────────────────────────────
const SECTION: Record<NarrativeType, { title: string; uspap: string }> = {
  property_description: { title: "Subject Property Description", uspap: "USPAP SR 2-2(a)(vii)" },
  scope_of_work: { title: "Scope of Work", uspap: "USPAP SR 2-2(a)(iii)" },
  market_conditions: { title: "Market Conditions", uspap: "USPAP SR 1-3(a)" },
  highest_best_use: { title: "Highest and Best Use", uspap: "USPAP SR 1-3(b)" },
  cost_approach: { title: "Cost Approach", uspap: "USPAP SR 1-4(b)" },
  sales_comparison: { title: "Sales Comparison Approach", uspap: "USPAP SR 1-4(a)" },
  income_approach: { title: "Income Approach", uspap: "USPAP SR 1-4(c)" },
  reconciliation: { title: "Reconciliation & Final Opinion of Value", uspap: "USPAP SR 1-6" },
};

/**
 * TEMPLATE provider — deterministic structured scaffold from the workfile. No external model.
 * Honest: it fills what the workfile knows and brackets where the appraiser must apply judgment.
 * This is the default so the product is fully functional with zero external AI.
 */
function templateNarrative(req: NarrativeRequest): string {
  const b = req.fields;
  const s = (b.subject ?? b.property ?? {}) as Record<string, unknown>;
  const a = (b.approaches ?? {}) as Record<string, unknown>;
  const m = (b.market ?? {}) as Record<string, unknown>;
  const sec = SECTION[req.type];
  const loc = [s.address, s.city, s.state].filter(Boolean).join(", ");
  const usd = (n: unknown) => (typeof n === "number" ? "$" + n.toLocaleString() : "[value]");

  const lead = `${sec.title} (${sec.uspap}).`;
  let bodyText = "";
  switch (req.type) {
    case "property_description":
      bodyText = `The subject is ${loc || "[address]"}${s.county ? `, ${s.county} County` : ""}, a ${s.propertyType ?? "[property type]"} `
        + `${(s.gla ?? s.squareFeet) ? `containing approximately ${((s.gla ?? s.squareFeet) as number).toLocaleString()} sq ft` : ""}`
        + `${s.yearBuilt ? `, built in ${s.yearBuilt}` : ""}${s.condition ? `, in ${s.condition} condition` : ""}. `
        + `[Appraiser: describe site, improvements, and any features material to value.]`;
      break;
    case "scope_of_work":
      bodyText = `The scope of work reflects the intended use (${b.intendedUse ?? "[intended use]"}) and report type `
        + `(${b.reportType ?? "Appraisal Report"}). Approaches developed: `
        + `${[a.cost && "Cost", a.salesComp && "Sales Comparison", a.income && "Income"].filter(Boolean).join(", ") || "[approaches]"}. `
        + `[Appraiser: state inspection scope, data sources, and any extraordinary assumptions.]`;
      break;
    case "market_conditions":
      bodyText = `The subject competes in the ${s.city ?? "[market area]"} market. Indicators: `
        + `median price ${usd(m.medianPrice)}, avg $/SF ${m.averagePricePerSqft ? "$" + m.averagePricePerSqft : "[n/a]"}, `
        + `avg DOM ${m.averageDaysOnMarket ?? "[n/a]"}, trend ${m.marketTrend ?? "[trend]"}. `
        + `[Appraiser: interpret supply/demand, financing, and the trend's effect on value.]`;
      break;
    case "highest_best_use":
      bodyText = `Highest and best use is analyzed under the four tests (legally permissible, physically possible, `
        + `financially feasible, maximally productive), as vacant and as improved. `
        + `[Appraiser: state the conclusion for each and the resulting H&BU.]`;
      break;
    case "cost_approach":
      bodyText = `The cost approach develops replacement cost new less depreciation plus land value`
        + `${a.cost ? `, indicating ${usd(a.cost)}` : ""}. [Appraiser: summarize cost source, depreciation, and land basis.]`;
      break;
    case "sales_comparison":
      bodyText = `The sales comparison approach analyzes comparable sales with adjustments`
        + `${a.salesComp ? `, indicating ${usd(a.salesComp)}` : ""}. [Appraiser: summarize comp selection, adjustments, and reconciliation of the indicated range.]`;
      break;
    case "income_approach":
      bodyText = `The income approach capitalizes the subject's income`
        + `${a.income ? `, indicating ${usd(a.income)}` : ""}. [Appraiser: state rent basis, vacancy/collection loss, expenses, and cap rate derivation.]`;
      break;
    case "reconciliation":
      bodyText = `The approaches are reconciled to a final opinion of value`
        + `${a.cost ? ` — Cost ${usd(a.cost)} (${a.costWeight ?? 0}%)` : ""}`
        + `${a.salesComp ? `, Sales Comparison ${usd(a.salesComp)} (${a.salesCompWeight ?? 0}%)` : ""}`
        + `${a.income ? `, Income ${usd(a.income)} (${a.incomeWeight ?? 0}%)` : ""}`
        + `${a.final ? `, supporting a final opinion of ${usd(a.final)}` : ""}. `
        + `[Appraiser: explain the weight given to each approach and why.]`;
      break;
    default:
      bodyText = `[Appraiser: draft the ${sec.title} narrative from the workfile.]`;
  }
  return `${lead}\n\n${bodyText}\n\n— TerraFusion template scaffold (no external AI). Edit and complete; you remain the author of record.`;
}

// ── Providers ───────────────────────────────────────────────────────────────
async function generateOpenAI(req: NarrativeRequest): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("AI_PROVIDER=openai but OPENAI_API_KEY is not set.");
  }
  const { default: OpenAI } = await import("openai"); // lazy: only loaded in openai mode
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [
      { role: "system", content: req.systemPrompt },
      { role: "user", content: req.userPrompt },
    ],
    max_tokens: 800,
    temperature: 0.3,
  });
  return completion.choices[0]?.message?.content ?? "";
}

async function generateTerraFusion(req: NarrativeRequest): Promise<string> {
  const endpoint = process.env.TERRAFUSION_AI_ENDPOINT;
  if (!endpoint) {
    // Sovereign endpoint not configured yet — fall back to the template scaffold, never crash.
    return templateNarrative(req) + "\n\n(TerraFusion sovereign endpoint not configured; returned a template scaffold.)";
  }
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.TERRAFUSION_AI_API_KEY ? { Authorization: `Bearer ${process.env.TERRAFUSION_AI_API_KEY}` } : {}),
    },
    body: JSON.stringify({ system: req.systemPrompt, prompt: req.userPrompt, type: req.type }),
  });
  if (!resp.ok) throw new Error(`TerraFusion AI endpoint returned ${resp.status}`);
  const data = (await resp.json()) as { narrative?: string; text?: string };
  return data.narrative ?? data.text ?? "";
}

/**
 * Generate a narrative via the configured provider. Never throws for normal "not configured"
 * conditions — degrades to a template scaffold or a clear message instead.
 */
export async function generateNarrative(req: NarrativeRequest): Promise<NarrativeResult> {
  const mode = resolveProviderMode();
  const base = { type: req.type } as const;

  if (mode === "disabled") {
    return { ...base, provider: "disabled", mode: "disabled", isTemplate: false,
      narrative: "AI narrative drafting is disabled in this deployment. Draft this section manually, or set AI_PROVIDER to template, terrafusion, or openai." };
  }
  if (mode === "template") {
    return { ...base, provider: "template", mode: "scaffold", isTemplate: true, narrative: templateNarrative(req) };
  }
  try {
    const narrative = mode === "openai" ? await generateOpenAI(req) : await generateTerraFusion(req);
    return { ...base, provider: mode, mode: "generated", isTemplate: false, narrative };
  } catch (err) {
    // Graceful sovereign fallback: external provider failed → template scaffold + disclosure.
    const reason = err instanceof Error ? err.message : "provider error";
    return { ...base, provider: `${mode}->template`, mode: "scaffold", isTemplate: true,
      narrative: templateNarrative(req) + `\n\n(${mode} provider unavailable: ${reason}. Returned a template scaffold.)` };
  }
}
