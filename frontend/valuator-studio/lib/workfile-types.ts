// TypeScript types for TotalForge WorkfileDef — mirrors Rust workfile.rs exactly.

export type UadQuality = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6';
export type UadCondition = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export type Occupancy = 'O' | 'T' | 'V';

export interface WorkfileSubject {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  legal_desc: string | null;
  apn: string;
  tax_year: string | null;
  re_taxes: number | null;
  occupancy: Occupancy | null;
  sale_price: number | null;
  sale_date: string | null;
  gla: number | null;
  year_built: number | null;
  effective_age: number | null;
  site_area: string | null;
  view: string | null;
  quality: UadQuality | null;
  condition: UadCondition | null;
  bsmt_area: number | null;
  bsmt_finished: number | null;
  rooms: number | null;
  bedrooms: number | null;
  baths: number | null;
  half_baths: number | null;
  // 1073-only (condo)
  unit_num?: string | null;
  floor?: number | null;
}

export interface WorkfileComp {
  address: string | null;
  sale_price: number | null;
  sale_date: string | null;
  gla: number | null;
  year_built: number | null;
  view: string | null;
  quality: UadQuality | null;
  condition: UadCondition | null;
  adj_location: number | null;
  adj_site: number | null;
  adj_view: number | null;
  adj_quality: number | null;
  adj_condition: number | null;
  adj_bsmt: number | null;
  adj_garage: number | null;
  adj_gla: number | null;
  adj_other: number | null;
  net_adj: number | null;
  adj_sale_price: number | null;
  // 1073-only
  floor?: number | null;
}

export interface WorkfileProject {
  project_name: string | null;
  total_units: number | null;
  owner_occ_pct: number | null;
  hoa_fee: number | null;
  hoa_includes: string | null;
}

export interface WorkfileReconciliation {
  final_value: number | null;
  effective_date: string | null;
  appraiser_name: string | null;
  license_num: string | null;
}

export interface WorkfileDef {
  id?: string;
  contract_id: string;
  subject: WorkfileSubject;
  comparables: WorkfileComp[];
  reconciliation: WorkfileReconciliation;
  project?: WorkfileProject | null;
}

export interface WorkfileRecord {
  id: string;
  contract_id: string;
  data: WorkfileDef;
  created_at: number;
  updated_at: number;
}

export interface WorkfileSummary {
  id: string;
  contract_id: string;
  address: string | null;
  updated_at: number;
}

// ── Blank factories ──────────────────────────────────────────────────────────

export function blankProject(): WorkfileProject {
  return { project_name: null, total_units: null, owner_occ_pct: null, hoa_fee: null, hoa_includes: null };
}

export function blankComp(): WorkfileComp {
  return {
    address: null, sale_price: null, sale_date: null, gla: null,
    year_built: null, view: null, quality: null, condition: null,
    adj_location: null, adj_site: null, adj_view: null, adj_quality: null,
    adj_condition: null, adj_bsmt: null, adj_garage: null, adj_gla: null,
    adj_other: null, net_adj: null, adj_sale_price: null,
  };
}

export function blankWorkfile(): WorkfileDef {
  return {
    contract_id: 'FNMA-1004',
    subject: {
      address: '', city: '', state: 'WA', zip: '', county: '',
      legal_desc: null, apn: '', tax_year: null, re_taxes: null,
      occupancy: 'O', sale_price: null, sale_date: null, gla: null,
      year_built: null, effective_age: null, site_area: null, view: null,
      quality: null, condition: null, bsmt_area: null, bsmt_finished: null,
      rooms: null, bedrooms: null, baths: null, half_baths: null,
    },
    comparables: [blankComp(), blankComp(), blankComp()],
    reconciliation: {
      final_value: null, effective_date: null,
      appraiser_name: null, license_num: null,
    },
  };
}

export function blank2055(): WorkfileDef {
  return { ...blankWorkfile(), contract_id: 'FNMA-2055' };
}

export function blank1073(): WorkfileDef {
  const base = blankWorkfile();
  return {
    ...base,
    contract_id: 'FNMA-1073',
    subject: { ...base.subject, unit_num: null, floor: null },
    project: blankProject(),
  };
}

export function computeNetAdj(comp: WorkfileComp): number {
  const fields: (keyof WorkfileComp)[] = [
    'adj_location', 'adj_site', 'adj_view', 'adj_quality',
    'adj_condition', 'adj_bsmt', 'adj_garage', 'adj_gla', 'adj_other',
  ];
  return fields.reduce((sum, k) => sum + ((comp[k] as number | null) ?? 0), 0);
}

export function computeAdjSalePrice(comp: WorkfileComp): number | null {
  if (comp.sale_price === null) return null;
  return comp.sale_price + computeNetAdj(comp);
}
