pub mod cost_approach;
pub mod income_approach;
pub mod model;
pub mod qc;
pub mod reconciliation;
pub mod sales_comparison;

use model::{SubjectProperty, ValuationResult};
use sales_comparison::ComparableSale;

/// High-level entry point: perform simplified valuation combining approaches.
pub fn estimate_value(subject: &SubjectProperty, comps: &[ComparableSale]) -> ValuationResult {
    let sales_value = sales_comparison::estimate_sales_value(subject, comps);
    let cost_value = cost_approach::estimate_cost_value(subject);
    let income_value = income_approach::estimate_income_value(subject);
    reconciliation::reconcile(sales_value, cost_value, income_value)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sales_comparison::ComparableSale;

    #[test]
    fn smoke_estimate_value() {
        let subject = SubjectProperty {
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 10,
            monthly_rent: 2200.0,
        };
        let comps = vec![
            ComparableSale {
                sale_price: 400_000.0,
                square_feet: 1900,
                bedrooms: 3,
                bathrooms: 2,
                age_years: 12,
            },
            ComparableSale {
                sale_price: 420_000.0,
                square_feet: 2050,
                bedrooms: 3,
                bathrooms: 2,
                age_years: 9,
            },
        ];
        let result = estimate_value(&subject, &comps);
        assert!(result.final_value > 0.0);
        assert!(result.sales_indicator > 0.0);
    }
}
