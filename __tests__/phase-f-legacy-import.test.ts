/**
 * TerraFusion Valuator Pro — Phase F: Legacy Import Test Suite
 *
 * 30 tests covering:
 *  - MISMO XML parser (field extraction, type coercion, error handling)
 *  - M&S brand sanitization
 *  - LegacyImportRecord conversion
 *  - SubjectContext field mapping
 *  - Edge cases (missing fields, malformed XML, non-MISMO files)
 */

import {
  parseMismoXml,
  convertToLegacyImportRecord,
  type MismoParseResult,
} from "../lib/mismo-parser";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const SAMPLE_MISMO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<VALUATION_RESPONSE>
  <REPORT
    USPAPReportDescription="123 Main St, Richland, WA"
    AppraiserFileIdentifier="2108917678"
    AppraiserAdditionalFileIdentifier="562-3104019"
    AppraisalSoftwareProductName="a la mode - TOTAL"
    AppraisalSoftwareProductVersionIdentifier="6.251"
    AppraiserReportSignedDate="2021-10-19"
    AppraisalFormType="FNM1004"
    _TitleDescription="Uniform Residential Appraisal Report"
    AppraisalPurposeType="Refinance"
  />
  <PARTIES>
    <APPRAISER
      _Name="William J Spencer"
      _CompanyName="Spencer Appraisal Service Inc"
      _StreetAddress="535 Meadows Dr South"
      _City="Richland"
      _State="WA"
      _PostalCode="99352"
      _LicenseOrCertificationIdentifier="WA-12345"
      _LicenseOrCertificationStateIdentifier="WA"
    />
    <SUPERVISOR _Name="" _CompanyName="" _StreetAddress="" _City="" _State="" _PostalCode="" />
    <REVIEW_APPRAISER />
    <REAL_ESTATE_AGENT />
    <LENDER
      _UnparsedName="Carrington Mortgage Services LLC"
      _StreetAddress="1600 South Douglass Rd"
      _City="Anaheim"
      _State="CA"
      _PostalCode="92806"
    />
    <BORROWER _UnparsedName="Hernandez, Ruben" />
    <MANAGEMENT_COMPANY_EXTENSION />
  </PARTIES>
  <PROPERTY
    _StreetAddress="123 Main St"
    _City="Richland"
    _State="WA"
    _PostalCode="99352"
    _County="Benton"
    _CurrentOccupancyType="OwnerOccupied"
    _RightsType="FeeSimple"
  >
    <_IDENTIFICATION AssessorsParcelIdentifier="1-234-567-890" CensusTractIdentifier="9203.00" />
    <_LEGAL_DESCRIPTION _Description="Lot 12, Block 3, Sunrise Estates" />
    <STRUCTURE
      LivingUnitCount="1"
      StoriesCount="2"
      AttachmentType="Detached"
      _DesignDescription="Traditional"
      PropertyStructureBuiltYear="2006"
      TotalRoomCount="6"
      TotalBedroomCount="3"
      TotalBathroomCount="2.1"
      GrossLivingAreaSquareFeetCount="1893"
    />
    <SITE
      _DimensionsDescription="See plat map"
      _AreaDescription="7654 sf"
      _ZoningClassificationIdentifier="SFR"
      _ZoningClassificationDescription="Single Family Residential"
      _ZoningComplianceType="Legal"
      HighestBestUseIndicator="Y"
    >
      <SITE_FEATURE _Type="View" _Comment="N;Res;" />
      <SITE_FEATURE _Type="Shape" _Comment="Rectangular" />
      <FLOOD_ZONE SpecialFloodHazardAreaIndicator="N" NFIPFloodZoneIdentifier="C" NFIPMapIdentifier="5301950445B" />
    </SITE>
    <NEIGHBORHOOD _Description="Established residential neighborhood with good access to amenities.">
      <_HOUSING _LowPriceAmount="100" _HighPriceAmount="900" _PredominantPriceAmount="400" _OldestYearsCount="70" _NewestYearsCount="0" />
      <_PRESENT_LAND_USE _Type="SingleFamily" _Percent="70" />
      <_PRESENT_LAND_USE _Type="Commercial" _Percent="15" />
      <NEIGHBORHOOD_EXTENSION>
        <NEIGHBORHOOD_EXTENSION_SECTION ExtensionSectionOrganizationName="UNIFORM APPRAISAL DATASET">
          <NEIGHBORHOOD_EXTENSION_SECTION_DATA>
            <NEIGHBORHOOD_BOUNDARIES GSENeighborhoodBoundariesDescription="HWY 12 TO THE NORTH" />
          </NEIGHBORHOOD_EXTENSION_SECTION_DATA>
        </NEIGHBORHOOD_EXTENSION_SECTION>
      </NEIGHBORHOOD_EXTENSION>
    </NEIGHBORHOOD>
    <_TAX _YearIdentifier="2021" _TotalTaxAmount="3,728" />
    <_OWNER _Name="Hernandez, Ruben A" />
    <SALES_CONTRACT _Amount="" _Date="" />
  </PROPERTY>
  <VALUATION_METHODS>
    <COST_ANALYSIS
      _Type="Replacement"
      DataSourceDescription="cost service"
      _Comment="The cost service was used for the cost approach to value."
      SiteEstimatedValueAmount="95000"
      NewImprovementTotalCostAmount="391793"
      NewImprovementDepreciatedCostAmount="382586"
      SiteOtherImprovementsAsIsAmount="1500"
      ValueIndicatedByCostApproachAmount="479086"
      EstimatedRemainingEconomicLifeYearsCount="83"
    />
    <SALES_COMPARISON
      ValueIndicatedBySalesComparisonApproachAmount="420000"
      _Comment="See attached addenda."
    >
      <COMPARABLE_SALE PropertySequenceIdentifier="0" PropertySalesAmount="" SalesPricePerGrossLivingAreaAmount="" />
      <COMPARABLE_SALE
        PropertySequenceIdentifier="1"
        PropertySalesAmount="418000"
        SalesPricePerGrossLivingAreaAmount="233.78"
        DataSourceDescription="WWMLS#1767349;DOM 3"
        DataSourceVerificationDescription="WallaWallaCoAssr#141755"
        SalePriceTotalAdjustmentAmount="12845"
        AdjustedSalesPriceAmount="430845"
        SalesPriceTotalAdjustmentGrossPercent="3.2"
        SalePriceTotalAdjustmentNetPercent="3.1"
      >
        <LOCATION
          LatitudeNumber="46.0507686"
          LongitudeNumber="-118.3923265"
          PropertyStreetAddress="163 NW Destito Ct"
          PropertyCity="College Place"
          PropertyState="WA"
          PropertyPostalCode="99324"
          ProximityToSubjectDescription="0.86 miles W"
        />
        <SALE_PRICE_ADJUSTMENT _Type="DateOfSale" _Description="s06/21;c05/21" _Amount="+6270" />
        <SALE_PRICE_ADJUSTMENT _Type="Location" _Description="N;Res;" _Amount="" />
        <SALE_PRICE_ADJUSTMENT _Type="GrossLivingArea" _Description="1893" _Amount="-5000" />
      </COMPARABLE_SALE>
      <COMPARABLE_SALE
        PropertySequenceIdentifier="2"
        PropertySalesAmount="395000"
        SalesPricePerGrossLivingAreaAmount="215.00"
        DataSourceDescription="WWMLS#1800000"
        SalePriceTotalAdjustmentAmount="-5000"
        AdjustedSalesPriceAmount="390000"
        SalesPriceTotalAdjustmentGrossPercent="1.3"
        SalePriceTotalAdjustmentNetPercent="-1.3"
      >
        <LOCATION
          PropertyStreetAddress="456 Oak Ave"
          PropertyCity="Richland"
          PropertyState="WA"
          PropertyPostalCode="99352"
          ProximityToSubjectDescription="0.5 miles N"
        />
        <SALE_PRICE_ADJUSTMENT _Type="DateOfSale" _Description="s03/21;c02/21" _Amount="+3000" />
      </COMPARABLE_SALE>
    </SALES_COMPARISON>
    <INCOME_ANALYSIS
      ValueIndicatedByIncomeApproachAmount="410000"
      _Comment="Income approach used as secondary indicator."
    />
  </VALUATION_METHODS>
  <VALUATION PropertyAppraisedValueAmount="420000" AppraisalEffectiveDate="2021-10-19">
    <_RECONCILIATION
      _SummaryComment="Final value based on sales comparison approach."
      _ConditionsComment="As is appraisal"
    >
      <_CONDITION_OF_APPRAISAL _Type="AsIs" />
    </_RECONCILIATION>
  </VALUATION>
