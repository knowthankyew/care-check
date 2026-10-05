import { KtyHandoffPayload } from '@knowthankyew/privacy-telemetry';
import { ItemizedMedicalBill, BillLineItem } from '../contracts/bill.js';

/**
 * Maps incoming KnowThankYew extension handoff findings into an ItemizedMedicalBill structure.
 * Gracefully handles category mismatches by itemizing findings with statute references.
 */
export function mapHandoffToMedicalBill(payload: KtyHandoffPayload): ItemizedMedicalBill {
  const lineItems: BillLineItem[] = payload.findings.map((f, idx) => ({
    id: `handoff-line-${f.ruleId || idx + 1}`,
    codeType: 'UNKNOWN',
    code: f.ruleId || `KTY-${idx + 1}`,
    description: `${f.title} (${f.statuteCode || 'Statutory Disclosure'})`,
    quantity: 1,
    billedCharge: 0,
    patientResponsibility: 0,
    serviceDate: payload.scanTimestamp.slice(0, 10),
  }));

  return {
    id: `handoff-bill-${payload.domain}-${Date.parse(payload.scanTimestamp) || Date.now()}`,
    accountNumber: `KTY-${payload.domain.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ONLINE'}`,
    hospitalId: 'cleveland-clinic-main',
    hospitalName: `${payload.domain} (via KnowThankYew Reality Engine)`,
    patientName: 'Local Consumer',
    statementDate: payload.scanTimestamp.slice(0, 10),
    hasItemizedBreakdown: lineItems.length > 0,
    totalBilledCharge: 0,
    totalInsurancePaid: 0,
    totalPatientResponsibility: 0,
    lineItems,
  };
}
