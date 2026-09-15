import { describe, it, expect } from 'vitest';
import { calculateFpl, assessCharityCareEligibility } from '../src/core/charity-care/engine.js';
import type { HospitalProfile } from '../src/contracts/hospital.js';
import hospitalsData from '../data/hospitals/seed-hospitals.json' with { type: 'json' };

const HOSPITALS = hospitalsData as HospitalProfile[];
const clevelandClinic = HOSPITALS.find((h) => h.id === 'cleveland-clinic-main')!;
const mayoClinic = HOSPITALS.find((h) => h.id === 'mayo-clinic-rochester')!;

describe('CharityCareEngine - FPL Calculations', () => {
  it('calculates exact 2026 FPL for 1-person household in contiguous US', () => {
    const res = calculateFpl({
      year: 2026,
      householdSize: 1,
      annualHouseholdIncome: 16200,
      region: 'contiguous',
    });
    expect(res.povertyThreshold).toBe(16200);
    expect(res.povertyPercentage).toBe(100.0);
  });

  it('calculates exact 2026 FPL for family of 4 in contiguous US', () => {
    // 16,200 + 3 * 5,780 = 33,540
    const res = calculateFpl({
      year: 2026,
      householdSize: 4,
      annualHouseholdIncome: 67080, // exactly 200% FPL
      region: 'contiguous',
    });
    expect(res.povertyThreshold).toBe(33540);
    expect(res.povertyPercentage).toBe(200.0);
  });

  it('calculates regional adjustments for Alaska and Hawaii', () => {
    // Alaska 2026 for 1 person = 20,240
    const akRes = calculateFpl({
      year: 2026,
      householdSize: 1,
      annualHouseholdIncome: 20240,
      region: 'alaska',
    });
    expect(akRes.povertyThreshold).toBe(20240);
    expect(akRes.povertyPercentage).toBe(100.0);

    // Hawaii 2026 for 1 person = 18,630
    const hiRes = calculateFpl({
      year: 2026,
      householdSize: 1,
      annualHouseholdIncome: 18630,
      region: 'hawaii',
    });
    expect(hiRes.povertyThreshold).toBe(18630);
    expect(hiRes.povertyPercentage).toBe(100.0);
  });
});

