/**
 * WorkfilePdf — react-pdf/renderer document for FNMA 1004 URAR.
 * Renders a print-ready single-sheet summary: Subject + Sales Comparison Grid + Reconciliation.
 * Full URAR page layout is a Gate-3 item; this is the Gate-2 appraiser-signable version.
 */
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { WorkfileDef, WorkfileComp } from '../workfile-types';

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    padding: 28,
    color: '#111',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 14,
    color: '#555',
  },
  sectionHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#1e3a5f',
    color: '#fff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 10,
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d0d7e0',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  rowAlt: {
    backgroundColor: '#f5f7fa',
  },
  label: {
    width: '38%',
    color: '#555',
  },
  value: {
    width: '62%',
    fontFamily: 'Helvetica-Bold',
    color: '#111',
  },
  // ── Comp grid ──
  compTable: {
    marginTop: 6,
  },
  compHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  compColLabel: {
    width: '22%',
    color: '#aac',
    fontSize: 7,
  },
  compColHeader: {
    width: '26%',
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    fontSize: 7,
  },
  compRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d0d7e0',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  compRowAlt: {
    backgroundColor: '#f5f7fa',
  },
  compRowLabel: {
    width: '22%',
    color: '#555',
  },
  compCell: {
    width: '26%',
    textAlign: 'right',
    paddingRight: 4,
  },
  compCellAdj: {
    color: '#555',
  },
  adjPos: {
    color: '#166534',
  },
  adjNeg: {
    color: '#991b1b',
  },
  // ── Reconciliation ──
  recRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d0d7e0',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  finalValueRow: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    borderTopColor: '#1e3a5f',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1e3a5f',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginTop: 4,
    backgroundColor: '#eff4fb',
  },
  finalLabel: {
    width: '50%',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
  },
  finalValue: {
    width: '50%',
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    textAlign: 'right',
  },
  sigBlock: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  sigLine: {
    flex: 1,
    borderTopWidth: 0.75,
    borderTopColor: '#333',
    paddingTop: 3,
    fontSize: 7,
    color: '#555',
  },
  footer: {
    marginTop: 12,
    fontSize: 6.5,
    color: '#888',
    textAlign: 'center',
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = {
  money: (v: number | null | undefined): string =>
    v != null ? '$' + v.toLocaleString('en-US') : '—',
  adj: (v: number | null | undefined): string => {
    if (v == null || v === 0) return '—';
    return (v > 0 ? '+$' : '-$') + Math.abs(v).toLocaleString('en-US');
  },
  str: (v: string | null | undefined): string => v ?? '—',
  num: (v: number | null | undefined): string => v != null ? String(v) : '—',
};

function adjStyle(v: number | null | undefined) {
  if (v == null || v === 0) return s.compCellAdj;
  return v > 0 ? s.adjPos : s.adjNeg;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  workfile: WorkfileDef;
  generatedAt?: string;
}

export function WorkfilePdf({ workfile, generatedAt }: Props) {
  const sub = workfile.subject;
  const comps = workfile.comparables ?? [];
  const rec = workfile.reconciliation;

  const c1 = comps[0] ?? null;
  const c2 = comps[1] ?? null;
  const c3 = comps[2] ?? null;

  const adjRows: Array<{ label: string; key: keyof WorkfileComp }> = [
    { label: 'Location Adj', key: 'adj_location' },
    { label: 'Site Adj', key: 'adj_site' },
    { label: 'View Adj', key: 'adj_view' },
    { label: 'Quality Adj', key: 'adj_quality' },
    { label: 'Condition Adj', key: 'adj_condition' },
    { label: 'Basement Adj', key: 'adj_bsmt' },
    { label: 'Garage Adj', key: 'adj_garage' },
    { label: 'GLA Adj', key: 'adj_gla' },
    { label: 'Other Adj', key: 'adj_other' },
  ];

  const subjectRows: Array<[string, string]> = [
    ['Address', fmt.str(sub.address)],
    ['City / State / ZIP', `${fmt.str(sub.city)}, ${fmt.str(sub.state)} ${fmt.str(sub.zip)}`],
    ['County', fmt.str(sub.county)],
    ['APN', fmt.str(sub.apn)],
    ['Tax Year / RE Taxes', `${fmt.str(sub.tax_year)} / ${fmt.money(sub.re_taxes)}`],
    ['Occupancy', fmt.str(sub.occupancy)],
    ['GLA (sq ft)', fmt.num(sub.gla)],
    ['Year Built / Eff Age', `${fmt.num(sub.year_built)} / ${fmt.num(sub.effective_age)}`],
    ['Site Area', fmt.str(sub.site_area)],
    ['Quality / Condition', `${fmt.str(sub.quality)} / ${fmt.str(sub.condition)}`],
    ['Rooms / Beds / Baths', `${fmt.num(sub.rooms)} / ${fmt.num(sub.bedrooms)} / ${fmt.num(sub.baths)}`],
    ['Basement (total/fin)', `${fmt.num(sub.bsmt_area)} / ${fmt.num(sub.bsmt_finished)}`],
    ['View', fmt.str(sub.view)],
    ['Prior Sale Price', fmt.money(sub.sale_price)],
    ['Prior Sale Date', fmt.str(sub.sale_date)],
    ['Legal Description', fmt.str(sub.legal_desc)],
  ];

  return (
    <Document
      title={`FNMA 1004 — ${sub.address ?? 'Workfile'}`}
      author={rec.appraiser_name ?? 'Appraiser'}
    >
      <Page size="LETTER" style={s.page}>
        {/* ── Header ── */}
        <Text style={s.title}>Uniform Residential Appraisal Report (FNMA 1004)</Text>
        <Text style={s.subtitle}>
          TotalForge • Valuator Pro — {generatedAt ?? new Date().toLocaleDateString('en-US')}
        </Text>

        {/* ── Subject ── */}
        <Text style={s.sectionHeader}>SUBJECT PROPERTY</Text>
        {subjectRows.map(([label, val], i) => (
          <View key={label} style={[s.row, i % 2 === 1 ? s.rowAlt : {}]}>
            <Text style={s.label}>{label}</Text>
            <Text style={s.value}>{val}</Text>
          </View>
        ))}

        {/* ── Sales Comparison Grid ── */}
        <Text style={s.sectionHeader}>SALES COMPARISON APPROACH</Text>
        <View style={s.compTable}>
          {/* Header row */}
          <View style={s.compHeaderRow}>
            <Text style={s.compColLabel}>Item</Text>
            <Text style={s.compColHeader}>Comparable 1</Text>
            <Text style={s.compColHeader}>Comparable 2</Text>
            <Text style={s.compColHeader}>Comparable 3</Text>
          </View>

          {/* Data rows */}
          {([
            ['Address', (c: WorkfileComp | null) => fmt.str(c?.address)],
            ['Sale Price', (c: WorkfileComp | null) => fmt.money(c?.sale_price)],
            ['Sale Date', (c: WorkfileComp | null) => fmt.str(c?.sale_date)],
            ['GLA (sq ft)', (c: WorkfileComp | null) => fmt.num(c?.gla)],
            ['Year Built', (c: WorkfileComp | null) => fmt.num(c?.year_built)],
            ['Quality', (c: WorkfileComp | null) => fmt.str(c?.quality)],
            ['Condition', (c: WorkfileComp | null) => fmt.str(c?.condition)],
            ['View', (c: WorkfileComp | null) => fmt.str(c?.view)],
          ] as Array<[string, (c: WorkfileComp | null) => string]>).map(([label, fn], i) => (
            <View key={label} style={[s.compRow, i % 2 === 1 ? s.compRowAlt : {}]}>
              <Text style={s.compRowLabel}>{label}</Text>
              <Text style={s.compCell}>{fn(c1)}</Text>
              <Text style={s.compCell}>{fn(c2)}</Text>
              <Text style={s.compCell}>{fn(c3)}</Text>
            </View>
          ))}

          {/* Adjustment rows */}
          {adjRows.map(({ label, key }, i) => (
            <View key={key} style={[s.compRow, (i + 8) % 2 === 1 ? s.compRowAlt : {}]}>
              <Text style={[s.compRowLabel, { color: '#444' }]}>{label}</Text>
              {[c1, c2, c3].map((c, ci) => (
                <Text
                  key={ci}
                  style={[s.compCell, adjStyle(c?.[key] as number | null)]}
                >
                  {fmt.adj(c?.[key] as number | null)}
                </Text>
              ))}
            </View>
          ))}

          {/* Net Adj */}
          <View style={[s.compRow, { backgroundColor: '#e8f0fb' }]}>
            <Text style={[s.compRowLabel, { fontFamily: 'Helvetica-Bold' }]}>Net Adjustment</Text>
            {[c1, c2, c3].map((c, ci) => (
              <Text key={ci} style={[s.compCell, adjStyle(c?.net_adj)]}>
                {fmt.adj(c?.net_adj)}
              </Text>
            ))}
          </View>

          {/* Adj Sale Price */}
          <View style={[s.compRow, { backgroundColor: '#dbe9ff' }]}>
            <Text style={[s.compRowLabel, { fontFamily: 'Helvetica-Bold' }]}>Adj. Sale Price</Text>
            {[c1, c2, c3].map((c, ci) => (
              <Text key={ci} style={[s.compCell, { fontFamily: 'Helvetica-Bold' }]}>
                {fmt.money(c?.adj_sale_price)}
              </Text>
            ))}
          </View>
        </View>

        {/* ── Reconciliation ── */}
        <Text style={s.sectionHeader}>RECONCILIATION</Text>

        <View style={s.recRow}>
          <Text style={s.label}>Effective Date</Text>
          <Text style={s.value}>{fmt.str(rec.effective_date)}</Text>
        </View>

        <View style={s.finalValueRow}>
          <Text style={s.finalLabel}>INDICATED VALUE BY SALES COMPARISON</Text>
          <Text style={s.finalValue}>{fmt.money(rec.final_value)}</Text>
        </View>

        {/* Signature block */}
        <View style={s.sigBlock}>
          <View style={s.sigLine}>
            <Text>Appraiser Signature</Text>
          </View>
          <View style={s.sigLine}>
            <Text>Date of Signature</Text>
          </View>
          <View style={s.sigLine}>
            <Text>State Cert # {fmt.str(rec.license_num)}</Text>
          </View>
        </View>
        <View style={{ marginTop: 6, flexDirection: 'row', gap: 20 }}>
          <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
            {fmt.str(rec.appraiser_name)}
          </Text>
          <Text style={{ flex: 1, fontSize: 7, color: '#555' }}>
            Print Name
          </Text>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          Freddie Mac Form 70  /  Fannie Mae Form 1004  •  This report is for internal use only pending complete URAR rendering.
        </Text>
      </Page>
    </Document>
  );
}
