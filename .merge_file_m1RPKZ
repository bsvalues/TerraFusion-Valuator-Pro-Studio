# TerraFusion Valuator Pro Studio

Professional Real Estate Property Valuation Platform implementing the Three Approaches to Value methodology.

## 🏗️ Architecture

### Backend (Rust Microservices)

- **valuator-core** - Shared library with core valuation algorithms
- **valuator-api** - REST API gateway (Port 8080)
- **auth-service** - Authentication/authorization (Port 8081)
- **ai-engine** - AI-powered insights (Port 8082)
- **data-engine** - Data ingestion (Port 8083)

### Frontend (Next.js)

- **valuator-studio** - Web application interface (Port 3000)

## 🚀 Quick Start

### Prerequisites

```bash
cd frontend/valuator-studio
npm install
```

2. **Configure environment:**

   ```bash
   cp .env.local.template .env.local
   # Edit .env.local if needed
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

## 📋 Development Workflow

### Running Tests

**Backend:**

```powershell
# Test core library
cd backend/valuator-core
cargo test

# Test API endpoints
cd backend/valuator-api
cargo test

# Run with output
cargo test -- --nocapture
```

**Frontend:**

```bash
cd frontend/valuator-studio
npm test
npm run test:coverage
```

### Code Quality

**Backend:**

```powershell
# Format code
cargo fmt --all

# Run linter
cargo clippy --all-targets --all-features -- -D warnings
```

**Frontend:**

```bash
npm run lint
```

### Building for Production

**Backend:**

```powershell
cd backend/valuator-api
cargo build --release
# Binary at: target/release/valuator-api.exe
```

**Frontend:**

```bash
cd frontend/valuator-studio
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

Copy the template files:

- **Infrastructure**: `infrastructure/.env.development.template` → `.env.development`
- **Frontend**: `frontend/valuator-studio/.env.local.template` → `.env.local`

Key configurations:

- `API_PORT=8080` - API service port
- `NEXT_PUBLIC_API_URL=http://localhost:8080` - Frontend API endpoint
- `RUST_LOG=debug` - Logging level

## 📊 API Endpoints

### Health Check

```http
GET /api/v1/health
```

### Full Valuation

```http
POST /api/v1/valuation/estimate
Content-Type: application/json

{
  "subject": {
    "square_feet": 2000,
    "bedrooms": 3,
    "bathrooms": 2,
    "age_years": 10,
    "monthly_rent": 2200
  },
  "comparables": [
    {
      "sale_price": 400000,
      "square_feet": 2000,
      "bedrooms": 3,
      "bathrooms": 2,
      "age_years": 10
    }
  ]
}
```

### Quick Estimate

```http
POST /api/v1/valuation/quick
Content-Type: application/json

{
  "square_feet": 2000,
  "bedrooms": 3,
  "bathrooms": 2,
  "age_years": 10,
  "monthly_rent": 2200
}
```

## 🧪 Valuation Methodology

The platform implements three standard real estate appraisal approaches:

### 1. Sales Comparison Approach (40% weight)

- Analyzes comparable sales
- Adjustments: $50/sqft for size, $500/year for age

### 2. Cost Approach (30% weight)

- Replacement cost: $150/sqft
- Depreciation: 0.5%/year (capped at 80%)

### 3. Income Approach (30% weight)

- Gross Rent Multiplier: 180x annual rent

**Final Value** = Weighted average of all three approaches

## 📁 Project Structure

```
.
├── backend/
│   ├── valuator-core/       # Core valuation library
│   │   ├── src/
│   │   │   ├── lib.rs        # Entry point
│   │   │   ├── model.rs      # Data models
│   │   │   ├── sales_comparison.rs
│   │   │   ├── cost_approach.rs
│   │   │   ├── income_approach.rs
│   │   │   ├── reconciliation.rs
│   │   │   └── qc.rs
│   │   └── tests/
│   │       └── integration_tests.rs
│   ├── valuator-api/        # REST API service
│   │   └── src/
│   │       ├── main.rs
│   │       └── routes.rs
│   ├── auth-service/        # Authentication (TBD)
│   ├── ai-engine/          # AI insights (TBD)
│   └── data-engine/        # Data ingestion (TBD)
├── frontend/
│   └── valuator-studio/    # Next.js frontend
│       ├── app/
│       │   ├── page.tsx
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ValuationForm.tsx
│       │   └── ValuationResults.tsx
│       └── lib/
│           └── api.ts
└── infrastructure/
    ├── .env.development.template
    └── .env.production.template
```

## 🐛 Troubleshooting

### `dlltool.exe` not found (Windows)

```powershell
# Ensure MinGW is in PATH
$env:Path += ";C:\msys64\mingw64\bin"
rustup default stable-x86_64-pc-windows-gnu
cargo clean
```

### Frontend can't connect to API

- Ensure API is running: `cargo run` in `backend/valuator-api`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Verify CORS settings in API configuration

### Test failures

```powershell
# Clean and rebuild
cargo clean
cargo test
```

## 📖 Documentation

- [Backend Setup Guide](backend/DEV_SETUP.md)
- [AI Coding Instructions](.github/copilot-instructions.md)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

1. Follow the coding conventions in `.github/copilot-instructions.md`
2. Run tests before committing: `cargo test && npm test`
3. Format code: `cargo fmt --all && npm run lint`
4. Write descriptive commit messages

---

**Built with:** Rust, Next.js, TypeScript, Actix-web, Tailwind CSS
