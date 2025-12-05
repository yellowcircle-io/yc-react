/**
 * ProspectInputModal
 *
 * Modal for entering prospect emails to publish a journey.
 * Supports single email, multiple emails, or CSV paste.
 */

import React, { useState } from 'react';

const ProspectInputModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [inputMode, setInputMode] = useState('single'); // single, multiple, csv
  const [singleEmail, setSingleEmail] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleCompany, setSingleCompany] = useState('');
  const [multipleEmails, setMultipleEmails] = useState('');
  const [csvData, setCsvData] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const parseProspects = () => {
    setError('');
    let prospects = [];

    if (inputMode === 'single') {
      if (!singleEmail.trim()) {
        setError('Please enter an email address');
        return null;
      }
      if (!validateEmail(singleEmail)) {
        setError('Please enter a valid email address');
        return null;
      }
      prospects = [{
        email: singleEmail.trim(),
        name: singleName.trim(),
        company: singleCompany.trim()
      }];
    } else if (inputMode === 'multiple') {
      const lines = multipleEmails.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setError('Please enter at least one email');
        return null;
      }

      const invalidEmails = [];
      prospects = lines.map(line => {
        const email = line.trim();
        if (!validateEmail(email)) {
          invalidEmails.push(email);
        }
        return { email, name: '', company: '' };
      });

      if (invalidEmails.length > 0) {
        setError(`Invalid emails: ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`);
        return null;
      }
    } else if (inputMode === 'csv') {
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setError('Please paste CSV data');
        return null;
      }

      // Skip header row if it looks like headers
      const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
      const invalidEmails = [];

      prospects = lines.slice(startIndex).map(line => {
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        const email = parts[0] || '';

        if (!validateEmail(email)) {
          invalidEmails.push(email);
        }

        return {
          email,
          name: parts[1] || '',
          company: parts[2] || ''
        };
      }).filter(p => p.email);

      if (invalidEmails.length > 0 && invalidEmails.length === prospects.length + invalidEmails.length) {
        setError('No valid emails found in CSV');
        return null;
      }
    }

    return prospects;
  };

  const handleSubmit = () => {
    const prospects = parseProspects();
    if (prospects && prospects.length > 0) {
      onSubmit(prospects);
    }
  };

  const handleClose = () => {
    setSingleEmail('');
    setSingleName('');
    setSingleCompany('');
    setMultipleEmails('');
    setCsvData('');
    setError('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
            Add Prospects
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            &times;
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px'
        }}>
          {[
            { key: 'single', label: 'Single' },
            { key: 'multiple', label: 'Multiple' },
            { key: 'csv', label: 'CSV' }
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setInputMode(mode.key)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: inputMode === mode.key ? '600' : '400',
                backgroundColor: inputMode === mode.key ? 'rgb(251, 191, 36)' : '#f3f4f6',
                color: inputMode === mode.key ? 'black' : '#666'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Single Email Form */}
        {inputMode === 'single' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Email *
              </label>
              <input
                type="email"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                placeholder="john@company.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Name (optional)
              </label>
              <input
                type="text"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="John Smith"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Company (optional)
              </label>
              <input
                type="text"
                value={singleCompany}
                onChange={(e) => setSingleCompany(e.target.value)}
                placeholder="Acme Corp"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}

        {/* Multiple Emails */}
        {inputMode === 'multiple' && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Emails (one per line)
            </label>
            <textarea
              value={multipleEmails}
              onChange={(e) => setMultipleEmails(e.target.value)}
              placeholder="john@company1.com&#10;jane@company2.com&#10;bob@company3.com"
              style={{
                width: '100%',
                height: '150px',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* CSV Paste */}
        {inputMode === 'csv' && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Paste CSV (email, name, company)
            </label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="email,name,company&#10;john@acme.com,John Smith,Acme Corp&#10;jane@bigco.com,Jane Doe,BigCo Inc"
              style={{
                width: '100%',
                height: '150px',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Format: email, name (optional), company (optional)
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px'
        }}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'rgb(251, 191, 36)',
              cursor: isLoading ? 'wait' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Publishing...' : 'Publish Journey'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProspectInputModal;
