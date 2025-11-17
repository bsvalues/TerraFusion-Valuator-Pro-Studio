//! Market Analyzer Service
//!
//! Service for analyzing market trends and data

use valuator_core::{MarketData, MarketTrend, Result, ValuatorError};
use tracing::{info, instrument};

/// Market analyzer engine
pub struct MarketAnalyzer;

impl MarketAnalyzer {
    /// Create a new market analyzer
    pub fn new() -> Self {
        info!("Creating new MarketAnalyzer");
        Self
    }

    /// Analyze market data for a region
    #[instrument(skip(self))]
    pub fn analyze_market(&self, region: &str) -> Result<MarketData> {
        info!(region = %region, "Analyzing market data");

        if region.is_empty() {
            return Err(ValuatorError::ValidationError(
                "Region cannot be empty".to_string()
            ));
        }

        // Mock market data for demo
        let market_data = MarketData {
            region: region.to_string(),
            median_price: 425000.0,
            average_price_per_sqft: 210.0,
            market_trend: MarketTrend::Rising,
        };

        info!(
            region = %region,
            median_price = %market_data.median_price,
            "Market analysis complete"
        );

        Ok(market_data)
    }

    /// Get market trend for a region
    #[instrument(skip(self))]
    pub fn get_trend(&self, region: &str) -> Result<MarketTrend> {
        info!(region = %region, "Getting market trend");
        
        let market_data = self.analyze_market(region)?;
        Ok(market_data.market_trend)
    }
}

impl Default for MarketAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_market_analyzer() {
        let analyzer = MarketAnalyzer::new();
        let result = analyzer.analyze_market("Downtown");
        assert!(result.is_ok());
        
        let market_data = result.unwrap();
        assert_eq!(market_data.region, "Downtown");
        assert!(market_data.median_price > 0.0);
    }

    #[test]
    fn test_empty_region() {
        let analyzer = MarketAnalyzer::new();
        let result = analyzer.analyze_market("");
        assert!(result.is_err());
    }

    #[test]
    fn test_get_trend() {
        let analyzer = MarketAnalyzer::new();
        let result = analyzer.get_trend("Suburbs");
        assert!(result.is_ok());
    }
}
