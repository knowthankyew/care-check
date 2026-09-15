import React from 'react';

export interface GroundedSource {
  id: string;
  type: 'FEDERAL_STATUTE' | 'HOSPITAL_FAP' | 'CMS_TRANSPARENCY';
  title: string;
  citation: string;
  excerpt: string;
  fullDetails: React.ReactNode;
}

interface SourceModalProps {
  source: GroundedSource | null;
  onClose: () => void;
}

export const SourceModal: React.FC<SourceModalProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="source-type">{source.type.replace('_', ' ')}</span>
            <h3 style={{ marginTop: '4px', fontSize: '1.1rem', color: '#f8fafc' }}>
              {source.title}
            </h3>
            <span className="source-statute">{source.citation}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">{source.fullDetails}</div>
      </div>
    </div>
  );
};
