import React from 'react';
import { X, Shield, Activity, Download, Flame, Database, Radio, CheckCircle, AlertTriangle } from 'lucide-react';
import { telemetry, PrivacyAuditReport, SessionAuditEvent } from '../core/telemetry.js';

interface PrivacyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBurnData: () => void;
}

export const PrivacyAuditModal: React.FC<PrivacyAuditModalProps> = ({
  isOpen,
  onClose,
  onBurnData,
}) => {
  if (!isOpen) return null;

  const report: PrivacyAuditReport = telemetry.getPrivacyAuditReport();
  const claims = telemetry.getPrivacyClaims();
  const auditLogs: readonly SessionAuditEvent[] = telemetry.getAuditLog();

  const handleDownloadAudit = () => {
    const jsonStr = telemetry.downloadSessionAuditJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `care-check-session-audit-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
      <div className="modal-container" style={{ maxWidth: '750px', width: '90%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: claims.isLocalOnlyHonest ? 'var(--emerald-primary, #10b981)' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Shield size={18} />
            </div>
            <div>
              <h2 id="privacy-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {claims.isEnterpriseBuild ? 'Enterprise Telemetry Verification' : 'Privacy & Telemetry Verification'}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Inspect real-time telemetry state, data retention, and session audit trails
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.25rem' }}>
          {/* Real-time Status Card */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: claims.isLocalOnlyHonest ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 179, 8, 0.08)',
              border: `1px solid ${claims.isLocalOnlyHonest ? 'rgba(16, 185, 129, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {claims.isLocalOnlyHonest ? (
                <>
                  <CheckCircle size={18} color="#10b981" />
                  <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>
                    {claims.modalStatusTitle}
                  </strong>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} color="#ca8a04" />
                  <strong style={{ color: '#ca8a04', fontSize: '0.95rem' }}>
                    {claims.modalStatusTitle}
                  </strong>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {claims.modalStatusDescription}
            </div>
          </div>

          {/* Configuration Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated, #1e293b)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Activity size={14} />
                <span>OBSERVABILITY MODE</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                <code>{report.telemetryMode}</code>
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated, #1e293b)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Radio size={14} />
                <span>NETWORK EGRESS</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                <code>{report.networkEgress}</code>
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated, #1e293b)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Database size={14} />
                <span>BUFFERED SPANS</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {report.activeSpanCount} in memory
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated, #1e293b)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Flame size={14} />
                <span>BURNABLE STORAGE</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: report.burnEnabled ? '#10b981' : 'var(--text-muted)' }}>
                {report.burnEnabled ? 'Enabled (Full Purge)' : 'Disabled'}
              </div>
            </div>
          </div>

          {/* Session Audit Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  In-Memory Session Audit Trail ({auditLogs.length} events)
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Append-only activity verification. Does not contain raw medical records or patient data.
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownloadAudit}
                disabled={auditLogs.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated, #1e293b)',
                  color: 'var(--text-primary)',
                  cursor: auditLogs.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: auditLogs.length === 0 ? 0.5 : 1,
                  fontWeight: 600,
                }}
                title="Download session audit log as JSON"
              >
                <Download size={13} />
                <span>Download Audit (JSON)</span>
              </button>
            </div>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                background: 'var(--bg-surface-elevated, #1e293b)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
              }}
            >
              {auditLogs.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit events recorded in this session yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '6px 10px' }}>Timestamp</th>
                      <th style={{ padding: '6px 10px' }}>Action</th>
                      <th style={{ padding: '6px 10px' }}>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <code style={{ fontSize: '0.75rem', padding: '2px 4px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: '#38bdf8' }}>
                            {log.action}
                          </code>
                        </td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>{log.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <button
              type="button"
              className="btn-purge"
              onClick={() => {
                onBurnData();
                onClose();
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Flame size={14} />
              <span>Burn All Local Data & Telemetry</span>
            </button>

            <button
              type="button"
              className="btn-save"
              onClick={onClose}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
