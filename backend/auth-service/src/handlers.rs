use crate::error::AuthError;
use crate::jwt::{password, JwtService};
use crate::models::{
    AuthResponse, ChangePasswordRequest, Claims, LoginRequest, RefreshRequest,
    RegisterRequest, TokenValidationResponse, UpdateProfileRequest, SignatureUploadRequest,
    User, UserInfo, UserRole,
};
use actix_web::{web, HttpRequest, HttpResponse, Result};
use chrono::Utc;
use log::{error, info, warn};
use std::collections::HashMap;
use std::sync::RwLock;
use uuid::Uuid;
use std::fs;
use base64;

/// In-memory user store (replace with database in production)
pub struct UserStore {
    users: RwLock<HashMap<Uuid, User>>,
    email_index: RwLock<HashMap<String, Uuid>>,
}

impl UserStore {
    pub fn new() -> Self {
        Self {
            users: RwLock::new(HashMap::new()),
            email_index: RwLock::new(HashMap::new()),
        }
    }

    pub fn find_by_email(&self, email: &str) -> Option<User> {
        let email_index = self.email_index.read().unwrap();
        let users = self.users.read().unwrap();

        email_index.get(email).and_then(|id| users.get(id).cloned())
    }

    pub fn find_by_id(&self, id: Uuid) -> Option<User> {
        self.users.read().unwrap().get(&id).cloned()
    }

    pub fn create(&self, user: User) -> Result<User, AuthError> {
        let mut users = self.users.write().unwrap();
        let mut email_index = self.email_index.write().unwrap();

        if email_index.contains_key(&user.email) {
            return Err(AuthError::UserAlreadyExists);
        }

        email_index.insert(user.email.clone(), user.id);
        users.insert(user.id, user.clone());

        Ok(user)
    }

    pub fn update(&self, user: User) -> Result<User, AuthError> {
        let mut users = self.users.write().unwrap();

        if !users.contains_key(&user.id) {
            return Err(AuthError::UserNotFound);
        }

        users.insert(user.id, user.clone());
        Ok(user)
    }
}

impl Default for UserStore {
    fn default() -> Self {
        Self::new()
    }
}

/// Application state
pub struct AppState {
    pub user_store: UserStore,
    pub jwt_service: JwtService,
}

/// Health check endpoint
pub async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "auth-service",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

/// User registration
pub async fn register(
    state: web::Data<AppState>,
    req: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AuthError> {
    info!("Registration attempt for email: {}", req.email);

    // Validate email format
    if !req.email.contains('@') || !req.email.contains('.') {
        return Err(AuthError::InvalidEmail);
    }

    // Hash password
    let password_hash = password::hash_password(&req.password)?;

    // Create user
    let now = Utc::now();
    let user = User {
        id: Uuid::new_v4(),
        email: req.email.clone(),
        password_hash,
        full_name: req.full_name.clone(),
        role: UserRole::Appraiser, // Default role
        organization_id: req.organization_id,
        created_at: now,
        updated_at: now,
        is_active: true,
        // License/profile fields (optional)
        license_type: req.license_type,
        license_state: req.license_state.clone(),
        license_number: req.license_number.clone(),
        license_expiry: req.license_expiry.clone(),
        signature_image_path: None,
    };

    let user = state.user_store.create(user)?;
    info!("User registered successfully: {}", user.id);

    // Generate tokens
    let access_token = state.jwt_service.generate_access_token(&user)?;
    let refresh_token = state.jwt_service.generate_refresh_token(&user)?;

    Ok(HttpResponse::Created().json(AuthResponse {
        access_token,
        refresh_token,
        token_type: "Bearer".to_string(),
        expires_in: state.jwt_service.get_access_expiry_seconds(),
        user: UserInfo::from(&user),
    }))
}

/// User login
pub async fn login(
    state: web::Data<AppState>,
    req: web::Json<LoginRequest>,
) -> Result<HttpResponse, AuthError> {
    info!("Login attempt for email: {}", req.email);

    // Find user
    let user = state
        .user_store
        .find_by_email(&req.email)
        .ok_or(AuthError::InvalidCredentials)?;

    // Check if account is active
    if !user.is_active {
        warn!("Login attempt for disabled account: {}", req.email);
        return Err(AuthError::AccountDisabled);
    }

    // Verify password
    let valid = password::verify_password(&req.password, &user.password_hash)?;
    if !valid {
        warn!("Invalid password for user: {}", req.email);
        return Err(AuthError::InvalidCredentials);
    }

    info!("User logged in successfully: {}", user.id);

    // Generate tokens
    let access_token = state.jwt_service.generate_access_token(&user)?;
    let refresh_token = state.jwt_service.generate_refresh_token(&user)?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        access_token,
        refresh_token,
        token_type: "Bearer".to_string(),
        expires_in: state.jwt_service.get_access_expiry_seconds(),
        user: UserInfo::from(&user),
    }))
}

