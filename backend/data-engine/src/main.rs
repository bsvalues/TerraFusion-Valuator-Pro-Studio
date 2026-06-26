use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use log::{error, info};
use std::sync::Arc;

mod error;
mod handlers;
mod models;
mod repository;

use handlers::AppState;
use repository::PgRepository;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let port = std::env::var("DATA_ENGINE_PORT")
        .unwrap_or_else(|_| "8083".to_string())
        .parse::<u16>()
        .unwrap_or(8083);

    let cors_origin = std::env::var("CORS_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://valuator:valuator@localhost:5432/valuator_pro".to_string());

    info!("Starting Data Engine on port {}", port);
    info!("CORS origin: {}", cors_origin);

    // Initialize database connection
    let repository = match PgRepository::new(&database_url).await {
        Ok(repo) => {
            // Run migrations
            if let Err(e) = repo.run_migrations().await {
                error!("Failed to run migrations: {}", e);
                return Err(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Migration failed: {}", e),
                ));
            }
            Arc::new(repo)
        }
        Err(e) => {
            error!("Failed to connect to database: {}", e);
            return Err(std::io::Error::new(
                std::io::ErrorKind::ConnectionRefused,
                format!("Database connection failed: {}", e),
            ));
        }
    };

    let app_state = web::Data::new(AppState { repository });

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin(&cors_origin)
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::ACCEPT,
                actix_web::http::header::CONTENT_TYPE,
            ])
            .max_age(3600);

        App::new()
            .app_data(app_state.clone())
            .wrap(cors)
            .wrap(actix_web::middleware::Logger::default())
            .configure(handlers::configure)
    })
    .bind(("127.0.0.1", port))?
    .run()
    .await
}
