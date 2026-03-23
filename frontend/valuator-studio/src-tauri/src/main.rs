#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![cfg(not(test))]

use tauri::{Manager, WindowEvent, State};
mod db;
use std::sync::Mutex;
use rusqlite::{params, Connection, Result};
use log::info;

struct AppState {
    conn: Mutex<Connection>,
}

fn init_db(conn: &Connection) -> Result<()> {
    db::init_db(conn)
}

use db::{get_kv_db, set_kv_db, delete_kv_db, list_keys_db};

#[tauri::command]
fn set_kv(state: State<'_, AppState>, key: String, value: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    set_kv_db(&conn, &key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_kv(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    get_kv_db(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_kv(state: State<'_, AppState>, key: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    delete_kv_db(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_keys(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    list_keys_db(&conn).map_err(|e| e.to_string())
}

fn main() {
    env_logger::init();
    // Open a connection in app dir
    let db_path = tauri::api::path::app_dir(&tauri::Config::default())
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("valuator_studio.db");

    let conn = Connection::open(db_path).expect("failed to open db");
    init_db(&conn).expect("failed to init db");

    let state = AppState { conn: Mutex::new(conn) };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![set_kv, get_kv, delete_kv, list_keys])
        .on_window_event(|event| match event.event() {
            WindowEvent::CloseRequested { .. } => info!("window close requested"),
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error running tauri application");
}
