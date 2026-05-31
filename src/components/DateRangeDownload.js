import { useState } from 'react';
import API_BASE from '../config';

const TERMINALS_WITH_ALL = [
  'All Terminals',
  'Terminal 1',
  'Terminal 2',
  'Abakpa Terminal',
  'Gariki Terminal'
];

const TOILET_WITH_ALL = ['All', 'Inside Toilet', 'Outside Toilet'];

export default function DateRangeDownload({ defaultTerminal, defaultToilet }) {
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [terminal,   setTerminal]   = useState(defaultTerminal || 'All Terminals');
  const [toiletType, setToiletType] = useState(defaultToilet  || 'All');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      setError('Please select both a start date and an end date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        terminal,
        toiletType
      });

      const response = await fetch(
        `${API_BASE}/api/revenue/download-range?${params.toString()}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'No records found for the selected dates.');
        setLoading(false);
        return;
      }

      // Trigger file download in browser
      const blob     = await response.blob();
      const url      = window.URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;

      const label    = terminal !== 'All Terminals' ? terminal : 'All_Terminals';
      const toilet   = toiletType !== 'All' ? `_${toiletType.replace(/\s+/g, '_')}` : '';
      link.download  = `${label}${toilet}_${startDate}_to_${endDate}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError('Could not download. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">📥 Download Records by Date Range</div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="form-grid">

        <div className="form-group">
          <label>Terminal</label>
          <select
            value={terminal}
            onChange={e => setTerminal(e.target.value)}
          >
            {TERMINALS_WITH_ALL.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Toilet Type</label>
          <select
            value={toiletType}
            onChange={e => setToiletType(e.target.value)}
          >
            {TOILET_WITH_ALL.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

      </div>

      <div className="form-actions">
        <button
          className="btn btn-download"
          onClick={handleDownload}
          disabled={loading}
        >
          {loading ? '⏳ Preparing Excel...' : '📥 Download Excel'}
        </button>

        {(startDate || endDate) && (
          <button
            className="btn"
            style={{
              background: '#f3f4f6',
              color:      '#4b5563',
              border:     '1px solid #e5e7eb'
            }}
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setError('');
            }}
          >
            ✕ Clear Dates
          </button>
        )}
      </div>
    </div>
  );
}