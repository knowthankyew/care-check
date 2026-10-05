import { describe, it, expect } from 'vitest';
import { mapHandoffToMedicalBill } from '../src/core/handoff-adapter.js';
import type { KtyHandoffPayload } from '@knowthankyew/privacy-telemetry';

describe('Milestone 7 Phase 3: CareCheck Handoff Intake Bypass (tests/handoff.test.ts)', () => {
  const samplePayload: KtyHandoffPayload = {
    version: '1.0',
    originApp: 'knowthankyew-extension',
    domain: 'health-portal-telehealth.com',
    scanTimestamp: '2026-10-04T19:30:00.000Z',
    riskScore: 65,
    summary: { critical: 1, warning: 1, info: 0 },
    primaryLegalLink: {
      url: 'https://health-portal-telehealth.com/privacy-practices',
      title: 'Notice of Privacy Practices',
      category: 'PRIVACY',
      source: 'DOM_ANCHOR',
    },
    targetTool: 'care-check',
    findings: [
      {
        ruleId: 'SURV-HEALTH-01',
        title: 'Cross-Context Health Data Broker Sharing',
        category: 'SURVEILLANCE',
        severity: 'CRITICAL',
        statuteCode: 'FTC Health Breach Notification Rule / CCPA § 1798.100',
        statuteTitle: 'Health Data Brokerage Prohibition',
        matchedSnippet: 'We disclose medical symptoms and consultation logs to third-party ad networks for targeted behavioral advertising.',
        explanation: 'Unauthorized disclosure of identifiable health inquiries to data brokers violates the FTC Health Breach Notification Rule.',
        recommendation: 'Submit formal demand to cease health data brokerage under CCPA/FTC rules.',
      },
    ],
  };

  it('maps KtyHandoffPayload into an ItemizedMedicalBill with zero data loss', () => {
    const bill = mapHandoffToMedicalBill(samplePayload);

    expect(bill.hospitalName).toContain('health-portal-telehealth.com');
    expect(bill.hasItemizedBreakdown).toBe(true);
    expect(bill.lineItems.length).toBe(1);

    const item = bill.lineItems[0]!;
    expect(item.code).toBe('SURV-HEALTH-01');
    expect(item.description).toContain('Cross-Context Health Data Broker Sharing');
    expect(item.description).toContain('FTC Health Breach Notification Rule');
  });
});
