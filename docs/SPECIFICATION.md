# CareCheck: Technical Architecture Specification

> *"Fearing avarice is a quiet form of wisdom. Software can be an act of pure utility and protection: taking public data or open infrastructure, wrapping it in order, and giving it away for free so people can make informed decisions."*

---

## 1. Mission & System Ethos

CareCheck is an open-source, local-first medical bill audit and Section 501(r) charity care reality engine. It protects patients and families from predatory healthcare billing practices by transforming opaque public datasets into immediate defensive leverage.

### 1.1 The Institutional Problem
Medical debt is the single largest driver of personal bankruptcy in the United States:
- **Mandated Charity Care is Concealed**: Under Section 501(r) of the Internal Revenue Code (enacted under the ACA), all 501(c)(3) tax-exempt non-profit hospitals—which constitute ~60% of all community hospitals in the U.S.—are legally required to maintain a written **Financial Assistance Policy (FAP)**. Non-profit hospitals receive tens of billions of dollars in federal, state, and local tax exemptions annually in exchange for providing free or deeply discounted care to low- and moderate-income individuals (typically up to 200%–400% of the Federal Poverty Line). Despite this mandate, hospitals routinely conceal these policies, fail to inform patients, and deploy aggressive third-party debt collectors.
- **Inflated Chargemaster Rates**: Uninsured and out-of-network patients are billed arbitrary "chargemaster" list prices—often marked up 400% to 1,200% above actual Medicare allowable costs.
- **Opaque Price Transparency Data**: While federal CMS rules (45 CFR Part 180) legally require hospitals to publish machine-readable files (MRFs) detailing gross charges, discounted cash prices, and negotiated rates, these files are intentionally unwieldy (often 2GB–50GB CSV/JSON monsters) designed to be unusable by consumers.

### 1.2 The CareCheck Intervention
CareCheck gives patients three immediate protections:
1. **Price Match & Markup Audit**: Cross-references billed CPT/HCPCS codes against the hospital's published cash rate, negotiated minimums, and Medicare fee schedules to flag overcharges, markup multiples, and unbundled codes.
2. **501(r) Charity Care Eligibility Evaluator**: Compares household size, geography, and income against the hospital's specific FAP thresholds and Federal Poverty Guidelines (FPL) to determine exact legal discount eligibility (e.g., 100% full forgiveness vs. sliding-scale relief vs. Amounts Generally Billed caps).
3. **Action & Dispute Letter Generator**: Synthesizes a formal, legally grounded 501(r) Financial Assistance Application and Price Dispute Notice complete with statutory citations, putting an immediate statutory halt on Extraordinary Collection Actions (ECAs).

---

## 2. Threat Model & Zero-Extraction Architecture

Medical data is uniquely toxic when concentrated: it reveals financial precarity, chronic illness, family emergencies, and vulnerable life moments.

```
       ┌──────────────────────────────────────────────────────────┐
       │             THE USER'S PRIVATE BROWSER RUNTIME           │
       │                                                          │
       │   [Itemized Bill]    [Income / Household]                │
       │          │                   │                           │
       │          ▼                   ▼                           │
       │   ┌──────────────────────────────────────────────────┐   │
       │   │           CareCheck Pure Domain Engines          │   │
       │   │  • PriceAuditEngine    • CharityCareEngine       │   │
       │   │  • DisputeLetterEngine                           │   │
       │   └──────────────────────────────────────────────────┘   │
       │          │                   │                           │
       │          ▼                   ▼                           │
       │   [Audit Verdict]     [501(r) Letter]                    │
       │          │                                               │
       │          ▼                                               │
       │   [Local IndexedDB / WebCrypto AES-GCM Vault]            │
       └──────────────────────────────────────────────────────────┘
                         ▲ (Read-Only Public Datasets)
                         │ (No Cookies, No Tracking)
       ┌─────────────────┴────────────────────────────────────────┐
       │             STATIC PUBLIC HOSTING (CDN / Git)            │
       │   • HHS Poverty Guidelines (JSON)                        │
       │   • Hospital 501(r) Policy Registry (JSON)               │
       │   • Shoppable CPT Benchmarks (JSON)                      │
       └──────────────────────────────────────────────────────────┘
```

