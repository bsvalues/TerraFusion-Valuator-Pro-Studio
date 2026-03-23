//! Appraisal order store — one order ties together client/lender metadata + workfile.
//! In-memory for Phase 2. Gate-3 migrates to PostgreSQL `appraisals` table.

use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};
use uuid::Uuid;

pub type OrderStore = Arc<Mutex<HashMap<String, AppraisalOrder>>>;

pub fn new_store() -> OrderStore {
    Arc::new(Mutex::new(HashMap::new()))
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Appraisal order record — order metadata wraps an optional workfile_id reference.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppraisalOrder {
    pub id: String,
    /// File number assigned by the appraiser/AMC
    pub file_number: Option<String>,
    /// Borrower full name
    pub borrower: Option<String>,
    /// Client (lender or AMC) name
    pub client: Option<String>,
    /// Lender name (may differ from client)
    pub lender: Option<String>,
    /// Subject property address (denormalized for fast list display)
    pub subject_address: Option<String>,
    /// ISO-8601 date string when the appraisal is due
    pub due_date: Option<String>,
    /// Order status: draft | in-progress | review | complete
    pub status: String,
    /// Linked workfile id (if one has been created)
    pub workfile_id: Option<String>,
    /// Form type: FNMA-1004 | FNMA-2055 | FNMA-1073
    pub form_type: Option<String>,
    /// Arbitrary extra fields (lender case number, AMC order id, etc.)
    pub extra: Option<Value>,
    pub created_at: u64,
    pub updated_at: u64,
}

// ── List ──────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
struct OrderSummary {
    id: String,
    file_number: Option<String>,
    borrower: Option<String>,
    subject_address: Option<String>,
    due_date: Option<String>,
    status: String,
    workfile_id: Option<String>,
    form_type: Option<String>,
    updated_at: u64,
}

pub async fn list_orders(store: web::Data<OrderStore>) -> HttpResponse {
    let lock = store.lock().unwrap();
    let mut list: Vec<OrderSummary> = lock
        .values()
        .map(|o| OrderSummary {
            id: o.id.clone(),
            file_number: o.file_number.clone(),
            borrower: o.borrower.clone(),
            subject_address: o.subject_address.clone(),
            due_date: o.due_date.clone(),
            status: o.status.clone(),
            workfile_id: o.workfile_id.clone(),
            form_type: o.form_type.clone(),
            updated_at: o.updated_at,
        })
        .collect();
    list.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    HttpResponse::Ok().json(list)
}

// ── Create ────────────────────────────────────────────────────────────────────

pub async fn create_order(
    store: web::Data<OrderStore>,
    body: web::Json<Value>,
) -> HttpResponse {
    let id = Uuid::new_v4().to_string();
    let ts = now_secs();
    let b = &*body;

    let order = AppraisalOrder {
        id: id.clone(),
        file_number: b["file_number"].as_str().map(String::from),
        borrower: b["borrower"].as_str().map(String::from),
        client: b["client"].as_str().map(String::from),
        lender: b["lender"].as_str().map(String::from),
        subject_address: b["subject_address"].as_str().map(String::from),
        due_date: b["due_date"].as_str().map(String::from),
        status: b["status"].as_str().unwrap_or("draft").to_string(),
        workfile_id: b["workfile_id"].as_str().map(String::from),
        form_type: b["form_type"].as_str().map(String::from),
        extra: b.get("extra").cloned(),
        created_at: ts,
        updated_at: ts,
    };

    let mut lock = store.lock().unwrap();
    lock.insert(id.clone(), order.clone());
    HttpResponse::Created().json(order)
}

// ── Get ───────────────────────────────────────────────────────────────────────

pub async fn get_order(
    store: web::Data<OrderStore>,
    path: web::Path<String>,
) -> HttpResponse {
    let id = path.into_inner();
    let lock = store.lock().unwrap();
    match lock.get(&id) {
        Some(order) => HttpResponse::Ok().json(order),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Order {} not found", id)
        })),
    }
}

// ── Update ────────────────────────────────────────────────────────────────────

pub async fn update_order(
    store: web::Data<OrderStore>,
    path: web::Path<String>,
    body: web::Json<Value>,
) -> HttpResponse {
    let id = path.into_inner();
    let b = &*body;
    let mut lock = store.lock().unwrap();
    match lock.get_mut(&id) {
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Order {} not found", id)
        })),
        Some(order) => {
            if let Some(v) = b["file_number"].as_str() { order.file_number = Some(v.to_string()); }
            if let Some(v) = b["borrower"].as_str() { order.borrower = Some(v.to_string()); }
            if let Some(v) = b["client"].as_str() { order.client = Some(v.to_string()); }
            if let Some(v) = b["lender"].as_str() { order.lender = Some(v.to_string()); }
            if let Some(v) = b["subject_address"].as_str() { order.subject_address = Some(v.to_string()); }
            if let Some(v) = b["due_date"].as_str() { order.due_date = Some(v.to_string()); }
            if let Some(v) = b["status"].as_str() { order.status = v.to_string(); }
            if let Some(v) = b["workfile_id"].as_str() { order.workfile_id = Some(v.to_string()); }
            if let Some(v) = b["form_type"].as_str() { order.form_type = Some(v.to_string()); }
            if let Some(v) = b.get("extra") { order.extra = Some(v.clone()); }
            order.updated_at = now_secs();
            HttpResponse::Ok().json(order.clone())
        }
    }
}
