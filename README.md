# CareCheck (carecheck)

> **An open-source medical bill audit and Section 501(r) charity care reality engine.**  
> *100% local-first, zero personal data extraction.*

---

## The Ethos
Fearing avarice is a quiet form of wisdom. Modern software often extracts attention, personal health data, subscription fees, or leverage over people at their most vulnerable moments.

**CareCheck** is built on an opposing principle: **pure utility and protection**. It takes publicly mandated data—hospital 501(r) Financial Assistance Policies, CMS Machine-Readable Price Transparency files, and HHS Federal Poverty Guidelines—wraps it in deterministic order, and equips patients with immediate leverage against predatory billing systems.

### Core Guarantees
- 🛡️ **Zero PHI / PII Network Transmission**: Medical and income data never leaves the patient's device.
- ⚡ **100% Local-First Execution**: Audits, FPL brackets, and dispute letters are evaluated entirely in the client runtime.
- 📜 **Statutory Leverage**: Automatically invokes federal safe harbors (26 U.S.C. § 501(r)(6), 45 CFR Part 180, No Surprises Act).

---

## Key Features

1. **Section 501(r) Charity Care Evaluator**
   - Calculates exact Federal Poverty Level (FPL) brackets across all HHS geographical regions (Contiguous US, Alaska, Hawaii).
   - Maps household size and income against hospital-specific Financial Assistance Policies to identify 100% forgiveness vs. sliding-scale discount tiers.
   - Enforces statutory Amounts Generally Billed (AGB) caps for uninsured patients under 26 U.S.C. § 501(r)(5).
   - Verifies the 240-day statutory safe harbor period halting Extraordinary Collection Actions (ECAs) under § 501(r)(6).

2. **Medical Bill Price Audit & Benchmark Engine**
   - Compares billed CPT/HCPCS codes against published hospital cash discount rates.
   - Computes chargemaster markup multipliers relative to CMS Medicare baseline rates, flagging excessive (>4x) and predatory (>8x) list prices.
   - Detects unbundled laboratory and procedure codes (NCCI coding compliance).
   - Computes defensible fair settlement targets.

3. **Action & Dispute Letter Generator**
   - Generates formal Markdown and print-ready HTML documents.
   - Populates complete statutory citations (26 U.S.C. § 501(r), 45 CFR Part 180, 42 U.S.C. § 300gg-111, 15 U.S.C. § 1692g).
   - Pre-fills hospital financial assistance department addresses, account numbers, and itemized billing objections for certified mail submission.

---

## Repository Structure

```
├── ARCHITECTURE.md                  # Comprehensive architectural specification
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
│   └── index.ts                     # Main library export
└── tests/                           # Vitest test suite
    ├── charity-care.test.ts
    ├── price-audit.test.ts
    └── letter-generator.test.ts
```

---

## Getting Started

### Installation
```bash
git clone https://github.com/carecheck/carecheck.git
cd carecheck
npm install
```

### Run Tests
```bash
npm test
```

### Build Distribution
```bash
npm run build
```

---

## License
MIT License - Built as open public-good software.
