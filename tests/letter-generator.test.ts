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
    expect(doc.markdownContent).toContain('adjust the outstanding balance to reflect the qualifying');
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

  it('renders markdown tables as valid HTML tables and includes UPL disclaimer', () => {
    const auditPayload: DisputeLetterPayload = {
      ...samplePayload,
      letterType: 'PRICE_TRANSPARENCY_AUDIT_DISPUTE',
      auditResult: {
        billId: 'bill-1',
        hospitalId: 'cleveland-clinic-main',
        hospitalName: 'Cleveland Clinic',
        totalBilledCharge: 3500,
        totalPatientResponsibility: 3500,
        totalPotentialSavingsUSD: 2050,
        recommendedFairSettlementUSD: 1450,
        summaryFlags: ['EXCEEDS_CASH_PRICE'],
        hasHighSeverityDiscrepancy: true,
        auditTimestamp: '2026-09-01T00:00:00Z',
        lineItemAudits: [
          {
            lineItemId: 'line-1',
            code: '99285',
            description: 'ER Level 5',
            billedCharge: 3500,
            hospitalCashPrice: 1450,
            medicareBaselineRate: 204.6,
            markupMultiplier: 17.1,
            flags: ['EXCEEDS_CASH_PRICE'],
            potentialSavingsUSD: 2050,
            explanation: 'Billed charge exceeds cash rate.',
          },
        ],
      },
    };

    const doc = generateDisputeLetter(auditPayload);

    // Verify HTML table tags are properly parsed
    expect(doc.htmlContent).toContain('<table><thead><tr>');
    expect(doc.htmlContent).toContain('<th>Code</th>');
    expect(doc.htmlContent).toContain('<tbody>');
    expect(doc.htmlContent).toContain('<tr>');
    expect(doc.htmlContent).toContain('<td>99285</td>');
    expect(doc.htmlContent).toContain('</table>');

    // Verify UPL disclaimer is present
    expect(doc.htmlContent).toContain('Notice & Self-Advocacy Disclaimer');
    expect(doc.htmlContent).toContain('does not constitute formal legal advice');
  });

  it('escapes malicious XSS payloads and quotes in generated HTML output', () => {
    const maliciousPayload: DisputeLetterPayload = {
      letterType: 'COMPREHENSIVE_PROTECTION_NOTICE',
      accountNumber: 'ACC-12345"><script>alert("xss")</script>',
      statementDate: '2026-08-15',
      patient: {
        fullName: 'Jane <img src=x onerror=alert(1)> Doe',
        addressLine1: '123 "Main" Street',
        city: 'Cleveland',
        state: 'OH',
        zipCode: '44101',
        phoneNumber: '(216) 555-0199',
      },
      additionalPatientStatement: 'Unforeseen <script>malicious()</script> "hardship\'s impact"',
    };

    const doc = generateDisputeLetter(maliciousPayload);

    // Verify <script> tags are neutralised into &lt;script&gt;
    expect(doc.htmlContent).not.toContain('<script>');
    expect(doc.htmlContent).not.toContain('<img src=x onerror=alert(1)>');
    expect(doc.htmlContent).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(doc.htmlContent).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(doc.htmlContent).toContain('&quot;Main&quot;');
    expect(doc.htmlContent).toContain('&#39;');
  });

  it('generates dispute letter safely when assessment and audit are both undefined', () => {
    const minimalPayload: DisputeLetterPayload = {
      letterType: 'PRICE_TRANSPARENCY_AUDIT_DISPUTE',
      accountNumber: 'ACC-999',
      statementDate: '2026-09-01',
      patient: {
        fullName: 'John Doe',
        addressLine1: '100 Broadway',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phoneNumber: '(212) 555-0100',
      },
    };

    const doc = generateDisputeLetter(minimalPayload);
    expect(doc.markdownContent).toContain('Formal Dispute of Itemized Charges');
    expect(doc.markdownContent).toContain('Account #ACC-999');
    expect(doc.htmlContent).toContain('John Doe');
  });

  it('includes Notice & Self-Advocacy Disclaimer in copied markdown output across all letter types', () => {
    const doc501r = generateDisputeLetter(samplePayload);
    expect(doc501r.markdownContent).toContain('Notice & Self-Advocacy Disclaimer');
    expect(doc501r.markdownContent).toContain('does not constitute formal legal advice or provide legal representation');


    const docAudit = generateDisputeLetter({
      ...samplePayload,
      letterType: 'PRICE_TRANSPARENCY_AUDIT_DISPUTE',
    });
    expect(docAudit.markdownContent).toContain('Notice & Self-Advocacy Disclaimer');

    const docComb = generateDisputeLetter({
      ...samplePayload,
      letterType: 'COMPREHENSIVE_PROTECTION_NOTICE',
    });
    expect(docComb.markdownContent).toContain('Notice & Self-Advocacy Disclaimer');
  });
});

