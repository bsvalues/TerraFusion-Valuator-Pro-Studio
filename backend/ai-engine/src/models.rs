use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Property data for AI analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyData {
    pub id: Option<Uuid>,
    pub address: String,
    pub city: String,
    pub state: String,
    pub zip_code: String,
    pub property_type: String,
    pub square_feet: u32,
    pub lot_size_sqft: Option<u32>,
    pub bedrooms: u8,
    pub bathrooms: u8,
    pub year_built: u16,
    pub monthly_rent: Option<f64>,
}

/// Comparable sale data for analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComparableData {
    pub sale_price: f64,
    pub sale_date: DateTime<Utc>,
    pub square_feet: u32,
    pub bedrooms: u8,
    pub bathrooms: u8,
    pub year_built: u16,
    pub distance_miles: Option<f64>,
}

/// AI insight request
#[derive(Debug, Deserialize)]
pub struct InsightRequest {
    pub property: PropertyData,
    pub comparables: Vec<ComparableData>,
    pub valuation_result: Option<ValuationSummary>,
}

/// Valuation summary from core engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValuationSummary {
    pub final_value: f64,
    pub sales_indicator: f64,
    pub cost_indicator: f64,
    pub income_indicator: f64,
}

/// AI-generated property insights
#[derive(Debug, Serialize)]
pub struct PropertyInsights {
    pub property_id: Option<Uuid>,
    pub generated_at: DateTime<Utc>,
    pub confidence_score: f64,
    pub market_analysis: MarketAnalysis,
    pub value_drivers: Vec<ValueDriver>,
    pub risk_factors: Vec<RiskFactor>,
    pub recommendations: Vec<Recommendation>,
    pub comparable_analysis: ComparableAnalysis,
    pub narrative_summary: String,
}

/// Market analysis insights
#[derive(Debug, Serialize)]
pub struct MarketAnalysis {
    pub market_trend: MarketTrend,
    pub price_per_sqft_market_avg: f64,
    pub price_per_sqft_subject: f64,
    pub market_position: String,
    pub days_on_market_avg: Option<u32>,
    pub absorption_rate: Option<f64>,
}

/// Market trend direction
#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MarketTrend {
    Rising,
    Stable,
    Declining,
    Volatile,
}

/// Value driver affecting property value
#[derive(Debug, Serialize)]
pub struct ValueDriver {
    pub factor: String,
    pub impact: ValueImpact,
    pub contribution_pct: f64,
    pub description: String,
}

/// Impact classification
#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ValueImpact {
    StrongPositive,
    Positive,
    Neutral,
    Negative,
    StrongNegative,
}

/// Risk factor identified
#[derive(Debug, Serialize)]
pub struct RiskFactor {
    pub category: RiskCategory,
    pub severity: RiskSeverity,
    pub description: String,
    pub mitigation: Option<String>,
}

/// Risk categories
#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RiskCategory {
    Market,
    Property,
    Location,
    Economic,
    Environmental,
    DataQuality,
}

/// Risk severity levels
#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RiskSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Recommendation from AI
#[derive(Debug, Serialize)]
pub struct Recommendation {
    pub action: String,
    pub priority: RecommendationPriority,
    pub rationale: String,
    pub estimated_value_impact: Option<f64>,
}

/// Recommendation priority
#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RecommendationPriority {
    High,
    Medium,
    Low,
}

/// Analysis of comparable properties
#[derive(Debug, Serialize)]
pub struct ComparableAnalysis {
    pub total_comps: usize,
    pub avg_adjustment_pct: f64,
    pub similarity_scores: Vec<f64>,
    pub outliers: Vec<usize>,
    pub best_comparable_index: Option<usize>,
    pub adjustment_summary: String,
}

/// Market forecast request
#[derive(Debug, Deserialize)]
pub struct ForecastRequest {
    pub property: PropertyData,
    pub current_value: f64,
    pub forecast_months: u8,
}

/// Market value forecast
#[derive(Debug, Serialize)]
pub struct ValueForecast {
    pub current_value: f64,
    pub forecast_date: DateTime<Utc>,
    pub predicted_value: f64,
    pub confidence_interval_low: f64,
    pub confidence_interval_high: f64,
    pub annual_appreciation_rate: f64,
    pub factors: Vec<ForecastFactor>,
}

/// Factor affecting forecast
#[derive(Debug, Serialize)]
pub struct ForecastFactor {
    pub name: String,
    pub impact_pct: f64,
    pub trend: MarketTrend,
}

/// QC check request
#[derive(Debug, Deserialize)]
pub struct QcRequest {
    pub property: PropertyData,
    pub valuation_result: ValuationSummary,
    pub comparables: Vec<ComparableData>,
}

/// QC check results
#[derive(Debug, Serialize)]
pub struct QcResults {
    pub passed: bool,
    pub score: f64,
    pub checks: Vec<QcCheck>,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
}

/// Individual QC check
#[derive(Debug, Serialize)]
pub struct QcCheck {
    pub name: String,
    pub passed: bool,
    pub message: String,
    pub severity: QcSeverity,
}

/// QC severity level
#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum QcSeverity {
    Info,
    Warning,
    Error,
}
