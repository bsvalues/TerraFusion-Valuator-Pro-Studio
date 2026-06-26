use thiserror::Error;

/// Authentication errors
#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Invalid credentials")]
    InvalidCredentials,

    #[error("User not found")]
    UserNotFound,

    #[error("User already exists")]
    UserAlreadyExists,

    #[error("Invalid token")]
    InvalidToken,

    #[error("Token expired")]
    TokenExpired,

    #[error("Token revoked")]
    TokenRevoked,

    #[error("Insufficient permissions")]
    InsufficientPermissions,

    #[error("Account disabled")]
    AccountDisabled,

    #[error("Password too weak: {0}")]
    WeakPassword(String),

    #[error("Invalid email format")]
    InvalidEmail,

    #[error("Internal error: {0}")]
    Internal(String),
}

impl actix_web::ResponseError for AuthError {
    fn error_response(&self) -> actix_web::HttpResponse {
        use actix_web::HttpResponse;

        let (status, error_code) = match self {
            AuthError::InvalidCredentials => {
                (actix_web::http::StatusCode::UNAUTHORIZED, "INVALID_CREDENTIALS")
            }
            AuthError::UserNotFound => {
                (actix_web::http::StatusCode::NOT_FOUND, "USER_NOT_FOUND")
            }
            AuthError::UserAlreadyExists => {
                (actix_web::http::StatusCode::CONFLICT, "USER_ALREADY_EXISTS")
            }
            AuthError::InvalidToken => {
                (actix_web::http::StatusCode::UNAUTHORIZED, "INVALID_TOKEN")
            }
            AuthError::TokenExpired => {
                (actix_web::http::StatusCode::UNAUTHORIZED, "TOKEN_EXPIRED")
            }
            AuthError::TokenRevoked => {
                (actix_web::http::StatusCode::UNAUTHORIZED, "TOKEN_REVOKED")
            }
            AuthError::InsufficientPermissions => {
                (actix_web::http::StatusCode::FORBIDDEN, "INSUFFICIENT_PERMISSIONS")
            }
            AuthError::AccountDisabled => {
                (actix_web::http::StatusCode::FORBIDDEN, "ACCOUNT_DISABLED")
            }
            AuthError::WeakPassword(_) => {
                (actix_web::http::StatusCode::BAD_REQUEST, "WEAK_PASSWORD")
            }
            AuthError::InvalidEmail => {
                (actix_web::http::StatusCode::BAD_REQUEST, "INVALID_EMAIL")
            }
            AuthError::Internal(_) => {
                (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR")
            }
        };

        HttpResponse::build(status).json(serde_json::json!({
            "error": error_code,
            "message": self.to_string()
        }))
    }
}
