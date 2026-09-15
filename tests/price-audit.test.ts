import { describe, it, expect } from 'vitest';
import { auditMedicalBill } from '../src/core/price-audit/engine.js';
import type { ItemizedMedicalBill } from '../src/contracts/bill.js';

describe('PriceAuditEngine', () => {
  const sampleBill: ItemizedMedicalBill = {
    id: 'bill-101',
    accountNumber: 'ACC-882910',
    hospitalId: 'cleveland-clinic-main',
    hospitalName: 'Cleveland Clinic',
    patientName: 'Jane Doe',
    statementDate: '2026-08-01',
    hasItemizedBreakdown: true,
    totalBilledCharge: 6350,
    totalInsurancePaid: 0,
    totalPatientResponsibility: 6350,
    lineItems: [
      {
        id: 'line-1',
        codeType: 'CPT',
        code: '99285', // ER Visit Level 5 (Benchmark cash: $1,450, Medicare: $204.60)
        description: 'Emergency Dept Visit Level 5',
        quantity: 1,
        billedCharge: 3500,
        patientResponsibility: 3500,
      },
      {
        id: 'line-2',
        codeType: 'CPT',
        code: '70450', // CT Head without contrast (Benchmark cash: $420, Medicare: $98.40)
        description: 'CT Scan Head/Brain',
        quantity: 1,
        billedCharge: 2400, // 24.4x Medicare baseline!
        patientResponsibility: 2400,
      },
      {
        id: 'line-3',
        codeType: 'CPT',
        code: '80053', // Comprehensive Metabolic Panel (Bundling risk)
        description: 'Comprehensive Metabolic Panel',
        quantity: 1,
        billedCharge: 450,
        patientResponsibility: 450,
      },
    ],
  };

  it('detects cash price overcharges and Medicare markup multipliers', () => {
    const result = auditMedicalBill(sampleBill);

    expect(result.hasHighSeverityDiscrepancy).toBe(true);
    expect(result.summaryFlags).toContain('EXCEEDS_CASH_PRICE');
    expect(result.summaryFlags).toContain('PREDATORY_MARKUP');
    expect(result.summaryFlags).toContain('POTENTIAL_UNBUNDLED_CODE');

    // Line 1: 99285 billed $3500 vs cash $1450 -> $2050 savings
    const line1Audit = result.lineItemAudits.find((l) => l.lineItemId === 'line-1')!;
    expect(line1Audit.flags).toContain('EXCEEDS_CASH_PRICE');
    expect(line1Audit.flags).toContain('PREDATORY_MARKUP'); // 3500 / 204.60 = 17.1x
    expect(line1Audit.potentialSavingsUSD).toBe(2050);

    // Line 2: 70450 billed $2400 vs cash $420 -> $1980 savings, markup ~24.4x
    const line2Audit = result.lineItemAudits.find((l) => l.lineItemId === 'line-2')!;
    expect(line2Audit.flags).toContain('PREDATORY_MARKUP');
    expect(line2Audit.potentialSavingsUSD).toBe(1980);

    // Total savings should be 2050 + 1980 + (450 - 45) = 4435
    expect(result.totalPotentialSavingsUSD).toBe(4435);

    // Recommended fair settlement ceiling should be substantially lower than $6,350
    expect(result.recommendedFairSettlementUSD).toBeLessThan(2500);
  });

  it('handles custom hospital-specific cash rates if provided in options', () => {
    const result = auditMedicalBill(sampleBill, {
      customCashPricesByCode: {
        '99285': 1200, // Custom negotiated/published rate
      },
    });

    const line1Audit = result.lineItemAudits.find((l) => l.lineItemId === 'line-1')!;
    expect(line1Audit.hospitalCashPrice).toBe(1200);
    expect(line1Audit.potentialSavingsUSD).toBe(2300); // 3500 - 1200
  });

  it('caps settlement target with charity care assessment relief', () => {
    const mockAssessment = {
      hospitalId: 'cleveland-clinic-main',
      hospitalLegalName: 'Cleveland Clinic',
      evaluationDate: '2026-09-01T00:00:00Z',
      householdSize: 2,
      annualHouseholdIncome: 25000,
      fplThresholdUSD: 21980,
      fplPercentage: 113.7,
      tierType: 'FULL_FORGIVENESS' as const,
      qualifyingTierName: '100% Charity Care',
      discountPercentage: 100,
      originalPatientBalanceUSD: 6350,
      adjustedPatientBalanceUSD: 0,
      totalForgivenAmountUSD: 6350,
      assetTestPassed: true,
      ecaSafeHarborActive: true,
      daysRemainingInApplicationWindow: 200,
      requiredDocumentsChecklist: [],
      legalProtectionsSummary: [],
    };

    const result = auditMedicalBill(sampleBill, {
      charityCareAssessment: mockAssessment,
    });

    // When patient qualifies for 100% forgiveness under 501(r), settlement ceiling must be $0.00
    expect(result.recommendedFairSettlementUSD).toBe(0);
  });
});
