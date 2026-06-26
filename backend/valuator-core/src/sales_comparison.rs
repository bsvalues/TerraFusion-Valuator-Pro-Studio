use crate::model::SubjectProperty;

#[derive(Debug, Clone)]
pub struct ComparableSale {
    pub sale_price: f64,
    pub square_feet: u32,
    pub bedrooms: u8,
    pub bathrooms: u8,
    pub age_years: u8,
}

pub fn estimate_sales_value(subject: &SubjectProperty, comps: &[ComparableSale]) -> f64 {
    if comps.is_empty() {
        return 0.0;
    }
    // Very naive: size adjustment +/- $50 per sqft delta, age -$500 per year difference
    let mut adjusted_sum = 0.0;
    for c in comps {
        let mut adj = c.sale_price;
        let sqft_delta = subject.square_feet as f64 - c.square_feet as f64;
        adj += sqft_delta * 50.0;
        let age_delta = subject.age_years as f64 - c.age_years as f64;
        adj -= age_delta * 500.0; // newer subject: positive age_delta reduces comp price
        adjusted_sum += adj;
    }
    adjusted_sum / comps.len() as f64
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::SubjectProperty;

    #[test]
    fn test_estimate_sales_value_exact_match() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
            monthly_rent: 2000.0,
        };
        let comps = vec![ComparableSale {
            sale_price: 400_000.0,
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
        }];
        let value = estimate_sales_value(&subject, &comps);
        // No adjustments needed
        assert_eq!(value, 400_000.0);
    }

    #[test]
    fn test_estimate_sales_value_no_comps() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
            monthly_rent: 2000.0,
        };
        let comps = vec![];
        let value = estimate_sales_value(&subject, &comps);
        assert_eq!(value, 0.0);
    }

    #[test]
    fn test_estimate_sales_value_size_adjustment() {
        let subject = SubjectProperty {
            square_feet: 2100,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
            monthly_rent: 2000.0,
        };
        let comps = vec![ComparableSale {
            sale_price: 400_000.0,
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
        }];
        let value = estimate_sales_value(&subject, &comps);
        // Subject is 100 sqft larger: +100 * 50 = +5000
        assert_eq!(value, 405_000.0);
    }

    #[test]
    fn test_estimate_sales_value_age_adjustment() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 5,
            monthly_rent: 2000.0,
        };
        let comps = vec![ComparableSale {
            sale_price: 400_000.0,
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
        }];
        let value = estimate_sales_value(&subject, &comps);
        // Subject is 5 years newer: age_delta = 5 - 10 = -5, adjustment = -(-5)*500 = +2500
        assert_eq!(value, 402_500.0);
    }
}
