<!-- diagram-meta
  last-validated: 2026-10-19
  covers: [src/**, contracts/**]
  generated-by: manual
-->

# Architecture & Invariants Specification: CareCheck Reality Engine

> Client-side medical bill auditor, hospital chargemaster evaluator, Section 501(r) charity care barometer, and debt defense studio.

---

## 1. Executive Summary

`careCheck` is a client-side reality engine in the `knowthankyew` portfolio built to defend patients against predatory medical billing. Operating under strict Zero Document Egress, it evaluates itemized medical bills against CMS Hospital Price Transparency data (45 CFR Part 180), benchmarks prices against Medicare allowable amounts, calculates income eligibility for statutory Charity Care under 26 U.S.C. § 501(r) and state Fair Pricing Acts, and generates formal dispute and debt-pause notices.

---

## 2. System Architecture & Component Interactions

### A. Execution Sandbox & Trust Boundary

```mermaid
flowchart LR
    subgraph ClientEnvironment["Client Browser Sandbox (Air-Gapped)"]
        User["👤 Patient / Advocate"]

        subgraph Ingestion["1. Ingestion Layer"]
            BillInput["🧾 Itemized Bill Input<br/><i>(CPT / HCPCS / Rev Codes)</i>"]
            IncomeInput["💰 Income & Family Size<br/><i>(FPL Calculation)</i>"]
            Handoff["🔗 Handoff Adapter<br/><i>(From Extension)</i>"]
        end

        subgraph CoreEngine["2. Local Evaluation Core"]
            PriceAudit["🏥 Price Audit Engine<br/><code>src/core/price-audit</code>"]
            CharityCare["⚖️ Charity Care Barometer<br/><code>src/core/charity-care</code>"]
            PolicyPack["📦 @knowthankyew/policy-packs/healthcare<br/><i>(501(r), CMS Benchmarks, FPL)</i>"]
            DefenseStudio["📜 Defense Letter Studio<br/><code>src/core/letter-generator</code>"]
        end

        subgraph Presentation["3. React 19 UI & Controls"]
            Workbench["🛠️ Bill Audit Workbench"]
            Barometer["📊 Charity Care Barometer"]
            PolicyModal["🏛️ Hospital Policy Modal"]
            PrivacyModal["🛡️ Privacy Audit Modal"]
            BurnCtrl["🔥 Hard Burn Controller"]
        end

        subgraph TelemetryStore["4. Volatile Telemetry"]
            TelemBuffer["🧠 In-Memory Circular Buffer<br/><i>(Zero Network Egress)</i>"]
        end
    end

    %% Data Flow
    User -->|"Inputs Bill & Codes"| BillInput
    User -->|"Inputs Household Financials"| IncomeInput
    Handoff -->|"Transfers Code Context"| BillInput

    BillInput --> PriceAudit
    IncomeInput --> CharityCare
    PolicyPack -.->|"Statutory FPL & CMS Data"| PriceAudit & CharityCare

    PriceAudit -->|"Price Markups & Outliers"| Workbench
    CharityCare -->|"Eligibility Assessment"| Barometer
    CharityCare & PriceAudit -->|"Violations & Statutory Basis"| DefenseStudio

    Workbench & Barometer -->|"Render Findings"| User
    DefenseStudio -->|"Generate 501(r) Debt Pause Letter"| User

    %% Telemetry & Burn
    PriceAudit & CharityCare -.->|"Allowlisted Spans"| TelemBuffer
    TelemBuffer -.->|"Inspect Real-Time Events"| PrivacyModal
    BurnCtrl -->|"Purges Memory & DOM State"| TelemBuffer
    BurnCtrl -->|"Wipes Document State"| BillInput & IncomeInput

    classDef client fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#f8fafc;
    classDef comp fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef pkg fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#f8fafc;
    classDef burn fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;

    class BillInput,IncomeInput,Handoff,PriceAudit,CharityCare,DefenseStudio,Workbench,Barometer,PolicyModal,PrivacyModal comp;
    class PolicyPack pkg;
    class TelemBuffer,BurnCtrl burn;
```

### B. Medical Debt Defense Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient / Advocate
    participant UI as React UI (App.tsx)
    participant Engine as PriceAudit & CharityCare
    participant Health as Policy Packs (Healthcare)
    participant Studio as Defense Letter Studio
    participant Telem as Telemetry Buffer

    Patient->>UI: Enter bill CPT codes, hospital name & charges
    Patient->>UI: Enter household income & family size
    UI->>Engine: auditBill(charges, hospitalId, income)
    Engine->>Health: Query 501(r) FAP rules & CMS benchmark thresholds
    Health-->>Engine: Standard markup multipliers & FPL sliding scales
    Engine->>Engine: Compute price excess vs Medicare baseline
    Engine->>Engine: Determine mandatory charity care eligibility percentage
    Engine-->>UI: Return audit findings & eligibility tiers
    UI->>Telem: Record scan metric (cpt_count, duration_ms)
    UI-->>Patient: Display Interactive Workbench & Charity Barometer

    Patient->>UI: Click "Draft 501(r) Debt Defense Letter"
    UI->>Studio: buildDefensePackage(hospital, charges, fplTier)
    Studio-->>UI: Formatted legal notice requesting itemized dispute & pause on collections
    UI-->>Patient: Render editable letter ready to print or PDF export

    Patient->>UI: Click "Burn Local Data"
    UI->>Telem: Purge circular buffer
    UI->>Engine: Dereference all charges, codes & household financial data
    UI-->>Patient: Instant clean amnesiac state
```

---

## 3. Core Architectural Invariants

| # | Invariant | Enforcement & Guarantee |
|:--|:----------|:------------------------|
| 1 | **Zero Document Egress** | Medical bills, diagnostic codes, personal identifiers, and income numbers never leave the local browser sandbox. |
| 2 | **Volatile Memory Telemetry** | Operational metrics are held in a fixed-size ring buffer for local inspection only; no cloud transport in consumer builds. |
| 3 | **Strict Key Allowlists** | Telemetry sanitizes properties against `SAFE_ALLOWLIST_KEYS`; diagnosis text, patient names, and exact dollar figures are redacted. |
| 4 | **Compile-Time Dead Code Shims** | Enterprise OTLP exporter symbols are completely excised at build time for standard consumer builds. |
| 5 | **Amnesiac State Purge (Hard Burn)** | Complete memory purge removing sensitive health and financial data without persistence in browser storage. |

---

## 4. Directory Structure

```
careCheck/
├── docs/
│   ├── ARCHITECTURE.md          # Architecture, data flow & invariant specification
│   └── PRIVACY_TELEMETRY_SCHEMA.md # Telemetry contract specification
├── src/
│   ├── App.tsx                  # Root application view & workflow orchestration
│   ├── main.tsx                 # Entrypoint
│   ├── components/              # UI components (BillAuditWorkbench, CharityCareBarometer, DefenseStudio)
│   ├── contracts/               # TypeScript interfaces & handoff contracts
│   ├── core/
│   │   ├── price-audit/         # CMS chargemaster comparison & markup calculation
│   │   ├── charity-care/        # Section 501(r) sliding scale & FPL evaluation
│   │   ├── letter-generator/    # Debt defense & financial assistance letter generation
│   │   ├── handoff-adapter.ts   # Structured Handoff from knowthankyew-extension
│   │   └── telemetry.ts         # In-memory privacy telemetry controller
│   └── styles/                  # Styling & themes
├── tests/                       # Vitest unit test suites
└── vite.config.ts               # Air-gapped bundler configuration
```
