import { describe, it, expect } from 'vitest';
import { generateDisputeLetter } from '../src/core/letter-generator/engine.js';
import type { DisputeLetterPayload } from '../src/contracts/dispute-letter.js';

describe('LetterGeneratorEngine', () => {
  const samplePayload: DisputeLetterPayload = {
    letterType: '501R_FINANCIAL_ASSISTANCE_APPLICATION',
    patient: {
      fullName: 'Johnathan Smith',
      addressLine1: '123 Hope Way',
      city: 'Cleveland',
      state: 'OH',
      zipCode: '44101',
      phoneNumber: '(216) 555-0192',
      email: 'johnathan.smith@example.org',
    },
    accountNumber: 'CLV-992019',
    statementDate: '2026-08-15',
    charityCareAssessment: {
      hospitalId: 'cleveland-clinic-main',
      hospitalLegalName: 'The Cleveland Clinic Foundation',
      evaluationDate: '2026-09-01T00:00:00.000Z',
      householdSize: 2,
      annualHouseholdIncome: 30000,
      fplThresholdUSD: 21980,
      fplPercentage: 136.5,
      tierType: 'FULL_FORGIVENESS',
      qualifyingTierName: '100% Charity Care Assistance',
      discountPercentage: 100,
      originalPatientBalanceUSD: 8400,
      adjustedPatientBalanceUSD: 0,
      totalForgivenAmountUSD: 8400,
      assetTestPassed: true,
      ecaSafeHarborActive: true,
      daysRemainingInApplicationWindow: 220,
      requiredDocumentsChecklist: ['Completed application', 'Tax return'],
      legalProtectionsSummary: ['26 U.S.C. § 501(r)(6) Safe Harbor'],
    },
    additionalPatientStatement:
      'I suffered a sudden reduction in work hours following emergency surgery.',
  };

  it('generates formal 501(r) application markdown with statutory citations', () => {
    const doc = generateDisputeLetter(samplePayload);

    expect(doc.title).toContain('Section 501(r) Formal Financial Assistance Application');
    expect(doc.markdownContent).toContain('26 U.S.C. § 501(r)');
    expect(doc.markdownContent).toContain('26 U.S.C. § 501(r)(6)');
    expect(doc.markdownContent).toContain('Johnathan Smith');
    expect(doc.markdownContent).toContain('CLV-992019');
    expect(doc.markdownContent).toContain('136.5% FPL');
    expect(doc.markdownContent).toContain('100% Relief');
    expect(doc.markdownContent).toContain('sudden reduction in work hours');
    expect(doc.statutoryCitations.length).toBeGreaterThanOrEqual(4);
    expect(doc.mailingInstructions[0]).toContain('Certified Mail');
  });

  it('generates clean printable HTML containing required styling and metadata', () => {
    const doc = generateDisputeLetter(samplePayload);

    expect(doc.htmlContent).toContain('<!DOCTYPE html>');
    expect(doc.htmlContent).toContain('@media print');
    expect(doc.htmlContent).toContain('Johnathan Smith');
    expect(doc.htmlContent).toContain('CLV-992019');
  });

  it('generates comprehensive combined notice when selected', () => {
    const comprehensiveDoc = generateDisputeLetter({
      ...samplePayload,
      letterType: 'COMPREHENSIVE_PROTECTION_NOTICE',
    });

    expect(comprehensiveDoc.title).toContain('Demand for 501(r) Financial Assistance & Price Audit Dispute');
    expect(comprehensiveDoc.markdownContent).toContain('Safe Harbor Invocation Under 26 U.S.C. § 501(r)(6)');
    expect(comprehensiveDoc.markdownContent).toContain('Price Audit & Chargemaster Inflation Findings');
  });
});
