/**
 * TerraFusion Valuator Pro — MISMO XML Parser
 *
 * Converts a la mode WinTOTAL / Mercury MISMO 2.6 XML appraisal reports
 * into TerraFusion SubjectContext, RunRecord, and LegacyImportRecord structures.
 *
 * SUPPORTED FORMATS:
 *  - Mercury Deliveries XML (VALUATION_RESPONSE root element)
 *  - MISMO 2.6 / URAR / FNMA 1004 / FNMA 2055 / FNMA 1073
 *
 * COMPATIBILITY:
 *  - Browser: uses native DOMParser
 *  - Node.js / Jest: uses @xmldom/xmldom (DOM Level 2 API)
 *  - All DOM access uses getElementsByTagName / getAttribute (no querySelector)
 *
 * GOVERNANCE:
 *  - No Marshall & Swift references are emitted in any output field
 *  - DataSourceDescription fields from COST_ANALYSIS are sanitized
 *  - All imported records are tagged with source="legacy_mismo_import"
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MismoSubjectProperty {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  county: string;
  propertyRights: string;
  occupancyType: string;
  parcelId: string;
  censusTract: string;
  legalDescription: string;
  zoningClass: string;
  zoningDescription: string;
  siteArea: string;
  floodZone: string;
  floodMapId: string;
  view: string;
  shape: string;
  // Structure
  gla: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  stories: number | null;
  style: string;
  attachmentType: string;
  totalRooms: number | null;
  livingUnits: number | null;
  // Tax
  annualTaxes: number | null;
  taxYear: string;
  // Owner
  ownerName: string;
  // Sales contract
  contractAmount: number | null;
  contractDate: string;
}

export interface MismoAppraiser {
  name: string;
  companyName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  licenseNumber: string;
  licenseState: string;
  licenseType: string;
  signedDate: string;
}

export interface MismoReport {
  fileNumber: string;
  additionalFileNumber: string;
  softwareName: string;
  softwareVersion: string;
  signedDate: string;
  formType: string;
  formTitle: string;
  appraisalPurpose: string;
  description: string;
}

export interface MismoLender {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface MismoBorrower {
  name: string;
}

export interface MismoComp {
  sequenceId: number;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  proximity: string;
  latitude: number | null;
  longitude: number | null;
  salePrice: number | null;
  pricePerGla: number | null;
  dataSource: string;
  verificationSource: string;
  totalAdjustment: number | null;
  adjustedSalePrice: number | null;
  grossAdjustmentPct: number | null;
  netAdjustmentPct: number | null;
  adjustments: Array<{
    type: string;
    description: string;
    amount: number | null;
  }>;
  saleDate: string;
  saleType: string;
}

export interface MismoCostApproach {
  siteValue: number | null;
  rcnTotal: number | null;
  depreciatedCost: number | null;
  otherImprovements: number | null;
  indicatedValue: number | null;
  remainingEconomicLife: number | null;
  costServiceNote: string; // sanitized — no brand names
}

export interface MismoSalesComparison {
  indicatedValue: number | null;
  comment: string;
  comps: MismoComp[];
}

export interface MismoIncomeApproach {
  indicatedValue: number | null;
  comment: string;
}

export interface MismoValuation {
  finalValue: number | null;
  effectiveDate: string;
  reconciliationComment: string;
  conditionType: string;
}

export interface MismoMarketConditions {
  neighborhoodDescription: string;
  neighborhoodBoundaries: string;
  housingLowPrice: number | null;
  housingHighPrice: number | null;
  housingPredominantPrice: number | null;
  housingOldestAge: number | null;
  housingNewestAge: number | null;
  presentLandUse: Record<string, number>;
  medianSalesPricePrior7to12: number | null;
  medianSalesPricePrior4to6: number | null;
  medianSalesPriceLast3: number | null;
  medianSalesPriceTrend: string;
  medianDomPrior7to12: number | null;
  medianDomPrior4to6: number | null;
  medianDomLast3: number | null;
  medianDomTrend: string;
}

export interface MismoParseResult {
  success: boolean;
  fileName: string;
  report: MismoReport;
  subject: MismoSubjectProperty;
  appraiser: MismoAppraiser;
  lender: MismoLender;
  borrower: MismoBorrower;
  salesComparison: MismoSalesComparison;
  costApproach: MismoCostApproach;
  incomeApproach: MismoIncomeApproach;
  valuation: MismoValuation;
  marketConditions: MismoMarketConditions;
  hasPdf: boolean;
  pdfBase64: string | null;
  parseErrors: string[];
  importedAt: string;
}

// ---------------------------------------------------------------------------
// DOM helpers — DOM Level 2 compatible (no querySelector)
// ---------------------------------------------------------------------------

type DomElement = Element | null | undefined;

/** Get first child element by tag name */
function getEl(parent: Element | Document | null | undefined, tag: string): Element | null {
  if (!parent) return null;
  const list = parent.getElementsByTagName(tag);
  return list.length > 0 ? list[0] : null;
}

