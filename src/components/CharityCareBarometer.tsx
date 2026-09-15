import React from 'react';
import type { CharityCareAssessment } from '../contracts/charity-care.js';
import type { HospitalProfile } from '../contracts/hospital.js';

interface CharityCareBarometerProps {
  hospital: HospitalProfile;
  householdSize: number;
  onHouseholdSizeChange: (size: number) => void;
  annualIncome: number;
  onAnnualIncomeChange: (income: number) => void;
  assessment: CharityCareAssessment;
}

export const CharityCareBarometer: React.FC<CharityCareBarometerProps> = ({
  hospital,
  householdSize,
  onHouseholdSizeChange,
  annualIncome,
  onAnnualIncomeChange,
  assessment,
}) => {
  const fplPercent = assessment.fplPercentage;
  // Meter fill up to 400% FPL
  const meterProgress = Math.min(100, (fplPercent / 400) * 100);

  const getStatusClass = () => {
    switch (assessment.tierType) {
      case 'FULL_FORGIVENESS':
        return 'forgiveness';
      case 'SLIDING_SCALE_DISCOUNT':
        return 'sliding-scale';
      case 'UNINSURED_AGB_DISCOUNT':
        return 'agb-discount';
      default:
        return 'ineligible';
    }
  };

  return (
    <div className="barometer-card">
      <div className="barometer-top-row">
        <div>
          <span className="control-label" style={{ display: 'block', marginBottom: '4px' }}>
            Section 501(r) Legal Reality Check
          </span>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Charity Care Eligibility Barometer
          </h2>
        </div>

        <div className={`status-callout ${getStatusClass()}`}>
          <div style={{ textAlign: 'right' }}>
            <div className="callout-title">
              {assessment.discountPercentage === 100
                ? '100% Full Balance Forgiveness'
                : assessment.discountPercentage > 0
                ? `${assessment.discountPercentage}% Balance Reduction`
                : 'No Standard Policy Discount'}
            </div>
            <div className="callout-subtitle">{assessment.qualifyingTierName}</div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background:
                assessment.discountPercentage === 100
                  ? 'rgba(16, 185, 129, 0.2)'
                  : assessment.discountPercentage > 0
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(148, 163, 184, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color:
                assessment.discountPercentage === 100
                  ? '#34d399'
                  : assessment.discountPercentage > 0
                  ? '#fbbf24'
                  : '#94a3b8',
            }}
          >
            {assessment.discountPercentage}%
          </div>
        </div>
      </div>

      <div className="barometer-controls">
        <div className="control-block">
          <label className="control-label">Household Size (Dependents + You)</label>
          <div className="stepper-row">
            <button
              className="stepper-btn"
              onClick={() => onHouseholdSizeChange(Math.max(1, householdSize - 1))}
              disabled={householdSize <= 1}
            >
              -
            </button>
            <span className="stepper-val">{householdSize}</span>
            <button
              className="stepper-btn"
              onClick={() => onHouseholdSizeChange(householdSize + 1)}
            >
              +
            </button>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
              Base: ${assessment.fplThresholdUSD.toLocaleString()} FPL
            </span>
          </div>
        </div>

        <div className="control-block" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="control-label">Annual Household Income (USD)</label>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              ${Math.round(annualIncome / 12).toLocaleString()}/month
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              className="input-num"
              value={annualIncome || ''}
              placeholder="0"
              onChange={(e) => onAnnualIncomeChange(Number(e.target.value) || 0)}
              step="1000"
              min="0"
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 28000, 45000, 68000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onAnnualIncomeChange(preset)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#94a3b8',
                    fontSize: '0.7rem',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  ${preset === 0 ? '0' : `${preset / 1000}k`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Meter */}
      <div className="fpl-meter-container">
        <div className="fpl-meter-header">
          <span className="fpl-meter-title">
            Income Relative to Federal Poverty Line (42 U.S.C. § 9902(2))
          </span>
          <span className="fpl-meter-val">{fplPercent}% FPL</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${meterProgress}%` }} />
        </div>
        <div className="fpl-scale-ticks">
          <span>0% (Free Care)</span>
          <span>100% FPL (${assessment.fplThresholdUSD.toLocaleString()})</span>
          <span>200% ({hospital.fapTiers[0]?.maxFplPercent || 200}%)</span>
          <span>300%</span>
          <span>400% (AGB Cap)</span>
        </div>
      </div>

      {/* Safe Harbor Banner */}
      <div className="safe-harbor-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="safe-harbor-text">
            <strong>26 U.S.C. § 501(r)(6) Statutory ECA Safe Harbor:</strong> Non-profit hospitals must
            suspend debt collection lawsuits and credit bureau reporting.
          </span>
        </div>
        <span className="safe-harbor-badge">
          {assessment.daysRemainingInApplicationWindow} Days Remaining in Safe Window
        </span>
      </div>
    </div>
  );
};
