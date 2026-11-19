import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapHandoffToMedicalBill } from '../src/core/handoff-adapter.js';
import {
  type KtyHandoffPayload,
  KTY_HANDOFF_SESSION_KEY,
  validateHandoffPayload,
} from '@knowthankyew/privacy-telemetry';
import { useKTYHandoff } from '@knowthankyew/privacy-telemetry/react';

const reactHarness = vi.hoisted(() => {
  const states: unknown[] = [];
  let stateIndex = 0;
  let pendingEffects: Array<() => void | (() => void)> = [];
  let cleanups: Array<() => void> = [];

  return {
    reset() {
      for (const cleanup of cleanups) cleanup();
      states.length = 0;
      stateIndex = 0;
      pendingEffects = [];
      cleanups = [];
    },
    renderHook<T>(hookFn: () => T): T {
      stateIndex = 0;
      pendingEffects = [];
      let result = hookFn();
      if (pendingEffects.length > 0) {
        const effects = pendingEffects;
        pendingEffects = [];
        for (const eff of effects) {
          const cleanup = eff();
          if (typeof cleanup === 'function') cleanups.push(cleanup);
        }
        stateIndex = 0;
        result = hookFn();
      }
      return result;
    },
    useState<T>(initial: T | (() => T)): [T, (next: T | ((prev: T) => T)) => void] {
      const idx = stateIndex++;
      if (!(idx in states)) {
        states[idx] = typeof initial === 'function' ? (initial as () => T)() : initial;
      }
      const setState = (next: T | ((prev: T) => T)) => {
        const prev = states[idx] as T;
        states[idx] = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      };
      return [states[idx] as T, setState];
    },
    useEffect(fn: () => void | (() => void)) {
      pendingEffects.push(fn);
    },
    useCallback<T extends (...args: never[]) => unknown>(fn: T): T {
      return fn;
    },
  };
});

vi.mock('react', () => ({
  useState: reactHarness.useState,
  useEffect: reactHarness.useEffect,
  useCallback: reactHarness.useCallback,
}));

function stubHandoffGlobals(initialPayload?: KtyHandoffPayload): void {
  const store = new Map<string, string>();
  if (initialPayload) {
    store.set(KTY_HANDOFF_SESSION_KEY, JSON.stringify(initialPayload));
  }
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  });
  vi.stubGlobal('window', {
    location: { search: '?kty_handoff=1', pathname: '/' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    history: { replaceState: vi.fn() },
  });
}

describe('Milestone 7 Phase 3: CareCheck Handoff Intake Bypass (tests/handoff.test.ts)', () => {
  beforeEach(() => {
    reactHarness.reset();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    reactHarness.reset();
    vi.unstubAllGlobals();
  });

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
    expect(validateHandoffPayload(samplePayload)).toBe(true);
    const bill = mapHandoffToMedicalBill(samplePayload);

    expect(bill.hospitalName).toContain('health-portal-telehealth.com');
    expect(bill.hasItemizedBreakdown).toBe(true);
    expect(bill.lineItems.length).toBe(1);

    const item = bill.lineItems[0]!;
    expect(item.code).toBe('SURV-HEALTH-01');
    expect(item.description).toContain('Cross-Context Health Data Broker Sharing');
    expect(item.description).toContain('FTC Health Breach Notification Rule');
  });

  it('accepts matching targetTool via useKTYHandoff("care-check") and leaves mismatched targetTool returning null', () => {
    expect(validateHandoffPayload(samplePayload)).toBe(true);
    stubHandoffGlobals(samplePayload);

    const matched = reactHarness.renderHook(() => useKTYHandoff('care-check'));
    expect(matched.isHandoffActive).toBe(true);
    expect(matched.payload?.domain).toBe('health-portal-telehealth.com');

    reactHarness.reset();
    const otherToolPayload: KtyHandoffPayload = {
      ...samplePayload,
      targetTool: 'paystub-check',
    };
    expect(validateHandoffPayload(otherToolPayload)).toBe(true);
    stubHandoffGlobals(otherToolPayload);

    const mismatched = reactHarness.renderHook(() => useKTYHandoff('care-check'));
    expect(mismatched.payload).toBeNull();
    expect(mismatched.isHandoffActive).toBe(false);
  });
});
