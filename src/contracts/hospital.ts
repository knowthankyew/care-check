/**
 * CareCheck Data Contract: Hospital Profile & Section 501(r) Financial Assistance Policy (FAP)
 * Governed by 26 U.S.C. § 501(r)(4)-(6) and CMS 45 CFR Part 180.
 */

export interface FapTier {
  tierId: string;
  name: string; // e.g., "Full Charity Care", "Sliding Scale Tier 1"
  minFplPercent: number; // e.g. 0
  maxFplPercent: number; // e.g. 200
  discountPercent: number; // e.g. 100 (100% forgiveness) or 70 (70% discount)
  notes?: string;
}

export interface HospitalBillingContact {
  department: string; // e.g., "Patient Financial Services / Charity Care Coordinator"
  mailingAddressLine1: string;
  mailingAddressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber?: string;
  faxNumber?: string;
  fapWebpageUrl?: string;
}

export interface HospitalProfile {
  id: string; // Internal unique slug, e.g. "cleveland-clinic-main"
  legalName: string;
  displayName: string;
  ein: string; // Employer Identification Number
  npi?: string; // National Provider Identifier
  cmsCertificationNumber?: string; // CCN / Medicare Provider Number
  state: string; // Two-letter state code
  isTaxExempt501c3: boolean; // Must be true for 501(r) statutory binding

  // Section 501(r) Financial Assistance Policy details
  fapTiers: FapTier[];
  
  // Amounts Generally Billed (AGB) discount percentage (26 U.S.C. § 501(r)(5))
  // Applied to gross charges for uninsured patients exceeding charity tiers
  agbDiscountPercent?: number; // e.g. 68% means patient pays at most 32% of chargemaster

  // Window to submit application before Extraordinary Collection Actions (ECAs)
  // § 501(r)(6) mandates a minimum of 240 days from the date of the first post-discharge billing statement
  fapApplicationWindowDays: number;

  // Asset test requirement: Some hospitals consider liquid assets above a threshold
  requiresAssetTest: boolean;
  assetExemptionLimitUSD?: number;

  // Contact info for dispute submission
  billingContact: HospitalBillingContact;

  // Data verification status for audit integrity
  dataVerificationStatus?: 'VERIFIED_PRIMARY_SOURCE' | 'SAMPLE_POLICY_VERIFY_BILL';
  verificationNotes?: string;

  // Reference to CMS Machine-Readable File (MRF) index slice if available
  mrfSliceUrl?: string;
}
