//! Core data models for property valuation

use serde::{Deserialize, Serialize};

/// Represents a property being valued
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Property {
    pub id: String,
    pub address: String,
    pub square_feet: f64,
    pub bedrooms: u32,
    pub bathrooms: f64,
}

/// Represents a valuation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Valuation {
    pub property_id: String,
    pub estimated_value: f64,
    pub confidence_level: f64,
    pub methodology: String,
}

/// Market data for analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketData {
    pub region: String,
    pub median_price: f64,
    pub average_price_per_sqft: f64,
    pub market_trend: MarketTrend,
}

/// Market trend indicator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MarketTrend {
    Rising,
    Stable,
    Declining,
}

/// Risk assessment result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub property_id: String,
    pub risk_score: f64,
    pub risk_level: RiskLevel,
    pub factors: Vec<String>,
}

/// Risk level classification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serialize_property() {
        let property = Property {
            id: "TEST-001".to_string(),
            address: "456 Oak Ave".to_string(),
            square_feet: 1800.0,
            bedrooms: 2,
            bathrooms: 2.0,
        };
        
        let json = serde_json::to_string(&property).unwrap();
        assert!(json.contains("TEST-001"));
    }

    #[test]
    fn test_deserialize_valuation() {
        let json = r#"{
            "property_id": "TEST-001",
            "estimated_value": 350000.0,
            "confidence_level": 0.9,
            "methodology": "Automated Valuation Model"
        }"#;
        
        let valuation: Valuation = serde_json::from_str(json).unwrap();
        assert_eq!(valuation.property_id, "TEST-001");
    }
}
