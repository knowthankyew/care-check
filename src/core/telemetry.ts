/**
 * CareCheck Telemetry Adapter
 * Powered by @knowthankyew/privacy-telemetry
 * 
 * Invariants:
 * 1. Default mode is 'memory_only' with MemoryExporter. Zero network egress.
 * 2. Raw document/bill bodies, patient records, or PHI/PII payloads are strictly forbidden from attributes.
 * 3. "Burn Local Data" purges all buffered spans and audit events, resetting telemetry.
 * 4. Honest privacy audit affordance: never reports "local-only" if an OTLP exporter is active.
 */

import {
  TelemetryManager as BaseTelemetryManager,
  MemoryExporter,
  TelemetryMode,
  EgressPolicy,
  TelemetryConfig,
  SpanRecord,
  SessionAuditEvent,
  PrivacyAuditReport,
  PrivacyClaims,
  DEFAULT_SAFE_ALLOWLIST_KEYS,
} from '@knowthankyew/privacy-telemetry';

export type {
  TelemetryMode,
  EgressPolicy,
  TelemetryConfig,
  SpanRecord,
  SessionAuditEvent,
  PrivacyAuditReport,
  PrivacyClaims,
};

export { MemoryExporter };

// Domain-specific operational attributes for CareCheck (PHI, bill totals, and CPT codes strictly excluded)
export const CARECHECK_ALLOWLIST_KEYS: ReadonlySet<string> = new Set([
  'hospital_id',
  'household_size',
  'fpl_percentage',
  'charity_eligible',
  'line_count',
  'has_itemized_breakdown',
  'discrepancy_count',
  'discount_percent',
  'has_income_verified',
  'has_balance_due',
]);

export const SAFE_ALLOWLIST_KEYS: ReadonlySet<string> = new Set([
  ...DEFAULT_SAFE_ALLOWLIST_KEYS,
  ...CARECHECK_ALLOWLIST_KEYS,
]);

export function getPrivacyClaims(report: PrivacyAuditReport): PrivacyClaims {
  if (report.isLocalOnlyHonest) {
    return {
      isLocalOnlyHonest: true,
      isEnterpriseBuild: false,
      appTitleSuffix: '',
      badgeLabel: 'Zero PHI Network • Memory-Only',
      dropzoneNotice: '100% Client-Side Local Execution • Zero PHI Network Transmission',
      disclaimerExecutionText:
        'All medical bill evaluations execute 100% locally in your browser with zero remote network transmission.',
      footerTitle: '100% Local Air-Gapped Medical Bill Compliance & Charity Care Engine.',
      footerSubtext:
        'Zero Telemetry • Zero Remote PHI/Document Egress • Section 501(r) Reality Engine',
      modalStatusTitle: '100% Local-First & Private (Memory-Only Telemetry)',
      modalStatusDescription:
        'All computation and telemetry spans remain buffered strictly in volatile memory. No outbound network calls are made. Telemetry purges immediately upon invoking "Burn Local Data".',
      otlpEndpoint: null,
    };
  }

  return {
    isLocalOnlyHonest: false,
    isEnterpriseBuild: true,
    appTitleSuffix: ' (Enterprise Build)',
    badgeLabel: `OTLP Active (${report.telemetryMode})`,
    dropzoneNotice: 'Local Bill Parsing • OTLP Operational Metadata Active (Strictly Redacted)',
    disclaimerExecutionText: `Bill evaluations execute in-browser. Scrubbed operational telemetry is exported to configured OTLP endpoint (${report.otlpEndpoint}). Medical records and patient data are never transmitted.`,
    footerTitle:
      'Enterprise Medical Bill Compliance & Charity Care Engine (OTLP Telemetry Active).',
    footerSubtext:
      'Enterprise Telemetry Mode • Operational Metadata Export Active • Medical Bills Air-Gapped',
    modalStatusTitle: 'Enterprise OTLP Telemetry Active',
    modalStatusDescription: `Telemetry spans are exported to configured OTLP endpoint: ${report.otlpEndpoint}. Patient identifiers and line-item details are redacted via strict allowlist.`,
    otlpEndpoint: report.otlpEndpoint,
  };
}

export class TelemetryManager extends BaseTelemetryManager {
  constructor(customConfig?: Partial<TelemetryConfig>) {
    super(
      { serviceName: 'care-check', ...customConfig },
      CARECHECK_ALLOWLIST_KEYS
    );
  }

  public override getPrivacyClaims(): PrivacyClaims {
    return getPrivacyClaims(this.getPrivacyAuditReport());
  }
}

export const telemetry = new TelemetryManager();
