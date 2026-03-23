/**
 * Jest Setup - TerraFusion Valuator Pro Studio Tests
 */

// Test configuration
const TEST_CONFIG = {
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:8081",
  AI_ENGINE_URL: process.env.AI_ENGINE_URL || "http://localhost:8082",
  DATA_ENGINE_URL: process.env.DATA_ENGINE_URL || "http://localhost:8083",
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || "http://localhost:8080",
};

// Make config available globally
global.TEST_CONFIG = TEST_CONFIG;

// Increase timeout for integration tests
jest.setTimeout(30000);

// Log test configuration on startup
console.log("🧪 TerraFusion Valuator Pro Studio - Integration Tests");
console.log("Configuration:", TEST_CONFIG);
console.log("---");
