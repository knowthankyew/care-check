import { describe, it, expect } from 'vitest';
import {
  auditZeroEgress,
  auditStatutoryParity,
  auditVocabulary,
  auditPolicyPacks,
  auditPortfolioMasterBrief,
} from '../scripts/audit-claims.mjs';

describe('CareCheck Claims & Privacy Invariant Linter (claims-linter.test.ts)', () => {
  it('enforces zero-egress air-gap and CSP connect-src none invariant', () => {
    const errors: string[] = [];
    auditZeroEgress(errors);
    expect(errors).toEqual([]);
  });

  it('enforces statutory citation parity between README and dispute letter engines', () => {
    const errors: string[] = [];
    auditStatutoryParity(errors);
    expect(errors).toEqual([]);
  });

  it('prohibits unprovable marketing adjectives in documentation', () => {
    const errors: string[] = [];
    auditVocabulary(errors);
    expect(errors).toEqual([]);
  });

  it('validates schema conformance across all statutory policy packs', () => {
    const errors: string[] = [];
    auditPolicyPacks(errors);
    expect(errors).toEqual([]);
  });

  it('verifies Portfolio Master Brief parity if brief is present', () => {
    const errors: string[] = [];
    auditPortfolioMasterBrief(errors, { requireBrief: false });
    expect(errors).toEqual([]);
  });

  it('fails if Portfolio Master Brief is required but missing', () => {
    const errors: string[] = [];
    auditPortfolioMasterBrief(errors, {
      requireBrief: true,
      overrideBriefPath: '/non-existent/path/BRIEF.md',
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('not found but required via --require-brief');
  });
});
