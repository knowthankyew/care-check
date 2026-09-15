/**
 * CareCheck Data Contract: Medical Bill Price Audit & Verification
 * Compares charges against CMS Price Transparency files and Medicare baselines.
 */

export type PriceDiscrepancyType =
  | 'EXCEEDS_CASH_PRICE' // Billed amount is higher than hospital's published cash rate
  | 'EXCESSIVE_MARKUP' // Billed charge > 4x Medicare baseline rate
  | 'PREDATORY_MARKUP' // Billed charge > 8x Medicare baseline rate
  | 'POTENTIAL_UNBUNDLED_CODE' // Code commonly bundled under NCCI guidelines
  | 'MISSING_ITEMIZATION' // Lacks CPT/HCPCS or detailed units
  | 'STATUTORY_AGB_VIOLATION'; // Charge exceeds 501(r)(5) Amounts Generally Billed limitation

export interface LineItemAuditVerdict {
  lineItemId: string;
  code: string;
  description: string;
  billedCharge: number;
  hospitalCashPrice?: number; // From CMS Price Transparency MRF
  medicareBaselineRate?: number; // CMS Physician Fee Schedule / OPPS baseline
  markupMultiplier?: number; // billedCharge / medicareBaselineRate
  flags: PriceDiscrepancyType[];
  potentialSavingsUSD: number;
  explanation: string;
}

export interface PriceAuditResult {
  billId: string;
  hospitalId: string;
  hospitalName: string;
  totalBilledCharge: number;
  totalPatientResponsibility: number;
  totalPotentialSavingsUSD: number;
  
  // Realistic, defensible settlement ceiling based on cash price or Medicare + 20%
  recommendedFairSettlementUSD: number;

  lineItemAudits: LineItemAuditVerdict[];
  summaryFlags: PriceDiscrepancyType[];
  hasHighSeverityDiscrepancy: boolean;
  auditTimestamp: string; // ISO 8601
}
