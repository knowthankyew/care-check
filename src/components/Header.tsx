import React from 'react';

interface HeaderProps {
  scenarioId: string;
  onScenarioChange: (id: string) => void;
  onPurgeData: () => void;
  groundedSourcesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  scenarioId,
  onScenarioChange,
  onPurgeData,
  groundedSourcesCount,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className="brand-title">
          CareCheck Studio
          <span className="brand-badge">Reality Engine</span>
        </div>
      </div>

      <div className="header-meta">
        <div className="pill-indicator verified" title="All computations run purely in-browser">
          <span className="pill-dot"></span>
          <span>Zero PHI Network Transmission</span>
        </div>

        <div className="pill-indicator" title="Grounded against public law and hospital transparency files">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
          </svg>
          <span>{groundedSourcesCount} Sources Grounded</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="scenario-select" className="sample-selector-label">
            Scenario:
          </label>
          <select
            id="scenario-select"
            className="select-input"
            value={scenarioId}
            onChange={(e) => onScenarioChange(e.target.value)}
          >
            <option value="er-trauma">Emergency Visit + CT Scan (Cleveland Clinic)</option>
            <option value="maternity">Obstetric Delivery (Ascension Health)</option>
            <option value="outpatient-imaging">MRI & Routine Care (Mayo Clinic)</option>
            <option value="custom">Blank / Custom Bill</option>
          </select>
        </div>

        <button
          className="btn-purge"
          onClick={onPurgeData}
          title="Instantly clear all local storage, bill data, and session memory"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          Burn Local Data
        </button>
      </div>
    </header>
  );
};
