use crate::analysis::AnalysisEngine;
use crate::models::*;
use actix_web::{web, HttpResponse, Result};
use log::info;

/// Health check
pub async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "ai-engine",
        "version": env!("CARGO_PKG_VERSION"),
        "capabilities": [
            "property_insights",
            "value_forecast",
            "qc_checks",
            "market_analysis"
        ]
    }))
}

/// Generate AI insights for a property
pub async fn generate_insights(
    req: web::Json<InsightRequest>,
) -> Result<HttpResponse> {
    info!("Generating insights for property: {}", req.property.address);

    let insights = AnalysisEngine::generate_insights(&req);

    Ok(HttpResponse::Ok().json(insights))
}

/// Generate value forecast
pub async fn generate_forecast(
    req: web::Json<ForecastRequest>,
) -> Result<HttpResponse> {
    info!(
        "Generating {}-month forecast for property: {}",
        req.forecast_months, req.property.address
    );

    let forecast = AnalysisEngine::generate_forecast(&req);

    Ok(HttpResponse::Ok().json(forecast))
}

/// Run QC checks on valuation
pub async fn run_qc_checks(
    req: web::Json<QcRequest>,
) -> Result<HttpResponse> {
    info!("Running QC checks for property: {}", req.property.address);

    let results = AnalysisEngine::run_qc_checks(&req);

    Ok(HttpResponse::Ok().json(results))
}

/// Analyze market conditions (simplified endpoint)
pub async fn analyze_market(
    req: web::Json<InsightRequest>,
) -> Result<HttpResponse> {
    info!("Analyzing market for: {}, {}", req.property.city, req.property.state);

    let insights = AnalysisEngine::generate_insights(&req);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "market_analysis": insights.market_analysis,
        "comparable_analysis": insights.comparable_analysis
    })))
}

/// Get available AI capabilities
pub async fn capabilities() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "service": "ai-engine",
        "version": env!("CARGO_PKG_VERSION"),
        "endpoints": {
            "/api/v1/ai/insights": {
                "method": "POST",
                "description": "Generate comprehensive property insights"
            },
            "/api/v1/ai/forecast": {
                "method": "POST",
                "description": "Generate value forecast"
            },
            "/api/v1/ai/qc": {
                "method": "POST",
                "description": "Run QC checks on valuation"
            },
            "/api/v1/ai/market": {
                "method": "POST",
                "description": "Analyze market conditions"
            }
        }
    }))
}

/// Configure routes
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1/ai")
            .route("/health", web::get().to(health))
            .route("/capabilities", web::get().to(capabilities))
            .route("/insights", web::post().to(generate_insights))
            .route("/forecast", web::post().to(generate_forecast))
            .route("/qc", web::post().to(run_qc_checks))
            .route("/market", web::post().to(analyze_market)),
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, App};
    use chrono::Utc;

    #[actix_web::test]
    async fn test_health_endpoint() {
        let app = test::init_service(App::new().configure(configure)).await;
        let req = test::TestRequest::get()
            .uri("/api/v1/ai/health")
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_insights_endpoint() {
        let app = test::init_service(App::new().configure(configure)).await;

        let insight_req = InsightRequest {
            property: PropertyData {
                id: None,
                address: "123 Test St".to_string(),
                city: "Testville".to_string(),
                state: "WA".to_string(),
                zip_code: "12345".to_string(),
                property_type: "single_family".to_string(),
                square_feet: 2000,
                lot_size_sqft: Some(8000),
                bedrooms: 3,
                bathrooms: 2,
                year_built: 2015,
                monthly_rent: Some(2500.0),
            },
            comparables: vec![
                ComparableData {
                    sale_price: 400000.0,
                    sale_date: Utc::now(),
                    square_feet: 1900,
                    bedrooms: 3,
                    bathrooms: 2,
                    year_built: 2014,
                    distance_miles: Some(0.5),
                },
            ],
            valuation_result: None,
        };

        let req = test::TestRequest::post()
            .uri("/api/v1/ai/insights")
            .set_json(&insight_req)
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_capabilities_endpoint() {
        let app = test::init_service(App::new().configure(configure)).await;
        let req = test::TestRequest::get()
            .uri("/api/v1/ai/capabilities")
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }
}
