/**
 * CareCheck Data Contract: Dispute Letter & 501(r) Legal Application Generator
 */

import type { CharityCareAssessment } from './charity-care.js';
import type { PriceAuditResult } from './audit.js';

export type LetterType =
  | '501R_FINANCIAL_ASSISTANCE_APPLICATION'
  | 'PRICE_TRANSPARENCY_AUDIT_DISPUTE'
  | 'COMPREHENSIVE_PROTECTION_NOTICE';

export interface PatientContactInfo {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email?: string;
}

export interface DisputeLetterPayload {
  letterType: LetterType;
  patient: PatientContactInfo;
  accountNumber: string;
  encounterNumber?: string;
  statementDate: string;
  dueDate?: string;
  charityCareAssessment?: CharityCareAssessment;
  auditResult?: PriceAuditResult;
  additionalPatientStatement?: string;
  letterDate?: string; // Defaults to current date (YYYY-MM-DD)
}

export interface GeneratedDocument {
  title: string;
  letterType: LetterType;
  generatedDate: string; // ISO 8601
  markdownContent: string;
  htmlContent: string;
  statutoryCitations: string[];
  mailingInstructions: string[];
}
