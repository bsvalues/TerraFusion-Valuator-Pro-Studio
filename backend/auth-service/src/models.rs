use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Appraiser state license type (USPAP categories)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LicenseType {
    CertifiedResidential,
    CertifiedGeneral,
    Trainee,
    Review,
}

impl std::fmt::Display for LicenseType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LicenseType::CertifiedResidential => write!(f, "certified_residential"),
            LicenseType::CertifiedGeneral => write!(f, "certified_general"),
            LicenseType::Trainee => write!(f, "trainee"),
            LicenseType::Review => write!(f, "review"),
        }
    }
}

/// User account stored in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub full_name: String,
    pub role: UserRole,
    pub organization_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    /// USPAP license category
    pub license_type: Option<LicenseType>,
    /// Two-letter state code (e.g. "WA")
    pub license_state: Option<String>,
    /// State-issued license number
    pub license_number: Option<String>,
    /// License expiry date (ISO-8601: "YYYY-MM-DD")
    pub license_expiry: Option<String>,
    /// Path/URL to stored signature image
    pub signature_image_path: Option<String>,
}

/// User role for authorization
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    Admin,
    Appraiser,
    Reviewer,
    ReadOnly,
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Admin => write!(f, "admin"),
            UserRole::Appraiser => write!(f, "appraiser"),
            UserRole::Reviewer => write!(f, "reviewer"),
            UserRole::ReadOnly => write!(f, "read_only"),
        }
    }
}

/// JWT Claims structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// User email
    pub email: String,
    /// User role
    pub role: UserRole,
    /// Organization ID (optional)
    pub org_id: Option<String>,
    /// USPAP license type (optional — appraisers only)
    pub license_type: Option<LicenseType>,
    /// Issued at timestamp
    pub iat: i64,
    /// Expiration timestamp
    pub exp: i64,
    /// Token ID for revocation tracking
    pub jti: String,
}

/// Login request payload
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Registration request payload
#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub organization_id: Option<Uuid>,
    pub license_type: Option<LicenseType>,
    pub license_state: Option<String>,
    pub license_number: Option<String>,
    pub license_expiry: Option<String>,
}

/// Token refresh request
#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// Authentication response with tokens
#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub user: UserInfo,
}

/// Public user info (safe to expose)
#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub full_name: String,
    pub role: UserRole,
    pub organization_id: Option<String>,
    pub license_type: Option<LicenseType>,
    pub license_state: Option<String>,
    pub license_number: Option<String>,
    pub license_expiry: Option<String>,
    /// True when license expires within 30 days
    pub license_expiry_warning: bool,
}

impl From<&User> for UserInfo {
    fn from(user: &User) -> Self {
        let license_expiry_warning = user.license_expiry.as_deref().map_or(false, |exp| {
            if let Ok(expiry) = chrono::NaiveDate::parse_from_str(exp, "%Y-%m-%d") {
                let today = Utc::now().date_naive();
                let days_until = (expiry - today).num_days();
                days_until >= 0 && days_until <= 30
            } else {
                false
            }
        });
        UserInfo {
            id: user.id.to_string(),
            email: user.email.clone(),
            full_name: user.full_name.clone(),
            role: user.role,
            organization_id: user.organization_id.map(|id| id.to_string()),
            license_type: user.license_type,
            license_state: user.license_state.clone(),
            license_number: user.license_number.clone(),
            license_expiry: user.license_expiry.clone(),
            license_expiry_warning,
        }
    }
}

/// Password change request
#[derive(Debug, Serialize, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

/// Profile update payload (partial updates allowed)
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProfileRequest {
    pub full_name: Option<String>,
    pub organization_id: Option<Uuid>,
    pub license_type: Option<LicenseType>,
    pub license_state: Option<String>,
    pub license_number: Option<String>,
    pub license_expiry: Option<String>,
}

/// Signature upload via base64 payload
#[derive(Debug, Serialize, Deserialize)]
pub struct SignatureUploadRequest {
    /// Base64-encoded image bytes (data only, without data: prefix)
    pub signature_base64: String,
    /// Optional filename to use when storing (e.g. "sig.png")
    pub filename: Option<String>,
}

/// Token validation response
#[derive(Debug, Serialize)]
pub struct TokenValidationResponse {
    pub valid: bool,
    pub claims: Option<Claims>,
}
