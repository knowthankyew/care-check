import React, { useState } from 'react';
import type { BillLineItem, ItemizedMedicalBill } from '../contracts/bill.js';
import type { PriceAuditResult } from '../contracts/audit.js';

interface BillAuditWorkbenchProps {
  bill: ItemizedMedicalBill;
  auditResult: PriceAuditResult;
  onUpdateLineItems: (items: BillLineItem[]) => void;
}

export const BillAuditWorkbench: React.FC<BillAuditWorkbenchProps> = ({
  bill,
  auditResult,
  onUpdateLineItems,
}) => {
  const [showAddRow, setShowAddRow] = useState(false);
  const [newCpt, setNewCpt] = useState('99284');
  const [newDesc, setNewDesc] = useState('Emergency Dept Visit Level 4');
  const [newAmount, setNewAmount] = useState('1850');

  const handleAddLineItem = () => {
    const amount = parseFloat(newAmount) || 0;
    const newItem: BillLineItem = {
      id: `line-${Date.now()}`,
      codeType: 'CPT',
      code: newCpt.trim(),
      description: newDesc.trim(),
      quantity: 1,
      billedCharge: amount,
      patientResponsibility: amount,
    };
    onUpdateLineItems([...bill.lineItems, newItem]);
    setShowAddRow(false);
  };

  const handleRemoveLineItem = (id: string) => {
    onUpdateLineItems(bill.lineItems.filter((item) => item.id !== id));
  };

  const handleUpdateAmount = (id: string, newBilled: number) => {
    onUpdateLineItems(
      bill.lineItems.map((item) =>
        item.id === id
          ? { ...item, billedCharge: newBilled, patientResponsibility: newBilled }
          : item
      )
    );
  };

  return (
    <div className="panel workbench-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Itemized Medical Bill & Markup Audit
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Account #{bill.accountNumber} • Statement Date: {bill.statementDate}
          </span>
        </div>

        <button
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          onClick={() => setShowAddRow(!showAddRow)}
        >
          {showAddRow ? 'Cancel' : '+ Add Line Item'}
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="metrics-summary-row">
        <div className="metric-card">
          <div className="metric-label">Total Billed Balance</div>
          <div className="metric-amount">
            ${bill.totalBilledCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="metric-card savings">
          <div className="metric-label">Overcharges vs. Cash & Baseline</div>
          <div className="metric-amount green">
            ${auditResult.totalPotentialSavingsUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="metric-card settlement">
          <div className="metric-label">Defensible Settlement Target</div>
          <div className="metric-amount cyan">
            ${auditResult.recommendedFairSettlementUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {showAddRow && (
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px',
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            Add Medical Line Item
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px auto', gap: '8px' }}>
            <input
              type="text"
              className="input-num"
              placeholder="CPT Code"
              maxLength={15}
              value={newCpt}
              onChange={(e) => setNewCpt(e.target.value)}
            />
            <input
              type="text"
              className="input-num"
              placeholder="Description"
              maxLength={150}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <input
              type="number"
              className="input-num"
              placeholder="Billed Amount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
            <button className="btn-primary" style={{ padding: '6px 14px' }} onClick={handleAddLineItem}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Code</th>
              <th>Service Description</th>
              <th style={{ width: '130px' }}>Billed Amount</th>
              <th style={{ width: '150px' }}>Cash / Baseline</th>
              <th>Discrepancy Audit Findings</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {bill.lineItems.map((item) => {
              const audit = auditResult.lineItemAudits.find((a) => a.lineItemId === item.id);
              return (
                <tr key={item.id}>
                  <td>
                    <span className="cpt-tag">{item.code}</span>
                  </td>
                  <td>
                    <div className="item-desc">{item.description}</div>
                    {audit?.explanation && (
                      <div className="item-explanation">{audit.explanation}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>$</span>
                      <input
                        type="number"
                        className="input-num"
                        style={{ padding: '4px 6px', fontSize: '0.85rem', width: '90px' }}
                        value={item.billedCharge}
                        onChange={(e) => handleUpdateAmount(item.id, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </td>
                  <td>
                    {audit?.hospitalCashPrice ? (
                      <div style={{ fontSize: '0.78rem' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>Cash: </span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          ${audit.hospitalCashPrice.toLocaleString()}
                        </span>
                      </div>
                    ) : null}
                    {audit?.medicareBaselineRate ? (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        <span>Medicare: </span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          ${audit.medicareBaselineRate.toFixed(2)}
                        </span>
                      </div>
                    ) : null}
                    {audit?.markupMultiplier ? (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          color: audit.markupMultiplier >= 8 ? '#f87171' : '#fbbf24',
                          fontWeight: 700,
                        }}
                      >
                        {audit.markupMultiplier}x Markup
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {audit?.flags.map((flag) => {
                      if (flag === 'PREDATORY_MARKUP') {
                        return (
                          <span key={flag} className="flag-badge predatory">
                            Predatory Markup
                          </span>
                        );
                      }
                      if (flag === 'EXCEEDS_CASH_PRICE') {
                        return (
                          <span key={flag} className="flag-badge cash-price">
                            Exceeds Cash Rate
                          </span>
                        );
                      }
                      if (flag === 'POTENTIAL_UNBUNDLED_CODE') {
                        return (
                          <span key={flag} className="flag-badge unbundled">
                            Unbundling Risk
                          </span>
                        );
                      }
                      return (
                        <span key={flag} className="flag-badge">
                          {flag.replace(/_/g, ' ')}
                        </span>
                      );
                    })}
                    {(!audit || audit.flags.length === 0) && (
                      <span style={{ color: '#10b981', fontSize: '0.75rem' }}>
                        ✓ Within Fair Range
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleRemoveLineItem(item.id)}
                      aria-label="Remove line item"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                      title="Remove line item"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
