import React, { useState } from 'react';
import type { HospitalProfile } from '../contracts/hospital.js';
import { SourceModal, type GroundedSource } from './SourceModal.js';

interface SourcePanelProps {
  hospital: HospitalProfile;
  householdSize: number;
  fplThreshold: number;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  hospital,
  householdSize,
  fplThreshold,
}) => {
  const [inspectedSource, setInspectedSource] = useState<GroundedSource | null>(null);

  const sources: GroundedSource[] = [
    {
      id: 'fpl-2026',
      type: 'FEDERAL_STATUTE',
      title: 'HHS Federal Poverty Guidelines',
      citation: '42 U.S.C. § 9902(2)',
      excerpt: `2026 Continental US benchmark: $16,200 base + $5,780/person. Household of ${householdSize} threshold is $${fplThreshold.toLocaleString()}.`,
      fullDetails: (
        <div>
          <p style={{ marginBottom: '12px' }}>
            The Federal Poverty Guidelines are issued annually by the U.S. Department of Health and Human Services (HHS).
            Under federal law, these numbers define the baseline poverty threshold used by Section 501(r) hospital policies.
          </p>
          <div style={{ background: '#090d16', padding: '12px', borderRadius: '6px', fontFamily: 'monospace' }}>
            <div>• Contiguous 48 States + DC: $16,200 (1 person) + $5,780/addl</div>
            <div>• Alaska: $20,240 (1 person) + $7,230/addl</div>
            <div>• Hawaii: $18,630 (1 person) + $6,650/addl</div>
          </div>
        </div>
      ),
    },
    {
      id: 'hospital-fap',
      type: 'HOSPITAL_FAP',
      title: hospital.displayName,
      citation: `26 U.S.C. § 501(r)(4) • EIN: ${hospital.ein}`,
      excerpt: `Written FAP provides 100% forgiveness up to ${hospital.fapTiers[0]?.maxFplPercent || 200}% FPL. 240-day safe harbor window.`,
      fullDetails: (
        <div>
          <p style={{ marginBottom: '12px' }}>
            As a 501(c)(3) tax-exempt entity, {hospital.legalName} is legally required to provide free or discounted care
            pursuant to its published policy.
          </p>
          <table className="audit-table" style={{ marginTop: '8px' }}>
            <thead>
              <tr>
                <th>Tier Name</th>
                <th>FPL Range</th>
                <th>Discount</th>
              </tr>
            </thead>
            <tbody>
              {hospital.fapTiers.map((tier) => (
                <tr key={tier.tierId}>
                  <td>{tier.name}</td>
                  <td>{tier.minFplPercent}% - {tier.maxFplPercent}% FPL</td>
                  <td><strong>{tier.discountPercent}%</strong></td>
                </tr>
              ))}
              {hospital.agbDiscountPercent ? (
                <tr>
                  <td>Amounts Generally Billed (AGB)</td>
                  <td>Uninsured &gt; 400%</td>
                  <td><strong>{hospital.agbDiscountPercent}%</strong></td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <p style={{ marginTop: '12px', fontSize: '0.78rem', color: '#94a3b8' }}>
            Application Window: {hospital.fapApplicationWindowDays} days post-discharge safe harbor against Extraordinary Collection Actions (ECAs).
          </p>
        </div>
      ),
    },
    {
      id: 'cms-mrf',
      type: 'CMS_TRANSPARENCY',
      title: 'CMS Price Transparency & NCCI',
      citation: '45 CFR Part 180 • 42 U.S.C. § 300gg-111',
      excerpt: 'National shoppable procedure database with median cash prices and Medicare Fee Schedule baselines.',
      fullDetails: (
        <div>
          <p style={{ marginBottom: '12px' }}>
            Federal hospital price transparency rules require hospitals to publicly disclose standard gross charges,
            discounted cash prices, and de-identified minimum and maximum negotiated rates for all items and services.
          </p>
          <div style={{ background: '#090d16', padding: '12px', borderRadius: '6px', fontSize: '0.8rem' }}>
            <div><strong>Key Evaluated Baselines:</strong></div>
            <div>• CPT 99285 (ER Level 5): Cash $1,450 | Medicare $204.60</div>
            <div>• CPT 70450 (CT Head): Cash $420 | Medicare $98.40</div>
            <div>• CPT 80053 (Comprehensive Metabolic Panel): Unbundling protected</div>
            <div>• CPT 59400 (Routine Vaginal Delivery): Cash $3,200 | Medicare $1,820</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <aside className="panel sources-column">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
          </svg>
          Grounding Sources
        </h2>
        <span className="panel-badge">{sources.length} Verified</span>
      </div>

      <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '14px' }}>
        Click any source below to inspect the underlying federal law, poverty tables, or transparency pricing.
      </p>

      <div className="sources-list">
        {sources.map((src) => (
          <div
            key={src.id}
            className="source-card"
            onClick={() => setInspectedSource(src)}
          >
            <div className="source-badge-row">
              <span className="source-type">{src.type.replace('_', ' ')}</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981' }}>View &rarr;</span>
            </div>
            <div className="source-name">{src.title}</div>
            <div className="source-statute">{src.citation}</div>
            <div className="source-excerpt">{src.excerpt}</div>
          </div>
        ))}
      </div>

      <SourceModal
        source={inspectedSource}
        onClose={() => setInspectedSource(null)}
      />
    </aside>
  );
};
