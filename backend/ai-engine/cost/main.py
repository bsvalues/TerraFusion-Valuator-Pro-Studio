"""
TotalForge Cost Engine Sidecar — FastAPI
Exposes POST /analyze/cost for the ai-engine Rust service to proxy, or direct use.
Runs on port 8084 (separate from the Rust ai-engine on 8082).
"""

from __future__ import annotations

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from engine import CostRequest, estimate_cost

app = FastAPI(
    title="TotalForge Cost Engine",
    description="UAD-grade construction cost estimation for fee appraisers",
    version="0.1.0",
)

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN, "http://localhost:8082"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class CostAnalysisRequest(BaseModel):
    apn: str = Field(..., description="Parcel identifier")
    square_footage: float = Field(..., gt=0, description="Gross living area in square feet")
    year_built: int = Field(..., ge=1800, le=2100, description="Year of original construction")
    uad_quality: str = Field(
        "Q4",
        pattern=r"^Q[1-6]$",
        description="UAD quality grade: Q1 (best) through Q6 (worst)",
    )
    uad_condition: str = Field(
        "C3",
        pattern=r"^C[1-6]$",
        description="UAD condition grade: C1 (new) through C6 (failed)",
    )
    region: str = Field(
        "suburban",
        pattern=r"^(urban|suburban|rural)$",
        description="Regional location type for cost multiplier",
    )
    building_type: str = Field(
        "residential",
        pattern=r"^(residential|commercial)$",
        description="Building type for cost matrix selection",
    )
    stories: int | None = Field(None, ge=1, le=10)
    garage_sqft: float = Field(0.0, ge=0.0)
    land_value: float | None = Field(
        None,
        ge=0,
        description="Optional appraiser-supplied land value to include in value summary",
    )


class CostAnalysisResponse(BaseModel):
    apn: str
    replacement_cost_new: float
    depreciated_value: float
    land_value: float | None
    value_by_cost_approach: float | None
    cost_per_sqft: float
    regional_factor: float
    quality_factor: float
    age_condition_factor: float
    effective_age: int
    cost_breakdown: dict[str, float]
    confidence_score: float
    method: str


@app.get("/health")
def health() -> dict:
    return {"status": "healthy", "service": "totalforge-cost-engine", "version": "0.1.0"}


