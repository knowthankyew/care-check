/**
 * CareCheck Data Contract: Medical Bill & Line Item Structure
 */

export type MedicalCodeType = 'CPT' | 'HCPCS' | 'REV' | 'DRG' | 'UNKNOWN';

export interface BillLineItem {
  id: string;
  codeType: MedicalCodeType;
  code: string; // e.g. "99285" (Emergency Dept Visit Level 5), "70450" (CT Head/Brain)
  revenueCode?: string; // e.g. "0450" (Emergency Room)
  description: string;
  quantity: number;
  billedCharge: number; // The total gross chargemaster amount billed for this line (reflecting quantity)
  insurerAllowedAmount?: number; // Contracted amount allowed by insurance if applicable
  insurerPaidAmount?: number; // Amount paid by insurer
  patientResponsibility: number; // Balance billed directly to the patient
  serviceDate?: string; // YYYY-MM-DD
}

export interface ItemizedMedicalBill {
  id: string;
  accountNumber: string; // Hospital billing account number
  encounterNumber?: string;
  hospitalId: string;
  hospitalName: string;
  patientName: string;
  statementDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  admissionDate?: string;
  dischargeDate?: string;
  lineItems: BillLineItem[];
  totalBilledCharge: number;
  totalInsurancePaid: number;
  totalPatientResponsibility: number;
  hasItemizedBreakdown: boolean; // False if hospital only provided a summary balance
}
