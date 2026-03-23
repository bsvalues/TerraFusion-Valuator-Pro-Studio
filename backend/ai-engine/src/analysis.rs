use crate::models::*;
use chrono::{Duration, Utc};
use log::info;

/// AI analysis engine for property valuation insights
pub struct AnalysisEngine;

impl AnalysisEngine {
    /// Generate comprehensive property insights
    pub fn generate_insights(request: &InsightRequest) -> PropertyInsights {
        info!("Generating AI insights for property: {}", request.property.address);

        let market_analysis = Self::analyze_market(&request.property, &request.comparables);
        let value_drivers = Self::identify_value_drivers(&request.property, &request.comparables);
        let risk_factors = Self::assess_risks(&request.property, &request.comparables);
        let recommendations = Self::generate_recommendations(&request.property, &value_drivers, &risk_factors);
        let comparable_analysis = Self::analyze_comparables(&request.comparables);
        let confidence_score = Self::calculate_confidence(&request.comparables, &risk_factors);
        let narrative = Self::generate_narrative(&request.property, &market_analysis, &value_drivers);

        PropertyInsights {
            property_id: request.property.id,
            generated_at: Utc::now(),
            confidence_score,
            market_analysis,
            value_drivers,
            risk_factors,
            recommendations,
            comparable_analysis,
            narrative_summary: narrative,
        }
    }

    /// Analyze market conditions
    fn analyze_market(property: &PropertyData, comps: &[ComparableData]) -> MarketAnalysis {
        let avg_price_per_sqft = if !comps.is_empty() {
            comps.iter()
                .map(|c| c.sale_price / c.square_feet as f64)
                .sum::<f64>() / comps.len() as f64
        } else {
            150.0 // Default market average
        };

        let subject_price_per_sqft = if let Some(ref val) = None::<f64> {
            *val / property.square_feet as f64
        } else {
            avg_price_per_sqft
        };

        // Determine market trend from comparable sale dates
        let market_trend = Self::determine_market_trend(comps);

        let market_position = if subject_price_per_sqft > avg_price_per_sqft * 1.1 {
            "Above Market".to_string()
        } else if subject_price_per_sqft < avg_price_per_sqft * 0.9 {
            "Below Market".to_string()
        } else {
            "At Market".to_string()
        };

        MarketAnalysis {
            market_trend,
            price_per_sqft_market_avg: (avg_price_per_sqft * 100.0).round() / 100.0,
            price_per_sqft_subject: (subject_price_per_sqft * 100.0).round() / 100.0,
            market_position,
            days_on_market_avg: Some(45), // Placeholder - would come from market data
            absorption_rate: Some(0.85),
        }
    }

    /// Determine market trend from comparable sales
    fn determine_market_trend(comps: &[ComparableData]) -> MarketTrend {
        if comps.len() < 2 {
            return MarketTrend::Stable;
        }

        // Sort by date and calculate price change
        let mut sorted_comps = comps.to_vec();
        sorted_comps.sort_by(|a, b| a.sale_date.cmp(&b.sale_date));

        let price_per_sqft: Vec<f64> = sorted_comps
            .iter()
            .map(|c| c.sale_price / c.square_feet as f64)
            .collect();

        if price_per_sqft.len() >= 2 {
            let first_half_avg = price_per_sqft[..price_per_sqft.len()/2].iter().sum::<f64>()
                / (price_per_sqft.len()/2) as f64;
            let second_half_avg = price_per_sqft[price_per_sqft.len()/2..].iter().sum::<f64>()
                / (price_per_sqft.len() - price_per_sqft.len()/2) as f64;

            let change_pct = (second_half_avg - first_half_avg) / first_half_avg;

            if change_pct > 0.05 {
                MarketTrend::Rising
            } else if change_pct < -0.05 {
                MarketTrend::Declining
            } else {
                MarketTrend::Stable
            }
        } else {
            MarketTrend::Stable
        }
    }

