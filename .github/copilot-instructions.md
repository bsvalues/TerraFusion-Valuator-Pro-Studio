# TerraFusion Valuator Pro Studio - AI Coding Agent Instructions

## Project Overview

TerraFusion Valuator Pro Studio is a **real estate property valuation platform** built with a Rust microservices backend and Next.js frontend. The system implements the **Three Approaches to Value** methodology used in professional real estate appraisal: Sales Comparison, Cost Approach, and Income Approach.

## Architecture

### Backend: Microservices in Rust
The backend follows a **shared library + service microarchitecture**:

- **`valuator-core/`** - Shared library crate containing core valuation logic (see `backend/valuator-core/src/lib.rs`)
  - **Three valuation modules**: `sales_comparison.rs`, `cost_approach.rs`, `income_approach.rs`
  - **Reconciliation logic**: `reconciliation.rs` - Weighted averaging (40% sales, 30% cost, 30% income)
  - **Data models**: `model.rs` - Core types like `SubjectProperty`, `ValuationResult`
  - **QC utilities**: `qc.rs` - Basic quality control scoring

- **Independent service crates** (currently scaffolded):
  - `valuator-api/` - REST API gateway (port 8080)
  - `auth-service/` - Authentication/authorization (port 8081)
  - `ai-engine/` - AI-powered insights (port 8082)
  - `data-engine/` - Data ingestion (port 8083)

**Key Pattern**: Services import `valuator_core` as a dependency. The core library is the single source of truth for valuation algorithms.

### Frontend: Next.js (Early Development)
- **Location**: `frontend/valuator-studio/`
- **Framework**: Next.js with App Router (`app/` directory)
- **Status**: Basic structure in place, minimal implementation

### Infrastructure
- **Environment Templates**: `infrastructure/.env.{development,production}.template`
- **Stack**: PostgreSQL (port 5432), Redis (port 6379), external AI APIs (OpenAI)
- **Service Ports**: See `.env.development.template` for all port assignments

## Development Workflow

### Rust Backend (Windows-Specific)

**Critical**: This project requires the **GNU toolchain** (`x86_64-pc-windows-gnu`) due to MinGW dependencies. The MSVC toolchain is NOT supported.

#### Initial Setup (One-Time)
Follow `backend/DEV_SETUP.md` exactly:
1. Install MSYS2 and MinGW-w64 toolchain
2. Add `C:\msys64\mingw64\bin` to PATH
3. Set default toolchain: `rustup default stable-x86_64-pc-windows-gnu`

#### Daily Development Commands
```powershell
# Navigate to specific service or core library
cd backend/valuator-core

# Run tests (includes unit + integration tests)
cargo test

# Run specific test
cargo test smoke_estimate_value

# Build service
cargo build

# Format code (required before commits)
cargo fmt --all

# Lint with Clippy
cargo clippy --all-targets --all-features -- -D warnings
```

**Always run `cargo clean` after switching between GNU/MSVC toolchains** to avoid linker errors.

### Testing Strategy

- **Unit tests**: Co-located in each module (e.g., `sales_comparison.rs` has `#[cfg(test)] mod tests`)
- **Integration tests**: `valuator-core/tests/integration_tests.rs`
- **Test pattern**: All test methods use `assert_eq!` with exact numeric comparisons
- **Example**: `test_full_valuation_workflow()` in `integration_tests.rs` demonstrates complete valuation pipeline

### Code Organization Patterns

#### Valuation Algorithm Structure
Each approach module follows the same pattern:
```rust
// Public estimation function (deterministic, no I/O)
pub fn estimate_*_value(subject: &SubjectProperty, ...) -> f64 {
    // Simple, documented heuristic
}

#[cfg(test)]
mod tests {
    // Edge cases: zero values, extreme inputs, exact matches
}
```

#### Data Models (`model.rs`)
All models use `serde` for serialization:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubjectProperty { /* fields */ }
```

#### Constants & Magic Numbers
Hard-coded constants are **intentional placeholders** for MVP:
- Sales Comparison: `$50/sqft` size adjustment, `$500/year` age depreciation
- Cost Approach: `$150/sqft` replacement cost, `0.5%/year` depreciation (capped at 80%)
- Income Approach: `180x` Gross Rent Multiplier
- Reconciliation: `40/30/30` weighting

**DO NOT** extract these to config files unless explicitly requested. They're documented in tests.

## Common Tasks

### Adding a New Valuation Factor
1. Update `model::SubjectProperty` or `sales_comparison::ComparableSale` with new field
2. Modify relevant approach function (`estimate_*_value`) 
3. Add unit tests covering new factor's edge cases
4. Update integration tests in `tests/integration_tests.rs`
5. Run `cargo test` and `cargo fmt --all`

### Creating a New Service
1. Create directory in `backend/<service-name>/`
2. Initialize with `cargo init --name <service-name>`
3. Add `valuator-core = { path = "../valuator-core" }` to `Cargo.toml`
4. Configure service port in `infrastructure/.env.development.template`

### Frontend Development (Future)
- Use `frontend/valuator-studio/.env.local` for local API URLs
- Next.js dev server expected on port 3000
- API integration points defined in `.env.development.template` as `NEXT_PUBLIC_*` vars

## Critical Files to Understand

1. **`backend/valuator-core/src/lib.rs`** - Entry point, exposes `estimate_value()` function
2. **`backend/valuator-core/src/reconciliation.rs`** - Weighted averaging logic (why final values differ from approach indicators)
3. **`backend/DEV_SETUP.md`** - Windows Rust environment setup (read BEFORE building)
4. **`infrastructure/.env.development.template`** - All service URLs, ports, and configuration
5. **`backend/valuator-core/tests/integration_tests.rs`** - Complete workflow examples

## Conventions

- **Error Handling**: Currently uses simple f64 returns (0.0 for errors). Future: `anyhow::Result<T>` for services
- **Naming**: Snake_case for Rust (functions, variables), PascalCase for types
- **Imports**: Group as `std`, external crates, `crate::` (see `lib.rs`)
- **Comments**: Inline comments explain "why" for non-obvious heuristics (e.g., GRM = 180)
- **Cargo.lock**: Currently NOT checked in (library crate). Check in when services become binaries

## Troubleshooting

### `dlltool.exe` not found
You're using MSVC toolchain. Switch: `rustup default stable-x86_64-pc-windows-gnu && cargo clean`

### Test failures after editing approach logic
Check integration tests - they expect exact numeric results based on hard-coded constants.

### Frontend build issues
This is early-stage scaffolding. Focus on backend services first.

## What NOT to Do

- ❌ Don't switch to MSVC toolchain without team approval
- ❌ Don't add database access to `valuator-core` (pure computation library)
- ❌ Don't extract magic numbers to config unless making them runtime-configurable
- ❌ Don't add async code to `valuator-core` (leave async/await for service layers)
- ❌ Don't create workspace-level `Cargo.toml` unless migrating all services (current structure is intentional)

## Questions to Ask Before Making Changes

1. Does this belong in the core library (`valuator-core`) or a service?
2. Will this change affect the deterministic output of valuation tests?
3. Have I run `cargo test` and `cargo fmt --all` before committing?
4. For new dependencies: Are they compatible with `x86_64-pc-windows-gnu`?
