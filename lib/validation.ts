// ============================================================================
// Property Validation -- TypeScript port of valuator-core/src/validation.rs
// ============================================================================

import type { Property } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates property data.
 * Direct port of validate_property() from validation.rs
 */
export function validateProperty(property: Property): ValidationResult {
  const errors: string[] = [];

  if (!property.id || property.id.trim() === "") {
    errors.push("Property ID cannot be empty");
  }

  if (!property.address || property.address.trim() === "") {
    errors.push("Address cannot be empty");
  }

  if (property.squareFeet <= 0) {
    errors.push("Square feet must be positive");
  }

  if ((property.bedrooms ?? 0) < 1 && property.propertyType === "single_family") {
    errors.push("Bedrooms must be at least 1");
  }

  if ((property.bathrooms ?? 0) <= 0 && property.propertyType === "single_family") {
    errors.push("Bathrooms must be positive");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
