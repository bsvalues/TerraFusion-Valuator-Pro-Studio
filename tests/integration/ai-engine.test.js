/**
 * AI Engine Integration Tests
 *
 * Tests the AI-powered property analysis capabilities including
 * market insights, value forecasting, and quality control.
 */

const BASE_URL = global.TEST_CONFIG?.AI_ENGINE_URL || "http://localhost:8082";

describe("AI Engine Integration", () => {
  const testSubject = {
    property_type: "single_family",
    address: {
      street: "123 AI Test Lane",
      city: "Seattle",
      state: "WA",
      zip_code: "98101",
    },
    gross_living_area: 2000,
    lot_size: 5000.0,
    year_built: 2010,
    bedrooms: 3,
    bathrooms: 2.5,
    features: {
      garage_spaces: 2,
      has_pool: false,
      has_basement: true,
    },
  };

  const testComparables = [
    {
      property_type: "single_family",
      address: {
        street: "124 AI Test Lane",
        city: "Seattle",
        state: "WA",
        zip_code: "98101",
      },
      sale_price: 550000,
      sale_date: "2024-01-15T00:00:00Z",
      gross_living_area: 1950,
      lot_size: 4800.0,
      year_built: 2008,
      bedrooms: 3,
      bathrooms: 2.0,
    },
    {
      property_type: "single_family",
      address: {
        street: "125 AI Test Lane",
        city: "Seattle",
        state: "WA",
        zip_code: "98101",
      },
      sale_price: 575000,
      sale_date: "2024-02-01T00:00:00Z",
      gross_living_area: 2100,
      lot_size: 5200.0,
      year_built: 2012,
      bedrooms: 4,
      bathrooms: 2.5,
    },
    {
      property_type: "single_family",
      address: {
        street: "126 AI Test Lane",
        city: "Seattle",
        state: "WA",
        zip_code: "98101",
      },
      sale_price: 520000,
      sale_date: "2024-01-20T00:00:00Z",
      gross_living_area: 1850,
      lot_size: 4500.0,
      year_built: 2005,
      bedrooms: 3,
      bathrooms: 2.0,
    },
  ];

  describe("Health Check", () => {
    it("should return healthy status", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/health`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.service).toBe("ai-engine");
    });
  });

  describe("Capabilities Endpoint", () => {
    it("should return AI engine capabilities", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/capabilities`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.capabilities).toBeDefined();
      expect(Array.isArray(data.capabilities)).toBe(true);
      expect(data.capabilities).toContain("property-insights");
      expect(data.capabilities).toContain("value-forecasting");
      expect(data.capabilities).toContain("quality-control");
    });
  });

  describe("Property Insights", () => {
    it("should generate property insights", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: testComparables,
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      // Check structure
      expect(data.estimated_value).toBeDefined();
      expect(data.confidence_score).toBeDefined();
      expect(data.market_analysis).toBeDefined();
      expect(data.value_drivers).toBeDefined();
      expect(data.risk_factors).toBeDefined();
      expect(data.recommendations).toBeDefined();

      // Check value ranges
      expect(data.estimated_value).toBeGreaterThan(0);
      expect(data.confidence_score).toBeGreaterThanOrEqual(0);
      expect(data.confidence_score).toBeLessThanOrEqual(1);
    });

    it("should return value drivers", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: testComparables,
        }),
      });

      const data = await response.json();

      expect(Array.isArray(data.value_drivers)).toBe(true);

      if (data.value_drivers.length > 0) {
        const driver = data.value_drivers[0];
        expect(driver.factor).toBeDefined();
        expect(driver.impact).toBeDefined();
        expect(["positive", "negative", "neutral"]).toContain(driver.impact);
      }
    });

    it("should return risk factors", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: testComparables,
        }),
      });

      const data = await response.json();

      expect(Array.isArray(data.risk_factors)).toBe(true);

      if (data.risk_factors.length > 0) {
        const risk = data.risk_factors[0];
        expect(risk.category).toBeDefined();
        expect(risk.severity).toBeDefined();
        expect(["low", "medium", "high"]).toContain(risk.severity);
      }
    });

    it("should handle missing comparables gracefully", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: [],
        }),
      });

      // Should return 200 with reduced confidence or 400 for insufficient data
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("Value Forecasting", () => {
    it("should generate value forecast", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: testComparables,
          forecast_months: 12,
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.current_value).toBeDefined();
      expect(data.forecasted_value).toBeDefined();
      expect(data.forecast_months).toBe(12);
      expect(data.projected_appreciation).toBeDefined();
      expect(data.confidence_interval).toBeDefined();
    });

    it("should return confidence intervals", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: testComparables,
          forecast_months: 6,
        }),
      });

      const data = await response.json();

      expect(data.confidence_interval).toBeDefined();
      expect(data.confidence_interval.low).toBeDefined();
      expect(data.confidence_interval.high).toBeDefined();
      expect(data.confidence_interval.low).toBeLessThan(
        data.confidence_interval.high
      );
    });

    it("should handle different forecast horizons", async () => {
      const horizons = [3, 6, 12, 24];

      for (const months of horizons) {
        const response = await fetch(`${BASE_URL}/api/v1/ai/forecast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: testSubject,
            comparables: testComparables,
            forecast_months: months,
          }),
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.forecast_months).toBe(months);
      }
    });
  });

  describe("Quality Control", () => {
    it("should perform QC analysis", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/qc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: testComparables,
          estimated_value: 560000,
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.overall_score).toBeDefined();
      expect(data.checks).toBeDefined();
      expect(data.passed).toBeDefined();
      expect(typeof data.passed).toBe("boolean");
    });

    it("should return detailed QC checks", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/qc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: testComparables,
          estimated_value: 560000,
        }),
      });

      const data = await response.json();

      expect(Array.isArray(data.checks)).toBe(true);

      if (data.checks.length > 0) {
        const check = data.checks[0];
        expect(check.name).toBeDefined();
        expect(check.passed).toBeDefined();
        expect(typeof check.passed).toBe("boolean");
      }
    });

    it("should flag outlier values", async () => {
      // Intentionally use an extreme value
      const response = await fetch(`${BASE_URL}/api/v1/ai/qc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          comparables: testComparables,
          estimated_value: 1500000, // Way above comparable range
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      // Should have lower score or failed checks for outlier
      expect(data.overall_score).toBeDefined();

      // Look for value-related check failures
      const valueCheck = data.checks?.find(
        (c) =>
          c.name?.toLowerCase().includes("value") ||
          c.name?.toLowerCase().includes("range")
      );

      if (valueCheck) {
        expect(valueCheck.passed).toBe(false);
      }
    });
  });

  describe("Market Analysis", () => {
    it("should return market analysis", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/market`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: {
            city: "Seattle",
            state: "WA",
            zip_code: "98101",
          },
          property_type: "single_family",
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.market_trend).toBeDefined();
      expect(data.median_price).toBeDefined();
      expect(data.days_on_market).toBeDefined();
      expect(["hot", "warm", "balanced", "cool", "cold"]).toContain(
        data.market_trend
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid request body", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(response.status).toBe(400);
    });

    it("should handle missing required fields", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });
});
