use thiserror::Error;

/// Data engine errors
#[derive(Debug, Error)]
pub enum DataError {
    #[error("Property not found: {0}")]
    PropertyNotFound(String),

    #[error("Order not found: {0}")]
    OrderNotFound(String),

    #[error("Duplicate parcel ID: {0}")]
    DuplicateParcel(String),

    #[error("Invalid query parameters: {0}")]
    InvalidQuery(String),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Connection error: {0}")]
    Connection(String),

    #[error("Serialization error: {0}")]
    Serialization(String),
}

impl actix_web::ResponseError for DataError {
    fn error_response(&self) -> actix_web::HttpResponse {
        use actix_web::{http::StatusCode, HttpResponse};

        let (status, error_code) = match self {
            DataError::PropertyNotFound(_) => (StatusCode::NOT_FOUND, "PROPERTY_NOT_FOUND"),
            DataError::OrderNotFound(_) => (StatusCode::NOT_FOUND, "ORDER_NOT_FOUND"),
            DataError::DuplicateParcel(_) => (StatusCode::CONFLICT, "DUPLICATE_PARCEL"),
            DataError::InvalidQuery(_) => (StatusCode::BAD_REQUEST, "INVALID_QUERY"),
            DataError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR"),
            DataError::Connection(_) => (StatusCode::SERVICE_UNAVAILABLE, "CONNECTION_ERROR"),
            DataError::Serialization(_) => (StatusCode::INTERNAL_SERVER_ERROR, "SERIALIZATION_ERROR"),
        };

        HttpResponse::build(status).json(serde_json::json!({
            "error": error_code,
            "message": self.to_string()
        }))
    }
}

impl From<sqlx::Error> for DataError {
    fn from(err: sqlx::Error) -> Self {
        match &err {
            sqlx::Error::RowNotFound => DataError::PropertyNotFound("Record not found".to_string()),
            sqlx::Error::Database(db_err) => {
                if let Some(code) = db_err.code() {
                    if code == "23505" {
                        return DataError::DuplicateParcel("Parcel ID already exists".to_string());
                    }
                }
                DataError::Database(err.to_string())
            }
            sqlx::Error::Io(_) => DataError::Connection(err.to_string()),
            _ => DataError::Database(err.to_string()),
        }
    }
}