    /// Identify factors driving property value
    fn identify_value_drivers(property: &PropertyData, comps: &[ComparableData]) -> Vec<ValueDriver> {
        let mut drivers = Vec::new();

        // Size analysis
        let avg_sqft = if !comps.is_empty() {
            comps.iter().map(|c| c.square_feet).sum::<u32>() as f64 / comps.len() as f64
        } else {
            2000.0
        };

        let size_diff_pct = (property.square_feet as f64 - avg_sqft) / avg_sqft * 100.0;
        drivers.push(ValueDriver {
            factor: "Living Area".to_string(),
            impact: if size_diff_pct > 10.0 {
                ValueImpact::Positive
            } else if size_diff_pct < -10.0 {
                ValueImpact::Negative
            } else {
                ValueImpact::Neutral
            },
            contribution_pct: size_diff_pct.abs().min(15.0),
            description: format!(
                "Property has {} sqft, which is {:.1}% {} the comparable average of {:.0} sqft",
                property.square_feet,
                size_diff_pct.abs(),
                if size_diff_pct > 0.0 { "above" } else { "below" },
                avg_sqft
            ),
        });

        // Age analysis
        let current_year = Utc::now().year() as u16;
        let age = current_year.saturating_sub(property.year_built);
        let age_impact = if age < 5 {
            ValueImpact::StrongPositive
        } else if age < 15 {
            ValueImpact::Positive
        } else if age < 30 {
            ValueImpact::Neutral
        } else if age < 50 {
            ValueImpact::Negative
        } else {
            ValueImpact::StrongNegative
        };

        drivers.push(ValueDriver {
            factor: "Property Age".to_string(),
            impact: age_impact,
            contribution_pct: if age < 20 { 5.0 } else { -2.0 * (age as f64 / 50.0).min(1.0) * 5.0 },
            description: format!(
                "Built in {}, property is {} years old",
                property.year_built, age
            ),
        });

        // Bedroom count
        let avg_beds = if !comps.is_empty() {
            comps.iter().map(|c| c.bedrooms as f64).sum::<f64>() / comps.len() as f64
        } else {
            3.0
        };

        drivers.push(ValueDriver {
            factor: "Bedroom Count".to_string(),
            impact: if property.bedrooms as f64 > avg_beds {
                ValueImpact::Positive
            } else if (property.bedrooms as f64) < avg_beds {
                ValueImpact::Negative
            } else {
                ValueImpact::Neutral
            },
            contribution_pct: ((property.bedrooms as f64 - avg_beds) * 2.0).abs().min(8.0),
            description: format!(
                "{} bedrooms compared to market average of {:.1}",
                property.bedrooms, avg_beds
            ),
        });

        // Location (placeholder - would use actual geo data)
        drivers.push(ValueDriver {
            factor: "Location".to_string(),
            impact: ValueImpact::Positive,
            contribution_pct: 10.0,
            description: format!("Located in {}, {}", property.city, property.state),
        });

        drivers
    }

    /// Assess risk factors
    fn assess_risks(property: &PropertyData, comps: &[ComparableData]) -> Vec<RiskFactor> {
        let mut risks = Vec::new();

        // Data quality risk
        if comps.len() < 3 {
            risks.push(RiskFactor {
                category: RiskCategory::DataQuality,
                severity: if comps.is_empty() { RiskSeverity::Critical } else { RiskSeverity::High },
                description: format!(
                    "Only {} comparable sales available; minimum 3-5 recommended for reliable analysis",
                    comps.len()
                ),
                mitigation: Some("Expand search radius or date range for additional comparables".to_string()),
            });
        }

        // Age risk
        let current_year = Utc::now().year() as u16;
        let age = current_year.saturating_sub(property.year_built);
        if age > 40 {
            risks.push(RiskFactor {
                category: RiskCategory::Property,
                severity: if age > 60 { RiskSeverity::High } else { RiskSeverity::Medium },
                description: format!(
                    "Property is {} years old; increased maintenance and obsolescence concerns",
                    age
                ),
                mitigation: Some("Verify recent updates/renovations and overall condition".to_string()),
            });
        }

        // Market volatility risk
        if comps.len() >= 3 {
            let prices: Vec<f64> = comps.iter().map(|c| c.sale_price).collect();
            let mean = prices.iter().sum::<f64>() / prices.len() as f64;
            let variance = prices.iter().map(|p| (p - mean).powi(2)).sum::<f64>() / prices.len() as f64;
            let std_dev = variance.sqrt();
            let cv = std_dev / mean;

            if cv > 0.20 {
                risks.push(RiskFactor {
                    category: RiskCategory::Market,
                    severity: if cv > 0.30 { RiskSeverity::High } else { RiskSeverity::Medium },
                    description: format!(
                        "High price variance among comparables (CV: {:.1}%); market may be volatile",
                        cv * 100.0
                    ),
                    mitigation: Some("Consider narrowing comparable criteria or using multiple valuation approaches".to_string()),
                });
            }
        }

        risks
    }