/// Refresh access token
pub async fn refresh(
    state: web::Data<AppState>,
    req: web::Json<RefreshRequest>,
) -> Result<HttpResponse, AuthError> {
    // Validate refresh token
    let token_data = state.jwt_service.validate_token(&req.refresh_token)?;

    // Get user
    let user_id = Uuid::parse_str(&token_data.claims.sub)
        .map_err(|_| AuthError::InvalidToken)?;

    let user = state
        .user_store
        .find_by_id(user_id)
        .ok_or(AuthError::UserNotFound)?;

    if !user.is_active {
        return Err(AuthError::AccountDisabled);
    }

    info!("Token refreshed for user: {}", user.id);

    // Generate new tokens
    let access_token = state.jwt_service.generate_access_token(&user)?;
    let refresh_token = state.jwt_service.generate_refresh_token(&user)?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        access_token,
        refresh_token,
        token_type: "Bearer".to_string(),
        expires_in: state.jwt_service.get_access_expiry_seconds(),
        user: UserInfo::from(&user),
    }))
}

/// Validate token endpoint
pub async fn validate(
    state: web::Data<AppState>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AuthError> {
    let auth_header = http_req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(AuthError::InvalidToken)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AuthError::InvalidToken)?;

    match state.jwt_service.validate_token(token) {
        Ok(token_data) => Ok(HttpResponse::Ok().json(TokenValidationResponse {
            valid: true,
            claims: Some(token_data.claims),
        })),
        Err(_) => Ok(HttpResponse::Ok().json(TokenValidationResponse {
            valid: false,
            claims: None,
        })),
    }
}

/// Get current user profile
pub async fn me(
    state: web::Data<AppState>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AuthError> {
    let claims = extract_claims(&state, &http_req)?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AuthError::InvalidToken)?;

    let user = state
        .user_store
        .find_by_id(user_id)
        .ok_or(AuthError::UserNotFound)?;

    Ok(HttpResponse::Ok().json(UserInfo::from(&user)))
}

/// Change password
pub async fn change_password(
    state: web::Data<AppState>,
    http_req: HttpRequest,
    req: web::Json<ChangePasswordRequest>,
) -> Result<HttpResponse, AuthError> {
    let claims = extract_claims(&state, &http_req)?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AuthError::InvalidToken)?;

    let mut user = state
        .user_store
        .find_by_id(user_id)
        .ok_or(AuthError::UserNotFound)?;

    // Verify current password
    let valid = password::verify_password(&req.current_password, &user.password_hash)?;
    if !valid {
        return Err(AuthError::InvalidCredentials);
    }

    // Hash new password
    let new_hash = password::hash_password(&req.new_password)?;
    user.password_hash = new_hash;
    user.updated_at = Utc::now();

    state.user_store.update(user)?;

    info!("Password changed for user: {}", user_id);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Password changed successfully"
    })))
}

/// Update current user's profile (partial updates accepted)
pub async fn update_profile(
    state: web::Data<AppState>,
    http_req: HttpRequest,
    req: web::Json<UpdateProfileRequest>,
) -> Result<HttpResponse, AuthError> {
    let claims = extract_claims(&state, &http_req)?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AuthError::InvalidToken)?;

    let mut user = state
        .user_store
        .find_by_id(user_id)
        .ok_or(AuthError::UserNotFound)?;

    if let Some(full_name) = &req.full_name {
        user.full_name = full_name.clone();
    }
    if let Some(org) = req.organization_id {
        user.organization_id = Some(org);
    }
    if let Some(lic_type) = req.license_type {
        user.license_type = Some(lic_type);
    }
    if let Some(lic_state) = &req.license_state {
        user.license_state = Some(lic_state.clone());
    }
    if let Some(lic_number) = &req.license_number {
        user.license_number = Some(lic_number.clone());
    }
    if let Some(lic_expiry) = &req.license_expiry {
        user.license_expiry = Some(lic_expiry.clone());
    }

    user.updated_at = Utc::now();
    state.user_store.update(user.clone())?;

    Ok(HttpResponse::Ok().json(UserInfo::from(&user)))
}

/// Upload signature image as base64 and attach to user profile
pub async fn upload_signature(
    state: web::Data<AppState>,
    http_req: HttpRequest,
    req: web::Json<SignatureUploadRequest>,
) -> Result<HttpResponse, AuthError> {
    let claims = extract_claims(&state, &http_req)?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AuthError::InvalidToken)?;

    let mut user = state
        .user_store
        .find_by_id(user_id)
        .ok_or(AuthError::UserNotFound)?;

    // Decode base64
    let decoded = base64::decode(&req.signature_base64)
        .map_err(|e| AuthError::Internal(format!("base64 decode error: {}", e)))?;

    // Basic validation: limit size to 2MB
    const MAX_SIGNATURE_BYTES: usize = 2 * 1024 * 1024;
    if decoded.len() > MAX_SIGNATURE_BYTES {
        return Err(AuthError::Internal("signature too large".to_string()));
    }

    // Detect PNG or JPEG by magic bytes and enforce extension
    let ext = if decoded.starts_with(&[0x89, b'P', b'N', b'G']) {
        "png"
    } else if decoded.starts_with(&[0xFF, 0xD8, 0xFF]) {
        "jpg"
    } else {
        return Err(AuthError::Internal(
            "unsupported image format (expected PNG or JPEG)".to_string(),
        ));
    };

    // Ensure storage directory exists
    let dir = std::path::Path::new("data/signatures");
    fs::create_dir_all(dir).map_err(|e| AuthError::Internal(e.to_string()))?;

    let filename = req.filename.clone().unwrap_or_else(|| format!("{}.{}", user_id, ext));
    // Ensure filename has correct extension
    let filename = if filename.to_lowercase().ends_with(ext) {
        filename
    } else {
        format!("{}.{}", filename, ext)
    };
    let path = dir.join(&filename);

    fs::write(&path, &decoded).map_err(|e| AuthError::Internal(e.to_string()))?;

    user.signature_image_path = Some(path.to_string_lossy().to_string());
    user.updated_at = Utc::now();
    state.user_store.update(user.clone())?;

    Ok(HttpResponse::Ok().json(UserInfo::from(&user)))
}

