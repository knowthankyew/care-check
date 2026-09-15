import React, { useState, useEffect } from 'react';
import type { HospitalProfile, FapTier } from '../contracts/hospital.js';
import hospitalsData from '../../data/hospitals/seed-hospitals.json' with { type: 'json' };

const SEED_HOSPITALS = hospitalsData as HospitalProfile[];

interface HospitalPolicyModalProps {
  isOpen: boolean;
  currentHospital: HospitalProfile;
  onSave: (hospital: HospitalProfile) => void;
  onClose: () => void;
}

export const HospitalPolicyModal: React.FC<HospitalPolicyModalProps> = ({
  isOpen,
  currentHospital,
  onSave,
  onClose,
}) => {
  const [profile, setProfile] = useState<HospitalProfile>(currentHospital);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(currentHospital);
    setShowImportBox(false);
    setImportError(null);
  }, [currentHospital, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePresetSelect = (seedId: string) => {
    const found = SEED_HOSPITALS.find((h) => h.id === seedId);
    if (found) {
      setProfile(JSON.parse(JSON.stringify(found)));
    }
  };

  const handleBlankCustom = () => {
    const blank: HospitalProfile = {
      id: `custom-${Date.now()}`,
      displayName: 'My Local Non-Profit Hospital',
      legalName: 'My Local Community Health System, Inc.',
      ein: '00-0000000',
      state: 'US',
      isTaxExempt501c3: true,
      dataVerificationStatus: 'CUSTOM_USER_POLICY',
      verificationNotes: 'User-entered financial assistance policy from billing notice or hospital website.',
      agbDiscountPercent: 65,
      fapApplicationWindowDays: 240,
      requiresAssetTest: false,
      fapTiers: [
        {
          tierId: 'tier-1',
          name: '100% Free Charity Care',
          minFplPercent: 0,
          maxFplPercent: 200,
          discountPercent: 100,
          notes: 'Full balance forgiveness',
        },
        {
          tierId: 'tier-2',
          name: 'Sliding Scale Tier',
          minFplPercent: 200,
          maxFplPercent: 350,
          discountPercent: 60,
          notes: 'Partial financial assistance',
        },
      ],
      billingContact: {
        department: 'Patient Financial Services / Financial Assistance Office',
        mailingAddressLine1: '100 Hospital Drive',
        city: 'City',
        state: 'ST',
        zipCode: '00000',
        phoneNumber: '(800) 555-0100',
      },
    };
    setProfile(blank);
  };

  const handleTierChange = (index: number, field: keyof FapTier, value: any) => {
    const newTiers = [...profile.fapTiers];
    newTiers[index] = { ...newTiers[index]!, [field]: value };
    setProfile({ ...profile, fapTiers: newTiers });
  };

  const handleAddTier = () => {
    const lastTier = profile.fapTiers[profile.fapTiers.length - 1];
    const nextMin = lastTier ? lastTier.maxFplPercent : 200;
    const newTier: FapTier = {
      tierId: `tier-${Date.now()}`,
      name: `Sliding Scale (${nextMin}% - ${nextMin + 100}%)`,
      minFplPercent: nextMin,
      maxFplPercent: nextMin + 100,
      discountPercent: 50,
      notes: 'Custom user tier',
    };
    setProfile({
      ...profile,
      fapTiers: [...profile.fapTiers, newTier],
    });
  };

  const handleRemoveTier = (index: number) => {
    if (profile.fapTiers.length <= 1) {
      alert('At least one FAP tier is required.');
      return;
    }
    const newTiers = profile.fapTiers.filter((_, i) => i !== index);
    setProfile({ ...profile, fapTiers: newTiers });
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.id || 'custom-hospital'}-fap-policy.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.displayName || !Array.isArray(parsed.fapTiers)) {
        throw new Error('Invalid schema: Missing displayName or fapTiers array.');
      }
      setProfile({
        ...parsed,
        dataVerificationStatus: 'CUSTOM_USER_POLICY',
      });
      setShowImportBox(false);
      setImportJsonText('');
      setImportError(null);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      dataVerificationStatus: 'CUSTOM_USER_POLICY',
      verificationNotes: profile.verificationNotes || 'User customized hospital policy parameters.',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '780px', maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hospital-policy-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="source-type" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                FAP Policy Editor
              </span>
              {profile.dataVerificationStatus === 'CUSTOM_USER_POLICY' && (
                <span className="panel-badge" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                  User Policy Active
                </span>
              )}
            </div>
            <h3 id="hospital-policy-title" style={{ marginTop: '4px', fontSize: '1.15rem', color: '#f8fafc' }}>
              Customize Hospital FAP &amp; AGB Policy
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Hospitals update their Section 501(r) policy and AGB percentage yearly. Input your hospital's specific rules below.
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
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

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Presets & Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', background: '#090d16', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Load Template:</span>
            {SEED_HOSPITALS.map((h) => (
              <button
                key={h.id}
                type="button"
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                onClick={() => handlePresetSelect(h.id)}
              >
                {h.displayName.split('(')[0]?.trim()}
              </button>
            ))}
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.72rem', borderColor: '#38bdf8', color: '#38bdf8' }}
              onClick={handleBlankCustom}
            >
              + Blank Policy
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                onClick={handleExportJson}
                title="Export policy JSON to your device"
              >
                ⬇ Export JSON
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                onClick={() => setShowImportBox(!showImportBox)}
              >
                ⬆ Import JSON
              </button>
            </div>
          </div>

          {showImportBox && (
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px dashed #38bdf8' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Paste Hospital Policy JSON:
              </label>
              <textarea
                className="input-num"
                style={{ width: '100%', height: '80px', fontFamily: 'monospace', fontSize: '0.75rem' }}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{ "displayName": "Hospital", "fapTiers": [...] }'
              />
              {importError && (
                <div style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '4px' }}>
                  {importError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={handleImportJson}>
                  Load Pasted Policy
                </button>
                <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowImportBox(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Core Hospital Identifiers */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Hospital Display Name *
              </label>
              <input
                type="text"
                className="input-num"
                style={{ width: '100%', fontSize: '0.8rem' }}
                required
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                IRS EIN *
              </label>
              <input
                type="text"
                className="input-num"
                style={{ width: '100%', fontSize: '0.8rem' }}
                required
                placeholder="XX-XXXXXXX"
                value={profile.ein}
                onChange={(e) => setProfile({ ...profile, ein: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                State (2-Letter)
              </label>
              <input
                type="text"
                className="input-num"
                style={{ width: '100%', fontSize: '0.8rem' }}
                maxLength={2}
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Legal Corporate Entity Name (from bill/Form 990)
              </label>
              <input
                type="text"
                className="input-num"
                style={{ width: '100%', fontSize: '0.8rem' }}
                value={profile.legalName}
                onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                AGB Discount % (26 USC § 501(r)(5))
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="input-num"
                style={{ width: '100%', fontSize: '0.8rem' }}
                value={profile.agbDiscountPercent ?? 65}
                onChange={(e) => setProfile({ ...profile, agbDiscountPercent: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Safe Harbor Window (Days)
              </label>
              <input
                type="number"
                min="120"
                max="365"
                className="input-num"
                style={{ width: '100%', fontSize: '0.8rem' }}
                value={profile.fapApplicationWindowDays}
                onChange={(e) => setProfile({ ...profile, fapApplicationWindowDays: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* FAP Tiers */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>
                Section 501(r) Financial Assistance Tiers (% of Federal Poverty Guidelines)
              </label>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                onClick={handleAddTier}
              >
                + Add Tier
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {profile.fapTiers.map((tier, idx) => (
                <div
                  key={tier.tierId || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 32px',
                    gap: '8px',
                    alignItems: 'center',
                    background: '#0b1120',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <input
                    type="text"
                    className="input-num"
                    placeholder="Tier Name (e.g. Full Charity)"
                    style={{ fontSize: '0.78rem' }}
                    value={tier.name}
                    onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Min:</span>
                    <input
                      type="number"
                      className="input-num"
                      style={{ fontSize: '0.78rem', width: '100%' }}
                      value={tier.minFplPercent}
                      onChange={(e) => handleTierChange(idx, 'minFplPercent', Number(e.target.value))}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Max:</span>
                    <input
                      type="number"
                      className="input-num"
                      style={{ fontSize: '0.78rem', width: '100%' }}
                      value={tier.maxFplPercent}
                      onChange={(e) => handleTierChange(idx, 'maxFplPercent', Number(e.target.value))}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Disc:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input-num"
                      style={{ fontSize: '0.78rem', width: '100%', fontWeight: 600, color: '#10b981' }}
                      value={tier.discountPercent}
                      onChange={(e) => handleTierChange(idx, 'discountPercent', Number(e.target.value))}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f43f5e',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Delete tier"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details for Letter Generation */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Billing / Financial Assistance Mailing Address (for Certified Mail delivery)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                className="input-num"
                placeholder="Mailing Address"
                style={{ fontSize: '0.78rem' }}
                value={profile.billingContact.mailingAddressLine1}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    billingContact: { ...profile.billingContact, mailingAddressLine1: e.target.value },
                  })
                }
              />
              <input
                type="text"
                className="input-num"
                placeholder="City"
                style={{ fontSize: '0.78rem' }}
                value={profile.billingContact.city}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    billingContact: { ...profile.billingContact, city: e.target.value },
                  })
                }
              />
              <input
                type="text"
                className="input-num"
                placeholder="ZIP Code"
                style={{ fontSize: '0.78rem' }}
                value={profile.billingContact.zipCode}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    billingContact: { ...profile.billingContact, zipCode: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              ✓ Apply Policy to Studio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
