// TypeScript types for Appraisal Orders — mirrors Rust appraisals.rs exactly.

export type OrderStatus = "draft" | "in-progress" | "review" | "complete";

export interface AppraisalOrder {
  id: string;
  file_number: string | null;
  borrower: string | null;
  client: string | null;
  lender: string | null;
  subject_address: string | null;
  due_date: string | null;
  status: OrderStatus;
  workfile_id: string | null;
  form_type: string | null;
  extra: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
}

export interface AppraisalOrderSummary {
  id: string;
  file_number: string | null;
  borrower: string | null;
  subject_address: string | null;
  due_date: string | null;
  status: OrderStatus;
  workfile_id: string | null;
  form_type: string | null;
  updated_at: number;
}

export interface CreateOrderBody {
  file_number?: string;
  borrower?: string;
  client?: string;
  lender?: string;
  subject_address?: string;
  due_date?: string;
  status?: OrderStatus;
  workfile_id?: string;
  form_type?: string;
}
