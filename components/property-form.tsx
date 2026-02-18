"use client";

import { useState } from "react";
import type { Property } from "@/lib/types";
import { AVAILABLE_REGIONS } from "@/lib/engines";

interface PropertyFormProps {
  onSubmit: (property: Property, region: string) => void;
  isLoading: boolean;
}

export function PropertyForm({ onSubmit, isLoading }: PropertyFormProps) {
  const [property, setProperty] = useState<Property>({
    id: "",
    address: "",
    squareFeet: 2000,
    bedrooms: 3,
    bathrooms: 2,
  });
  const [region, setRegion] = useState("Downtown");

  function generateId() {
    const prefix = "TF";
    const num = Math.floor(Math.random() * 90000) + 10000;
    return `${prefix}-${num}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prop = {
      ...property,
      id: property.id || generateId(),
    };
    onSubmit(prop, region);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Property ID */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="propertyId"
            className="font-mono text-[10px] tracking-wider text-muted-foreground"
          >
            PROPERTY ID
          </label>
          <input
            id="propertyId"
            type="text"
            placeholder="Auto-generated"
            value={property.id}
            onChange={(e) =>
              setProperty({ ...property, id: e.target.value })
            }
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="address"
            className="font-mono text-[10px] tracking-wider text-muted-foreground"
          >
            ADDRESS
          </label>
          <input
            id="address"
            type="text"
            required
            placeholder="123 Main St"
            value={property.address}
            onChange={(e) =>
              setProperty({ ...property, address: e.target.value })
            }
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Square Feet */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="squareFeet"
            className="font-mono text-[10px] tracking-wider text-muted-foreground"
          >
            SQUARE FEET
          </label>
          <input
            id="squareFeet"
            type="number"
            required
            min={1}
            value={property.squareFeet}
            onChange={(e) =>
              setProperty({
                ...property,
                squareFeet: Number(e.target.value),
              })
            }
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Bedrooms */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bedrooms"
            className="font-mono text-[10px] tracking-wider text-muted-foreground"
          >
            BEDROOMS
          </label>
          <input
            id="bedrooms"
            type="number"
            required
            min={1}
            value={property.bedrooms}
            onChange={(e) =>
              setProperty({
                ...property,
                bedrooms: Number(e.target.value),
              })
            }
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Bathrooms */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bathrooms"
            className="font-mono text-[10px] tracking-wider text-muted-foreground"
          >
            BATHROOMS
          </label>
          <input
            id="bathrooms"
            type="number"
            required
            min={1}
            step={0.5}
            value={property.bathrooms}
            onChange={(e) =>
              setProperty({
                ...property,
                bathrooms: Number(e.target.value),
              })
            }
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Region */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="region"
            className="font-mono text-[10px] tracking-wider text-muted-foreground"
          >
            MARKET REGION
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {AVAILABLE_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-mono text-xs font-semibold tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            EXECUTING SWARM PIPELINE...
          </>
        ) : (
          "EXECUTE SWARM PIPELINE"
        )}
      </button>
    </form>
  );
}
