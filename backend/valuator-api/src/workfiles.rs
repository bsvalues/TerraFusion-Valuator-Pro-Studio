//! In-memory workfile CRUD store for Phase 2.
//! Stores full WorkfileDef payloads as serde_json::Value keyed by UUID.
//! Gate-3 will migrate this to PostgreSQL JSONB.

use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};
use uuid::Uuid;

// ── In-memory store ───────────────────────────────────────────────────────────

pub type WorkfileStore = Arc<Mutex<HashMap<String, WorkfileRecord>>>;

pub fn new_store() -> WorkfileStore {
    Arc::new(Mutex::new(HashMap::new()))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkfileRecord {
    pub id: String,
    pub contract_id: String,
    /// Full workfile document (WorkfileDef shape)
    pub data: Value,
    pub created_at: u64,
    pub updated_at: u64,
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// ── List ──────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
struct WorkfileSummary {
    id: String,
    contract_id: String,
    address: Option<String>,
    updated_at: u64,
}

pub async fn list_workfiles(store: web::Data<WorkfileStore>) -> HttpResponse {
    let lock = store.lock().unwrap();
    let mut list: Vec<WorkfileSummary> = lock
        .values()
        .map(|r| WorkfileSummary {
            id: r.id.clone(),
            contract_id: r.contract_id.clone(),
            address: r.data["subject"]["address"].as_str().map(String::from),
            updated_at: r.updated_at,
        })
        .collect();
    list.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    HttpResponse::Ok().json(list)
}

// ── Create ────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct CreateWorkfileBody {
    contract_id: Option<String>,
    #[serde(flatten)]
    data: Value,
}

pub async fn create_workfile(
    store: web::Data<WorkfileStore>,
    body: web::Json<Value>,
) -> HttpResponse {
    let id = Uuid::new_v4().to_string();
    let ts = now_secs();
    let contract_id = body
        .get("contract_id")
        .and_then(|v| v.as_str())
        .unwrap_or("FNMA-1004")
        .to_string();

    let record = WorkfileRecord {
        id: id.clone(),
        contract_id,
        data: body.into_inner(),
        created_at: ts,
        updated_at: ts,
    };

    let mut lock = store.lock().unwrap();
    lock.insert(id.clone(), record.clone());

    HttpResponse::Created().json(record)
}

// ── Get ───────────────────────────────────────────────────────────────────────

pub async fn get_workfile(
    store: web::Data<WorkfileStore>,
    path: web::Path<String>,
) -> HttpResponse {
    let id = path.into_inner();
    let lock = store.lock().unwrap();
    match lock.get(&id) {
        Some(record) => HttpResponse::Ok().json(record),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Workfile {} not found", id)
        })),
    }
}

// ── Update ────────────────────────────────────────────────────────────────────

pub async fn update_workfile(
    store: web::Data<WorkfileStore>,
    path: web::Path<String>,
    body: web::Json<Value>,
) -> HttpResponse {
    let id = path.into_inner();
    let mut lock = store.lock().unwrap();
    match lock.get_mut(&id) {
        Some(record) => {
            record.data = body.into_inner();
            record.updated_at = now_secs();
            HttpResponse::Ok().json(record.clone())
        }
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Workfile {} not found", id)
        })),
    }
}

// ── Route config ──────────────────────────────────────────────────────────────

pub fn configure(cfg: &mut web::ServiceConfig, _store: WorkfileStore) {
    cfg.route("/workfiles", web::get().to(list_workfiles))
        .route("/workfiles", web::post().to(create_workfile))
        .route("/workfiles/{id}", web::get().to(get_workfile))
        .route("/workfiles/{id}", web::put().to(update_workfile));
}
