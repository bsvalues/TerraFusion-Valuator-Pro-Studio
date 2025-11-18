use crate::model::SubjectProperty;

pub fn estimate_income_value(subject: &SubjectProperty) -> f64 {
    // Simple GRM model: annual rent * gross rent multiplier (placeholder 180)
    let annual_rent = subject.monthly_rent * 12.0;
    annual_rent * 180.0
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::SubjectProperty;

    #[test]
    fn test_income_value_standard_rent() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
            monthly_rent: 2000.0,
        };
        let value = estimate_income_value(&subject);
        // 2000 * 12 * 180 = 4,320,000
        assert_eq!(value, 4_320_000.0);
    }

    #[test]
    fn test_income_value_zero_rent() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
            monthly_rent: 0.0,
        };
        let value = estimate_income_value(&subject);
        assert_eq!(value, 0.0);
    }

    #[test]
    fn test_income_value_high_rent() {
        let subject = SubjectProperty {
            square_feet: 3000,
            bedrooms: 4,
            bathrooms: 3,
            age_years: 5,
            monthly_rent: 5000.0,
        };
        let value = estimate_income_value(&subject);
        // 5000 * 12 * 180 = 10,800,000
        assert_eq!(value, 10_800_000.0);
    }
}