@app.post("/analyze/cost", response_model=CostAnalysisResponse)
def analyze_cost(req: CostAnalysisRequest) -> CostAnalysisResponse:
    """
    Estimate replacement cost new and depreciated value for a subject property.

    - `uad_quality`: Q1 (unique/best) → Q6 (poor) — maps to cost multiplier
    - `uad_condition`: C1 (new) → C6 (failed) — maps to depreciation factor
    - `region`: urban (+18%) / suburban (base) / rural (-13%)
    - `land_value`: if supplied, returns `value_by_cost_approach = depreciated + land`
    """
    try:
        result = estimate_cost(
            CostRequest(
                apn=req.apn,
                square_footage=req.square_footage,
                year_built=req.year_built,
                uad_quality=req.uad_quality,
                uad_condition=req.uad_condition,
                region=req.region,
                building_type=req.building_type,
                stories=req.stories,
                garage_sqft=req.garage_sqft,
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    land = req.land_value
    value_by_cost = (
        round(result.depreciated_value + land) if land is not None else None
    )

    return CostAnalysisResponse(
        apn=result.apn,
        replacement_cost_new=result.replacement_cost_new,
        depreciated_value=result.depreciated_value,
        land_value=land,
        value_by_cost_approach=value_by_cost,
        cost_per_sqft=result.cost_per_sqft,
        regional_factor=result.regional_factor,
        quality_factor=result.quality_factor,
        age_condition_factor=result.age_condition_factor,
        effective_age=result.effective_age,
        cost_breakdown=result.cost_breakdown,
        confidence_score=result.confidence_score,
        method=result.method,
    )


# ── Narrative Generation ──────────────────────────────────────────────────────

class SubjectInput(BaseModel):
    address: str = ""
    city: str = ""
    state: str = ""
    gla: float | None = None
    year_built: int | None = None
    quality: str | None = None
    condition: str | None = None
    view: str | None = None
    site_area: str | None = None
    bedrooms: int | None = None
    baths: int | None = None


class CompInput(BaseModel):
    address: str | None = None
    sale_price: float | None = None
    sale_date: str | None = None
    gla: float | None = None
    year_built: int | None = None
    net_adj: float | None = None
    adj_sale_price: float | None = None


class NarrativeRequest(BaseModel):
    subject: SubjectInput
    comparables: list[CompInput] = []
    final_value: float | None = None
    effective_date: str | None = None
    section: str = Field(
        "market_conditions",
        pattern=r"^(market_conditions|neighborhood|reconciliation)$",
        description="Which URAR section to generate",
    )


class NarrativeResponse(BaseModel):
    section: str
    text: str
    provider: str
    model: str | None


def _template_narrative(req: NarrativeRequest) -> str:
    """Template-based fallback when no AI provider is configured."""
    s = req.subject
    comps = [c for c in req.comparables if c.adj_sale_price is not None]
    adj_prices = [c.adj_sale_price for c in comps if c.adj_sale_price]

    if req.section == "market_conditions":
        avg_adj = round(sum(adj_prices) / len(adj_prices)) if adj_prices else None
        price_str = f"${avg_adj:,.0f}" if avg_adj else "market data"
        return (
            f"The subject property is located in {s.city}, {s.state}. "
            f"Market conditions in this area reflect typical supply and demand for residential properties. "
            f"The three comparable sales utilized support a value range consistent with the market trend, "
            f"with adjusted sale prices averaging approximately {price_str}. "
            f"There is no evidence of an extraordinary assumption or hypothetical condition affecting this analysis."
        )
    elif req.section == "neighborhood":
        return (
            f"The subject property is located in {s.city}, {s.state}. "
            f"The neighborhood consists primarily of residential land uses. "
            f"Land use and development are consistent with the predominant regional land use pattern. "
            f"No adverse conditions were observed in the neighborhood that would negatively affect marketability."
        )
    elif req.section == "reconciliation":
        fv = f"${req.final_value:,.0f}" if req.final_value else "the appraised value"
        eff = req.effective_date or "the effective date"
        return (
            f"Based on the sales comparison analysis, the reconciled value is {fv} as of {eff}. "
            f"The sales comparison approach was given primary weight in this analysis. "
            f"The comparables selected are the most similar available and adequately bracket the subject. "
            f"The final value opinion reflects current market conditions."
        )
    return ""


@app.post("/analyze/narrative", response_model=NarrativeResponse)
def analyze_narrative(req: NarrativeRequest) -> NarrativeResponse:
    """
    Generate a URAR narrative section draft.

    - `section`: market_conditions | neighborhood | reconciliation
    - If `OPENAI_API_KEY` is set, uses GPT-4o-mini; otherwise returns template text.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()

    if api_key:
        try:
            import openai  # type: ignore
            client = openai.OpenAI(api_key=api_key)

            s = req.subject
            comps_txt = "\n".join(
                f"  Comp {i+1}: {c.address or 'unknown'}, sale ${c.sale_price:,.0f if c.sale_price else 'N/A'}, "
                f"GLA {c.gla or 'N/A'} sqft, net adj ${c.net_adj:,.0f if c.net_adj else '0'}, "
                f"adj price ${c.adj_sale_price:,.0f if c.adj_sale_price else 'N/A'}"
                for i, c in enumerate(req.comparables)
            )
            system_prompt = (
                "You are a licensed residential appraiser writing URAR form narrative sections. "
                "Be concise, professional, and factual. Use standard appraisal terminology. "
                "Output 2-4 sentences. Do not include headings or labels."
            )
            user_prompt = (
                f"Write the {req.section.replace('_', ' ')} section for a URAR appraisal report.\n"
                f"Subject: {s.address}, {s.city}, {s.state}. "
                f"GLA: {s.gla} sqft, Year built: {s.year_built}, "
                f"Quality: {s.quality}, Condition: {s.condition}.\n"
                f"Comparables:\n{comps_txt}\n"
                f"Final value: {f'${req.final_value:,.0f}' if req.final_value else 'N/A'}, "
                f"Effective date: {req.effective_date or 'N/A'}"
            )

            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=300,
                temperature=0.3,
            )
            text = completion.choices[0].message.content or ""
            return NarrativeResponse(section=req.section, text=text.strip(), provider="openai", model="gpt-4o-mini")
        except Exception as exc:
            # Fall through to template on any AI error
            import logging
            logging.warning("OpenAI narrative failed, using template: %s", exc)

    text = _template_narrative(req)
    return NarrativeResponse(section=req.section, text=text, provider="template", model=None)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("COST_ENGINE_PORT", "8084"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
