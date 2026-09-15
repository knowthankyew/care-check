# CareCheck (carecheck)

> **An open-source medical bill audit and Section 501(r) charity care reality engine.**  
> *100% local-first, zero personal data extraction. Inspired by the grounded clarity of NotebookLM.*

---

## The Ethos
Fearing avarice is a quiet form of wisdom. Modern software often extracts attention, personal health data, subscription fees, or leverage over people at their most vulnerable moments.

**CareCheck** is built on an opposing principle: **pure utility and protection**. It takes publicly mandated data—hospital 501(r) Financial Assistance Policies, CMS Machine-Readable Price Transparency files, and HHS Federal Poverty Guidelines—wraps it in deterministic order, and equips patients with immediate leverage against predatory billing systems.

### Core Guarantees
- 🛡️ **Zero PHI / PII Network Transmission**: Medical and income data never leaves the patient's device.
- ⚡ **100% Local-First Execution**: Audits, FPL brackets, and dispute letters are evaluated entirely in the client browser runtime.
- 📚 **Grounded Public Knowledge**: Every dollar figure, discount tier, and statutory defense directly cites its legal and regulatory source.
- 📜 **Statutory Safe Harbor**: Automatically invokes federal protections (26 U.S.C. § 501(r)(6), 45 CFR Part 180, No Surprises Act 42 U.S.C. § 300gg-111).
- 🔥 **Instant Local Data Purge**: One-click "Burn Local Data" command immediately obliterates all local session and storage data.

---

## The 3-Panel Studio Workflow