describe('CharityCareEngine - 501(r) Eligibility Assessment', () => {
  it('qualifies for 100% full forgiveness under Cleveland Clinic policy (<= 250% FPL)', () => {
    // Family of 3 in 2026: 16,200 + 2 * 5,780 = 27,760
    // Income of $55,520 = exactly 200% FPL
    const assessment = assessCharityCareEligibility({
      hospital: clevelandClinic,
      householdSize: 3,
      annualHouseholdIncome: 55520,
      totalPatientBalance: 12500,
      statementDate: new Date().toISOString().split('T')[0]!,
      evaluationYear: 2026,
    });

    expect(assessment.fplPercentage).toBe(200.0);
    expect(assessment.tierType).toBe('FULL_FORGIVENESS');
    expect(assessment.discountPercentage).toBe(100);
    expect(assessment.totalForgivenAmountUSD).toBe(12500);
    expect(assessment.adjustedPatientBalanceUSD).toBe(0);
    expect(assessment.ecaSafeHarborActive).toBe(true);
  });

  it('qualifies for sliding scale tier (251% - 300% FPL) under Cleveland Clinic policy', () => {
    // Family of 1: threshold 16,200. Income $45,360 = 280% FPL -> 75% discount
    const assessment = assessCharityCareEligibility({
      hospital: clevelandClinic,
      householdSize: 1,
      annualHouseholdIncome: 45360,
      totalPatientBalance: 4000,
      statementDate: new Date().toISOString().split('T')[0]!,
      evaluationYear: 2026,
    });

    expect(assessment.fplPercentage).toBe(280.0);
    expect(assessment.tierType).toBe('SLIDING_SCALE_DISCOUNT');
    expect(assessment.discountPercentage).toBe(75);
    expect(assessment.totalForgivenAmountUSD).toBe(3000);
    expect(assessment.adjustedPatientBalanceUSD).toBe(1000);
  });

  it('falls back to statutory AGB limitation for uninsured patient exceeding 400% FPL', () => {
    // Family of 1: income $80,000 (~493% FPL)
    const assessment = assessCharityCareEligibility({
      hospital: clevelandClinic,
      householdSize: 1,
      annualHouseholdIncome: 80000,
      totalPatientBalance: 10000,
      statementDate: new Date().toISOString().split('T')[0]!,
      evaluationYear: 2026,
    });

    expect(assessment.fplPercentage).toBeGreaterThan(400);
    expect(assessment.tierType).toBe('UNINSURED_AGB_DISCOUNT');
    expect(assessment.discountPercentage).toBe(67); // Cleveland Clinic AGB discount
    expect(assessment.totalForgivenAmountUSD).toBe(6700);
    expect(assessment.adjustedPatientBalanceUSD).toBe(3300);
  });

  it('properly matches tier seam at 250.50% FPL without gap', () => {
    // Household of 1: threshold $16,200.
    // Income of $40,581 = 250.50% FPL. Under the previous gap bug, this fell through.
    const assessment = assessCharityCareEligibility({
      hospital: clevelandClinic,
      householdSize: 1,
      annualHouseholdIncome: 40581,
      totalPatientBalance: 10000,
      statementDate: new Date().toISOString().split('T')[0]!,
      evaluationYear: 2026,
    });

    expect(assessment.fplPercentage).toBe(250.5);
    // Should match Tier 2 (75% discount)
    expect(assessment.tierType).toBe('SLIDING_SCALE_DISCOUNT');
    expect(assessment.discountPercentage).toBe(75);
    expect(assessment.adjustedPatientBalanceUSD).toBe(2500);
  });

  it('blocks AGB fallback when asset test fails', () => {
    // Mayo Clinic: patient exceeds asset test AND income exceeds 400% FPL ($70k income, $30k assets)
    const assessment = assessCharityCareEligibility({
      hospital: mayoClinic,
      householdSize: 1,
      annualHouseholdIncome: 70000,
      liquidAssetsUSD: 30000,
      totalPatientBalance: 10000,
      statementDate: new Date().toISOString().split('T')[0]!,
      evaluationYear: 2026,
    });

    expect(assessment.assetTestPassed).toBe(false);
    expect(assessment.tierType).toBe('INELIGIBLE');
    expect(assessment.discountPercentage).toBe(0);
    expect(assessment.adjustedPatientBalanceUSD).toBe(10000);
  });

  it('does not apply AGB fallback to insured patients who exceed FAP tiers', () => {
    const assessment = assessCharityCareEligibility({
      hospital: clevelandClinic,
      householdSize: 1,
      annualHouseholdIncome: 85000, // > 400% FPL
      isUninsured: false, // Patient has commercial insurance
      totalPatientBalance: 5000,
      statementDate: new Date().toISOString().split('T')[0]!,
      evaluationYear: 2026,
    });

    expect(assessment.tierType).toBe('INELIGIBLE');
    expect(assessment.discountPercentage).toBe(0);
    expect(assessment.adjustedPatientBalanceUSD).toBe(5000);
  });

  it('calculates 240-day safe harbor accurately with UTC normalization across DST transitions', () => {
    // Set statement date exactly 100 days ago
    const pastDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const assessment = assessCharityCareEligibility({
      hospital: clevelandClinic,
      householdSize: 1,
      annualHouseholdIncome: 30000,
      totalPatientBalance: 2000,
      statementDate: pastDate,
      evaluationYear: 2026,
    });

    expect(assessment.ecaSafeHarborActive).toBe(true);
    expect(assessment.daysRemainingInApplicationWindow).toBe(140);
  });

  it('handles edge cases: zero income, negative income, and household size 0', () => {
    // Zero income
    const zeroRes = calculateFpl({
      householdSize: 1,
      annualHouseholdIncome: 0,
      year: 2026,
    });
    expect(zeroRes.annualHouseholdIncome).toBe(0);
    expect(zeroRes.povertyPercentage).toBe(0);

    // Negative income should clamp to 0
    const negRes = calculateFpl({
      householdSize: 1,
      annualHouseholdIncome: -5000,
      year: 2026,
    });
    expect(negRes.annualHouseholdIncome).toBe(0);
    expect(negRes.povertyPercentage).toBe(0);

    // Household size of 0 should clamp to minimum 1
    const zeroHhRes = calculateFpl({
      householdSize: 0,
      annualHouseholdIncome: 16200,
      year: 2026,
    });
    expect(zeroHhRes.householdSize).toBe(1);
    expect(zeroHhRes.povertyPercentage).toBe(100);

    // Negative household size should clamp to minimum 1
    const negHhRes = calculateFpl({
      householdSize: -3,
      annualHouseholdIncome: 16200,
      year: 2026,
    });
    expect(negHhRes.householdSize).toBe(1);
    expect(negHhRes.povertyPercentage).toBe(100);
  });
});