### 2.1 Security & Privacy Guarantees
- **Zero Network Transmission of PHI/PII**: Not a single byte of patient health information (CPT codes, medical notes, hospital visit dates), identity (names, addresses, account numbers), or financial status (income, household size) is ever transmitted over the network.
- **Zero Backend Servers**: CareCheck operates entirely client-side. The application bundle is a static set of HTML, JavaScript, and CSS files that can be hosted on GitHub Pages or any static CDN.
- **Zero Telemetry & Third-Party Trackers**: No Google Analytics, no Meta Pixels, no Sentry error logging, no session replay tools (FullStory/LogRocket), and no third-party cookie beacons.
- **Aggressive Content Security Policy (CSP)**:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none';
  ```
- **Local Storage Isolation**: All patient records, draft bills, and audit outcomes are persisted in client-controlled `IndexedDB` or volatile memory. Users can export an AES-GCM password-encrypted archive (`.carecheck`) or execute an instant **Burn All Data** command that completely wipes local databases and caches.

### 2.2 Financial Calculation & Rounding Precision
All currency values are calculated using IEEE-754 floating point arithmetic guarded by deterministic 2-decimal rounding (`Number(val.toFixed(2))`) on all intermediate and final outputs. For v0.x releases, these rounding guards prevent UI cent divergence; full integer-cent arithmetic (`cents = Math.round(usd * 100)`) is designated on the roadmap for multi-currency or enterprise-scale reconciliation.

---

## 3. Public Data Architecture & Micro-Indexing

CMS Machine-Readable Files (MRFs) are notorious for their size: a single hospital's JSON file often exceeds 10 GB. Downloading these in the browser is impossible.

CareCheck addresses this through a **Micro-Indexing Slicing Pipeline**:

```
[CMS Hospital Raw MRF] (Multi-GB JSON/CSV)
         │
         ▼ (Offline / GitHub Action Builder Pipeline)
[MRF Parser & Normalizer]
         │
         ├── Extracted: Standard Gross Charges
         ├── Extracted: Discounted Cash Prices
         ├── Extracted: Payer-Specific Min / Max Rates
         └── Filtered: Top 300 Shoppable & High-Volume CPT Codes
         │
         ▼
[Micro-Index Slice: <ein>_<npi>.json] (~50KB – 200KB gzip)
         │
         ▼
[Public Static CDN Repository: /data/hospitals/]
         │
         ▼ (Client On-Demand Fetch: ONLY requested hospital)
