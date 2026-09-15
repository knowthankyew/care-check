/**
 * CareCheck Legal Dispute & 501(r) Application Generator
 * Generates formal letters with statutory citations under 26 U.S.C. § 501(r),
 * 45 CFR Part 180 (Price Transparency), and 42 U.S.C. § 300gg-111 (No Surprises Act).
 */

import type {
  DisputeLetterPayload,
  GeneratedDocument,
} from '../../contracts/dispute-letter.js';

export function generateDisputeLetter(payload: DisputeLetterPayload): GeneratedDocument {
  const {
    letterType,
    patient,
    accountNumber,
    statementDate,
    charityCareAssessment,
    auditResult,
    additionalPatientStatement,
  } = payload;

  const letterDate = payload.letterDate || new Date().toISOString().split('T')[0]!;
  const hospitalName =
    charityCareAssessment?.hospitalLegalName ||
    auditResult?.hospitalName ||
    'Hospital Billing Department';

  const statutoryCitations: string[] = [
    'Internal Revenue Code Section 501(r)(4) [26 U.S.C. § 501(r)(4)] - Financial Assistance Policy Mandate',
    'Internal Revenue Code Section 501(r)(5) [26 U.S.C. § 501(r)(5)] - Limitation on Charges (Amounts Generally Billed)',
    'Internal Revenue Code Section 501(r)(6) [26 U.S.C. § 501(r)(6)] - Prohibition of Extraordinary Collection Actions (ECAs)',
    'CMS Hospital Price Transparency Rule [45 CFR Part 180] - Requirement to Disclose Cash & Standard Charges',
    'No Surprises Act [42 U.S.C. § 300gg-111] - Consumer Protection & Balance Billing Standards',
    'Fair Debt Collection Practices Act (FDCPA) [15 U.S.C. § 1692g] - Written Validation of Debts & Cessation of Collections',
  ];

  const mailingInstructions: string[] = [
    'Send via USPS Certified Mail with Return Receipt Requested (or trackable delivery). Keep a signed physical copy and the postmarked certified tracking stub for your legal records.',
    'Include copies of all income verification documents (Form 1040, recent paystubs, or zero-income affidavit). Do not send original documents.',
    'Retain proof of mailing. Under 26 CFR § 1.501(r)-6, once a hospital receives an assistance application, all extraordinary collection actions must immediately cease.',
  ];

  let title = '';
  let markdownContent = '';

  if (letterType === '501R_FINANCIAL_ASSISTANCE_APPLICATION') {
    title = `Section 501(r) Formal Financial Assistance Application - Account #${accountNumber}`;
    markdownContent = generate501rMarkdown(
      letterDate,
      patient,
      hospitalName,
      accountNumber,
      statementDate,
      charityCareAssessment,
      additionalPatientStatement
    );
  } else if (letterType === 'PRICE_TRANSPARENCY_AUDIT_DISPUTE') {
    title = `Formal Medical Bill Dispute & Price Transparency Audit - Account #${accountNumber}`;
    markdownContent = generateAuditDisputeMarkdown(
      letterDate,
      patient,
      hospitalName,
      accountNumber,
      statementDate,
      auditResult,
      additionalPatientStatement
    );
  } else {
    title = `Formal Demand for 501(r) Financial Assistance & Price Audit Dispute - Account #${accountNumber}`;
    markdownContent = generateComprehensiveMarkdown(
      letterDate,
      patient,
      hospitalName,
      accountNumber,
      statementDate,
      charityCareAssessment,
      auditResult,
      additionalPatientStatement
    );
  }

  const legalDisclaimerMarkdown = `\n\n---\n**Notice & Self-Advocacy Disclaimer:** This document was prepared using the CareCheck open-source reality engine for patient self-advocacy and informational records only. CareCheck is not a law firm, does not constitute formal legal advice or provide legal representation, and does not create an attorney-client relationship. If you are facing active collection litigation, court summons, or wage garnishment, consult a licensed attorney or accredited consumer defense specialist.`;
  markdownContent = markdownContent + legalDisclaimerMarkdown;


  const htmlContent = wrapInPrintableHtml(title, markdownContent);


  return {
    title,
    letterType,
    generatedDate: new Date().toISOString(),
    markdownContent,
    htmlContent,
    statutoryCitations,
    mailingInstructions,
  };
}

