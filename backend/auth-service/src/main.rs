use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use log::info;

mod error;
mod handlers;
mod jwt;
mod models;

use handlers::{AppState, UserStore};
use jwt::{JwtConfig, JwtService};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let port = std::env::var("AUTH_SERVICE_PORT")
        .unwrap_or_else(|_| "8081".to_string())
        .parse::<u16>()
        .unwrap_or(8081);

    let cors_origin = std::env::var("CORS_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());

    info!("Starting Auth Service on port {}", port);
    info!("CORS origin: {}", cors_origin);

    // Initialize application state
    let jwt_config = JwtConfig::default();
    let app_state = web::Data::new(AppState {
        user_store: UserStore::new(),
        jwt_service: JwtService::new(jwt_config),
    });

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
