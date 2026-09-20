# Contributing Statutory Charity Care Policies to CareCheck

Welcome! Healthcare advocates, legal aid attorneys, and civic volunteers can contribute state charity care statutes, hospital financial assistance mandates, and medical debt protections to CareCheck without writing or modifying any TypeScript code.

## How to Add or Update a Jurisdiction

1. **Locate or Create the Policy File**:
   - Files are stored in `policies/jurisdictions/<STATE_CODE>.json` (e.g. `policies/jurisdictions/CO.json` for Colorado HB 21-1198).
   - If adding a new state, copy `policies/templates/jurisdiction-template.json` to `policies/jurisdictions/<STATE_CODE>.json`.

2. **Update the Fields**:
   - `jurisdiction.code`: Two-letter state code (e.g., `"CO"`).
   - `jurisdiction.name`: Full jurisdiction name (e.g., `"Colorado"`).
   - `metadata.statuteRef`: Primary statutory citation (e.g., `"C.R.S. § 25.5-3-501"`).
   - `metadata.officialSourceUrl`: Official state Department of Health or legislative link.
   - `mandates.fullCharityFplThresholdPercent`: Minimum FPL percentage where care must be 100% free / forgiven (e.g., 200 or 250).
   - `mandates.partialDiscountFplThresholdPercent`: Upper FPL percentage where sliding scale discounts must be offered (e.g., 400).
   - `mandates.minimumEcaNoticeDays`: Mandatory notification window before Extraordinary Collection Actions (typically at least 240 days).
   - `mandates.assetExemptionRequired`: Whether state law protects primary residence/retirement assets from hospital asset tests.
   - `mandates.statutoryProtections`: Array of plain-language legal protections for patients.

3. **Validate Your Changes**:
   ```bash
   npm run validate:policies
   ```

4. **Submit a Pull Request**:
   Open a PR against `main`. Our CI will automatically validate your policy file against the schema.
