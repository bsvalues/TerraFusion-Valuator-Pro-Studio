//! Valuation Service
//!
//! Primary service for property valuation calculations

use valuator_core::{Property, Valuation, Result};
use tracing::{info, instrument};

/// Main valuation engine
pub struct ValuationEngine;

impl ValuationEngine {
    /// Create a new valuation engine
    pub fn new() -> Self {
        info!("Creating new ValuationEngine");
        Self
    }

    /// Calculate valuation for a property
    #[instrument(skip(self))]
    pub fn calculate_valuation(&self, property: &Property) -> Result<Valuation> {
        info!(property_id = %property.id, "Calculating valuation");

        // Validate input
        valuator_core::validation::validate_property(property)?;

        // Simple valuation calculation for demo
        let base_value = property.square_feet * 200.0;
        let bedroom_adjustment = property.bedrooms as f64 * 25000.0;
        let bathroom_adjustment = property.bathrooms * 15000.0;

        let estimated_value = base_value + bedroom_adjustment + bathroom_adjustment;

        info!(
            property_id = %property.id,
            estimated_value = %estimated_value,
            "Valuation calculated successfully"
        );

        Ok(Valuation {
            property_id: property.id.clone(),
            estimated_value,
            confidence_level: 0.85,
            methodology: "TerraFusion Automated Valuation Model".to_string(),
        })
    }
}

impl Default for ValuationEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valuation_engine() {
        let engine = ValuationEngine::new();
        let property = Property {
            id: "TEST-001".to_string(),
            address: "123 Test St".to_string(),
            square_feet: 2000.0,
            bedrooms: 3,
            bathrooms: 2.0,
        };

        let result = engine.calculate_valuation(&property);
        assert!(result.is_ok());
        
        let valuation = result.unwrap();
        assert_eq!(valuation.property_id, "TEST-001");
        assert!(valuation.estimated_value > 0.0);
    }

    #[test]
    fn test_invalid_property() {
        let engine = ValuationEngine::new();
        let property = Property {
            id: "".to_string(),
            address: "123 Test St".to_string(),
            square_feet: 2000.0,
            bedrooms: 3,
            bathrooms: 2.0,
        };

        let result = engine.calculate_valuation(&property);
        assert!(result.is_err());
    }
}
