import React, { useState } from 'react';
import type { CharityCareAssessment } from '../contracts/charity-care.js';
import type { PriceAuditResult } from '../contracts/audit.js';
import type { DisputeLetterPayload, LetterType, PatientContactInfo } from '../contracts/dispute-letter.js';
import { generateDisputeLetter } from '../core/letter-generator/engine.js';

interface DefenseStudioProps {
  charityAssessment: CharityCareAssessment;
  auditResult: PriceAuditResult;
  accountNumber: string;
  statementDate: string;
}

export const DefenseStudio: React.FC<DefenseStudioProps> = ({
  charityAssessment,
  auditResult,
  accountNumber,
  statementDate,
}) => {
  const [letterType, setLetterType] = useState<LetterType>('COMPREHENSIVE_PROTECTION_NOTICE');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientContactInfo>({
    fullName: 'Jane Doe',
    addressLine1: '452 Elm Street',
    city: 'Cleveland',
    state: 'OH',
    zipCode: '44101',
    phoneNumber: '(216) 555-0199',
    email: 'jane.doe@example.org',
  });
  const [patientNotes, setPatientNotes] = useState(
    'I experienced unforeseen hardship following this emergency visit and request immediate assistance under Section 501(r).'
  );

  const payload: DisputeLetterPayload = {
    letterType,
    patient: patientInfo,
    accountNumber,
    statementDate,
    charityCareAssessment: charityAssessment,
    auditResult,
    additionalPatientStatement: patientNotes,
  };

  const generatedDoc = generateDisputeLetter(payload);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(generatedDoc.markdownContent)
        .then(() => {
          setCopied(true);
          setCopyError(false);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          setCopyError(true);
          setTimeout(() => setCopyError(false), 3000);
        });
    } else {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'CareCheck Print Frame');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(generatedDoc.htmlContent);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    } else {
      window.print();
    }
  };

  return (
    <aside className="panel defense-column">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Defense & Action Studio
        </h2>
        <span className="panel-badge" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          Statutory Shield
        </span>
      </div>

      {/* Tabs */}
      <div className="letter-type-tabs">
        <button
          className={`letter-tab ${letterType === 'COMPREHENSIVE_PROTECTION_NOTICE' ? 'active' : ''}`}
          onClick={() => setLetterType('COMPREHENSIVE_PROTECTION_NOTICE')}
        >
          Combined Notice
        </button>
        <button
          className={`letter-tab ${letterType === '501R_FINANCIAL_ASSISTANCE_APPLICATION' ? 'active' : ''}`}
          onClick={() => setLetterType('501R_FINANCIAL_ASSISTANCE_APPLICATION')}
        >
          501(r) Application
        </button>
        <button
          className={`letter-tab ${letterType === 'PRICE_TRANSPARENCY_AUDIT_DISPUTE' ? 'active' : ''}`}
          onClick={() => setLetterType('PRICE_TRANSPARENCY_AUDIT_DISPUTE')}
        >
          Price Audit Dispute
        </button>
      </div>

      {/* Patient Name / Address Quick Edit */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <div>
          <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Patient Full Name</label>
          <input
            type="text"
            className="input-num"
            style={{ fontSize: '0.78rem' }}
            maxLength={100}
            value={patientInfo.fullName}
            onChange={(e) => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Phone Number</label>
          <input
            type="text"
            className="input-num"
            style={{ fontSize: '0.78rem' }}
            maxLength={30}
            value={patientInfo.phoneNumber}
            onChange={(e) => setPatientInfo({ ...patientInfo, phoneNumber: e.target.value })}
          />
        </div>
      </div>

      {/* Editable Notes */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
          Personal Hardship Statement (Optional, max 2,500 chars)
        </label>
        <textarea
          className="input-num"
          style={{
            width: '100%',
            height: '52px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-sans)',
            resize: 'none',
          }}
          maxLength={2500}
          value={patientNotes}
          onChange={(e) => setPatientNotes(e.target.value)}
        />
      </div>

      {/* Live Preview Box */}
      <div className="letter-preview-box">{generatedDoc.markdownContent}</div>

      {/* Action Buttons */}
      <div className="defense-actions">
        <button className="btn-secondary" onClick={handleCopy}>
          {copied ? '✓ Copied!' : copyError ? '⚠ Copy Failed' : 'Copy Letter'}
        </button>
        <button className="btn-primary" onClick={handlePrint}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print / Save PDF
        </button>
      </div>

      <div style={{ marginTop: '12px', fontSize: '0.72rem', color: '#64748b' }}>
        📬 <strong>Delivery Advice:</strong> Send via USPS Certified Mail with Return Receipt Requested. Verify hospital NPI/CCN on your itemized billing statement before mailing. Keep a copy for proof of ECA safe harbor invocation under 26 CFR § 1.501(r)-6.
      </div>
    </aside>
  );
};