/// Extract claims from authorization header
fn extract_claims(state: &web::Data<AppState>, req: &HttpRequest) -> Result<Claims, AuthError> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(AuthError::InvalidToken)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AuthError::InvalidToken)?;

    let token_data = state.jwt_service.validate_token(token)?;
    Ok(token_data.claims)
}

/// Configure routes
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1/auth")
            .route("/health", web::get().to(health))
            .route("/register", web::post().to(register))
            .route("/login", web::post().to(login))
            .route("/refresh", web::post().to(refresh))
            .route("/validate", web::get().to(validate))
            .route("/me", web::get().to(me))
            .route("/me", web::put().to(update_profile))
            .route("/signature", web::post().to(upload_signature))
            .route("/password", web::put().to(change_password)),
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::jwt::JwtConfig;
    use actix_web::{test, App};

    fn create_test_app_state() -> web::Data<AppState> {
        web::Data::new(AppState {
            user_store: UserStore::new(),
            jwt_service: JwtService::new(JwtConfig::default()),
        })
    }

    #[actix_web::test]
    async fn test_health_endpoint() {
        let state = create_test_app_state();
        let app = test::init_service(
            App::new()
                .app_data(state)
                .configure(configure),
        )
        .await;

        let req = test::TestRequest::get()
            .uri("/api/v1/auth/health")
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_register_and_login() {
        let state = create_test_app_state();
        let app = test::init_service(
            App::new()
                .app_data(state)
                .configure(configure),
        )
        .await;

        // Register
        let register_req = RegisterRequest {
            email: "test@example.com".to_string(),
            password: "SecurePass123".to_string(),
            full_name: "Test User".to_string(),
            organization_id: None,
            license_type: None,
            license_state: None,
            license_number: None,
            license_expiry: None,
        };

        let req = test::TestRequest::post()
            .uri("/api/v1/auth/register")
            .set_json(&register_req)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        // Login
        let login_req = LoginRequest {
            email: "test@example.com".to_string(),
            password: "SecurePass123".to_string(),
        };

        let req = test::TestRequest::post()
            .uri("/api/v1/auth/login")
            .set_json(&login_req)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_update_profile_and_signature() {
        let state = create_test_app_state();
        let app_data = state.clone();
        let app = test::init_service(
            App::new()
                .app_data(app_data)
                .configure(configure),
        )
        .await;

        // Create a test user directly in the store
        let password_hash = password::hash_password("TestPass123").unwrap();
        let user = User {
            id: Uuid::new_v4(),
            email: "up@example.com".to_string(),
            password_hash,
            full_name: "Update User".to_string(),
            role: UserRole::Appraiser,
            organization_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            is_active: true,
            license_type: None,
            license_state: None,
            license_number: None,
            license_expiry: None,
            signature_image_path: None,
        };

        state.user_store.create(user.clone()).unwrap();

        // Generate token for the user
        let token = state
            .jwt_service
            .generate_access_token(&user)
            .expect("token gen");

        // Update profile
        let update_req = UpdateProfileRequest {
            full_name: Some("Updated Name".to_string()),
            organization_id: None,
            license_type: Some(crate::models::LicenseType::CertifiedResidential),
            license_state: Some("WA".to_string()),
            license_number: Some("ABC123".to_string()),
            license_expiry: Some("2030-12-31".to_string()),
        };

        let req = test::TestRequest::put()
            .uri("/api/v1/auth/me")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&update_req)
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        // Verify store updated
        let stored = state.user_store.find_by_id(user.id).unwrap();
        assert_eq!(stored.full_name, "Updated Name");
        assert_eq!(stored.license_state.unwrap(), "WA");

        // Upload a tiny 1x1 PNG (base64)
        let png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
        let sig_req = serde_json::json!({
            "signature_base64": png_base64,
            "filename": "sig.png"
        });

        let req = test::TestRequest::post()
            .uri("/api/v1/auth/signature")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&sig_req)
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        let stored = state.user_store.find_by_id(user.id).unwrap();
        assert!(stored.signature_image_path.is_some());
        let sig_path = stored.signature_image_path.unwrap();
        let path = std::path::Path::new(&sig_path);
        assert!(path.exists());
    }
}
