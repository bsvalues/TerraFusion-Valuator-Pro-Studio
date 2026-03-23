use crate::error::DataError;
use crate::models::*;
use crate::repository::{OrderRepository, PgRepository, PropertyRepository};
use actix_web::{web, HttpResponse, Result};
use log::info;
use std::sync::Arc;
use uuid::Uuid;

/// Application state
pub struct AppState {
    pub repository: Arc<PgRepository>,
}

/// Health check
pub async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "data-engine",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

// ============ Property Handlers ============

/// Create a new property
pub async fn create_property(
    state: web::Data<AppState>,
    req: web::Json<CreatePropertyRequest>,
) -> Result<HttpResponse, DataError> {
    info!("Creating property: {}", req.parcel_id);

    let property = state.repository.create(req.into_inner(), None).await?;

    Ok(HttpResponse::Created().json(property))
}

/// Get property by ID
pub async fn get_property(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, DataError> {
    let id = path.into_inner();
    let property = state.repository.get_by_id(id).await?;

    Ok(HttpResponse::Ok().json(property))
}

/// Get property by parcel ID
pub async fn get_property_by_parcel(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, DataError> {
    let parcel_id = path.into_inner();
    let property = state.repository.get_by_parcel(&parcel_id).await?;

    Ok(HttpResponse::Ok().json(property))
}

/// Update property
pub async fn update_property(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    req: web::Json<UpdatePropertyRequest>,
) -> Result<HttpResponse, DataError> {
    let id = path.into_inner();
    info!("Updating property: {}", id);

    let property = state.repository.update(id, req.into_inner()).await?;

    Ok(HttpResponse::Ok().json(property))
}

/// Delete property
pub async fn delete_property(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, DataError> {
    let id = path.into_inner();
    info!("Deleting property: {}", id);

    state.repository.delete(id).await?;

    Ok(HttpResponse::NoContent().finish())
}

/// Search properties
pub async fn search_properties(
    state: web::Data<AppState>,
    query: web::Query<PropertySearchCriteria>,
) -> Result<HttpResponse, DataError> {
    let results = state.repository.search(query.into_inner()).await?;

    Ok(HttpResponse::Ok().json(results))
}

// ============ Order Handlers ============

/// Create a new valuation order
pub async fn create_order(
    state: web::Data<AppState>,
    req: web::Json<CreateOrderRequest>,
    // In production, extract user_id from JWT claims
) -> Result<HttpResponse, DataError> {
    info!("Creating order for property: {}", req.property_id);

    // TODO: Extract user_id from auth token
    let user_id = Uuid::new_v4(); // Placeholder

    let order = state.repository.create(req.into_inner(), user_id).await?;

    Ok(HttpResponse::Created().json(order))
}

/// Get order by ID
pub async fn get_order(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, DataError> {
    let id = path.into_inner();
    let order = state.repository.get_by_id(id).await?;

    Ok(HttpResponse::Ok().json(order))
}

/// Update order status
pub async fn update_order_status(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    req: web::Json<OrderStatus>,
) -> Result<HttpResponse, DataError> {
    let id = path.into_inner();
    info!("Updating order status: {} -> {:?}", id, *req);

    let order = state.repository.update_status(id, *req).await?;

    Ok(HttpResponse::Ok().json(order))
}

// ============ Stats Handlers ============

/// Get database statistics
pub async fn get_stats(state: web::Data<AppState>) -> Result<HttpResponse, DataError> {
    let pool = state.repository.pool();

    let property_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM properties")
        .fetch_one(pool)
        .await
        .map_err(DataError::from)?;

    let order_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM valuation_orders")
        .fetch_one(pool)
        .await
        .map_err(DataError::from)?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "properties": property_count.0,
        "orders": order_count.0
    })))
}

/// Configure routes
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .route("/health", web::get().to(health))
            .route("/stats", web::get().to(get_stats))
            // Property routes
            .route("/properties", web::post().to(create_property))
            .route("/properties", web::get().to(search_properties))
            .route("/properties/{id}", web::get().to(get_property))
            .route("/properties/{id}", web::put().to(update_property))
            .route("/properties/{id}", web::delete().to(delete_property))
            .route("/properties/parcel/{parcel_id}", web::get().to(get_property_by_parcel))
            // Order routes
            .route("/orders", web::post().to(create_order))
            .route("/orders/{id}", web::get().to(get_order))
            .route("/orders/{id}/status", web::put().to(update_order_status)),
    );
}
