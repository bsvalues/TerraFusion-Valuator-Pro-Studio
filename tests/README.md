# TerraFusion Valuator Pro Studio - Integration Tests

Comprehensive integration test suite for all backend microservices.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific service tests
npm run test:auth    # Auth Service tests
npm run test:data    # Data Engine tests
npm run test:ai      # AI Engine tests

# Watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Prerequisites

Ensure the following services are running before executing tests:

| Service      | Port | Description            |
| ------------ | ---- | ---------------------- |
| API Gateway  | 8080 | Main entry point       |
| Auth Service | 8081 | JWT authentication     |
| AI Engine    | 8082 | Property insights      |
| Data Engine  | 8083 | PostgreSQL persistence |

### Starting Services

```bash
# From backend directory
cd ../backend

# Start all services (each in separate terminal)
cd auth-service && cargo run
cd ai-engine && cargo run
cd data-engine && cargo run
cd valuator-api && cargo run
```

### Environment Variables

Override default service URLs via environment variables:

```bash
export AUTH_SERVICE_URL=http://localhost:8081
export AI_ENGINE_URL=http://localhost:8082
export DATA_ENGINE_URL=http://localhost:8083
export API_GATEWAY_URL=http://localhost:8080

npm test
```

## Test Structure

```
tests/
├── integration/
│   ├── auth-service.test.js    # Authentication tests
│   ├── data-engine.test.js     # Data persistence tests
│   └── ai-engine.test.js       # AI analysis tests
├── jest.config.js              # Jest configuration
├── setup.js                    # Global test setup
└── package.json                # Dependencies
```

## Test Coverage

### Auth Service (`auth-service.test.js`)

- ✅ Health check
- ✅ User registration
  - Success case
  - Duplicate email rejection
  - Weak password rejection
  - Invalid email rejection
- ✅ User login
  - Valid credentials
  - Invalid password
  - Non-existent user
- ✅ Token validation
- ✅ Token refresh
- ✅ Get current user
- ✅ Password change

### Data Engine (`data-engine.test.js`)

- ✅ Health check
- ✅ Property CRUD
  - Create property
  - Retrieve by ID
  - List all properties
  - Update property
  - Delete property
  - Validation
- ✅ Valuation Orders
  - Create order
  - Retrieve order
  - Update status
  - Filter by status
- ✅ Comparable Sales
  - Add to order
  - List by order
- ✅ Statistics endpoint

### AI Engine (`ai-engine.test.js`)

- ✅ Health check
- ✅ Capabilities endpoint
- ✅ Property insights
  - Value estimation
  - Value drivers
  - Risk factors
  - Missing data handling
- ✅ Value forecasting
  - Various horizons
  - Confidence intervals
- ✅ Quality control
  - Overall scoring
  - Detailed checks
  - Outlier detection
- ✅ Market analysis
- ✅ Error handling

## Writing New Tests

Follow this pattern for new integration tests:

```javascript
const BASE_URL = global.TEST_CONFIG?.SERVICE_URL || "http://localhost:PORT";

describe("Service Name", () => {
  describe("Feature", () => {
    it("should do something", async () => {
      const response = await fetch(`${BASE_URL}/endpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "value" }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.field).toBeDefined();
    });
  });
});
```

## CI/CD Integration

For CI environments, ensure services are available or use mock servers:

```yaml
# Example GitHub Actions step
- name: Run Integration Tests
  env:
    AUTH_SERVICE_URL: http://localhost:8081
    AI_ENGINE_URL: http://localhost:8082
    DATA_ENGINE_URL: http://localhost:8083
  run: npm test
```

## Troubleshooting

### Connection Refused

Ensure services are running:

```bash
curl http://localhost:8081/api/v1/auth/health
curl http://localhost:8082/api/v1/ai/health
curl http://localhost:8083/api/v1/data/health
```

### Timeout Errors

Increase Jest timeout:

```javascript
jest.setTimeout(60000);
```

### Database State

Tests may fail if database is not clean. Consider:

- Using separate test database
- Running migrations before tests
- Cleaning up test data after runs