function generate501rMarkdown(
  letterDate: string,
  patient: DisputeLetterPayload['patient'],
  hospitalName: string,
  accountNumber: string,
  statementDate: string,
  assessment?: DisputeLetterPayload['charityCareAssessment'],
  patientNotes?: string
): string {
  const fplPercent = assessment ? `${assessment.fplPercentage}%` : 'low-to-moderate';
  const householdSize = assessment ? assessment.householdSize : 'N/A';
  const tierName = assessment ? assessment.qualifyingTierName : 'Section 501(r) Financial Assistance';
  const expectedDiscount = assessment ? `${assessment.discountPercentage}%` : 'Complete or Substantial';
  const originalBalance = assessment ? `$${assessment.originalPatientBalanceUSD.toFixed(2)}` : 'the billed amount';
  const adjustedBalance = assessment ? `$${assessment.adjustedPatientBalanceUSD.toFixed(2)}` : '$0.00';

  return `**SENT VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED**

**Date:** ${letterDate}

**To:**  
Patient Financial Services / Charity Care Office  
${hospitalName}

**From:**  
${patient.fullName}  
${patient.addressLine1}  
${patient.addressLine2 ? patient.addressLine2 + '  \n' : ''}${patient.city}, ${patient.state} ${patient.zipCode}  
Phone: ${patient.phoneNumber}${patient.email ? '\nEmail: ' + patient.email : ''}

**Subject:** Formal Application for Section 501(r) Financial Assistance and Notice of ECA Safe Harbor  
**Patient Name:** ${patient.fullName}  
**Account Number:** ${accountNumber}  
**Billing Statement Date:** ${statementDate}

Dear Billing Director / Financial Assistance Committee,

I am writing to formally submit this application for financial assistance regarding the medical services rendered under Account #${accountNumber}. 

As a 501(c)(3) tax-exempt healthcare institution, ${hospitalName} is legally obligated under **Section 501(r) of the Internal Revenue Code (26 U.S.C. § 501(r))** to maintain and honor a written Financial Assistance Policy (FAP) for eligible patients.

### 1. Household Income & Eligibility Determination
- **Household Size:** ${householdSize}
- **Current Income Relative to Federal Poverty Guidelines:** ${fplPercent} FPL
- **Qualifying FAP Tier:** ${tierName}
- **Mandated Assistance Level:** ${expectedDiscount} Relief
- **Original Balance:** ${originalBalance}
- **Adjusted Allowable Responsibility:** ${adjustedBalance}

Enclosed please find copies of the documentation verifying household income, including recent wage statements/tax returns.

${patientNotes ? `### 2. Patient Statement of Hardship\n${patientNotes}\n` : ''}
### ${patientNotes ? '3' : '2'}. Notice of Statutory Safe Harbor Under 26 U.S.C. § 501(r)(6)
Please take notice that under **26 U.S.C. § 501(r)(6)** and Treasury Regulation **26 CFR § 1.501(r)-6**, a tax-exempt hospital is strictly prohibited from engaging in any **Extraordinary Collection Actions (ECAs)**—including referral to external debt collectors, reporting adverse credit information, or filing legal actions—before making reasonable efforts to determine whether an individual is FAP-eligible.

The submission of this application triggers an immediate statutory hold on all collection activities for at least 240 days following the first post-discharge billing statement.

### Request for Relief
I respectfully request that you:
1. Immediately place this account on a collection hold and suspend any third-party debt collection activities.
2. Review the enclosed verification materials and adjust the outstanding balance to reflect the qualifying ${expectedDiscount} financial assistance reduction.
3. Provide written confirmation of the adjusted or discharged balance within thirty (30) business days.

Thank you for your prompt attention to this matter.

Sincerely,

__________________________________________  
**${patient.fullName}**  
Date: ${letterDate}
`;
}

function generateAuditDisputeMarkdown(
  letterDate: string,
  patient: DisputeLetterPayload['patient'],
  hospitalName: string,
  accountNumber: string,
  statementDate: string,
  audit?: DisputeLetterPayload['auditResult'],
  patientNotes?: string
): string {
  const savings = audit ? `$${audit.totalPotentialSavingsUSD.toFixed(2)}` : 'unjustified charges';
  const fairTarget = audit ? `$${audit.recommendedFairSettlementUSD.toFixed(2)}` : 'a reasonable cash rate';

  let itemsTable = '';
  if (audit && audit.lineItemAudits.length > 0) {
    itemsTable = `
| Code | Description | Billed Charge | Cash Rate / Benchmark | Audit Findings |
|---|---|---|---|---|
` + audit.lineItemAudits.map((item) => {
      const benchmarkStr = item.hospitalCashPrice
        ? `Cash: $${item.hospitalCashPrice.toFixed(2)}`
        : item.medicareBaselineRate
        ? `Medicare: $${item.medicareBaselineRate.toFixed(2)}`
        : 'N/A';
      return `| ${item.code} | ${escapePipe(item.description)} | $${item.billedCharge.toFixed(2)} | ${benchmarkStr} | ${escapePipe(item.explanation)} |`;
    }).join('\n');
  }

  return `**SENT VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED**

**Date:** ${letterDate}

**To:**  
Billing Disputes & Patient Financial Services  
${hospitalName}

**From:**  
${patient.fullName}  
${patient.addressLine1}  
${patient.addressLine2 ? patient.addressLine2 + '  \n' : ''}${patient.city}, ${patient.state} ${patient.zipCode}  
Phone: ${patient.phoneNumber}${patient.email ? '\nEmail: ' + patient.email : ''}

**Subject:** Formal Dispute of Itemized Charges and Notice of Price Transparency Violations  
**Patient Name:** ${patient.fullName}  
**Account Number:** ${accountNumber}  
**Billing Statement Date:** ${statementDate}

Dear Billing Supervisor,

I am writing to formally dispute the charges billed on Account #${accountNumber} pursuant to federal healthcare price transparency regulations (**45 CFR Part 180**) and consumer fair-pricing standards.

A formal audit of the itemized statement reveals that the billed charges significantly exceed ${hospitalName}'s publicly posted cash prices and reflect arbitrary chargemaster markups that are inconsistent with federal transparency baselines.

### 1. Disputed Line Items & Audit Findings
${itemsTable || 'The itemized charges contain unbundled line items and exceed published cash rates.'}

- **Total Inflated / Disputed Charges:** ${savings}
- **Defensible Settlement Ceiling:** ${fairTarget}

${patientNotes ? `### 2. Patient Statement\n${patientNotes}\n` : ''}
### ${patientNotes ? '3' : '2'}. Statutory Basis & Dispute Demand
Under **45 CFR Part 180**, hospitals are required to make public their standard charges and discounted cash prices. Billed amounts exceeding publicly posted discounted cash rates for uninsured or self-pay accounts violate federal price transparency mandates.

Furthermore, under Section 501(r)(6) of the Internal Revenue Code (26 U.S.C. § 501(r)(6)) and federal consumer protection standards, I demand:
1. Immediate cessation of any collection attempts or referral to third-party collection agencies while this billing dispute remains unresolved.
2. A corrected billing statement reducing all billed line items to the published discounted cash rate or fair baseline of **${fairTarget}**.
3. A detailed coding justification for any disputed or unbundled charges.
4. If this account has already been referred or assigned to a third-party collection agency, please be advised that this notice constitutes a formal dispute requiring immediate cessation of collection activities under the Fair Debt Collection Practices Act (15 U.S.C. § 1692g) until full verification is furnished.

Please provide your formal written response within thirty (30) business days.

Sincerely,

__________________________________________  
**${patient.fullName}**  
Date: ${letterDate}
`;
}

function generateComprehensiveMarkdown(
  letterDate: string,
  patient: DisputeLetterPayload['patient'],
  hospitalName: string,
  accountNumber: string,
  statementDate: string,
  assessment?: DisputeLetterPayload['charityCareAssessment'],
  audit?: DisputeLetterPayload['auditResult'],
  patientNotes?: string
): string {
  return `**SENT VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED**

**Date:** ${letterDate}

**To:**  
Office of Patient Financial Assistance & Billing Administration  
${hospitalName}

**From:**  
${patient.fullName}  
${patient.addressLine1}  
${patient.addressLine2 ? patient.addressLine2 + '  \n' : ''}${patient.city}, ${patient.state} ${patient.zipCode}  
Phone: ${patient.phoneNumber}${patient.email ? '\nEmail: ' + patient.email : ''}

**Subject:** Formal Demand for Section 501(r) Financial Assistance & Medical Bill Price Dispute  
**Patient Name:** ${patient.fullName}  
**Account Number:** ${accountNumber}  
**Statement Date:** ${statementDate}

Dear Billing Director and Financial Assistance Committee,

Please accept this correspondence as both a **formal application for Section 501(r) Financial Assistance** and a **formal dispute of inflated chargemaster charges** billed on Account #${accountNumber}.

### 1. Section 501(r) Financial Assistance Qualification
Under **26 U.S.C. § 501(r)(4)** and ${hospitalName}'s written Financial Assistance Policy, my household qualifies for relief:
- **Household Size:** ${assessment?.householdSize ?? 'N/A'}
- **Poverty Bracket:** ${assessment ? `${assessment.fplPercentage}% FPL` : 'Low-to-moderate'}
- **Qualifying Relief Tier:** ${assessment?.qualifyingTierName ?? 'Charity Care Policy'}
- **Applicable Balance Adjustment:** ${assessment ? `${assessment.discountPercentage}% Discount` : 'Full Forgiveness'}
- **Adjusted Allowable Responsibility:** ${assessment ? `$${assessment.adjustedPatientBalanceUSD.toFixed(2)}` : '$0.00'}

### 2. Price Audit & Chargemaster Inflation Findings
Independent audit of the itemized billing codes confirms that the gross chargemaster charges reflect significant overcharges:
- Total Potential Overcharges vs. Cash/Medicare Rates: ${audit ? `$${audit.totalPotentialSavingsUSD.toFixed(2)}` : 'Significant overbilling'}
- Statutory AGB Limitation (26 U.S.C. § 501(r)(5)): As an eligible individual, I may not be charged more than the Amounts Generally Billed to insured patients.

${patientNotes ? `### 3. Patient Statement\n${patientNotes}\n` : ''}
### ${patientNotes ? '4' : '3'}. Safe Harbor Invocation Under 26 U.S.C. § 501(r)(6)
This notice formally invokes the statutory safe harbor protections under **26 U.S.C. § 501(r)(6)** and **26 CFR § 1.501(r)-6**. The hospital and any contracted collection agencies must immediately halt all Extraordinary Collection Actions (ECAs), including credit reporting and legal proceedings, until this application and dispute are fully processed.

Please furnish written confirmation of the adjusted account balance within thirty (30) days.

Sincerely,

__________________________________________  
**${patient.fullName}**  
Date: ${letterDate}
`;
}

function wrapInPrintableHtml(title: string, markdown: string): string {
  const lines = markdown.split('\n');
  const htmlLines: string[] = [];
  let inTable = false;
  let inThead = false;
  let inTbody = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] || '';
    const trimmed = rawLine.trim();

    // Check if line is a table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Is it a header separator like |---|---| ?
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));

      if (isSeparator) {
        if (inThead) {
          htmlLines.push('</thead><tbody>');
          inThead = false;
          inTbody = true;
        }
        continue;
      }

      if (!inTable) {
        inTable = true;
        inThead = true;
        htmlLines.push('<table><thead><tr>');
        for (const cell of cells) {
          htmlLines.push(`<th>${formatInline(escapeHtml(cell))}</th>`);
        }
        htmlLines.push('</tr>');
        continue;
      }

      // Regular body row
      htmlLines.push('<tr>');
      for (const cell of cells) {
        htmlLines.push(`<td>${formatInline(escapeHtml(cell))}</td>`);
      }
      htmlLines.push('</tr>');
      continue;
    }

    // If we were in a table and this line is not a table row, close table
    if (inTable) {
      if (inThead) htmlLines.push('</thead>');
      if (inTbody) htmlLines.push('</tbody>');
      htmlLines.push('</table>');
      inTable = false;
      inThead = false;
      inTbody = false;
    }

    if (trimmed.startsWith('### ')) {
      htmlLines.push(`<h3>${formatInline(escapeHtml(trimmed.slice(4)))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      htmlLines.push(`<h2>${formatInline(escapeHtml(trimmed.slice(3)))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      htmlLines.push(`<h1>${formatInline(escapeHtml(trimmed.slice(2)))}</h1>`);
    } else if (trimmed.startsWith('- ')) {
      htmlLines.push(`<li>${formatInline(escapeHtml(trimmed.slice(2)))}</li>`);
    } else if (trimmed === '---') {
      htmlLines.push('<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 24px 0;" />');
    } else if (trimmed === '') {
      htmlLines.push('<br/>');
    } else {
      htmlLines.push(`<p>${formatInline(escapeHtml(trimmed))}</p>`);
    }

  }

  if (inTable) {
    if (inThead) htmlLines.push('</thead>');
    if (inTbody) htmlLines.push('</tbody>');
    htmlLines.push('</table>');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20mm; font-size: 11pt; color: #000; }
      .no-print { display: none !important; }
      @page { margin: 20mm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
    p, li { font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    strong { color: #0f172a; }
    .upl-disclaimer {
      margin-bottom: 24px;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      font-size: 11px;
      color: #64748b;
      border-radius: 6px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="upl-disclaimer no-print">
    <strong>Notice & Self-Advocacy Disclaimer:</strong> This document was prepared using the CareCheck open-source reality engine for self-advocacy and informational purposes only and does not constitute formal legal advice. Consult a licensed attorney or accredited patient advocate for legal representation.
  </div>
  ${htmlLines.join('\n')}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapePipe(text: string): string {
  return text.replace(/\|/g, '-');
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}