    /// Generate recommendations
    fn generate_recommendations(
        property: &PropertyData,
        value_drivers: &[ValueDriver],
        risks: &[RiskFactor],
    ) -> Vec<Recommendation> {
        let mut recs = Vec::new();

        // Data quality recommendations
        let data_risks: Vec<_> = risks.iter()
            .filter(|r| matches!(r.category, RiskCategory::DataQuality))
            .collect();

        if !data_risks.is_empty() {
            recs.push(Recommendation {
                action: "Expand comparable search".to_string(),
                priority: RecommendationPriority::High,
                rationale: "Insufficient comparable data may impact valuation accuracy".to_string(),
                estimated_value_impact: None,
            });
        }

        // Age-related recommendations
        let current_year = Utc::now().year() as u16;
        let age = current_year.saturating_sub(property.year_built);
        if age > 20 {
            recs.push(Recommendation {
                action: "Verify property condition and updates".to_string(),
                priority: RecommendationPriority::Medium,
                rationale: format!(
                    "Property is {} years old; condition verification critical for accurate valuation",
                    age
                ),
                estimated_value_impact: Some(5000.0),
            });
        }

        // Value enhancement recommendations
        let negative_drivers: Vec<_> = value_drivers.iter()
            .filter(|d| matches!(d.impact, ValueImpact::Negative | ValueImpact::StrongNegative))
            .collect();

        for driver in negative_drivers.iter().take(2) {
            recs.push(Recommendation {
                action: format!("Address {} factor", driver.factor),
                priority: RecommendationPriority::Low,
                rationale: driver.description.clone(),
                estimated_value_impact: Some(driver.contribution_pct * 100.0),
            });
        }

        recs
    }

