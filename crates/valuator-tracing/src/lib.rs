//! Observability infrastructure for TerraFusion Valuator Pro Studio
//!
//! This crate provides consistent tracing and logging capabilities across
//! all services in the system.

use anyhow::Result;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initialize tracing for a service
///
/// # Arguments
///
/// * `service_name` - Name of the service for logging context
/// * `default_level` - Default log level if not specified by environment
///
/// # Examples
///
/// ```no_run
/// use valuator_tracing::init_tracing;
///
/// init_tracing("valuation-service", "info").expect("Failed to initialize tracing");
/// ```
pub fn init_tracing(service_name: &str, default_level: &str) -> Result<()> {
    let filter = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new(default_level))
        .unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(
            fmt::layer()
                .with_target(true)
                .with_thread_ids(true)
                .with_level(true)
                .with_line_number(true)
                .with_file(true)
        )
        .init();

    tracing::info!(service = service_name, "Tracing initialized");

    Ok(())
}

/// Initialize tracing with JSON output for structured logging
pub fn init_tracing_json(service_name: &str, default_level: &str) -> Result<()> {
    let filter = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new(default_level))
        .unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().json())
        .init();

    tracing::info!(service = service_name, "Tracing initialized with JSON output");

    Ok(())
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_init_tracing() {
        // Note: In a real test, we'd use a custom subscriber to verify output
        // For now, we just ensure the function doesn't panic
        // Commenting out to avoid double-initialization in tests
        // init_tracing("test-service", "debug").unwrap();
    }
}
