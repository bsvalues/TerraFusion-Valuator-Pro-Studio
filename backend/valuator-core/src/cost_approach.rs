use crate::model::SubjectProperty;

pub fn estimate_cost_value(subject: &SubjectProperty) -> f64 {
    // Naive replacement cost: base $150 per sqft minus depreciation (age * 0.5%)
    let base = subject.square_feet as f64 * 150.0;
    let depreciation = base * (subject.age_years as f64 * 0.005).min(0.8); // cap 80%
    base - depreciation
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::SubjectProperty;

    #[test]
    fn test_cost_value_new_property() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 0,
            monthly_rent: 2000.0,
        };
        let value = estimate_cost_value(&subject);
        // 2000 * 150 = 300,000 (no depreciation)
        assert_eq!(value, 300_000.0);
    }

    #[test]
    fn test_cost_value_with_depreciation() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
            monthly_rent: 2000.0,
        };
        let value = estimate_cost_value(&subject);
        // Base: 300,000, depreciation: 300k * (10 * 0.005) = 300k * 0.05 = 15,000
        // Result: 285,000
        assert_eq!(value, 285_000.0);
    }

    #[test]
    fn test_cost_value_depreciation_capped() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 200, // Extremely old
            monthly_rent: 2000.0,
        };
        let value = estimate_cost_value(&subject);
        // Depreciation capped at 80%: 300k - (300k * 0.8) = 60,000
        assert_eq!(value, 60_000.0);
    }
}
