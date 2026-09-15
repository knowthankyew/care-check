import React, { useState, useMemo } from 'react';
import { Header } from './components/Header.js';
import { SourcePanel } from './components/SourcePanel.js';
import { CharityCareBarometer } from './components/CharityCareBarometer.js';
import { BillAuditWorkbench } from './components/BillAuditWorkbench.js';
import { DefenseStudio } from './components/DefenseStudio.js';
import { HospitalPolicyModal } from './components/HospitalPolicyModal.js';
import { assessCharityCareEligibility } from './core/charity-care/engine.js';
import { auditMedicalBill } from './core/price-audit/engine.js';
import type { HospitalProfile } from './contracts/hospital.js';
import type { ItemizedMedicalBill, BillLineItem } from './contracts/bill.js';
import hospitalsData from '../data/hospitals/seed-hospitals.json' with { type: 'json' };

const HOSPITALS = hospitalsData as HospitalProfile[];


const SCENARIOS: Record<
  string,
  {
    hospitalId: string;
    householdSize: number;
    annualIncome: number;
    bill: ItemizedMedicalBill;
  }
> = {
  'er-trauma': {
    hospitalId: 'cleveland-clinic-main',
    householdSize: 2,
    annualIncome: 34000,
    bill: {
      id: 'bill-er-1',
      accountNumber: 'CLV-882910',
      hospitalId: 'cleveland-clinic-main',
      hospitalName: 'The Cleveland Clinic Foundation',
      patientName: 'Jane Doe',
      statementDate: '2026-08-01',
      hasItemizedBreakdown: true,
      totalBilledCharge: 6350,
      totalInsurancePaid: 0,
      totalPatientResponsibility: 6350,
      lineItems: [
        {
          id: 'line-1',
          codeType: 'CPT',
          code: '99285',
          description: 'Emergency Dept Visit Level 5 (High Severity)',
          quantity: 1,
          billedCharge: 3500,
          patientResponsibility: 3500,
        },
        {
          id: 'line-2',
          codeType: 'CPT',
          code: '70450',
          description: 'Computed Tomography (CT), Head/Brain Without Contrast',
          quantity: 1,
          billedCharge: 2400,
          patientResponsibility: 2400,
        },
        {
          id: 'line-3',
          codeType: 'CPT',
          code: '80053',
          description: 'Comprehensive Metabolic Panel (14 Chemistry Tests)',
          quantity: 1,
          billedCharge: 450,
          patientResponsibility: 450,
        },
      ],
    },
  },
  maternity: {
    hospitalId: 'ascension-health-national',
    householdSize: 3,
    annualIncome: 42000,
    bill: {
      id: 'bill-mat-1',
      accountNumber: 'ASC-441928',
      hospitalId: 'ascension-health-national',
      hospitalName: 'Ascension Health System',
      patientName: 'Sarah Jenkins',
      statementDate: '2026-07-15',
      hasItemizedBreakdown: true,
      totalBilledCharge: 8500,
      totalInsurancePaid: 0,
      totalPatientResponsibility: 8500,
      lineItems: [
        {
          id: 'line-m1',
          codeType: 'CPT',
          code: '59400',
          description: 'Routine Obstetric Care, Vaginal Delivery & Postpartum',
          quantity: 1,
          billedCharge: 8500,
          patientResponsibility: 8500,
        },
      ],
    },
  },
  'outpatient-imaging': {
    hospitalId: 'mayo-clinic-rochester',
    householdSize: 1,
    annualIncome: 24000,
    bill: {
      id: 'bill-img-1',
      accountNumber: 'MYO-771204',
      hospitalId: 'mayo-clinic-rochester',
      hospitalName: 'Mayo Clinic Rochester',
      patientName: 'David Miller',
      statementDate: '2026-08-10',
      hasItemizedBreakdown: true,
      totalBilledCharge: 3850,
      totalInsurancePaid: 0,
      totalPatientResponsibility: 3850,
      lineItems: [
        {
          id: 'line-i1',
          codeType: 'CPT',
          code: '73721',
          description: 'MRI Any Joint of Lower Extremity Without Contrast',
          quantity: 1,
          billedCharge: 3200,
          patientResponsibility: 3200,
        },
        {
          id: 'line-i2',
          codeType: 'CPT',
          code: '85025',
          description: 'Complete Blood Count (CBC) with Differential',
          quantity: 1,
          billedCharge: 650,
          patientResponsibility: 650,
        },
      ],
    },
  },
  custom: {
    hospitalId: 'cleveland-clinic-main',
    householdSize: 1,
    annualIncome: 25000,
    bill: {
      id: 'bill-custom',
      accountNumber: 'CUSTOM-001',
      hospitalId: 'cleveland-clinic-main',
      hospitalName: 'The Cleveland Clinic Foundation',
      patientName: 'Custom Patient',
      statementDate: '2026-08-01',
      hasItemizedBreakdown: true,
      totalBilledCharge: 1200,
      totalInsurancePaid: 0,
      totalPatientResponsibility: 1200,
      lineItems: [
        {
          id: 'line-c1',
          codeType: 'CPT',
          code: '99283',
          description: 'Emergency Dept Visit Level 3',
          quantity: 1,
          billedCharge: 1200,
          patientResponsibility: 1200,
        },
      ],
    },
  },
};