    /// Analyze comparable properties
    fn analyze_comparables(comps: &[ComparableData]) -> ComparableAnalysis {
        if comps.is_empty() {
            return ComparableAnalysis {
                total_comps: 0,
                avg_adjustment_pct: 0.0,
                similarity_scores: vec![],
                outliers: vec![],
                best_comparable_index: None,
                adjustment_summary: "No comparables provided for analysis".to_string(),
            };
        }

        // Calculate price per sqft for each
        let price_per_sqft: Vec<f64> = comps.iter()
            .map(|c| c.sale_price / c.square_feet as f64)
            .collect();

        let mean_ppsf = price_per_sqft.iter().sum::<f64>() / price_per_sqft.len() as f64;

        // Identify outliers (>2 std dev from mean)
        let variance = price_per_sqft.iter()
            .map(|p| (p - mean_ppsf).powi(2))
            .sum::<f64>() / price_per_sqft.len() as f64;
        let std_dev = variance.sqrt();

        let outliers: Vec<usize> = price_per_sqft.iter()
            .enumerate()
            .filter(|(_, p)| (**p - mean_ppsf).abs() > 2.0 * std_dev)
            .map(|(i, _)| i)
            .collect();

        // Calculate similarity scores (simplified)
        let similarity_scores: Vec<f64> = price_per_sqft.iter()
            .map(|p| 1.0 - ((p - mean_ppsf).abs() / mean_ppsf).min(1.0))
            .collect();

        // Find best comparable (highest similarity, not an outlier)
        let best_comparable_index = similarity_scores.iter()
            .enumerate()
            .filter(|(i, _)| !outliers.contains(i))
            .max_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal))
            .map(|(i, _)| i);

        let avg_adjustment = if comps.len() > 1 {
            price_per_sqft.iter()
                .map(|p| ((p - mean_ppsf) / mean_ppsf * 100.0).abs())
                .sum::<f64>() / comps.len() as f64
        } else {
            0.0
        };

        ComparableAnalysis {
            total_comps: comps.len(),
            avg_adjustment_pct: (avg_adjustment * 100.0).round() / 100.0,
            similarity_scores: similarity_scores.iter().map(|s| (s * 100.0).round() / 100.0).collect(),
            outliers,
            best_comparable_index,
            adjustment_summary: format!(
                "Analyzed {} comparables with average price variance of {:.1}%",
                comps.len(),
                avg_adjustment
            ),
        }
    }

    /// Calculate confidence score
    fn calculate_confidence(comps: &[ComparableData], risks: &[RiskFactor]) -> f64 {
        let mut score = 0.95; // Start high

        // Reduce for low comparable count
        if comps.is_empty() {
            score -= 0.30;
        } else if comps.len() < 3 {
            score -= 0.15;
        } else if comps.len() < 5 {
            score -= 0.05;
        }

        // Reduce for risks
        for risk in risks {
            match risk.severity {
                RiskSeverity::Critical => score -= 0.15,
                RiskSeverity::High => score -= 0.08,
                RiskSeverity::Medium => score -= 0.04,
                RiskSeverity::Low => score -= 0.02,
            }
        }

        (score.max(0.50) * 100.0).round() / 100.0
    }

    /// Generate narrative summary
    fn generate_narrative(
        property: &PropertyData,
        market: &MarketAnalysis,
        drivers: &[ValueDriver],
    ) -> String {
        let trend_desc = match market.market_trend {
            MarketTrend::Rising => "experiencing appreciation",
            MarketTrend::Declining => "experiencing price corrections",
            MarketTrend::Stable => "relatively stable",
            MarketTrend::Volatile => "showing volatility",
        };

        let positive_drivers: Vec<_> = drivers.iter()
            .filter(|d| matches!(d.impact, ValueImpact::Positive | ValueImpact::StrongPositive))
            .take(2)
            .collect();

        let driver_text = if positive_drivers.is_empty() {
            "The property shows typical characteristics for the area.".to_string()
        } else {
            format!(
                "Key value drivers include {} and {}.",
                positive_drivers.get(0).map(|d| d.factor.as_str()).unwrap_or("location"),
                positive_drivers.get(1).map(|d| d.factor.as_str()).unwrap_or("condition")
            )
        };

        format!(
            "The subject property at {} is a {} sqft {} located in {}, {}. \
            The local market is currently {} with an average price per square foot of ${:.2}. \
            This property is positioned {} with a price per sqft of ${:.2}. {}",
            property.address,
            property.square_feet,
            property.property_type,
            property.city,
            property.state,
            trend_desc,
            market.price_per_sqft_market_avg,
            market.market_position.to_lowercase(),
            market.price_per_sqft_subject,
            driver_text
        )
    }

    /// Generate value forecast
    pub fn generate_forecast(request: &ForecastRequest) -> ValueForecast {
        let months = request.forecast_months as i64;
        let forecast_date = Utc::now() + Duration::days(months * 30);

        // Simple appreciation model (would be ML-based in production)
        let base_appreciation_rate = 0.03; // 3% annual
        let monthly_rate = base_appreciation_rate / 12.0;
        let compound_factor = (1.0 + monthly_rate).powi(months as i32);

        let predicted_value = request.current_value * compound_factor;
        let uncertainty = 0.05 * (months as f64 / 12.0).sqrt(); // Uncertainty grows with time

        ValueForecast {
            current_value: request.current_value,
            forecast_date,
            predicted_value: (predicted_value * 100.0).round() / 100.0,
            confidence_interval_low: (predicted_value * (1.0 - uncertainty) * 100.0).round() / 100.0,
            confidence_interval_high: (predicted_value * (1.0 + uncertainty) * 100.0).round() / 100.0,
            annual_appreciation_rate: base_appreciation_rate,
            factors: vec![
                ForecastFactor {
                    name: "Market Conditions".to_string(),
                    impact_pct: 2.0,
                    trend: MarketTrend::Rising,
                },
                ForecastFactor {
                    name: "Economic Indicators".to_string(),
                    impact_pct: 0.5,
                    trend: MarketTrend::Stable,
                },
                ForecastFactor {
                    name: "Local Development".to_string(),
                    impact_pct: 0.5,
                    trend: MarketTrend::Rising,
                },
            ],
        }
    }

    /// Run QC checks on valuation
    pub fn run_qc_checks(request: &QcRequest) -> QcResults {
        let mut checks = Vec::new();
        let mut warnings = Vec::new();
        let mut errors = Vec::new();

        // Check 1: Value reasonableness
        let price_per_sqft = request.valuation_result.final_value / request.property.square_feet as f64;
        let reasonable_range = (100.0, 500.0); // Placeholder range

        let value_check = price_per_sqft >= reasonable_range.0 && price_per_sqft <= reasonable_range.1;
        checks.push(QcCheck {
            name: "Price Per Square Foot".to_string(),
            passed: value_check,
            message: format!(
                "Value of ${:.2}/sqft is {} typical range (${:.0}-${:.0})",
                price_per_sqft,
                if value_check { "within" } else { "outside" },
                reasonable_range.0,
                reasonable_range.1
            ),
            severity: if value_check { QcSeverity::Info } else { QcSeverity::Warning },
        });

        if !value_check {
            warnings.push(format!("Price per sqft ${:.2} outside typical range", price_per_sqft));
        }

        // Check 2: Comparable count
        let comp_check = request.comparables.len() >= 3;
        checks.push(QcCheck {
            name: "Comparable Count".to_string(),
            passed: comp_check,
            message: format!(
                "{} comparables provided (minimum 3 recommended)",
                request.comparables.len()
            ),
            severity: if comp_check { QcSeverity::Info } else { QcSeverity::Warning },
        });

        if !comp_check {
            warnings.push("Insufficient comparables for reliable analysis".to_string());
        }

        // Check 3: Approach reconciliation
        let approaches = [
            request.valuation_result.sales_indicator,
            request.valuation_result.cost_indicator,
            request.valuation_result.income_indicator,
        ];
        let max_diff = approaches.iter().cloned().fold(f64::MIN, f64::max)
            - approaches.iter().cloned().fold(f64::MAX, f64::min);
        let avg_value = approaches.iter().sum::<f64>() / 3.0;
        let reconciliation_check = max_diff / avg_value < 0.20;

        checks.push(QcCheck {
            name: "Approach Reconciliation".to_string(),
            passed: reconciliation_check,
            message: format!(
                "Value spread between approaches: {:.1}%",
                max_diff / avg_value * 100.0
            ),
            severity: if reconciliation_check { QcSeverity::Info } else { QcSeverity::Warning },
        });

        if !reconciliation_check {
            warnings.push("Large variance between valuation approaches".to_string());
        }

        // Check 4: Data completeness
        let data_complete = request.property.lot_size_sqft.is_some();
        checks.push(QcCheck {
            name: "Data Completeness".to_string(),
            passed: data_complete,
            message: if data_complete {
                "All required property data present".to_string()
            } else {
                "Some optional property data missing (lot size)".to_string()
            },
            severity: QcSeverity::Info,
        });

        // Calculate overall score
        let passed_count = checks.iter().filter(|c| c.passed).count();
        let score = passed_count as f64 / checks.len() as f64;
        let passed = errors.is_empty() && score >= 0.75;

        QcResults {
            passed,
            score: (score * 100.0).round() / 100.0,
            checks,
            warnings,
            errors,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn create_test_property() -> PropertyData {
        PropertyData {
            id: None,
            address: "123 Main St".to_string(),
            city: "Anytown".to_string(),
            state: "WA".to_string(),
            zip_code: "12345".to_string(),
            property_type: "single_family".to_string(),
            square_feet: 2000,
            lot_size_sqft: Some(8000),
            bedrooms: 3,
            bathrooms: 2,
            year_built: 2010,
            monthly_rent: Some(2200.0),
        }
    }

    fn create_test_comparables() -> Vec<ComparableData> {
        vec![
            ComparableData {
                sale_price: 400000.0,
                sale_date: Utc::now(),
                square_feet: 1900,
                bedrooms: 3,
                bathrooms: 2,
                year_built: 2012,
                distance_miles: Some(0.5),
            },
            ComparableData {
                sale_price: 420000.0,
                sale_date: Utc::now(),
                square_feet: 2050,
                bedrooms: 3,
                bathrooms: 2,
                year_built: 2009,
                distance_miles: Some(0.8),
            },
            ComparableData {
                sale_price: 380000.0,
                sale_date: Utc::now(),
                square_feet: 1850,
                bedrooms: 3,
                bathrooms: 2,
                year_built: 2011,
                distance_miles: Some(1.2),
            },
        ]
    }

    #[test]
    fn test_generate_insights() {
        let request = InsightRequest {
            property: create_test_property(),
            comparables: create_test_comparables(),
            valuation_result: None,
        };

        let insights = AnalysisEngine::generate_insights(&request);

        assert!(insights.confidence_score > 0.0);
        assert!(!insights.value_drivers.is_empty());
        assert!(!insights.narrative_summary.is_empty());
    }

    #[test]
    fn test_generate_forecast() {
        let request = ForecastRequest {
            property: create_test_property(),
            current_value: 400000.0,
            forecast_months: 12,
        };

        let forecast = AnalysisEngine::generate_forecast(&request);

        assert!(forecast.predicted_value > forecast.current_value);
        assert!(forecast.confidence_interval_low < forecast.predicted_value);
        assert!(forecast.confidence_interval_high > forecast.predicted_value);
    }

    #[test]
    fn test_qc_checks() {
        let request = QcRequest {
            property: create_test_property(),
            valuation_result: ValuationSummary {
                final_value: 400000.0,
                sales_indicator: 395000.0,
                cost_indicator: 410000.0,
                income_indicator: 396000.0,
            },
            comparables: create_test_comparables(),
        };

        let results = AnalysisEngine::run_qc_checks(&request);

        assert!(!results.checks.is_empty());
        assert!(results.score >= 0.0 && results.score <= 1.0);
    }
}
