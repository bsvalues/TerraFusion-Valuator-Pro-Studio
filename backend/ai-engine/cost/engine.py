"""
TotalForge Cost Engine — ported from TerraFusion CostForge AI.
Stripped of government/county-specific code.
Uses UAD Q1-Q6 quality grades and C1-C6 condition grades.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any

# UAD quality grades → engine quality factors
UAD_QUALITY_FACTORS: dict[str, float] = {
    "Q1": 1.35,  # Unique / highest quality
    "Q2": 1.20,  # Custom / above average
    "Q3": 1.08,  # Average/good quality (above typical)
    "Q4": 1.00,  # Typical / standard — baseline
    "Q5": 0.88,  # Fair / below average
    "Q6": 0.70,  # Poor / lowest quality
}

# UAD condition grades → engine condition factors
UAD_CONDITION_FACTORS: dict[str, float] = {
    "C1": 1.00,  # New, never occupied
    "C2": 0.97,  # Like new, excellent condition
    "C3": 0.90,  # Average, well-maintained
    "C4": 0.78,  # Below average, deferred maintenance
    "C5": 0.60,  # Poor, needs significant work
    "C6": 0.45,  # Severely damaged or functionally obsolete
}

# Base construction costs per sqft by building type (2025 Pacific Northwest rates)
COST_MATRICES: dict[str, dict[str, float]] = {
    "residential": {
        "base_cost_per_sqft": 165.0,
        "foundation": 16.0,
        "framing": 38.0,
        "roofing": 13.0,
        "exterior": 27.0,
        "interior": 44.0,
        "mechanical": 20.0,
        "electrical": 9.0,
        "plumbing": 14.0,
    },
    "commercial": {
        "base_cost_per_sqft": 215.0,
        "foundation": 28.0,
        "framing": 48.0,
        "roofing": 20.0,
        "exterior": 38.0,
        "interior": 58.0,
        "mechanical": 30.0,
        "electrical": 17.0,
        "plumbing": 20.0,
    },
}

# Regional cost multipliers
REGIONAL_MULTIPLIERS: dict[str, float] = {
    "urban": 1.18,
    "suburban": 1.00,
    "rural": 0.87,
}

AGE_DEPRECIATION_ANNUAL_RATE = 0.02   # 2% per year
AGE_DEPRECIATION_MAX = 0.60           # 60% maximum
INFLATION_ANNUAL_RATE = 0.035         # 3.5% per year construction inflation
INFLATION_BASE_YEAR = 2024


@dataclass
class CostRequest:
    apn: str
    square_footage: float
    year_built: int
    uad_quality: str          # Q1–Q6
    uad_condition: str        # C1–C6
    region: str               # urban | suburban | rural
    building_type: str = "residential"
    stories: int | None = None
    garage_sqft: float = 0.0


@dataclass
class CostResult:
    apn: str
    replacement_cost_new: float
    depreciated_value: float
    land_value_estimate: float | None
    cost_per_sqft: float
    regional_factor: float
    quality_factor: float
    age_condition_factor: float
    effective_age: int
    cost_breakdown: dict[str, float]
    confidence_score: float
    method: str = "TotalForge Cost Engine (UAD)"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def estimate_cost(req: CostRequest) -> CostResult:
    """
    Estimate replacement cost new and depreciated value for a subject property.
    Uses UAD quality (Q1-Q6) and condition (C1-C6) grades.
    """
    matrix = COST_MATRICES.get(req.building_type.lower(), COST_MATRICES["residential"])
    base_sqft = matrix["base_cost_per_sqft"]

    # Regional adjustment
    regional_factor = REGIONAL_MULTIPLIERS.get(req.region.lower(), 1.0)

    # UAD quality factor
    quality_str = (req.uad_quality or "Q4").upper().strip()
    if not quality_str.startswith("Q"):
        quality_str = "Q4"
    quality_factor = UAD_QUALITY_FACTORS.get(quality_str, 1.0)

    # Inflation to current year
    current_year = datetime.now().year
    years_inflation = max(current_year - INFLATION_BASE_YEAR, 0)
    inflation_factor = (1 + INFLATION_ANNUAL_RATE) ** years_inflation

    # Replacement cost new
    rcn = base_sqft * req.square_footage * regional_factor * quality_factor * inflation_factor

    # Garage addition (flat $75/sqft, lower than living area)
    if req.garage_sqft > 0:
        rcn += req.garage_sqft * 75.0 * regional_factor * inflation_factor

    # Age depreciation
    age = max(current_year - req.year_built, 0)
    age_depr = min(age * AGE_DEPRECIATION_ANNUAL_RATE, AGE_DEPRECIATION_MAX)
    age_factor = 1.0 - age_depr

    # UAD condition factor
    cond_str = (req.uad_condition or "C3").upper().strip()
    if not cond_str.startswith("C"):
        cond_str = "C3"
    condition_factor = UAD_CONDITION_FACTORS.get(cond_str, 0.90)

    age_condition_factor = age_factor * condition_factor

    # Depreciated value
    depreciated = rcn * age_condition_factor

    # Cost breakdown
    breakdown: dict[str, float] = {}
    for component, cost_per_sqft in matrix.items():
        if component != "base_cost_per_sqft":
            breakdown[component] = (
                cost_per_sqft * req.square_footage * regional_factor * quality_factor * inflation_factor
            )

    # Confidence score (85–96% based on data completeness)
    confidence = 94.0
    if req.stories is None:
        confidence -= 1.5
    if age > 60:
        confidence -= 2.0
    confidence = max(confidence, 85.0)

    return CostResult(
        apn=req.apn,
        replacement_cost_new=round(rcn),
        depreciated_value=round(depreciated),
        land_value_estimate=None,   # Caller must supply from assessor data
        cost_per_sqft=round(base_sqft * regional_factor * quality_factor * inflation_factor, 2),
        regional_factor=regional_factor,
        quality_factor=quality_factor,
        age_condition_factor=round(age_condition_factor, 4),
        effective_age=age,
        cost_breakdown={k: round(v) for k, v in breakdown.items()},
        confidence_score=round(confidence, 1),
    )
