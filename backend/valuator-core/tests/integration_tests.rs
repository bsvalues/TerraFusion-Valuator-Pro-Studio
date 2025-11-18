// Integration tests for valuator-core
use valuator_core::model::SubjectProperty;
use valuator_core::sales_comparison::ComparableSale;
use valuator_core::*;

#[test]
fn test_full_valuation_workflow() {
    // Create a realistic subject property
    let subject = SubjectProperty {
        square_feet: 2000,
        bedrooms: 3,
        bathrooms: 2,
        age_years: 10,
        monthly_rent: 2200.0,
    };

    // Create comparable sales
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
        ComparableSale {
            sale_price: 410_000.0,
            square_feet: 2000,
            bedrooms: 3,
            bathrooms: 2,
            age_years: 11,
        },
    ];

    // Run the full valuation
    let result = estimate_value(&subject, &comps);

    // Verify results are reasonable
    assert!(result.final_value > 0.0, "Final value should be positive");
    assert!(
        result.sales_indicator > 0.0,
        "Sales indicator should be positive"
    );
    assert!(
        result.cost_indicator > 0.0,
        "Cost indicator should be positive"
    );
    assert!(
        result.income_indicator > 0.0,
        "Income indicator should be positive"
    );

    // Final value should be a weighted combination
    let expected_final =
        result.sales_indicator * 0.4 + result.cost_indicator * 0.3 + result.income_indicator * 0.3;
    assert_eq!(
        result.final_value, expected_final,
        "Final value should match weighted average"
    );
}

#[test]
fn test_valuation_with_no_comparables() {
    let subject = SubjectProperty {
        square_feet: 2000,
        bedrooms: 3,
        bathrooms: 2,
        age_years: 10,
        monthly_rent: 2200.0,
    };

    let comps = vec![];
    let result = estimate_value(&subject, &comps);

    // Sales indicator should be zero with no comps
    assert_eq!(result.sales_indicator, 0.0);

    // But cost and income should still work
    assert!(result.cost_indicator > 0.0);
    assert!(result.income_indicator > 0.0);

    // Final value should still be reasonable
    assert!(result.final_value > 0.0);
}

#[test]
fn test_valuation_new_property() {
    let subject = SubjectProperty {
        square_feet: 2500,
        bedrooms: 4,
        bathrooms: 3,
        age_years: 0, // Brand new
        monthly_rent: 3000.0,
    };

    let comps = vec![ComparableSale {
        sale_price: 500_000.0,
        square_feet: 2500,
        bedrooms: 4,
        bathrooms: 3,
        age_years: 0,
    }];

    let result = estimate_value(&subject, &comps);

    // New property should have minimal depreciation
    // Cost approach: 2500 * 150 = 375,000
    assert_eq!(result.cost_indicator, 375_000.0);

    // Exact match comp should give exact price
    assert_eq!(result.sales_indicator, 500_000.0);
}

#[test]
fn test_valuation_old_property() {
    let subject = SubjectProperty {
        square_feet: 1500,
        bedrooms: 2,
        bathrooms: 1,
        age_years: 100, // Very old
        monthly_rent: 1500.0,
    };

    let comps = vec![ComparableSale {
        sale_price: 200_000.0,
        square_feet: 1500,
        bedrooms: 2,
        bathrooms: 1,
        age_years: 100,
    }];

    let result = estimate_value(&subject, &comps);

    // All indicators should still be positive
    assert!(result.final_value > 0.0);
    assert!(result.cost_indicator > 0.0); // Depreciation is capped at 80%
}

#[test]
fn test_valuation_consistency() {
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

    // Run valuation multiple times - should be consistent
    let result1 = estimate_value(&subject, &comps);
    let result2 = estimate_value(&subject, &comps);

    assert_eq!(result1.final_value, result2.final_value);
    assert_eq!(result1.sales_indicator, result2.sales_indicator);
    assert_eq!(result1.cost_indicator, result2.cost_indicator);
    assert_eq!(result1.income_indicator, result2.income_indicator);
}
