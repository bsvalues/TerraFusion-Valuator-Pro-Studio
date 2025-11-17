//! Risk Assessor Service
//!
//! Service for assessing risk factors in property valuation

use valuator_core::{Property, RiskAssessment, RiskLevel, Result};
use tracing::{info, instrument};

/// Risk assessment engine
pub struct RiskAssessor;

impl RiskAssessor {
    /// Create a new risk assessor
    pub fn new() -> Self {
        info!("Creating new RiskAssessor");
        Self
    }

    /// Assess risk for a property
    #[instrument(skip(self))]
    pub fn assess_risk(&self, property: &Property) -> Result<RiskAssessment> {
        info!(property_id = %property.id, "Assessing risk");

        // Validate input
        valuator_core::validation::validate_property(property)?;

        // Simple risk calculation for demo
        let mut risk_score = 0.0;
        let mut factors = Vec::new();

        // Age and size factors
        if property.square_feet > 5000.0 {
            risk_score += 0.2;
            factors.push("Large property size".to_string());
        }

        if property.bedrooms > 5 {
            risk_score += 0.1;
            factors.push("High bedroom count".to_string());
        }

        // Determine risk level
        let risk_level = if risk_score < 0.3 {
            RiskLevel::Low
        } else if risk_score < 0.6 {
            RiskLevel::Medium
        } else {
            RiskLevel::High
        };

        if factors.is_empty() {
            factors.push("Standard property profile".to_string());
        }

        info!(
            property_id = %property.id,
            risk_score = %risk_score,
            "Risk assessment complete"
        );

        Ok(RiskAssessment {
            property_id: property.id.clone(),
            risk_score,
            risk_level,
            factors,
        })
    }
}

impl Default for RiskAssessor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_assessor() {
        let assessor = RiskAssessor::new();
        let property = Property {
            id: "TEST-001".to_string(),
            address: "123 Test St".to_string(),
            square_feet: 2000.0,
            bedrooms: 3,
            bathrooms: 2.0,
        };

        let result = assessor.assess_risk(&property);
        assert!(result.is_ok());
        
        let assessment = result.unwrap();
        assert_eq!(assessment.property_id, "TEST-001");
        assert!(assessment.risk_score >= 0.0);
    }

    #[test]
    fn test_high_risk_property() {
        let assessor = RiskAssessor::new();
        let property = Property {
            id: "HIGH-RISK-001".to_string(),
            address: "456 Mansion Ave".to_string(),
            square_feet: 8000.0,
            bedrooms: 7,
            bathrooms: 5.0,
        };

        let result = assessor.assess_risk(&property);
        assert!(result.is_ok());
        
        let assessment = result.unwrap();
        assert!(assessment.risk_score > 0.0);
    }

    #[test]
    fn test_invalid_property_risk() {
        let assessor = RiskAssessor::new();
        let property = Property {
            id: "".to_string(),
            address: "123 Test St".to_string(),
            square_feet: 2000.0,
            bedrooms: 3,
            bathrooms: 2.0,
        };

        let result = assessor.assess_risk(&property);
        assert!(result.is_err());
    }
}
