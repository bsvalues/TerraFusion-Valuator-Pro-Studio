use actix_web::{web, App, HttpServer};
use actix_cors::Cors;

mod appraisals;
mod routes;
mod workfiles;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let api_port = std::env::var("API_PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .unwrap_or(8080);

    let cors_origin = std::env::var("CORS_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());

    log::info!("Starting Valuator API on port {}", api_port);

    let wf_store = workfiles::new_store();
    let order_store = appraisals::new_store();

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

        let store = wf_store.clone();
        let orders = order_store.clone();
        App::new()
            .wrap(cors)
            .wrap(actix_web::middleware::Logger::default())
            .app_data(web::Data::new(store.clone()))
            .app_data(web::Data::new(orders.clone()))
            .configure(move |cfg| routes::configure(cfg, store.clone(), orders.clone()))
    })
    .bind(("0.0.0.0", api_port))?
    .run()
    .await
}

