//! Core types and utilities for the TerraFusion Valuator Pro Studio
//!
//! This crate provides the foundational data structures and business logic
//! for property valuation, market analysis, and risk assessment.

pub mod error;
pub mod models;
pub mod validation;

pub use error::{ValuatorError, Result};
pub use models::{Property, Valuation, MarketData, RiskAssessment, MarketTrend, RiskLevel};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_property_creation() {
        let property = Property {
            id: "PROP-001".to_string(),
            address: "123 Main St".to_string(),
            square_feet: 2500.0,
            bedrooms: 3,
            bathrooms: 2.5,
        };
        assert_eq!(property.id, "PROP-001");
        assert_eq!(property.square_feet, 2500.0);
    }

    #[test]
    fn test_valuation_calculation() {
        let valuation = Valuation {
            property_id: "PROP-001".to_string(),
            estimated_value: 450000.0,
            confidence_level: 0.85,
            methodology: "Comparative Market Analysis".to_string(),
        };
        assert!(valuation.confidence_level > 0.0 && valuation.confidence_level <= 1.0);
    }
}
