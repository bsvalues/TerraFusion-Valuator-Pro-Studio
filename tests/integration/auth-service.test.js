/**
 * Auth Service Integration Tests
 *
 * Tests the authentication flow including registration, login,
 * token refresh, and validation.
 */

const BASE_URL =
  global.TEST_CONFIG?.AUTH_SERVICE_URL || "http://localhost:8081";

describe("Auth Service Integration", () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: "SecureP@ss123!",
    full_name: "Test User",
  };

  let accessToken = null;
  let refreshToken = null;

  describe("Health Check", () => {
    it("should return healthy status", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/health`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.service).toBe("auth-service");
    });
  });

  describe("User Registration", () => {
    it("should register a new user successfully", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      });

      // Registration might return 201 or 200 depending on implementation
      expect([200, 201]).toContain(response.status);

      const data = await response.json();
      expect(data.access_token).toBeDefined();
      expect(data.refresh_token).toBeDefined();
      expect(data.user.email).toBe(testUser.email);

      accessToken = data.access_token;
      refreshToken = data.refresh_token;
    });

    it("should reject duplicate email registration", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      });

      expect(response.status).toBe(409); // Conflict
    });

    it("should reject weak passwords", async () => {
      const weakPasswordUser = {
        email: "weak@example.com",
        password: "123",
        full_name: "Weak Password User",
      };

      const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weakPasswordUser),
      });

      expect(response.status).toBe(400); // Bad Request
    });

    it("should reject invalid email format", async () => {
      const invalidEmailUser = {
        email: "not-an-email",
        password: "SecureP@ss123!",
        full_name: "Invalid Email User",
      };

      const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidEmailUser),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("User Login", () => {
    it("should login with valid credentials", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.access_token).toBeDefined();
      expect(data.refresh_token).toBeDefined();
      expect(data.token_type).toBe("Bearer");
      expect(data.expires_in).toBeGreaterThan(0);

      accessToken = data.access_token;
      refreshToken = data.refresh_token;
    });

    it("should reject invalid password", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: "wrong-password",
        }),
      });

      expect(response.status).toBe(401); // Unauthorized
    });

    it("should reject non-existent user", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Token Validation", () => {
    it("should validate a valid access token", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: accessToken }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.claims).toBeDefined();
    });

    it("should reject an invalid token", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid-token" }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe("Token Refresh", () => {
    it("should refresh access token with valid refresh token", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.access_token).toBeDefined();
      expect(data.refresh_token).toBeDefined();

      // New tokens should be different
      expect(data.access_token).not.toBe(accessToken);

      accessToken = data.access_token;
      refreshToken = data.refresh_token;
    });

    it("should reject invalid refresh token", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: "invalid-refresh-token" }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe("Get Current User", () => {
    it("should return current user info with valid token", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.email).toBe(testUser.email);
      expect(data.full_name).toBe(testUser.full_name);
    });

    it("should reject request without token", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/me`);
      expect(response.status).toBe(401);
    });
  });

  describe("Password Change", () => {
    const newPassword = "NewSecureP@ss456!";

    it("should change password with valid credentials", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: testUser.password,
          new_password: newPassword,
        }),
      });

      expect(response.ok).toBe(true);
    });

    it("should login with new password", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: newPassword,
        }),
      });

      expect(response.ok).toBe(true);
    });

    it("should reject old password after change", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password, // Old password
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