export const App: React.FC = () => {
  const [scenarioId, setScenarioId] = useState<string>('er-trauma');
  const activeScenario = SCENARIOS[scenarioId] || SCENARIOS['er-trauma']!;

  const [hospitalId, setHospitalId] = useState<string>(activeScenario.hospitalId);
  const [customHospital, setCustomHospital] = useState<HospitalProfile | null>(null);
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
  const [householdSize, setHouseholdSize] = useState<number>(activeScenario.householdSize);
  const [annualIncome, setAnnualIncome] = useState<number>(activeScenario.annualIncome);
  const [bill, setBill] = useState<ItemizedMedicalBill>(activeScenario.bill);

  // Switch scenario
  const handleScenarioChange = (id: string) => {
    setScenarioId(id);
    setCustomHospital(null);
    const scen = SCENARIOS[id] || SCENARIOS['er-trauma']!;
    setHospitalId(scen.hospitalId);
    setHouseholdSize(scen.householdSize);
    setAnnualIncome(scen.annualIncome);
    setBill(scen.bill);
  };

  const handleSaveHospitalPolicy = (updated: HospitalProfile) => {
    setCustomHospital(updated);
    setBill((prev) => ({
      ...prev,
      hospitalId: updated.id,
      hospitalName: updated.displayName,
    }));
  };

  const currentHospital = useMemo(
    () => customHospital || HOSPITALS.find((h) => h.id === hospitalId) || HOSPITALS[0]!,
    [customHospital, hospitalId]
  );


  // Pure domain evaluations
  const charityAssessment = useMemo(() => {
    return assessCharityCareEligibility({
      hospital: currentHospital,
      householdSize,
      annualHouseholdIncome: annualIncome,
      totalPatientBalance: bill.totalPatientResponsibility,
      statementDate: bill.statementDate,
      evaluationYear: new Date().getFullYear(),
    });
  }, [currentHospital, householdSize, annualIncome, bill.totalPatientResponsibility, bill.statementDate]);

  const auditResult = useMemo(() => {
    return auditMedicalBill(bill, {
      charityCareAssessment: charityAssessment,
    });
  }, [bill, charityAssessment]);

  // Update line items
  const handleUpdateLineItems = (items: BillLineItem[]) => {
    const totalBilled = items.reduce((sum, i) => sum + i.billedCharge, 0);
    setBill({
      ...bill,
      lineItems: items,
      totalBilledCharge: totalBilled,
      totalPatientResponsibility: totalBilled,
    });
  };

  // Instant Burn All Data command
  const handlePurgeData = () => {
    if (confirm('Burn all local data? This will immediately wipe all loaded bills, in-memory state, and caches from your device.')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        if (typeof window !== 'undefined' && 'caches' in window) {
          window.caches.keys().then((keys) => {
            keys.forEach((k) => window.caches.delete(k));
          });
        }
        if (typeof window !== 'undefined' && 'indexedDB' in window && typeof indexedDB.databases === 'function') {
          indexedDB.databases().then((dbs) => {
            for (const db of dbs) {
              if (db.name) indexedDB.deleteDatabase(db.name);
            }
          }).catch(() => {});
        }
      } catch {
        // Silently ignore storage errors
      }
      // Purge in-memory state
      setHouseholdSize(1);
      setAnnualIncome(0);
      setBill({
        id: 'cleared-session',
        accountNumber: 'CLEARED',
        hospitalId: 'cleveland-clinic-main',
        hospitalName: 'The Cleveland Clinic Foundation',
        patientName: '',
        statementDate: new Date().toISOString().slice(0, 10),
        hasItemizedBreakdown: true,
        totalBilledCharge: 0,
        totalInsurancePaid: 0,
        totalPatientResponsibility: 0,
        lineItems: [],
      });
      setScenarioId('custom');
      alert('All local state and in-memory data burned. Zero records remain on this device.');
    }
  };

  return (
    <div className="app-container">
      <div className="ambient-glow" />

      <Header
        scenarioId={scenarioId}
        onScenarioChange={handleScenarioChange}
        onPurgeData={handlePurgeData}
        groundedSourcesCount={3}
      />

      <main className="studio-grid">
        {/* Left: Grounded Sources Panel */}
        <SourcePanel
          hospital={currentHospital}
          householdSize={householdSize}
          fplThreshold={charityAssessment.fplThresholdUSD}
          onEditHospitalPolicy={() => setIsHospitalModalOpen(true)}
        />

        {/* Center: Reality Studio Canvas */}
        <div className="canvas-column">
          <CharityCareBarometer
            hospital={currentHospital}
            householdSize={householdSize}
            onHouseholdSizeChange={setHouseholdSize}
            annualIncome={annualIncome}
            onAnnualIncomeChange={setAnnualIncome}
            assessment={charityAssessment}
          />

          <BillAuditWorkbench
            bill={bill}
            auditResult={auditResult}
            onUpdateLineItems={handleUpdateLineItems}
          />
        </div>

        {/* Right: Defense & Action Studio */}
        <DefenseStudio
          charityAssessment={charityAssessment}
          auditResult={auditResult}
          accountNumber={bill.accountNumber}
          statementDate={bill.statementDate}
        />
      </main>

      <HospitalPolicyModal
        isOpen={isHospitalModalOpen}
        currentHospital={currentHospital}
        onSave={handleSaveHospitalPolicy}
        onClose={() => setIsHospitalModalOpen(false)}
      />
    </div>
  );
};