[CareCheck Client Browser Memory]
```

### 3.1 Public Data Repositories
1. **HHS Federal Poverty Guidelines (`/data/fpl/`)**:
   - Updated annually upon publication in the Federal Register (typically late January).
   - Covers all 3 statutory geographical zones: Contiguous 48 States + DC, Alaska, and Hawaii.
2. **Hospital 501(r) Policy Registry (`/data/hospitals/`)**:
   - Curated database of non-profit hospitals indexed by CMS Certification Number (CCN), EIN, and NPI.
   - Contains structured Financial Assistance Policy (FAP) thresholds, Amounts Generally Billed (AGB) discount percentages, application deadlines (minimum 240 days from first post-discharge billing statement under § 501(r)(6)), and physical mailing addresses for certified mail.
3. **Shoppable Procedure Benchmarks (`/data/benchmarks/`)**:
   - Median national cash prices and Medicare Fee Schedule (PFS) allowable amounts for common emergency, inpatient, and outpatient CPT/HCPCS codes.

---

## 4. Mathematical & Statutory Logic

### 4.1 Federal Poverty Level (FPL) Calculation
Under 42 U.S.C. § 9902(2), the Federal Poverty Line for a household of size $S$ in region $R$ for year $Y$ is defined as:

$$\text{FPL}(S, R, Y) = \text{Base}(R, Y) + (S - 1) \times \text{Increment}(R, Y)$$

The patient's FPL percentage is calculated as:

$$\text{PovertyPercentage} = \left( \frac{\text{AnnualHouseholdIncome}}{\text{FPL}(S, R, Y)} \right) \times 100$$

*Note: If monthly income is provided, it is annualized: $\text{AnnualIncome} = \text{MonthlyIncome} \times 12$.*

### 4.2 Section 501(r) Assistance Tiers
A hospital's Financial Assistance Policy defines discrete FPL tier intervals $[0, T_1], (T_1, T_2], \dots, (T_{k-1}, T_k]$:

$$\text{AssistanceTier} = \begin{cases} 
100\% \text{ Relief (Zero Balance)}, & \text{if } \text{PovertyPercentage} \le T_{\text{full}} \\
\text{Sliding Scale } (D_i\% \text{ Discount}), & \text{if } T_{i-1} < \text{PovertyPercentage} \le T_i \\
\text{Amounts Generally Billed (AGB) Cap}, & \text{if Uninsured and } \text{PovertyPercentage} > T_{\text{fap\_max}} \\
\text{No Policy Discount}, & \text{otherwise}
\end{cases}$$

### 4.3 Amounts Generally Billed (AGB) Limitation
Under 26 U.S.C. § 501(r)(5) and 26 CFR § 1.501(r)-5, a tax-exempt hospital is strictly prohibited from charging an individual eligible for financial assistance more than the **Amounts Generally Billed (AGB)** to individuals who have insurance covering such care. The AGB ratio is typically calculated using the look-back method:

$$\text{AGB Cap} = \text{Gross Chargemaster Charge} \times \text{Hospital AGB Percentage}$$

Any bill charging an uninsured patient the undiscounted gross chargemaster rate violates federal statutory guidelines if the patient qualifies for assistance.

### 4.4 Price Audit & Markup Evaluation
For each line item $i$ with billed charge $B_i$:
- **Cash Rate Comparison**: If published discounted cash price $C_i > 0$ and $B_i > C_i$:
  $$\text{PotentialCashSavings}_i = B_i - C_i$$
- **Medicare Markup Ratio**: Against Medicare baseline $M_i$:
  $$\text{MarkupMultiplier}_i = \frac{B_i}{M_i}$$
  - $\text{Multiplier} > 4.0\times$: Flagged as **Excessive Chargemaster Markup**.
  - $\text{Multiplier} > 8.0\times$: Flagged as **Predatory Inflation**.
- **Unbundling Detector**: Cross-checks billed CPT code combinations against standard CMS National Correct Coding Initiative (NCCI) unbundling rules (e.g., billing comprehensive panels alongside constituent individual laboratory tests).

---

## 5. Legal & Statutory Framework

Every document generated by CareCheck incorporates statutory legal citations designed to protect patients:

| Statute | Legal Protection & Safe Harbor |
|---|---|
| **26 U.S.C. § 501(r)(4)** | Mandates written Financial Assistance Policy (FAP) and plain-language summary. |
| **26 U.S.C. § 501(r)(5)** | Limits charges to eligible individuals to Amounts Generally Billed (AGB). |
| **26 U.S.C. § 501(r)(6)** | **ECA Safe Harbor**: Prohibits Extraordinary Collection Actions (credit reporting, lawsuits, wage garnishment) before reasonable efforts are made to determine FAP eligibility (minimum 240-day notification/application period). |
| **45 CFR Part 180** | CMS Hospital Price Transparency: Requires public availability of standard charges and discounted cash prices. |
| **42 U.S.C. § 300gg-111** | **No Surprises Act**: Prohibits balance billing for out-of-network emergency services and certain non-emergency services at in-network facilities without explicit consent. |
| **15 U.S.C. § 1692g** | **Fair Debt Collection Practices Act (FDCPA)**: Requires debt collectors to cease collection activities upon receipt of a timely written dispute until debt verification is obtained. |

---

## 6. Data Contracts & Type Architecture

The application is structured into decoupled modules with strict typing contracts:

```
src/contracts/
├── fpl.ts             # HHS Federal Poverty Guidelines schemas
├── hospital.ts        # Hospital profile, FAP tiers, and AGB rates
├── bill.ts            # Medical bill headers, encounters, and line items
├── audit.ts           # Audit results, savings calculations, discrepancy flags
├── charity-care.ts    # 501(r) eligibility assessment outcomes
├── dispute-letter.ts  # Structured input for legal document generation
└── index.ts           # Central contract export
```

### Key Schemas
- `HospitalProfile`: Legal entity identifiers (EIN, NPI, CCN), address, 501(c)(3) verification, FAP eligibility brackets (`fapTiers`), AGB percentage, and billing dispute contact.
- `ItemizedMedicalBill`: Complete bill representation containing an array of `BillLineItem` records (CPT/HCPCS, Revenue Code, description, billed amount, insurer payments).
- `PriceAuditResult`: Aggregated financial analysis including `totalBilled`, `totalPotentialSavings`, line-item discrepancy flags (`OverchargedVsCashPrice`, `ExcessiveMedicareMarkup`, `UnbundledCodeRisk`), and prioritized patient recommendations.
- `CharityCareAssessment`: Determination of FPL bracket percentage, qualifying tier (`FullForgiveness`, `SlidingScale`, `AgBDiscount`, `Ineligible`), required documentation checklist, and statutory safe harbor notice.
- `DisputeLetterPayload`: Parameterized data structure for generating certified mail dispute notices and FAP applications.

---

## 7. Local-First Stack Specifications

| Component | Technology | Rationale |
|---|---|---|
| **Language** | TypeScript 5.5+ (Strict Mode) | Strong mathematical typing, safety across currency and percentage calculations. |
| **Runtime** | Modern Browser / Node 20+ | Universal portability; runs offline in browser or headless test environments. |
| **Testing** | Vitest | Extremely fast, deterministic unit test execution with zero config overhead. |
| **Client Storage** | IndexedDB / WebCrypto (AES-GCM) | Zero server dependency, persistent client-side bill history, encrypted backups. |
| **Document Output**| Semantic HTML + Print CSS / Markdown | Lightweight, dependency-free, converts directly to print/PDF in any browser. |
| **Data Format** | Validated JSON Schemas | Easily auditable, git-versionable public datasets. |

---

## 8. Extensibility & Future Roadmap

1. **OCR / Bill Parser Module**: Client-side OCR via Tesseract.js / WebAssembly to automatically extract CPT codes and dollar amounts directly from phone photos or scanned PDFs without uploading images to any server.
2. **50-State Statutory Overlays**: State-specific medical debt laws (e.g., California AB 1020/AB 532, New York fair pricing laws, Maryland hospital financial assistance mandates) extending federal 501(r) baseline protections.
3. **Crowdsourced FAP Catalog**: Community-driven, Git-backed submissions of hospital financial assistance policies validated via pull request automation.

---

## 9. Data Provenance, Licensing & Legal Safeguards

### 9.1 Hospital Policy Scalability & Dual-Mode Architecture
Seed hospital policies (`seed-hospitals.json`) cannot feasibly catalog all ~3,000+ U.S. 501(c)(3) hospitals whose FAP brackets and AGB percentages change annually. To prevent maintenance rot:
- **Seed Presets**: Serve as verified reference templates with documented primary-source Form 990 / published FAP citations.
- **Client Policy Editor**: Allows patients to input their hospital's exact FAP brackets, AGB discount rate, and certified mailing address directly from their physical billing statement or plain-language summary.
- **Local Persistence & Portability**: Custom policies can be exported and imported as structured JSON files locally, preserving the zero-network PHI guarantee.

### 9.2 CPT® Licensing vs. CMS Public Domain
- **Public Domain Baselines**: Medicare Physician Fee Schedule (MPFS) baselines, Outpatient Prospective Payment System (OPPS) Addendum B rates, and NCCI unbundling edits are works of the U.S. Federal Government and reside in the public domain under **17 U.S.C. § 105**.
- **CPT® Trademark & Short Descriptors**: CPT® is a registered trademark of the American Medical Association (AMA). CareCheck benchmark data strictly utilizes abbreviated public-use descriptors and avoids proprietary long descriptions. CareCheck is an independent educational tool and not affiliated with the AMA.
- **Patient-Supplied Data Model**: CareCheck operates as an analytical engine over codes entered by the patient from their own itemized bill, rather than distributing a commercial medical coding ontology.

### 9.3 Unauthorized Practice of Law (UPL) Safeguards
The letter generator produces formal correspondence invoking statutory rights (26 U.S.C. § 501(r)(6), 45 CFR Part 180, 15 U.S.C. § 1692g). To eliminate patient reliance risks and UPL exposure:
- **Prominent UI Notices**: High-visibility disclaimer banner in the Defense Studio notifying users that CareCheck is an informational self-advocacy engine, not a law firm.
- **Immutable Output Disclaimers**: All generated dispute letters—both in copied Markdown and rendered print/PDF formats—contain an explicit Notice & Self-Advocacy Disclaimer stating the document does not constitute formal legal representation or create an attorney-client relationship.

