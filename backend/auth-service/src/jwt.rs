use crate::error::AuthError;
use crate::models::{Claims, User, UserRole};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use uuid::Uuid;

/// JWT configuration
#[derive(Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub access_token_expiry_hours: i64,
    pub refresh_token_expiry_days: i64,
    pub issuer: String,
}

impl Default for JwtConfig {
    fn default() -> Self {
        Self {
            secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "terrafusion-valuator-pro-secret-key-change-in-production".to_string()),
            access_token_expiry_hours: std::env::var("JWT_ACCESS_EXPIRY_HOURS")
                .unwrap_or_else(|_| "1".to_string())
                .parse()
                .unwrap_or(1),
            refresh_token_expiry_days: std::env::var("JWT_REFRESH_EXPIRY_DAYS")
                .unwrap_or_else(|_| "7".to_string())
                .parse()
                .unwrap_or(7),
            issuer: std::env::var("JWT_ISSUER")
                .unwrap_or_else(|_| "valuator-pro".to_string()),
        }
    }
}

/// JWT service for token generation and validation
pub struct JwtService {
    config: JwtConfig,
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    pub fn new(config: JwtConfig) -> Self {
        let encoding_key = EncodingKey::from_secret(config.secret.as_bytes());
        let decoding_key = DecodingKey::from_secret(config.secret.as_bytes());

        Self {
            config,
            encoding_key,
            decoding_key,
        }
    }

    /// Generate an access token for a user
    pub fn generate_access_token(&self, user: &User) -> Result<String, AuthError> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.config.access_token_expiry_hours);

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.role,
            license_type: user.license_type,
            org_id: user.organization_id.map(|id| id.to_string()),
            iat: now.timestamp(),
            exp: exp.timestamp(),
            jti: Uuid::new_v4().to_string(),
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| AuthError::Internal(format!("Token generation failed: {}", e)))
    }

    /// Generate a refresh token for a user
    pub fn generate_refresh_token(&self, user: &User) -> Result<String, AuthError> {
        let now = Utc::now();
        let exp = now + Duration::days(self.config.refresh_token_expiry_days);

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.role,
            license_type: user.license_type,
            org_id: user.organization_id.map(|id| id.to_string()),
            iat: now.timestamp(),
            exp: exp.timestamp(),
            jti: Uuid::new_v4().to_string(),
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| AuthError::Internal(format!("Refresh token generation failed: {}", e)))
    }

    /// Validate and decode a token
    pub fn validate_token(&self, token: &str) -> Result<TokenData<Claims>, AuthError> {
        let mut validation = Validation::default();
        validation.validate_exp = true;

        decode::<Claims>(token, &self.decoding_key, &validation).map_err(|e| {
            match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::TokenExpired,
                _ => AuthError::InvalidToken,
            }
        })
    }

    /// Get the access token expiry in seconds
    pub fn get_access_expiry_seconds(&self) -> i64 {
        self.config.access_token_expiry_hours * 3600
    }
}

/// Password hashing utilities
pub mod password {
    use crate::error::AuthError;
    use bcrypt::{hash, verify, DEFAULT_COST};

    /// Hash a password using bcrypt
    pub fn hash_password(password: &str) -> Result<String, AuthError> {
        // Validate password strength
        validate_password_strength(password)?;

        hash(password, DEFAULT_COST)
            .map_err(|e| AuthError::Internal(format!("Password hashing failed: {}", e)))
    }

    /// Verify a password against a hash
    pub fn verify_password(password: &str, hash: &str) -> Result<bool, AuthError> {
        verify(password, hash)
            .map_err(|e| AuthError::Internal(format!("Password verification failed: {}", e)))
    }

    /// Validate password strength
    fn validate_password_strength(password: &str) -> Result<(), AuthError> {
        if password.len() < 8 {
            return Err(AuthError::WeakPassword(
                "Password must be at least 8 characters".to_string(),
            ));
        }

        let has_uppercase = password.chars().any(|c| c.is_uppercase());
        let has_lowercase = password.chars().any(|c| c.is_lowercase());
        let has_digit = password.chars().any(|c| c.is_ascii_digit());

        if !has_uppercase || !has_lowercase || !has_digit {
            return Err(AuthError::WeakPassword(
                "Password must contain uppercase, lowercase, and digit".to_string(),
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::UserRole;
    use chrono::Utc;

    fn create_test_user() -> User {
        User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            password_hash: "hash".to_string(),
            full_name: "Test User".to_string(),
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
        }
    }

    #[test]
    fn test_generate_and_validate_token() {
        let config = JwtConfig::default();
        let service = JwtService::new(config);
        let user = create_test_user();

        let token = service.generate_access_token(&user).unwrap();
        let decoded = service.validate_token(&token).unwrap();

        assert_eq!(decoded.claims.sub, user.id.to_string());
        assert_eq!(decoded.claims.email, user.email);
    }

    #[test]
    fn test_password_hashing() {
        let password = "SecurePass123";
        let hash = password::hash_password(password).unwrap();

        assert!(password::verify_password(password, &hash).unwrap());
        assert!(!password::verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_weak_password_rejection() {
        assert!(password::hash_password("short").is_err());
        assert!(password::hash_password("alllowercase123").is_err());
        assert!(password::hash_password("ALLUPPERCASE123").is_err());
        assert!(password::hash_password("NoDigitsHere").is_err());
    }
}
