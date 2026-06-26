/**
 * TotalForge GIS Service — Fastify entry point
 * Port 8085 (cost engine runs on 8084, ai-engine on 8082)
 *
 * Routes:
 *   GET  /health
 *   GET  /parcel/:apn               lookup by APN (query: ?county=walla+walla)
 *   GET  /parcel/search             lookup by address (query: ?address=...&county=...)
 *   GET  /flood                     FEMA flood zone (query: ?lat=...&lng=...)
 *   GET  /comps/radius              parcels within radius (query: ?lat=...&lng=...&miles=...&county=...)
 *   GET  /geocode                   geocode an address (query: ?q=...)
 */

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  lookupParcelByAPN,
  searchParcelsByAddress,
  getParcelsInRadius,
  geocodeAddress,
} from "./parcel-cascade";
import { getFloodZone } from "./fema-flood";

void (async () => {

const PORT = parseInt(process.env.GIS_PORT ?? "8085", 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: [CORS_ORIGIN, "http://localhost:8082", "http://localhost:8080"],
  methods: ["GET"],
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/health", async () => ({
  status: "healthy",
  service: "totalforge-gis-service",
  version: "0.1.0",
}));

// ── Parcel by APN ─────────────────────────────────────────────────────────────

app.get<{ Params: { apn: string }; Querystring: { county?: string } }>(
  "/parcel/:apn",
  async (req, reply) => {
    const { apn } = req.params;
    if (!apn || apn.length < 5) {
      return reply.status(400).send({ error: "apn must be at least 5 characters" });
    }
    const result = await lookupParcelByAPN(apn, req.query.county);
    if (!result) {
      return reply.status(404).send({ error: "Parcel not found in any tier" });
    }
    return result;
  }
);

// ── Parcel search by address ───────────────────────────────────────────────────

app.get<{ Querystring: { address?: string; county?: string } }>(
  "/parcel/search",
  async (req, reply) => {
    const { address, county } = req.query;
    if (!address || address.trim().length < 5) {
      return reply.status(400).send({ error: "address query param required (min 5 chars)" });
    }
    const results = await searchParcelsByAddress(address.trim(), county);
    return { count: results.length, results };
  }
);

// ── FEMA flood zone ───────────────────────────────────────────────────────────

app.get<{ Querystring: { lat?: string; lng?: string } }>(
  "/flood",
  async (req, reply) => {
    const lat = parseFloat(req.query.lat ?? "");
    const lng = parseFloat(req.query.lng ?? "");
    if (isNaN(lat) || isNaN(lng)) {
      return reply.status(400).send({ error: "lat and lng query params required (decimal degrees)" });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return reply.status(400).send({ error: "lat/lng out of valid range" });
    }
    return getFloodZone(lat, lng);
  }
);

// ── Comp radius search ────────────────────────────────────────────────────────

app.get<{
  Querystring: { lat?: string; lng?: string; miles?: string; county?: string };
}>(
  "/comps/radius",
  async (req, reply) => {
    const lat = parseFloat(req.query.lat ?? "");
    const lng = parseFloat(req.query.lng ?? "");
    const miles = parseFloat(req.query.miles ?? "1");
    if (isNaN(lat) || isNaN(lng)) {
      return reply.status(400).send({ error: "lat and lng query params required" });
    }
    if (miles <= 0 || miles > 50) {
      return reply.status(400).send({ error: "miles must be between 0 and 50" });
    }
    const results = await getParcelsInRadius(lat, lng, miles, req.query.county);
    return { count: results.length, results };
  }
);

// ── Geocode ───────────────────────────────────────────────────────────────────

app.get<{ Querystring: { q?: string } }>(
  "/geocode",
  async (req, reply) => {
    const q = req.query.q?.trim();
    if (!q || q.length < 5) {
      return reply.status(400).send({ error: "q query param required (min 5 chars)" });
    }
    const result = await geocodeAddress(q);
    if (!result) {
      return reply.status(404).send({ error: "Address could not be geocoded" });
    }
    return result;
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`[gis-service] Listening on port ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

})();
