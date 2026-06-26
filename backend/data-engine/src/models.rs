use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Property record in the database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Property {
    pub id: Uuid,
    pub parcel_id: String,
    pub address: String,
    pub city: String,
    pub state: String,
    pub zip_code: String,
    pub property_type: PropertyType,
    pub square_feet: i32,
    pub lot_size_sqft: Option<i32>,
    pub bedrooms: i16,
    pub bathrooms: i16,
    pub year_built: i16,
    pub zoning: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub owner_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Property type classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "property_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum PropertyType {
    SingleFamily,
    MultiFamily,
    Condo,
    Townhouse,
    Commercial,
    Land,
    Industrial,
    MixedUse,
}

/// Comparable sale record
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ComparableSale {
    pub id: Uuid,
    pub property_id: Uuid,
    pub sale_price: f64,
    pub sale_date: DateTime<Utc>,
    pub days_on_market: Option<i32>,
    pub listing_price: Option<f64>,
    pub financing_type: Option<String>,
    pub verified: bool,
    pub data_source: String,
    pub created_at: DateTime<Utc>,
}

/// Valuation order/request
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ValuationOrder {
    pub id: Uuid,
    pub property_id: Uuid,
    pub user_id: Uuid,
    pub order_type: OrderType,
    pub status: OrderStatus,
    pub purpose: String,
    pub effective_date: DateTime<Utc>,
    pub due_date: Option<DateTime<Utc>>,
    pub assigned_appraiser_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Order type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "order_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum OrderType {
    FullAppraisal,
    DriveBy,
    DesktopReview,
    Bpo,
    Avm,
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "order_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum OrderStatus {
    Pending,
    Assigned,
    InProgress,
    UnderReview,
    Completed,
    Cancelled,
    OnHold,
}

/// Valuation result stored in database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ValuationResult {
    pub id: Uuid,
    pub order_id: Uuid,
    pub final_value: f64,
    pub sales_indicator: f64,
    pub cost_indicator: f64,
    pub income_indicator: f64,
    pub confidence_score: f64,
    pub effective_date: DateTime<Utc>,
    pub result_json: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

/// Create property request
#[derive(Debug, Deserialize)]
pub struct CreatePropertyRequest {
    pub parcel_id: String,
    pub address: String,
    pub city: String,
    pub state: String,
    pub zip_code: String,
    pub property_type: PropertyType,
    pub square_feet: i32,
    pub lot_size_sqft: Option<i32>,
    pub bedrooms: i16,
    pub bathrooms: i16,
    pub year_built: i16,
    pub zoning: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

/// Update property request
#[derive(Debug, Deserialize)]
pub struct UpdatePropertyRequest {
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip_code: Option<String>,
    pub property_type: Option<PropertyType>,
    pub square_feet: Option<i32>,
    pub lot_size_sqft: Option<i32>,
    pub bedrooms: Option<i16>,
    pub bathrooms: Option<i16>,
    pub year_built: Option<i16>,
    pub zoning: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

/// Create order request
#[derive(Debug, Deserialize)]
pub struct CreateOrderRequest {
    pub property_id: Uuid,
    pub order_type: OrderType,
    pub purpose: String,
    pub effective_date: DateTime<Utc>,
    pub due_date: Option<DateTime<Utc>>,
}

/// Property search criteria
#[derive(Debug, Deserialize)]
pub struct PropertySearchCriteria {
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip_code: Option<String>,
    pub property_type: Option<PropertyType>,
    pub min_sqft: Option<i32>,
    pub max_sqft: Option<i32>,
    pub min_bedrooms: Option<i16>,
    pub max_bedrooms: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Pagination response
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub limit: i64,
    pub offset: i64,
}
