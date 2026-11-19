import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryManager } from '../src/core/telemetry.js';
import { runTelemetryInFreshRealm } from './realm-worker.mjs';

describe('CareCheck TelemetryManager & Privacy Invariants', () => {
  let tm: TelemetryManager;

  beforeEach(() => {
    tm = new TelemetryManager({
      mode: 'memory_only',
      otlpEndpoint: null,
      burnEnabled: true,
      allowRawPayloads: false,
      auditDurable: false,
      networkEgress: 'deny',
    });
  });

  it('initializes in memory_only mode with zero network egress', () => {
    const report = tm.getPrivacyAuditReport();
    expect(report.telemetryMode).toBe('memory_only');
    expect(report.networkEgress).toBe('deny');
    expect(report.otlpEndpoint).toBeNull();
    expect(report.isLocalOnlyHonest).toBe(true);
    expect(report.activeSpanCount).toBe(0);
  });

  it('records spans in MemoryExporter and calculates duration', () => {
    const span = tm.startSpan('audit_medical_bill', { line_count: 5 });
    span.end('OK', { duration_ms: 22 });

    const spans = tm.getMemorySpans();
    expect(spans).toHaveLength(1);
    const firstSpan = spans[0]!;
    expect(firstSpan.name).toBe('audit_medical_bill');
    expect(firstSpan.status).toBe('OK');
    expect(firstSpan.attributes.line_count).toBe(5);
  });

  it('strictly redacts any attribute not registered in the safe allowlist', () => {
    const span = tm.startSpan('evaluate_charity_care', {
      hospital_id: 'cleveland-clinic-main',
      patient_name: 'Jane Doe',
      ssn: '000-11-2222',
      diagnosis: 'Acute appendicitis with peritonitis',
      matchedText: 'short 40 char snippet of sensitive text',
      raw_payload: 'SECRET CONFIDENTIAL PHI',
      household_size: 3,
      annual_income: 32000,
      has_income_verified: true,
    });
    span.end('OK');

    const spans = tm.getMemorySpans();
    expect(spans).toHaveLength(1);
    const attrs = spans[0]!.attributes;

    // Allowlisted operational keys pass through
    expect(attrs.hospital_id).toBe('cleveland-clinic-main');
    expect(attrs.household_size).toBe(3);
    expect(attrs.has_income_verified).toBe(true);

    // Sensitive financial and PHI keys are strictly redacted by default without retaining key names
    expect('annual_income' in attrs).toBe(false);
    expect('patient_name' in attrs).toBe(false);
    expect('ssn' in attrs).toBe(false);
    expect('diagnosis' in attrs).toBe(false);
    expect('matchedText' in attrs).toBe(false);
    expect('raw_payload' in attrs).toBe(false);
    expect(attrs['[REDACTED_KEY]']).toBe('[REDACTED_BY_DEFAULT_ALLOWLIST]');
  });

  it('purges all in-memory spans and session audit logs upon burn()', async () => {
    await runTelemetryInFreshRealm(`
      const { TelemetryManager: IsolatedTelemetryManager } = telemetryMod;
      const isolatedTm = new IsolatedTelemetryManager({
        mode: 'memory_only',
        otlpEndpoint: null,
        burnEnabled: true,
        allowRawPayloads: false,
        auditDurable: false,
        networkEgress: 'deny',
      });

      const span = isolatedTm.startSpan('parse_bill', { line_count: 3 });
      span.end('OK');

      isolatedTm.recordAuditEvent('document_ingested', 'Ingested medical bill', { has_balance_due: true });

      assert.equal(isolatedTm.getMemorySpans().length, 1);
      assert.equal(isolatedTm.getAuditLog().length, 1);

      // Invoke Burn Local Data
      isolatedTm.burn();

      assert.equal(isolatedTm.getMemorySpans().length, 0);
      assert.equal(isolatedTm.getAuditLog().length, 0);

      // Subsequent span attempts remain permanently no-op within this burned JS realm
      const spanAfterBurn = isolatedTm.startSpan('post_burn_op', { count: 1 });
      spanAfterBurn.end('OK');
      assert.equal(isolatedTm.getMemorySpans().length, 0);
    `);
  });

  it('generates downloadable session audit JSON', () => {
    tm.recordAuditEvent('document_ingested', 'Bill ingested', { hospital_id: 'cleveland-clinic-main' });
    tm.recordAuditEvent('rules_evaluated', 'Evaluated charity care', { charity_eligible: true });

    const jsonStr = tm.downloadSessionAuditJson();
    const parsed = JSON.parse(jsonStr);

    expect(parsed.service).toBe('care-check');
    expect(parsed.eventCount).toBe(2);
    expect(parsed.events[0].action).toBe('document_ingested');
    expect(parsed.events[1].action).toBe('rules_evaluated');
    expect(parsed.events[1].details.charity_eligible).toBe(true);
  });

  it('honestly reports observability status when OTLP is active', () => {
    tm.updateConfig({
      mode: 'otlp',
      otlpEndpoint: 'https://otel.hospital-network.internal/v1/traces',
      networkEgress: 'allow_otlp',
    });

    const report = tm.getPrivacyAuditReport();
    expect(report.telemetryMode).toBe('otlp');
    expect(report.otlpEndpoint).toBe('https://otel.hospital-network.internal/v1/traces');
    expect(report.isLocalOnlyHonest).toBe(false);
  });

  it('provides single source of truth for consumer privacy claims', () => {
    // 1. Consumer defaults
    const consumerClaims = tm.getPrivacyClaims();
    expect(consumerClaims.isLocalOnlyHonest).toBe(true);
    expect(consumerClaims.isEnterpriseBuild).toBe(false);
    expect(consumerClaims.badgeLabel).toBe('Zero PHI Network • Memory-Only');
    expect(consumerClaims.dropzoneNotice).toContain('100% Client-Side Local Execution');
    expect(consumerClaims.disclaimerExecutionText).toContain('100% locally');
    expect(consumerClaims.footerTitle).toContain('100% Local Air-Gapped');

    // 2. Enterprise mode escalation
    tm.updateConfig({
      mode: 'otlp',
      otlpEndpoint: 'https://collector.corp.internal:4318/v1/traces',
      networkEgress: 'allow_otlp',
    });

    const enterpriseClaims = tm.getPrivacyClaims();
    expect(enterpriseClaims.isLocalOnlyHonest).toBe(false);
    expect(enterpriseClaims.isEnterpriseBuild).toBe(true);
    expect(enterpriseClaims.badgeLabel).toBe('OTLP Active (otlp)');
    expect(enterpriseClaims.appTitleSuffix).toBe(' (Enterprise Build)');
    expect(enterpriseClaims.dropzoneNotice).not.toContain('Zero PHI Network Transmission');
    expect(enterpriseClaims.disclaimerExecutionText).not.toContain('zero remote network transmission');
    expect(enterpriseClaims.footerTitle).not.toContain('Air-Gapped');
  });
});
