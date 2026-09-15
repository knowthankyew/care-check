/**
 * CareCheck Data Contract: Federal Poverty Line (FPL) Guidelines
 * Governed by 42 U.S.C. § 9902(2) and published annually by HHS.
 */

export type PovertyRegion = 'contiguous' | 'alaska' | 'hawaii';

export interface FplYearlyGuideline {
  year: number;
  effectiveDate: string; // ISO 8601 Date
  publicationReference?: string; // Federal Register publication citation (e.g., 89 FR 2961) or benchmark status
  regions: Record<
    PovertyRegion,
    {
      baseAmount: number; // Base poverty threshold for household of 1
      incrementPerPerson: number; // Additional threshold per additional member
    }
  >;
}

export interface FplCalculationParams {
  year?: number; // Defaults to latest available guideline year
  householdSize: number; // Must be >= 1
  annualHouseholdIncome: number; // Total annual household income in USD
  region?: PovertyRegion; // Defaults to 'contiguous'
}

export interface FplCalculationResult {
  year: number;
  region: PovertyRegion;
  householdSize: number;
  annualHouseholdIncome: number;
  povertyThreshold: number; // Dollar threshold for this household size & region
  povertyPercentage: number; // e.g. 175.5 means 175.5% of FPL
}
