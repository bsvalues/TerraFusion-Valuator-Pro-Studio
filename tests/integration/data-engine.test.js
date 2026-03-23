/**
 * Data Engine Integration Tests
 *
 * Tests the data persistence layer including CRUD operations
 * for properties, orders, and valuations.
 */

const BASE_URL = global.TEST_CONFIG?.DATA_ENGINE_URL || "http://localhost:8083";

describe("Data Engine Integration", () => {
  let createdPropertyId = null;
  let createdOrderId = null;

  const testProperty = {
    property_type: "single_family",
    address: {
      street: "123 Test Street",
      city: "Seattle",
      state: "WA",
      zip_code: "98101",
      county: "King",
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
      finished_basement_sqft: 500,
    },
  };

  describe("Health Check", () => {
    it("should return healthy status", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/data/health`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.service).toBe("data-engine");
    });
  });

  describe("Property CRUD Operations", () => {
    it("should create a new property", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testProperty),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.property_type).toBe(testProperty.property_type);
      expect(data.gross_living_area).toBe(testProperty.gross_living_area);

      createdPropertyId = data.id;
    });

    it("should retrieve property by ID", async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/properties/${createdPropertyId}`
      );

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.id).toBe(createdPropertyId);
      expect(data.property_type).toBe(testProperty.property_type);
      expect(data.address.street).toBe(testProperty.address.street);
    });

    it("should list all properties", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/properties`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it("should update property", async () => {
      const updateData = {
        gross_living_area: 2200,
        year_built: 2012,
      };

      const response = await fetch(
        `${BASE_URL}/api/v1/properties/${createdPropertyId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.gross_living_area).toBe(2200);
    });

    it("should return 404 for non-existent property", async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/properties/00000000-0000-0000-0000-000000000000`
      );
      expect(response.status).toBe(404);
    });

    it("should validate required fields", async () => {
      const invalidProperty = {
        property_type: "single_family",
        // Missing required fields
      };

      const response = await fetch(`${BASE_URL}/api/v1/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidProperty),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Valuation Order Operations", () => {
    const testOrder = {
      order_type: "full_appraisal",
      client_reference: "TEST-001",
      notes: "Integration test order",
    };

    it("should create a valuation order", async () => {
      const orderData = {
        ...testOrder,
        subject_property_id: createdPropertyId,
      };

      const response = await fetch(`${BASE_URL}/api/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.order_type).toBe(testOrder.order_type);
      expect(data.status).toBe("pending");

      createdOrderId = data.id;
    });

    it("should retrieve order by ID", async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/orders/${createdOrderId}`
      );

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.id).toBe(createdOrderId);
      expect(data.client_reference).toBe(testOrder.client_reference);
    });

    it("should list all orders", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/orders`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should update order status", async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/orders/${createdOrderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        }
      );

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe("in_progress");
    });

    it("should filter orders by status", async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/orders?status=in_progress`
      );

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // All returned orders should have the filtered status
      data.forEach((order) => {
        expect(order.status).toBe("in_progress");
      });
    });
  });

  describe("Comparable Sales Operations", () => {
    const testComp = {
      property_type: "single_family",
      address: {
        street: "456 Comp Street",
        city: "Seattle",
        state: "WA",
        zip_code: "98102",
      },
      sale_price: 550000,
      sale_date: "2024-01-15T00:00:00Z",
      gross_living_area: 1950,
      lot_size: 4800.0,
      year_built: 2008,
      bedrooms: 3,
      bathrooms: 2.0,
    };

    it("should add comparable sale to order", async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/orders/${createdOrderId}/comps`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testComp),
        }
      );

      expect([200, 201]).toContain(response.status);

      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.sale_price).toBe(testComp.sale_price);
    });

    it("should list comparables for order", async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/orders/${createdOrderId}/comps`
      );

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe("Statistics Endpoint", () => {
    it("should return database statistics", async () => {
      const response = await fetch(`${BASE_URL}/api/v1/stats`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.property_count).toBeDefined();
      expect(data.order_count).toBeDefined();
      expect(typeof data.property_count).toBe("number");
    });
  });

  describe("Cleanup", () => {
    it("should delete order", async () => {
      if (!createdOrderId) return;

      const response = await fetch(
        `${BASE_URL}/api/v1/orders/${createdOrderId}`,
        {
          method: "DELETE",
        }
      );

      expect([200, 204]).toContain(response.status);
    });

    it("should delete property", async () => {
      if (!createdPropertyId) return;

      const response = await fetch(
        `${BASE_URL}/api/v1/properties/${createdPropertyId}`,
        {
          method: "DELETE",
        }
      );

      expect([200, 204]).toContain(response.status);
    });

    it("should confirm property deletion", async () => {
      if (!createdPropertyId) return;

      const response = await fetch(
        `${BASE_URL}/api/v1/properties/${createdPropertyId}`
      );
      expect(response.status).toBe(404);
    });
  });
});
