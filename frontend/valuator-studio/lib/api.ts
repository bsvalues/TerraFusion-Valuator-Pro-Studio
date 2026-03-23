import axios from "axios";
import type { WorkfileDef, WorkfileRecord, WorkfileSummary } from "./workfile-types";
import type { AppraisalOrder, AppraisalOrderSummary, CreateOrderBody } from "./order-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface SubjectProperty {
  square_feet: number;
  bedrooms: number;
  bathrooms: number;
  age_years: number;
  monthly_rent: number;
}

interface ComparableSale {
  sale_price: number;
  square_feet: number;
  bedrooms: number;
  bathrooms: number;
  age_years: number;
}

interface ValuationRequest {
  subject: SubjectProperty;
  comparables: ComparableSale[];
}

interface ValuationResult {
  final_value: number;
  sales_indicator: number;
  cost_indicator: number;
  income_indicator: number;
}

export async function submitValuation(request: ValuationRequest): Promise<ValuationResult> {
  try {
    const response = await axios.post<ValuationResult>(
      `${API_BASE_URL}/api/v1/valuation/estimate`,
      request,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || "Failed to connect to valuation API"
      );
    }
    throw error;
  }
}

export async function quickEstimate(subject: SubjectProperty): Promise<ValuationResult> {
  try {
    const response = await axios.post<ValuationResult>(
      `${API_BASE_URL}/api/v1/valuation/quick`,
      subject,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || "Failed to connect to valuation API"
      );
    }
    throw error;
  }
}

export async function checkHealth(): Promise<{ status: string; version: string }> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/health`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw new Error("API service unavailable");
  }
}

// ── Workfile CRUD ─────────────────────────────────────────────────────────────

export async function listWorkfiles(): Promise<WorkfileSummary[]> {
  return (await axios.get(`${API_BASE_URL}/api/v1/workfiles`)).data;
}

export async function createWorkfile(wf: WorkfileDef): Promise<WorkfileRecord> {
  return (await axios.post(`${API_BASE_URL}/api/v1/workfiles`, wf)).data;
}

export async function getWorkfile(id: string): Promise<WorkfileRecord> {
  return (await axios.get(`${API_BASE_URL}/api/v1/workfiles/${id}`)).data;
}

export async function saveWorkfile(id: string, wf: WorkfileDef): Promise<WorkfileRecord> {
  return (await axios.put(`${API_BASE_URL}/api/v1/workfiles/${id}`, wf)).data;
}

// ── Appraisal Orders ──────────────────────────────────────────────────────────

export async function listOrders(): Promise<AppraisalOrderSummary[]> {
  return (await axios.get(`${API_BASE_URL}/api/v1/appraisals`)).data;
}

export async function createOrder(body: CreateOrderBody): Promise<AppraisalOrder> {
  return (await axios.post(`${API_BASE_URL}/api/v1/appraisals`, body)).data;
}

export async function getOrder(id: string): Promise<AppraisalOrder> {
  return (await axios.get(`${API_BASE_URL}/api/v1/appraisals/${id}`)).data;
}

export async function updateOrder(id: string, body: Partial<CreateOrderBody>): Promise<AppraisalOrder> {
  return (await axios.put(`${API_BASE_URL}/api/v1/appraisals/${id}`, body)).data;
}

// ── AI Narrative ──────────────────────────────────────────────────────────────

const AI_BASE_URL = process.env.NEXT_PUBLIC_COST_ENGINE_URL ?? "http://localhost:8084";

export interface NarrativeRequest {
  subject: {
    address?: string; city?: string; state?: string;
    gla?: number | null; year_built?: number | null;
    quality?: string | null; condition?: string | null;
    view?: string | null; site_area?: string | null;
    bedrooms?: number | null; baths?: number | null;
  };
  comparables?: Array<{
    address?: string | null;
    sale_price?: number | null;
    sale_date?: string | null;
    gla?: number | null;
    net_adj?: number | null;
    adj_sale_price?: number | null;
  }>;
  final_value?: number | null;
  effective_date?: string | null;
  section: "market_conditions" | "neighborhood" | "reconciliation";
}

export interface NarrativeResponse {
  section: string;
  text: string;
  provider: string;
  model: string | null;
}

export async function analyzeNarrative(req: NarrativeRequest): Promise<NarrativeResponse> {
  return (await axios.post(`${AI_BASE_URL}/analyze/narrative`, req)).data;
}
