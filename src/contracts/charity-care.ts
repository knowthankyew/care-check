/**
 * CareCheck Data Contract: Section 501(r) Charity Care Eligibility Assessment
 */

import type { PovertyRegion } from './fpl.js';
import type { HospitalProfile } from './hospital.js';

export type CharityCareTierType =
  | 'FULL_FORGIVENESS' // 100% write-off ($0 balance)
  | 'SLIDING_SCALE_DISCOUNT' // Partial write-off based on FAP tier
  | 'UNINSURED_AGB_DISCOUNT' // Capped at Amounts Generally Billed under § 501(r)(5)
  | 'INELIGIBLE'; // Income exceeds all policy thresholds

export interface CharityCareAssessmentParams {
  hospital: HospitalProfile;
  householdSize: number;
  annualHouseholdIncome: number;
  liquidAssetsUSD?: number;
  totalPatientBalance: number;
  statementDate: string; // YYYY-MM-DD
  region?: PovertyRegion;
  evaluationYear?: number;
}

export interface CharityCareAssessment {
  hospitalId: string;
  hospitalLegalName: string;
  evaluationDate: string; // ISO 8601
  
  // Income & FPL Metrics
  householdSize: number;
  annualHouseholdIncome: number;
  fplThresholdUSD: number;
  fplPercentage: number; // e.g. 185.2 for 185.2% FPL

  // Qualification Verdict
  tierType: CharityCareTierType;
  qualifyingTierName: string;
  discountPercentage: number; // 0 to 100
  originalPatientBalanceUSD: number;
  adjustedPatientBalanceUSD: number;
  totalForgivenAmountUSD: number;

  // Asset Test Assessment
  assetTestPassed: boolean;
  assetTestNotes?: string;

  // Statutory Safe Harbor (§ 501(r)(6))
  ecaSafeHarborActive: boolean;
  daysRemainingInApplicationWindow: number;
  
  // Action Requirements
  requiredDocumentsChecklist: string[];
  legalProtectionsSummary: string[];
}
