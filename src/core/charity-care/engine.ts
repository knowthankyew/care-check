/**
 * CareCheck Section 501(r) Charity Care Engine
 * Deterministic calculation of FPL brackets and hospital Financial Assistance Policy (FAP) eligibility.
 * Governed by 26 U.S.C. § 501(r) and 42 U.S.C. § 9902(2).
 */

import type {
  FplCalculationParams,
  FplCalculationResult,
  FplYearlyGuideline,
  PovertyRegion,
} from '../../contracts/fpl.js';
import type {
  CharityCareAssessment,
  CharityCareAssessmentParams,
  CharityCareTierType,
} from '../../contracts/charity-care.js';
import guidelinesData from '../../../data/fpl/guidelines.json' with { type: 'json' };

const GUIDELINES = guidelinesData.guidelines as FplYearlyGuideline[];

/**
 * Calculates the exact Federal Poverty Level threshold and percentage
 * for a given household size, income, and geographical region.
 */
export function calculateFpl(params: FplCalculationParams): FplCalculationResult {
  const householdSize = Math.max(1, Math.floor(params.householdSize));
  const region: PovertyRegion = params.region || 'contiguous';
  const targetYear = params.year || 2026;

  // Find target year guideline or fallback to latest
  const guideline =
    GUIDELINES.find((g) => g.year === targetYear) ||
    GUIDELINES[GUIDELINES.length - 1]!;

  const regionData = guideline.regions[region];
  if (!regionData) {
    throw new Error(`Unsupported poverty region: ${region}`);
  }

  // FPL = Base + (HouseholdSize - 1) * Increment
  const povertyThreshold =
    regionData.baseAmount + (householdSize - 1) * regionData.incrementPerPerson;

  const income = Math.max(0, params.annualHouseholdIncome);
  const povertyPercentage = Number(((income / povertyThreshold) * 100).toFixed(2));

  return {
    year: guideline.year,
    region,
    householdSize,
    annualHouseholdIncome: income,
    povertyThreshold,
    povertyPercentage,
  };
}

/**
 * Evaluates patient's eligibility under a specific hospital's Section 501(r) Financial Assistance Policy.
 */
export function assessCharityCareEligibility(
  params: CharityCareAssessmentParams
): CharityCareAssessment {
  const { hospital, householdSize, annualHouseholdIncome, totalPatientBalance, statementDate } =
    params;

  const fplResult = calculateFpl({
    householdSize,
    annualHouseholdIncome,
    region: params.region,
    year: params.evaluationYear,
  });

  const fplPercent = fplResult.povertyPercentage;

  // Evaluate Asset Test if required by hospital policy
  let assetTestPassed = true;
  let assetTestNotes: string | undefined;
  if (hospital.requiresAssetTest && hospital.assetExemptionLimitUSD !== undefined) {
    const assets = params.liquidAssetsUSD || 0;
    if (assets > hospital.assetExemptionLimitUSD) {
      assetTestPassed = false;
      assetTestNotes = `Liquid assets ($${assets.toLocaleString()}) exceed hospital exemption limit ($${hospital.assetExemptionLimitUSD.toLocaleString()}). Assistance may be reduced or subject to managerial review.`;
    } else {
      assetTestNotes = `Liquid assets within exempt limit.`;
    }
  }

  // Evaluate FAP Tiers
  // Sort tiers ascending by maxFplPercent to find the best qualifying tier
  const sortedTiers = [...hospital.fapTiers].sort(
    (a, b) => a.maxFplPercent - b.maxFplPercent
  );

  let matchedTier = sortedTiers.find(
    (tier) => fplPercent >= tier.minFplPercent && fplPercent <= tier.maxFplPercent
  );

  let tierType: CharityCareTierType = 'INELIGIBLE';
  let qualifyingTierName = 'No Policy Discount Available';
  let discountPercentage = 0;

  if (matchedTier && assetTestPassed) {
    discountPercentage = matchedTier.discountPercent;
    qualifyingTierName = matchedTier.name;

    if (discountPercentage >= 100) {
      tierType = 'FULL_FORGIVENESS';
    } else if (discountPercentage > 0) {
      tierType = 'SLIDING_SCALE_DISCOUNT';
    }
  } else if (!matchedTier && hospital.agbDiscountPercent && hospital.agbDiscountPercent > 0) {
    // Uninsured fallback: AGB limitation under 26 U.S.C. § 501(r)(5)
    tierType = 'UNINSURED_AGB_DISCOUNT';
    discountPercentage = hospital.agbDiscountPercent;
    qualifyingTierName = `Amounts Generally Billed (AGB) Cap (${hospital.agbDiscountPercent}% Discount)`;
  }

  const originalBalance = Math.max(0, totalPatientBalance);
  const totalForgivenAmountUSD = Number(
    ((originalBalance * discountPercentage) / 100).toFixed(2)
  );
  const adjustedPatientBalanceUSD = Number(
    Math.max(0, originalBalance - totalForgivenAmountUSD).toFixed(2)
  );

  // Safe Harbor & Timelines under 26 U.S.C. § 501(r)(6)
  const stmtDate = new Date(statementDate);
  const today = new Date();
  const daysElapsed = Math.floor(
    (today.getTime() - stmtDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const windowDays = hospital.fapApplicationWindowDays || 240;
  const daysRemaining = Math.max(0, windowDays - daysElapsed);
  const ecaSafeHarborActive = daysRemaining > 0;

  // Required Documentation Checklist
  const requiredDocumentsChecklist: string[] = [
    'Completed & signed Hospital Financial Assistance Application Form',
    'Prior year IRS Form 1040 federal tax return or W-2 statement',
    'Last 2 to 3 consecutive pay stubs (or employer verification of wages)',
  ];
  if (annualHouseholdIncome === 0) {
    requiredDocumentsChecklist.push(
      'Written Statement of Zero Income / Letter of Support from housing provider'
    );
  }
  if (hospital.requiresAssetTest) {
    requiredDocumentsChecklist.push(
      'Recent bank statements (checking/savings) for liquid asset verification'
    );
  }

  // Statutory Rights & Legal Protections
  const legalProtectionsSummary: string[] = [
    '26 U.S.C. § 501(r)(4): The hospital is legally bound by its published Financial Assistance Policy.',
    '26 U.S.C. § 501(r)(6) Safe Harbor: Tax-exempt hospitals are prohibited from Extraordinary Collection Actions (ECAs)—including credit bureau reporting, lawsuits, and wage garnishments—until reasonable efforts are made to determine FAP eligibility (minimum 240 days).',
  ];
  if (tierType === 'UNINSURED_AGB_DISCOUNT') {
    legalProtectionsSummary.push(
      '26 U.S.C. § 501(r)(5): Non-profit hospitals are prohibited from charging FAP-eligible or uninsured individuals more than the Amounts Generally Billed (AGB) to insured patients.'
    );
  }

  return {
    hospitalId: hospital.id,
    hospitalLegalName: hospital.legalName,
    evaluationDate: new Date().toISOString(),
    householdSize,
    annualHouseholdIncome,
    fplThresholdUSD: fplResult.povertyThreshold,
    fplPercentage: fplResult.povertyPercentage,
    tierType,
    qualifyingTierName,
    discountPercentage,
    originalPatientBalanceUSD: originalBalance,
    adjustedPatientBalanceUSD,
    totalForgivenAmountUSD,
    assetTestPassed,
    assetTestNotes,
    ecaSafeHarborActive,
    daysRemainingInApplicationWindow: daysRemaining,
    requiredDocumentsChecklist,
    legalProtectionsSummary,
  };
}