CareCheck Studio is organized into three unified rails:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [🛡️ CareCheck Studio]    [● Zero PHI Network]   [📚 3 Sources Grounded]  [🔥 Burn Data]│
├───────────────────┬──────────────────────────────────────────────┬─────────────────────┤
│ GROUNDED SOURCES  │ REALITY STUDIO CANVAS                        │ DEFENSE & ACTION    │
│ (Left Rail)       │ (Center Workspace)                           │ (Right Rail)        │
│                   │                                              │                     │
│ 1. HHS Poverty    │ • Section 501(r) Charity Care Barometer      │ • Tabbed Generator: │
│    Guidelines     │   - Household size stepper & income presets  │   - 501(r) App      │
│    (42 U.S.C. 9902)│   - Live FPL gauge (0% - 400%)              │   - Price Dispute   │
│                   │   - 240-day statutory ECA Safe Harbor timer  │   - Combined Notice │
│ 2. Hospital FAP   │                                              │                     │
│    Policy & Tiers │ • Medical Bill Price Audit Workbench         │ • Editable Notes    │
│    (26 U.S.C. 501)│   - Total Billed vs Savings vs Target        │ • 1-Click Copy      │
│                   │   - CPT line-item table                      │ • Print to PDF for  │
│ 3. CMS Price      │   - Cash price & markup multiplier badges    │   Certified Mail    │
│    Transparency   │     (e.g., "17.1x Medicare Rate")            │                     │
│    (45 CFR 180)   │   - Unbundling risk alerts                   │                     │
│                   │   - Add/Remove line items                    │                     │
└───────────────────┴──────────────────────────────────────────────┴─────────────────────┘
```

1. **Grounded Sources (Left Rail)**
   - Displays verified public sources: HHS Federal Poverty Guidelines, Hospital 501(r) FAP Policy, and CMS Price Transparency Benchmarks.
   - Click any source card to inspect the underlying statutory text, bracket thresholds, or procedure fee schedules.

2. **Reality Studio Canvas (Center Rail)**
   - **Charity Care Barometer**: Computes real-time poverty percentage (`povertyPercentage % FPL`), matches hospital FAP tiers (`100% Full Forgiveness`, `Sliding Scale`, `AGB Cap`), and displays a live 240-day collection pause counter under 26 U.S.C. § 501(r)(6).
   - **Medical Bill Audit Workbench**: Line-by-line audit comparing billed amounts to published cash rates and Medicare baselines, flagging list price markups (>4x excessive, >8x predatory) and unbundled laboratory codes.

3. **Defense & Action Studio (Right Rail)**
   - Generates formal legal correspondence with complete statutory citations.
   - 1-click **Copy Letter** and **Print / Save PDF** (using unbranded `@media print` styles ready for USPS Certified Mail with Return Receipt).

---

## Repository Structure

```
├── ARCHITECTURE.md                  # Comprehensive architectural specification
├── index.html                       # HTML shell with Google Fonts (Outfit, Inter, JetBrains Mono)
├── vite.config.ts                   # Vite + React configuration
├── data/
│   ├── fpl/
│   │   └── guidelines.json          # HHS Federal Poverty Guidelines (2024, 2025, 2026)
│   ├── hospitals/
│   │   └── seed-hospitals.json      # Seed 501(r) non-profit hospital policies & AGB rates
│   └── benchmarks/
│       └── shoppable-codes.json     # Shoppable CPT codes, cash rates, and Medicare baselines
├── src/
│   ├── contracts/                   # Strongly typed data contracts
│   │   ├── fpl.ts                   # Poverty line and household parameter types
│   │   ├── hospital.ts              # Hospital 501(r) profile, FAP tiers, and AGB schemas
│   │   ├── bill.ts                  # Itemized medical bill and line item schemas
│   │   ├── audit.ts                 # Price audit verdicts and discrepancy flags
│   │   ├── charity-care.ts          # Section 501(r) assessment schemas
│   │   ├── dispute-letter.ts        # Dispute letter payloads and generated document types
│   │   └── index.ts
│   ├── core/                        # Pure domain logic (zero network dependencies)
│   │   ├── charity-care/
│   │   │   └── engine.ts            # Deterministic FPL & 501(r) calculator
│   │   ├── price-audit/
│   │   │   └── engine.ts            # Price audit and benchmark comparator
│   │   └── letter-generator/
│   │       └── engine.ts            # Statutory dispute letter and FAP application generator
│   ├── components/                  # CareCheck Studio React components
│   │   ├── Header.tsx               # Brand, privacy badge, scenario selector, purge button
│   │   ├── SourcePanel.tsx          # NotebookLM left rail: active grounded sources
│   │   ├── SourceModal.tsx          # Source inspector modal for raw statutory texts
│   │   ├── CharityCareBarometer.tsx # 501(r) FPL gauge & 240-day safe harbor counter
│   │   ├── BillAuditWorkbench.tsx   # Itemized bill audit table & markup multipliers
│   │   └── DefenseStudio.tsx        # Legal dispute letter generator & print/PDF export
│   ├── styles/
│   │   └── index.css                # Dark slate glassmorphism & @media print styles
│   ├── App.tsx                      # Root Studio application state & scenario manager
│   ├── main.tsx                     # Application entry point
│   └── index.ts                     # Core library barrel export
└── tests/                           # Vitest test suite
    ├── charity-care.test.ts
    ├── price-audit.test.ts
    └── letter-generator.test.ts
```

---

## Getting Started

### 1. Installation
```bash
git clone https://github.com/carecheck/carecheck.git
cd carecheck
npm install
```

### 2. Launch CareCheck Studio (Web UI)
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build Production Distribution
```bash
npm run build
```

---

## Statutory Legal References

| Statute | Protection |
|---|---|
| **26 U.S.C. § 501(r)(4)** | Mandates written Financial Assistance Policy (FAP). |
| **26 U.S.C. § 501(r)(5)** | Limits charges to eligible individuals to Amounts Generally Billed (AGB). |
| **26 U.S.C. § 501(r)(6)** | **ECA Safe Harbor**: Prohibits Extraordinary Collection Actions for a minimum 240-day window. |
| **45 CFR Part 180** | CMS Price Transparency: Mandates public disclosure of discounted cash prices. |
| **42 U.S.C. § 300gg-111** | **No Surprises Act**: Prohibits balance billing for out-of-network emergency services. |
| **15 U.S.C. § 1692g** | **FDCPA**: Requires written debt validation and immediate collection suspension upon dispute. |

---

## License
MIT License - Built as open public-good software.