</VALUATION_RESPONSE>`;

const MISMO_WITH_MS_REFERENCE = SAMPLE_MISMO_XML.replace(
  'DataSourceDescription="cost service"',
  'DataSourceDescription="Marshall and Swift ( residential estimator)"'
).replace(
  '_Comment="The cost service was used for the cost approach to value."',
  '_Comment="The Marshall and Swift Cost service was used for the cost approach to value."'
);

const MALFORMED_XML = `<VALUATION_RESPONSE><UNCLOSED_TAG>`;

const NON_MISMO_XML = `<?xml version="1.0"?><root><item>Not an appraisal</item></root>`;

// ---------------------------------------------------------------------------
// Helper: parse the sample XML
// ---------------------------------------------------------------------------
function parseSample(): MismoParseResult {
  return parseMismoXml(SAMPLE_MISMO_XML, "123 Main St, Richland, WA.xml");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Phase F — MISMO XML Parser", () => {
  // -------------------------------------------------------------------------
  // 1. Basic parse success
  // -------------------------------------------------------------------------
  test("1. parseMismoXml returns success=true for valid MISMO XML", () => {
    const result = parseSample();
    expect(result.success).toBe(true);
    expect(result.parseErrors).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 2. REPORT section
  // -------------------------------------------------------------------------
  test("2. Extracts REPORT file number correctly", () => {
    const result = parseSample();
    expect(result.report.fileNumber).toBe("2108917678");
  });

  test("3. Extracts REPORT additional file number", () => {
    const result = parseSample();
    expect(result.report.additionalFileNumber).toBe("562-3104019");
  });

  test("4. Extracts REPORT form type and purpose", () => {
    const result = parseSample();
    expect(result.report.formType).toBe("FNM1004");
    expect(result.report.appraisalPurpose).toBe("Refinance");
  });

  test("5. Extracts REPORT signed date", () => {
    const result = parseSample();
    expect(result.report.signedDate).toBe("2021-10-19");
  });

  // -------------------------------------------------------------------------
  // 3. PROPERTY / SUBJECT section
  // -------------------------------------------------------------------------
  test("6. Extracts subject street address", () => {
    const result = parseSample();
    expect(result.subject.streetAddress).toBe("123 Main St");
  });

  test("7. Extracts subject city, state, zip, county", () => {
    const result = parseSample();
    expect(result.subject.city).toBe("Richland");
    expect(result.subject.state).toBe("WA");
    expect(result.subject.postalCode).toBe("99352");
    expect(result.subject.county).toBe("Benton");
  });

  test("8. Extracts STRUCTURE GLA as number", () => {
    const result = parseSample();
    expect(result.subject.gla).toBe(1893);
  });

  test("9. Extracts bedrooms and bathrooms", () => {
    const result = parseSample();
    expect(result.subject.bedrooms).toBe(3);
    expect(result.subject.bathrooms).toBe(2.1);
  });

  test("10. Extracts year built", () => {
    const result = parseSample();
    expect(result.subject.yearBuilt).toBe(2006);
  });

  test("11. Extracts stories count", () => {
    const result = parseSample();
    expect(result.subject.stories).toBe(2);
  });

  test("12. Extracts site area description", () => {
    const result = parseSample();
    expect(result.subject.siteArea).toBe("7654 sf");
  });

  test("13. Extracts flood zone identifier", () => {
    const result = parseSample();
    expect(result.subject.floodZone).toBe("C");
  });

  test("14. Extracts parcel ID and census tract", () => {
    const result = parseSample();
    expect(result.subject.parcelId).toBe("1-234-567-890");
    expect(result.subject.censusTract).toBe("9203.00");
  });

  test("15. Extracts annual taxes as number", () => {
    const result = parseSample();
    expect(result.subject.annualTaxes).toBe(3728);
  });

  // -------------------------------------------------------------------------
  // 4. PARTIES section
  // -------------------------------------------------------------------------
  test("16. Extracts appraiser name and company", () => {
    const result = parseSample();
    expect(result.appraiser.name).toBe("William J Spencer");
    expect(result.appraiser.companyName).toBe("Spencer Appraisal Service Inc");
  });

  test("17. Extracts lender name", () => {
    const result = parseSample();
    expect(result.lender.name).toBe("Carrington Mortgage Services LLC");
  });

  test("18. Extracts borrower name", () => {
    const result = parseSample();
    expect(result.borrower.name).toBe("Hernandez, Ruben");
  });

  // -------------------------------------------------------------------------
  // 5. VALUATION_METHODS — Sales Comparison
  // -------------------------------------------------------------------------
  test("19. Extracts sales comparison indicated value", () => {
    const result = parseSample();
    expect(result.salesComparison.indicatedValue).toBe(420000);
  });

  test("20. Extracts comp 1 sale price and adjusted price", () => {
    const result = parseSample();
    const comp1 = result.salesComparison.comps.find((c) => c.sequenceId === 1);
    expect(comp1).toBeDefined();
    expect(comp1!.salePrice).toBe(418000);
    expect(comp1!.adjustedSalePrice).toBe(430845);
  });

  test("21. Extracts comp 1 address and proximity", () => {
    const result = parseSample();
    const comp1 = result.salesComparison.comps.find((c) => c.sequenceId === 1);
    expect(comp1!.streetAddress).toBe("163 NW Destito Ct");
    expect(comp1!.city).toBe("College Place");
    expect(comp1!.proximity).toBe("0.86 miles W");
  });

  test("22. Extracts comp 1 lat/lon coordinates", () => {
    const result = parseSample();
    const comp1 = result.salesComparison.comps.find((c) => c.sequenceId === 1);
    expect(comp1!.latitude).toBeCloseTo(46.0507686);
    expect(comp1!.longitude).toBeCloseTo(-118.3923265);
  });

  test("23. Extracts comp adjustments array", () => {
    const result = parseSample();
    const comp1 = result.salesComparison.comps.find((c) => c.sequenceId === 1);
    expect(comp1!.adjustments.length).toBeGreaterThan(0);
    const dateAdj = comp1!.adjustments.find((a) => a.type === "DateOfSale");
    expect(dateAdj).toBeDefined();
    expect(dateAdj!.amount).toBe(6270);
  });

  test("24. Skips subject row (sequenceId=0) in comps", () => {
    const result = parseSample();
    const subjectRow = result.salesComparison.comps.find((c) => c.sequenceId === 0);
    expect(subjectRow).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // 6. VALUATION_METHODS — Cost Approach
  // -------------------------------------------------------------------------
  test("25. Extracts cost approach site value and indicated value", () => {
    const result = parseSample();
    expect(result.costApproach.siteValue).toBe(95000);
    expect(result.costApproach.indicatedValue).toBe(479086);
  });

  test("26. Extracts remaining economic life", () => {
    const result = parseSample();
    expect(result.costApproach.remainingEconomicLife).toBe(83);
  });

  // -------------------------------------------------------------------------
  // 7. VALUATION (final)
  // -------------------------------------------------------------------------
  test("27. Extracts final appraised value and effective date", () => {
    const result = parseSample();
    expect(result.valuation.finalValue).toBe(420000);
    expect(result.valuation.effectiveDate).toBe("2021-10-19");
  });

  test("28. Extracts reconciliation comment", () => {
    const result = parseSample();
    expect(result.valuation.reconciliationComment).toContain("sales comparison");
  });

  // -------------------------------------------------------------------------
  // 8. M&S Sanitization
  // -------------------------------------------------------------------------
  test("29. Sanitizes Marshall & Swift brand references from cost note", () => {
    const result = parseMismoXml(MISMO_WITH_MS_REFERENCE, "test.xml");
    // The costServiceNote must NOT contain any M&S brand name
    expect(result.costApproach.costServiceNote.toLowerCase()).not.toMatch(
      /marshall|swift/i
    );
    // But it should still have meaningful content
    expect(result.costApproach.costServiceNote.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // 9. Error handling
  // -------------------------------------------------------------------------
  test("30. Returns success=false with error for malformed XML", () => {
    const result = parseMismoXml(MALFORMED_XML, "bad.xml");
    expect(result.success).toBe(false);
    expect(result.parseErrors.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // 10. convertToLegacyImportRecord
  // -------------------------------------------------------------------------
  test("31. convertToLegacyImportRecord generates a TF file number", () => {
    const parsed = parseSample();
    const record = convertToLegacyImportRecord(parsed);
    expect(record.fileNumber).toMatch(/^TF-/);
  });

  test("32. convertToLegacyImportRecord maps address fields correctly", () => {
    const parsed = parseSample();
    const record = convertToLegacyImportRecord(parsed);
    expect(record.subjectContext.address).toBe("123 Main St");
    expect(record.subjectContext.city).toBe("Richland");
    expect(record.subjectContext.state).toBe("WA");
  });

  test("33. convertToLegacyImportRecord maps property rights to Fee Simple", () => {
    const parsed = parseSample();
    const record = convertToLegacyImportRecord(parsed);
    expect(record.subjectContext.propertyRights).toBe("Fee Simple");
  });

  test("34. convertToLegacyImportRecord maps Refinance purpose to Mortgage Finance", () => {
    const parsed = parseSample();
    const record = convertToLegacyImportRecord(parsed);
    expect(record.subjectContext.intendedUse).toBe("Mortgage Finance");
  });

  test("35. convertToLegacyImportRecord captures all three value conclusions", () => {
    const parsed = parseSample();
    const record = convertToLegacyImportRecord(parsed);
    expect(record.valueSummary.costApproach).toBe(479086);
    expect(record.valueSummary.salesComparison).toBe(420000);
    expect(record.valueSummary.incomeApproach).toBe(410000);
    expect(record.valueSummary.finalValue).toBe(420000);
  });

  test("36. convertToLegacyImportRecord sets sourceSystem to alamode_mercury", () => {
    const parsed = parseSample();
    const record = convertToLegacyImportRecord(parsed);
    expect(record.sourceSystem).toBe("alamode_mercury");
  });

  test("37. convertToLegacyImportRecord preserves legacy file number", () => {
    const parsed = parseSample();
    const record = convertToLegacyImportRecord(parsed);
    expect(record.legacyFileNumber).toBe("2108917678");
    expect(record.legacyAdditionalFileNumber).toBe("562-3104019");
  });

  test("38. Market conditions: extracts present land use percentages", () => {
    const result = parseSample();
    expect(result.marketConditions.presentLandUse["SingleFamily"]).toBe(70);
    expect(result.marketConditions.presentLandUse["Commercial"]).toBe(15);
  });

  test("39. Market conditions: extracts housing price range", () => {
    const result = parseSample();
    expect(result.marketConditions.housingLowPrice).toBe(100);
    expect(result.marketConditions.housingHighPrice).toBe(900);
    expect(result.marketConditions.housingPredominantPrice).toBe(400);
  });

  test("40. Income approach: extracts indicated value", () => {
    const result = parseSample();
    expect(result.incomeApproach.indicatedValue).toBe(410000);
    expect(result.incomeApproach.comment).toContain("Income approach");
  });
});

describe("Phase F — Governance Audit", () => {
  test("41. No M&S brand references in any exported field of a clean import", () => {
    const result = parseSample();
    const record = convertToLegacyImportRecord(result);
    const serialized = JSON.stringify(record);
    expect(serialized).not.toMatch(/marshall\s*&?\s*swift/i);
    expect(serialized).not.toMatch(/m\s*&\s*s\s+cost/i);
  });

  test("42. M&S references in source XML are sanitized in the converted record", () => {
    const result = parseMismoXml(MISMO_WITH_MS_REFERENCE, "ms_test.xml");
    const record = convertToLegacyImportRecord(result);
    const serialized = JSON.stringify(record);
    expect(serialized).not.toMatch(/marshall\s*&?\s*swift/i);
  });

  test("43. importedAt timestamp is a valid ISO string", () => {
    const result = parseSample();
    expect(() => new Date(result.importedAt)).not.toThrow();
    expect(new Date(result.importedAt).getFullYear()).toBeGreaterThan(2020);
  });

  test("44. File number format is TF-YYMMDD-CITY-XXXX", () => {
    const result = parseSample();
    const record = convertToLegacyImportRecord(result);
    // Should match TF-YYMMDD-CITY-XXXX pattern
    expect(record.fileNumber).toMatch(/^TF-\d{6}-[A-Z]{1,4}-[A-Z0-9]{4}$/);
  });
});
