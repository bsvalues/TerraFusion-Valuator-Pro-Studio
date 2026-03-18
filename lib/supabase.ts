/**
 * TerraFusion Valuator Pro — Supabase Client
 *
 * Provides a singleton Supabase client for server-side and client-side use.
 * All database operations go through this module.
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 *  NEXT_PUBLIC_SUPABASE_URL   — Project URL from Supabase dashboard
 *  NEXT_PUBLIC_SUPABASE_ANON_KEY — Anon/public key from Supabase dashboard
 *
 * SCHEMA OVERVIEW:
 *  appraisal_orders    — Order management (file number, client, status, dates)
 *  subject_contexts    — Subject property data anchored to an order
 *  analytical_runs     — Run history (cost, sales, income, reconciliation)
 *  appraiser_profiles  — Appraiser license, firm, and signature data
 *
 * GRACEFUL DEGRADATION:
 *  If Supabase env vars are not set, the client returns null and all
 *  persistence operations are silently skipped (in-memory only mode).
 *  This allows the app to run without a Supabase project during development.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Database type definitions (mirrors Supabase schema)
// ---------------------------------------------------------------------------

export interface DbAppraisalOrder {
  id: string;                     // UUID primary key
  file_number: string;            // Unique file number
  client_name: string | null;
  client_email: string | null;
  lender_name: string | null;
  loan_number: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  property_county: string | null;
  property_type: string | null;
  intended_use: string | null;
  property_rights: string | null;
  report_type: string | null;
  inspection_type: string | null;
  effective_date: string | null;
  report_date: string | null;
  due_date: string | null;
  status: string;                 // intake | analysis | draft | review | delivered
  appraiser_id: string | null;
  final_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbSubjectContext {
  id: string;
  order_id: string;               // FK → appraisal_orders.id
  file_number: string;
  context_json: Record<string, unknown>; // Full SubjectContext as JSON
  created_at: string;
  updated_at: string;
}

export interface DbAnalyticalRun {
  id: string;
  order_id: string;               // FK → appraisal_orders.id
  run_id: string;                 // Matches RunRecord.runId
  correlation_id: string;
  run_type: string;               // cost | sales_comparison | income_direct_cap | etc.
  file_number: string;
  status: string;
  reason_code: string;
  started_at: string;
  completed_at: string | null;
  input_snapshot: Record<string, unknown>;
  output_snapshot: Record<string, unknown>;
  evidence_refs: unknown[];
  narrative_ready: boolean;
  created_at: string;
}

export interface DbAppraiserProfile {
  id: string;
  user_id: string | null;         // Supabase auth user ID (optional)
  license_number: string | null;
  license_state: string | null;
  license_type: string | null;
  license_expiry: string | null;
  appraiser_name: string | null;
  appraiser_title: string | null;
  firm_name: string | null;
  firm_address: string | null;
  firm_phone: string | null;
  firm_email: string | null;
  designations: string[];
  signature_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      appraisal_orders: {
        Row: DbAppraisalOrder;
        Insert: Omit<DbAppraisalOrder, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbAppraisalOrder, "id" | "created_at">>;
      };
      subject_contexts: {
        Row: DbSubjectContext;
        Insert: Omit<DbSubjectContext, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbSubjectContext, "id" | "created_at">>;
      };
      analytical_runs: {
        Row: DbAnalyticalRun;
        Insert: Omit<DbAnalyticalRun, "id" | "created_at">;
        Update: Partial<Omit<DbAnalyticalRun, "id" | "created_at">>;
      };
      appraiser_profiles: {
        Row: DbAppraiserProfile;
        Insert: Omit<DbAppraiserProfile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbAppraiserProfile, "id" | "created_at">>;
      };
    };
  };
};

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Graceful degradation: return null when env vars not set
    return null;
  }

  if (!_client) {
    _client = createClient<Database>(url, key);
  }
  return _client;
}

// ---------------------------------------------------------------------------
// SQL migration script (run once in Supabase SQL editor)
// ---------------------------------------------------------------------------
export const SUPABASE_MIGRATION_SQL = `
-- TerraFusion Valuator Pro — Database Schema
-- Run this in the Supabase SQL editor to create all required tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Appraisal Orders
CREATE TABLE IF NOT EXISTS appraisal_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_number     TEXT NOT NULL UNIQUE,
  client_name     TEXT,
  client_email    TEXT,
  lender_name     TEXT,
  loan_number     TEXT,
  property_address TEXT,
  property_city   TEXT,
  property_state  TEXT,
  property_zip    TEXT,
  property_county TEXT,
  property_type   TEXT,
  intended_use    TEXT,
  property_rights TEXT,
  report_type     TEXT,
  inspection_type TEXT,
  effective_date  DATE,
  report_date     DATE,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'intake',
  appraiser_id    UUID,
  final_value     NUMERIC,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subject Contexts (full SubjectContext JSON per order)
CREATE TABLE IF NOT EXISTS subject_contexts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES appraisal_orders(id) ON DELETE CASCADE,
  file_number  TEXT NOT NULL,
  context_json JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytical Runs
CREATE TABLE IF NOT EXISTS analytical_runs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES appraisal_orders(id) ON DELETE CASCADE,
  run_id           TEXT NOT NULL UNIQUE,
  correlation_id   TEXT NOT NULL,
  run_type         TEXT NOT NULL,
  file_number      TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  reason_code      TEXT NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ,
  input_snapshot   JSONB NOT NULL DEFAULT '{}',
  output_snapshot  JSONB NOT NULL DEFAULT '{}',
  evidence_refs    JSONB NOT NULL DEFAULT '[]',
  narrative_ready  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appraiser Profiles
CREATE TABLE IF NOT EXISTS appraiser_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID,
  license_number   TEXT,
  license_state    TEXT,
  license_type     TEXT,
  license_expiry   DATE,
  appraiser_name   TEXT,
  appraiser_title  TEXT,
  firm_name        TEXT,
  firm_address     TEXT,
  firm_phone       TEXT,
  firm_email       TEXT,
  designations     TEXT[] NOT NULL DEFAULT '{}',
  signature_url    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_file_number ON appraisal_orders(file_number);
CREATE INDEX IF NOT EXISTS idx_runs_order_id ON analytical_runs(order_id);
CREATE INDEX IF NOT EXISTS idx_runs_run_id ON analytical_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_contexts_order_id ON subject_contexts(order_id);

-- Row Level Security (enable but allow all for now — add auth policies later)
ALTER TABLE appraisal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytical_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon users (dev mode)
-- Replace with proper auth policies for production
CREATE POLICY "allow_all_orders" ON appraisal_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contexts" ON subject_contexts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_runs" ON analytical_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_profiles" ON appraiser_profiles FOR ALL USING (true) WITH CHECK (true);
`;
