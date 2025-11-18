use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubjectProperty {
    pub square_feet: u32,
    pub bedrooms: u8,
    pub bathrooms: u8,
    pub age_years: u8,
    pub monthly_rent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValuationResult {
    pub final_value: f64,
    pub sales_indicator: f64,
    pub cost_indicator: f64,
    pub income_indicator: f64,
}
