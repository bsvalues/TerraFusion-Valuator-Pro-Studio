//! Validation utilities for property data

use crate::error::{ValuatorError, Result};
use crate::models::Property;

/// Validates property data
pub fn validate_property(property: &Property) -> Result<()> {
    if property.id.is_empty() {
        return Err(ValuatorError::ValidationError(
            "Property ID cannot be empty".to_string()
        ));
    }

    if property.address.is_empty() {
        return Err(ValuatorError::ValidationError(
            "Address cannot be empty".to_string()
        ));
    }

    if property.square_feet <= 0.0 {
        return Err(ValuatorError::ValidationError(
            "Square feet must be positive".to_string()
        ));
    }

    if property.bedrooms == 0 {
        return Err(ValuatorError::ValidationError(
            "Bedrooms must be at least 1".to_string()
        ));
    }

    if property.bathrooms <= 0.0 {
        return Err(ValuatorError::ValidationError(
            "Bathrooms must be positive".to_string()
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_property() {
        let property = Property {
            id: "VALID-001".to_string(),
            address: "789 Elm St".to_string(),
            square_feet: 2000.0,
            bedrooms: 3,
            bathrooms: 2.0,
        };
        
        assert!(validate_property(&property).is_ok());
    }

    #[test]
    fn test_invalid_empty_id() {
        let property = Property {
            id: "".to_string(),
            address: "789 Elm St".to_string(),
            square_feet: 2000.0,
            bedrooms: 3,
            bathrooms: 2.0,
        };
        
        assert!(validate_property(&property).is_err());
    }

    #[test]
    fn test_invalid_zero_square_feet() {
        let property = Property {
            id: "INVALID-001".to_string(),
            address: "789 Elm St".to_string(),
            square_feet: 0.0,
            bedrooms: 3,
            bathrooms: 2.0,
        };
        
        assert!(validate_property(&property).is_err());
    }
}
