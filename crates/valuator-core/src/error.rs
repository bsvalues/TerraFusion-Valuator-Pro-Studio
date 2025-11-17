//! Error types for the valuator core library

use thiserror::Error;

/// Custom error type for valuator operations
#[derive(Error, Debug)]
pub enum ValuatorError {
    #[error("Invalid property data: {0}")]
    InvalidProperty(String),

    #[error("Valuation calculation failed: {0}")]
    ValuationFailed(String),

    #[error("Market data unavailable: {0}")]
    MarketDataUnavailable(String),

    #[error("Risk assessment error: {0}")]
    RiskAssessmentError(String),

    #[error("Data validation error: {0}")]
    ValidationError(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// Result type alias for valuator operations
pub type Result<T> = std::result::Result<T, ValuatorError>;
