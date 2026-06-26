use crate::model::ValuationResult;

pub fn reconcile(sales: f64, cost: f64, income: f64) -> ValuationResult {
    // Weighting heuristic: sales 40%, cost 30%, income 30%
    let final_value = sales * 0.4 + cost * 0.3 + income * 0.3;
    ValuationResult {
        final_value,
        sales_indicator: sales,
        cost_indicator: cost,
        income_indicator: income,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reconcile_weighted_average() {
        let sales = 400_000.0;
        let cost = 300_000.0;
        let income = 4_320_000.0;
        let result = reconcile(sales, cost, income);
        // (400k * 0.4 + 300k * 0.3 + 4.32M * 0.3)
        // = 160k + 90k + 1,296k = 1,546,000
        assert_eq!(result.final_value, 1_546_000.0);
        assert_eq!(result.sales_indicator, 400_000.0);
        assert_eq!(result.cost_indicator, 300_000.0);
        assert_eq!(result.income_indicator, 4_320_000.0);
    }

    #[test]
    fn test_reconcile_all_zeros() {
        let result = reconcile(0.0, 0.0, 0.0);
        assert_eq!(result.final_value, 0.0);
    }

    #[test]
    fn test_reconcile_sales_dominant() {
        let result = reconcile(1_000_000.0, 0.0, 0.0);
        // Only sales: 1M * 0.4 = 400k
        assert_eq!(result.final_value, 400_000.0);
    }

    #[test]
    fn test_reconcile_equal_indicators() {
        let result = reconcile(500_000.0, 500_000.0, 500_000.0);
        // All equal: 500k * (0.4 + 0.3 + 0.3) = 500k
        assert_eq!(result.final_value, 500_000.0);
    }
}
