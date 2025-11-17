# TerraFusion Valuator Pro Studio

A comprehensive property valuation platform with advanced market analysis and risk assessment capabilities.

## Architecture

This project is organized as a Rust workspace with the following components:

### Core Libraries

- **valuator-core**: Core data models, types, and business logic
- **valuator-tracing**: Consistent observability infrastructure for all services

### Services

- **valuation-service**: Property valuation calculations
- **market-analyzer**: Market trend analysis and data aggregation
- **risk-assessor**: Risk assessment for property valuations

## Features

- ✅ Automated property valuation
- ✅ Market trend analysis
- ✅ Risk assessment
- ✅ Comprehensive observability with tracing
- ✅ Consistent error handling across services
- ✅ Full test coverage

## Building

```bash
cargo build
```

## Testing

```bash
cargo test
```

## Running Tests with Coverage

```bash
cargo test --all-features
```

## Development

Each service can be developed independently while sharing the core libraries. All services use the `valuator-tracing` crate for consistent logging and observability.

## License

MIT License - See LICENSE file for details