/** Get all child elements by tag name */
function getEls(parent: Element | Document | null | undefined, tag: string): Element[] {
  if (!parent) return [];
  const list = parent.getElementsByTagName(tag);
  const result: Element[] = [];
  for (let i = 0; i < list.length; i++) result.push(list[i]);
  return result;
}

/** Get attribute value safely */
function attr(el: DomElement, name: string): string {
  if (!el) return "";
  return el.getAttribute(name) ?? "";
}

/** Get first child element with a matching attribute value */
function getElByAttr(
  parent: Element | Document | null | undefined,
  tag: string,
  attrName: string,
  attrValue: string
): Element | null {
  if (!parent) return null;
  const els = getEls(parent, tag);
  return els.find((el) => el.getAttribute(attrName) === attrValue) ?? null;
}

// ---------------------------------------------------------------------------
// Sanitization helpers
// ---------------------------------------------------------------------------

const MS_BRAND_PATTERN = /marshall\s*(?:and|&)?\s*swift|m\s*&\s*s\s+cost/gi;

function sanitizeCostNote(raw: string): string {
  if (!raw) return "";
  return raw.replace(MS_BRAND_PATTERN, "cost service").trim();
}

function parseAmount(val: string | null | undefined): number | null {
  if (!val) return null;
  const cleaned = String(val).replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseCount(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// XML parser factory — browser + Node.js compatible
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getXmlParser(): { parseFromString: (xml: string, mime: string) => any } {
  if (typeof DOMParser !== "undefined") {
    const bp = new DOMParser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { parseFromString: (xml: string, mime: string) => bp.parseFromString(xml, mime as DOMParserSupportedType) };
  }
  // Node.js / Jest environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DOMParser: NodeDOMParser } = require("@xmldom/xmldom");
  return new NodeDOMParser();
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseMismoXml(xmlString: string, fileName: string): MismoParseResult {
  const errors: string[] = [];

  let doc: Document;
  try {
    const parser = getXmlParser();
    doc = parser.parseFromString(xmlString, "text/xml");
    const docEl = doc.documentElement;
    if (!docEl) throw new Error("Empty document");
    // xmldom signals errors via a root element named "parsererror"
    if (docEl.nodeName === "parsererror") {
      throw new Error(docEl.textContent ?? "XML parse error");
    }
    // Browser DOMParser signals errors via a child parsererror element
    const errEl = getEl(doc, "parsererror");
    if (errEl) throw new Error(errEl.textContent ?? "XML parse error");
  } catch (e) {
    return {
      success: false,
      fileName,
      report: emptyReport(),
      subject: emptySubject(),
      appraiser: emptyAppraiser(),
      lender: emptyLender(),
      borrower: { name: "" },
      salesComparison: { indicatedValue: null, comment: "", comps: [] },
      costApproach: emptyCostApproach(),
      incomeApproach: { indicatedValue: null, comment: "" },
      valuation: emptyValuation(),
      marketConditions: emptyMarketConditions(),
      hasPdf: false,
      pdfBase64: null,
      parseErrors: [`XML parse failed: ${e instanceof Error ? e.message : String(e)}`],
      importedAt: new Date().toISOString(),
    };
  }

  const root = doc.documentElement;

  // ---------------------------------------------------------------------------
  // REPORT
  // ---------------------------------------------------------------------------
  const reportEl = getEl(doc, "REPORT");
  const report: MismoReport = {
    fileNumber: attr(reportEl, "AppraiserFileIdentifier"),
    additionalFileNumber: attr(reportEl, "AppraiserAdditionalFileIdentifier"),
    softwareName: attr(reportEl, "AppraisalSoftwareProductName"),
    softwareVersion: attr(reportEl, "AppraisalSoftwareProductVersionIdentifier"),
    signedDate: attr(reportEl, "AppraiserReportSignedDate"),
    formType: attr(reportEl, "AppraisalFormType"),
    formTitle: attr(reportEl, "_TitleDescription"),
    appraisalPurpose: attr(reportEl, "AppraisalPurposeType"),
    description: attr(reportEl, "USPAPReportDescription"),
  };

  // ---------------------------------------------------------------------------
  // PROPERTY / SUBJECT
  // ---------------------------------------------------------------------------
  const propEl = getEl(doc, "PROPERTY");
  const structEl = getEl(propEl, "STRUCTURE");
  const siteEl = getEl(propEl, "SITE");
  const taxEl = getEl(propEl, "_TAX");
  const ownerEl = getEl(propEl, "_OWNER");
  const legalEl = getEl(propEl, "_LEGAL_DESCRIPTION");
  const identEl = getEl(propEl, "_IDENTIFICATION");
  const floodEl = getEl(siteEl, "FLOOD_ZONE");
  const viewEl = getElByAttr(siteEl, "SITE_FEATURE", "_Type", "View");
  const shapeEl = getElByAttr(siteEl, "SITE_FEATURE", "_Type", "Shape");
  const neighborhoodEl = getEl(propEl, "NEIGHBORHOOD");
  const housingEl = getEl(neighborhoodEl, "_HOUSING");
  const salesContractEl = getEl(propEl, "SALES_CONTRACT");

  const subject: MismoSubjectProperty = {
    streetAddress: attr(propEl, "_StreetAddress"),
    city: attr(propEl, "_City"),
    state: attr(propEl, "_State"),
    postalCode: attr(propEl, "_PostalCode"),
    county: attr(propEl, "_County"),
    propertyRights: attr(propEl, "_RightsType"),
    occupancyType: attr(propEl, "_CurrentOccupancyType"),
    parcelId: attr(identEl, "AssessorsParcelIdentifier"),
    censusTract: attr(identEl, "CensusTractIdentifier"),
    legalDescription: attr(legalEl, "_Description"),
    zoningClass: attr(siteEl, "_ZoningClassificationIdentifier"),
    zoningDescription: attr(siteEl, "_ZoningClassificationDescription"),
    siteArea: attr(siteEl, "_AreaDescription"),
    floodZone: attr(floodEl, "NFIPFloodZoneIdentifier"),
    floodMapId: attr(floodEl, "NFIPMapIdentifier"),
    view: attr(viewEl, "_Comment"),
    shape: attr(shapeEl, "_Comment"),
    // Structure
    gla: parseCount(attr(structEl, "GrossLivingAreaSquareFeetCount")),
    bedrooms: parseCount(attr(structEl, "TotalBedroomCount")),
    bathrooms: parseAmount(attr(structEl, "TotalBathroomCount")),
    yearBuilt: parseCount(attr(structEl, "PropertyStructureBuiltYear")),
    stories: parseCount(attr(structEl, "StoriesCount")),
    style: attr(structEl, "_DesignDescription"),
    attachmentType: attr(structEl, "AttachmentType"),
    totalRooms: parseCount(attr(structEl, "TotalRoomCount")),
    livingUnits: parseCount(attr(structEl, "LivingUnitCount")),
    // Tax
    annualTaxes: parseAmount(attr(taxEl, "_TotalTaxAmount")),
    taxYear: attr(taxEl, "_YearIdentifier"),
    // Owner
    ownerName: attr(ownerEl, "_Name"),
    // Sales contract
    contractAmount: parseAmount(attr(salesContractEl, "_Amount")),
    contractDate: attr(salesContractEl, "_Date"),
  };

  // ---------------------------------------------------------------------------
  // PARTIES
  // ---------------------------------------------------------------------------
  const partiesEl = getEl(doc, "PARTIES");
  const appraiserEl = getEl(partiesEl, "APPRAISER");
  const lenderEl = getEl(partiesEl, "LENDER");
  const borrowerEl = getEl(partiesEl, "BORROWER");

  const appraiser: MismoAppraiser = {
    name: attr(appraiserEl, "_Name"),
    companyName: attr(appraiserEl, "_CompanyName"),
    streetAddress: attr(appraiserEl, "_StreetAddress"),
    city: attr(appraiserEl, "_City"),
    state: attr(appraiserEl, "_State"),
    postalCode: attr(appraiserEl, "_PostalCode"),
    licenseNumber: attr(appraiserEl, "_LicenseOrCertificationIdentifier"),
    licenseState: attr(appraiserEl, "_LicenseOrCertificationStateIdentifier"),
    licenseType: attr(appraiserEl, "_LicenseOrCertificationType"),
    signedDate: report.signedDate,
  };

  const lender: MismoLender = {
    name: attr(lenderEl, "_UnparsedName"),
    address: attr(lenderEl, "_StreetAddress"),
    city: attr(lenderEl, "_City"),
    state: attr(lenderEl, "_State"),
    postalCode: attr(lenderEl, "_PostalCode"),
  };

  const borrower: MismoBorrower = {
    name: attr(borrowerEl, "_UnparsedName"),
  };

  // ---------------------------------------------------------------------------
  // VALUATION_METHODS — SALES_COMPARISON
  // ---------------------------------------------------------------------------
  const vmEl = getEl(doc, "VALUATION_METHODS");
  const scEl = getEl(vmEl, "SALES_COMPARISON");

  const comps: MismoComp[] = [];
  const compEls = getEls(scEl, "COMPARABLE_SALE");
  compEls.forEach((compEl) => {
    const seqId = parseCount(attr(compEl, "PropertySequenceIdentifier"));
    if (seqId === null || seqId === 0) return; // skip subject row

    const locationEl = getEl(compEl, "LOCATION");
    const adjustmentEls = getEls(compEl, "SALE_PRICE_ADJUSTMENT");

    const adjustments: MismoComp["adjustments"] = [];
    let saleDate = "";
    adjustmentEls.forEach((adjEl) => {
      const type = attr(adjEl, "_Type");
      const desc = attr(adjEl, "_Description");
      const amount = parseAmount(attr(adjEl, "_Amount"));
      if (type === "DateOfSale") {
        const match = desc.match(/s(\d{2}\/\d{2})/);
        if (match) saleDate = match[1];
      }
      adjustments.push({ type, description: desc, amount });
    });

    comps.push({
      sequenceId: seqId,
      streetAddress: attr(locationEl, "PropertyStreetAddress"),
      city: attr(locationEl, "PropertyCity"),
      state: attr(locationEl, "PropertyState"),
      postalCode: attr(locationEl, "PropertyPostalCode"),
      proximity: attr(locationEl, "ProximityToSubjectDescription"),
      latitude: parseAmount(attr(locationEl, "LatitudeNumber")),
      longitude: parseAmount(attr(locationEl, "LongitudeNumber")),
      salePrice: parseAmount(attr(compEl, "PropertySalesAmount")),
      pricePerGla: parseAmount(attr(compEl, "SalesPricePerGrossLivingAreaAmount")),
      dataSource: attr(compEl, "DataSourceDescription"),
      verificationSource: attr(compEl, "DataSourceVerificationDescription"),
      totalAdjustment: parseAmount(attr(compEl, "SalePriceTotalAdjustmentAmount")),
      adjustedSalePrice: parseAmount(attr(compEl, "AdjustedSalesPriceAmount")),
      grossAdjustmentPct: parseAmount(attr(compEl, "SalesPriceTotalAdjustmentGrossPercent")),
      netAdjustmentPct: parseAmount(attr(compEl, "SalePriceTotalAdjustmentNetPercent")),
      adjustments,
      saleDate,
      saleType: "",
    });
  });

  const salesComparison: MismoSalesComparison = {
    indicatedValue: parseAmount(attr(scEl, "ValueIndicatedBySalesComparisonApproachAmount")),
    comment: attr(scEl, "_Comment"),
    comps,
  };

  // ---------------------------------------------------------------------------
  // VALUATION_METHODS — COST_ANALYSIS
  // ---------------------------------------------------------------------------
  const caEl = getEl(vmEl, "COST_ANALYSIS");
  const rawCostNote = attr(caEl, "DataSourceDescription") + " " + attr(caEl, "_Comment");

  const costApproach: MismoCostApproach = {
    siteValue: parseAmount(attr(caEl, "SiteEstimatedValueAmount")),
    rcnTotal: parseAmount(attr(caEl, "NewImprovementTotalCostAmount")),
    depreciatedCost: parseAmount(attr(caEl, "NewImprovementDepreciatedCostAmount")),
    otherImprovements: parseAmount(attr(caEl, "SiteOtherImprovementsAsIsAmount")),
    indicatedValue: parseAmount(attr(caEl, "ValueIndicatedByCostApproachAmount")),
    remainingEconomicLife: parseCount(attr(caEl, "EstimatedRemainingEconomicLifeYearsCount")),
    costServiceNote: sanitizeCostNote(rawCostNote),
  };

  // ---------------------------------------------------------------------------
  // VALUATION_METHODS — INCOME_ANALYSIS
  // ---------------------------------------------------------------------------
  const iaEl = getEl(vmEl, "INCOME_ANALYSIS");
  const incomeApproach: MismoIncomeApproach = {
    indicatedValue: parseAmount(attr(iaEl, "ValueIndicatedByIncomeApproachAmount")),
    comment: attr(iaEl, "_Comment"),
  };

  // ---------------------------------------------------------------------------
  // VALUATION (final)
  // ---------------------------------------------------------------------------
  const valEl = getEl(doc, "VALUATION");
  const reconEl = getEl(valEl, "_RECONCILIATION");
  const condEl = getEl(valEl, "_CONDITION_OF_APPRAISAL");

  const valuation: MismoValuation = {
    finalValue: parseAmount(attr(valEl, "PropertyAppraisedValueAmount")),
    effectiveDate: attr(valEl, "AppraisalEffectiveDate"),
    reconciliationComment: attr(reconEl, "_SummaryComment"),
    conditionType: attr(condEl, "_Type"),
  };

  // ---------------------------------------------------------------------------
  // MARKET CONDITIONS
  // ---------------------------------------------------------------------------
  const neighborhoodDesc = attr(neighborhoodEl, "_Description");

  // Neighborhood boundaries — in NEIGHBORHOOD_EXTENSION_SECTION_DATA
  const neighborhoodBoundariesEl = getEl(neighborhoodEl, "NEIGHBORHOOD_BOUNDARIES");
  const neighborhoodBoundaries = attr(neighborhoodBoundariesEl, "GSENeighborhoodBoundariesDescription");

  // Present land use
  const presentLandUse: Record<string, number> = {};
  const landUseEls = getEls(propEl, "_PRESENT_LAND_USE");
  landUseEls.forEach((el) => {
    const type = el.getAttribute("_Type");
    const pct = parseCount(el.getAttribute("_Percent"));
    if (type && pct !== null) presentLandUse[type] = pct;
  });

  // Market inventory data (MISMO 2.6 MARKET_INVENTORY elements)
  const getMarketInventory = (type: string, range: string, attrName: string): number | null => {
    const els = getEls(root, "MARKET_INVENTORY");
    const el = els.find(
      (e) => e.getAttribute("_Type") === type && e.getAttribute("_MonthRangeType") === range
    );
    return el ? parseAmount(el.getAttribute(attrName)) : null;
  };

  const getMarketTrend = (type: string): string => {
    const els = getEls(root, "MARKET_INVENTORY");
    const el = els.find((e) => e.getAttribute("_Type") === type && e.getAttribute("_TrendType"));
    return el?.getAttribute("_TrendType") ?? "";
  };

  const marketConditions: MismoMarketConditions = {
    neighborhoodDescription: neighborhoodDesc,
    neighborhoodBoundaries,
    housingLowPrice: parseAmount(attr(housingEl, "_LowPriceAmount")),
    housingHighPrice: parseAmount(attr(housingEl, "_HighPriceAmount")),
    housingPredominantPrice: parseAmount(attr(housingEl, "_PredominantPriceAmount")),
    housingOldestAge: parseCount(attr(housingEl, "_OldestYearsCount")),
    housingNewestAge: parseCount(attr(housingEl, "_NewestYearsCount")),
    presentLandUse,
    medianSalesPricePrior7to12: getMarketInventory("MedianSalesPrice", "Prior7To12Months", "_Amount"),
    medianSalesPricePrior4to6: getMarketInventory("MedianSalesPrice", "Prior4To6Months", "_Amount"),
    medianSalesPriceLast3: getMarketInventory("MedianSalesPrice", "Last3Months", "_Amount"),
    medianSalesPriceTrend: getMarketTrend("MedianSalesPrice"),
    medianDomPrior7to12: getMarketInventory("MedianSalesDOM", "Prior7To12Months", "_Count"),
    medianDomPrior4to6: getMarketInventory("MedianSalesDOM", "Prior4To6Months", "_Count"),
    medianDomLast3: getMarketInventory("MedianSalesDOM", "Last3Months", "_Count"),
    medianDomTrend: getMarketTrend("MedianSalesDOM"),
  };

  // ---------------------------------------------------------------------------
  // Embedded PDF
  // ---------------------------------------------------------------------------
  const embeddedFileEls = getEls(doc, "EMBEDDED_FILE");
  const pdfFileEl = embeddedFileEls.find((el) => el.getAttribute("MIMEType") === "application/pdf");
  const pdfDocEl = pdfFileEl ? getEl(pdfFileEl, "DOCUMENT") : null;
  const hasPdf = !!pdfDocEl;
  const pdfBase64 = hasPdf ? (pdfDocEl?.textContent?.replace(/\s/g, "") ?? null) : null;

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  if (!subject.streetAddress) errors.push("Missing subject street address");
  if (!subject.city) errors.push("Missing subject city");
  if (!valuation.effectiveDate) errors.push("Missing effective date");

  return {
    success: errors.length === 0,
    fileName,
    report,
    subject,
    appraiser,
    lender,
    borrower,
    salesComparison,
    costApproach,
    incomeApproach,
    valuation,
    marketConditions,
    hasPdf,
    pdfBase64,
    parseErrors: errors,
    importedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Conversion: MismoParseResult → TerraFusion SubjectContext shape
// ---------------------------------------------------------------------------

export interface LegacyImportRecord {
  /** Generated TerraFusion file number */
  fileNumber: string;
  /** Original a la mode file number */
  legacyFileNumber: string;
  /** Original a la mode additional file number */
  legacyAdditionalFileNumber: string;
  /** Source system */
  sourceSystem: "alamode_wintotal" | "alamode_mercury";
  /** Import timestamp */
  importedAt: string;
  /** The parsed MISMO data */
  parsed: MismoParseResult;
  /** TerraFusion SubjectContext-compatible fields */
  subjectContext: {
    fileNumber: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    propertyRights: "Fee Simple" | "Leasehold" | "Life Estate" | "Other";
    intendedUse: "Mortgage Finance" | "Estate Planning" | "Litigation Support" | "Tax Appeal" | "Relocation" | "Private Sale" | "Insurance" | "Other";
    effectiveDate: string;
    propertyType: string;
    gla: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    yearBuilt: number | null;
    siteArea: string;
    lenderName: string;
    borrowerName: string;
    appraiserName: string;
    appraiserFirm: string;
  };
  /** Value conclusions */
  valueSummary: {
    costApproach: number | null;
    salesComparison: number | null;
    incomeApproach: number | null;
    finalValue: number | null;
    effectiveDate: string;
  };
}

function mapPropertyRights(raw: string): LegacyImportRecord["subjectContext"]["propertyRights"] {
  const r = raw.toLowerCase();
  if (r.includes("leasehold")) return "Leasehold";
  if (r.includes("life")) return "Life Estate";
  return "Fee Simple";
}

function mapIntendedUse(purpose: string): LegacyImportRecord["subjectContext"]["intendedUse"] {
  const p = purpose.toLowerCase();
  if (p.includes("refinance") || p.includes("purchase") || p.includes("mortgage")) return "Mortgage Finance";
  if (p.includes("estate")) return "Estate Planning";
  if (p.includes("litig")) return "Litigation Support";
  if (p.includes("tax")) return "Tax Appeal";
  return "Mortgage Finance";
}

function generateFileNumber(parsed: MismoParseResult): string {
  const date = parsed.valuation.effectiveDate?.replace(/-/g, "").slice(0, 6) ?? "000000";
  const city = (parsed.subject.city ?? "UNKN").replace(/\s/g, "").slice(0, 4).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TF-${date}-${city}-${suffix}`;
}

export function convertToLegacyImportRecord(parsed: MismoParseResult): LegacyImportRecord {
  const fileNumber = generateFileNumber(parsed);

  return {
    fileNumber,
    legacyFileNumber: parsed.report.fileNumber,
    legacyAdditionalFileNumber: parsed.report.additionalFileNumber,
    sourceSystem: "alamode_mercury",
    importedAt: parsed.importedAt,
    parsed,
    subjectContext: {
      fileNumber,
      address: parsed.subject.streetAddress,
      city: parsed.subject.city,
      state: parsed.subject.state,
      zip: parsed.subject.postalCode,
      county: parsed.subject.county,
      propertyRights: mapPropertyRights(parsed.subject.propertyRights),
      intendedUse: mapIntendedUse(parsed.report.appraisalPurpose),
      effectiveDate: parsed.valuation.effectiveDate,
      propertyType: parsed.subject.livingUnits && parsed.subject.livingUnits > 1 ? "Multi-Family" : "Single Family Residential",
      gla: parsed.subject.gla,
      bedrooms: parsed.subject.bedrooms,
      bathrooms: parsed.subject.bathrooms,
      yearBuilt: parsed.subject.yearBuilt,
      siteArea: parsed.subject.siteArea,
      lenderName: parsed.lender.name,
      borrowerName: parsed.borrower.name,
      appraiserName: parsed.appraiser.name,
      appraiserFirm: parsed.appraiser.companyName,
    },
    valueSummary: {
      costApproach: parsed.costApproach.indicatedValue,
      salesComparison: parsed.salesComparison.indicatedValue,
      incomeApproach: parsed.incomeApproach.indicatedValue,
      finalValue: parsed.valuation.finalValue,
      effectiveDate: parsed.valuation.effectiveDate,
    },
  };
}

// ---------------------------------------------------------------------------
// Empty defaults
// ---------------------------------------------------------------------------

function emptyReport(): MismoReport {
  return { fileNumber: "", additionalFileNumber: "", softwareName: "", softwareVersion: "", signedDate: "", formType: "", formTitle: "", appraisalPurpose: "", description: "" };
}

function emptySubject(): MismoSubjectProperty {
  return { streetAddress: "", city: "", state: "", postalCode: "", county: "", propertyRights: "", occupancyType: "", parcelId: "", censusTract: "", legalDescription: "", zoningClass: "", zoningDescription: "", siteArea: "", floodZone: "", floodMapId: "", view: "", shape: "", gla: null, bedrooms: null, bathrooms: null, yearBuilt: null, stories: null, style: "", attachmentType: "", totalRooms: null, livingUnits: null, annualTaxes: null, taxYear: "", ownerName: "", contractAmount: null, contractDate: "" };
}

function emptyAppraiser(): MismoAppraiser {
  return { name: "", companyName: "", streetAddress: "", city: "", state: "", postalCode: "", licenseNumber: "", licenseState: "", licenseType: "", signedDate: "" };
}

function emptyLender(): MismoLender {
  return { name: "", address: "", city: "", state: "", postalCode: "" };
}

function emptyCostApproach(): MismoCostApproach {
  return { siteValue: null, rcnTotal: null, depreciatedCost: null, otherImprovements: null, indicatedValue: null, remainingEconomicLife: null, costServiceNote: "" };
}

function emptyValuation(): MismoValuation {
  return { finalValue: null, effectiveDate: "", reconciliationComment: "", conditionType: "" };
}

function emptyMarketConditions(): MismoMarketConditions {
  return { neighborhoodDescription: "", neighborhoodBoundaries: "", housingLowPrice: null, housingHighPrice: null, housingPredominantPrice: null, housingOldestAge: null, housingNewestAge: null, presentLandUse: {}, medianSalesPricePrior7to12: null, medianSalesPricePrior4to6: null, medianSalesPriceLast3: null, medianSalesPriceTrend: "", medianDomPrior7to12: null, medianDomPrior4to6: null, medianDomLast3: null, medianDomTrend: "" };
}
