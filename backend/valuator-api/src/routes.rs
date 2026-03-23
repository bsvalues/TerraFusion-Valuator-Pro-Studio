use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use valuator_core::{estimate_value, model::SubjectProperty, sales_comparison::ComparableSale};
use crate::appraisals::OrderStore;
use crate::workfiles::WorkfileStore;

#[derive(Debug, Serialize, Deserialize)]
pub struct ValuationRequest {
    pub subject: SubjectProperty,
    pub comparables: Vec<ComparableSaleDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComparableSaleDto {
    pub sale_price: f64,
    pub square_feet: u32,
    pub bedrooms: u8,
    pub bathrooms: u8,
    pub age_years: u8,
}

impl From<ComparableSaleDto> for ComparableSale {
    fn from(dto: ComparableSaleDto) -> Self {
        ComparableSale {
            sale_price: dto.sale_price,
            square_feet: dto.square_feet,
            bedrooms: dto.bedrooms,
            bathrooms: dto.bathrooms,
            age_years: dto.age_years,
        }
    }
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

/// Health check endpoint
async fn health() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }))
}

/// Main valuation endpoint
async fn estimate_property_value(
    req: web::Json<ValuationRequest>,
) -> Result<HttpResponse> {
    log::info!("Processing valuation request for property: {:?}", req.subject);

    // Convert DTOs to domain models
    let comps: Vec<ComparableSale> = req
        .comparables
        .iter()
        .map(|c| ComparableSale {
            sale_price: c.sale_price,
            square_feet: c.square_feet,
            bedrooms: c.bedrooms,
            bathrooms: c.bathrooms,
            age_years: c.age_years,
        })
        .collect();

    // Perform valuation
    let result = estimate_value(&req.subject, &comps);

    log::info!(
        "Valuation complete - Final value: ${:.2}",
        result.final_value
    );

    Ok(HttpResponse::Ok().json(result))
}

/// Quick estimate endpoint (no comparables required)
async fn quick_estimate(
    subject: web::Json<SubjectProperty>,
) -> Result<HttpResponse> {
    log::info!("Processing quick estimate for property: {:?}", subject);

    // Use empty comparables for quick estimate (cost + income only)
    let result = estimate_value(&subject, &[]);

    Ok(HttpResponse::Ok().json(result))
}

/// Configure all routes
pub fn configure(cfg: &mut web::ServiceConfig, _store: WorkfileStore, _orders: OrderStore) {
    cfg.service(
        web::scope("/api/v1")
            .route("/health", web::get().to(health))
            .route("/valuation/estimate", web::post().to(estimate_property_value))
            .route("/valuation/quick", web::post().to(quick_estimate))
            // Workfiles
            .route("/workfiles", web::get().to(crate::workfiles::list_workfiles))
            .route("/workfiles", web::post().to(crate::workfiles::create_workfile))
            .route("/workfiles/{id}", web::get().to(crate::workfiles::get_workfile))
            .route("/workfiles/{id}", web::put().to(crate::workfiles::update_workfile))
            // Appraisal orders
            .route("/appraisals", web::get().to(crate::appraisals::list_orders))
            .route("/appraisals", web::post().to(crate::appraisals::create_order))
            .route("/appraisals/{id}", web::get().to(crate::appraisals::get_order))
            .route("/appraisals/{id}", web::put().to(crate::appraisals::update_order)),
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, App};

    #[actix_web::test]
    async fn test_health_endpoint() {
        let app = test::init_service(App::new().configure(configure)).await;
        let req = test::TestRequest::get().uri("/api/v1/health").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_valuation_endpoint() {
        let app = test::init_service(App::new().configure(configure)).await;

        let valuation_req = ValuationRequest {
            subject: SubjectProperty {
                square_feet: 2000,
                bedrooms: 3,
                bathrooms: 2,
                age_years: 10,
                monthly_rent: 2200.0,
            },
            comparables: vec![ComparableSaleDto {
                sale_price: 400_000.0,
                square_feet: 2000,
                bedrooms: 3,
                bathrooms: 2,
                age_years: 10,
            }],
        };

        let req = test::TestRequest::post()
            .uri("/api/v1/valuation/estimate")
            .set_json(&valuation_req)
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }
}

