import { useState } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import { useAuth } from '../context/AuthContext';

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday'
];

const getToday = () => new Date().toISOString().split('T')[0];

const getDayName = (dateString) => {
  const d     = new Date(dateString + 'T00:00:00');
  const jsDay = d.getDay();
  const index = jsDay === 0 ? 6 : jsDay - 1;
  return DAYS[index];
};

export default function RevenueForm({ terminal, toiletType, onSuccess }) {
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    date:                getToday(),
    day:                 getDayName(getToday()),
    totalAmountPerDay:   '',
    expensesDescription: '',
    totalExpensesPerDay: ''
  });

  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'date') {
      setForm(f => ({ ...f, date: value, day: getDayName(value) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const revenue   = parseFloat(form.totalAmountPerDay)   || 0;
  const expenses  = parseFloat(form.totalExpensesPerDay) || 0;
  const remaining = revenue - expenses;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await axios.post(`${API_BASE}/api/revenue`, {
        ...form,
        terminal,
        toiletType
      });
      setStatus({
        type: 'success',
        msg:  `✅ Entry saved for ${terminal} — ${toiletType}! Excel updated.`
      });
      setForm(f => ({
        ...f,
        totalAmountPerDay:   '',
        expensesDescription: '',
        totalExpensesPerDay: ''
      }));
      onSuccess();
    } catch (err) {
      setStatus({
        type: 'error',
        msg:  `❌ Error: ${err.response?.data?.error || 'Could not save entry.'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(
      `${API_BASE}/api/revenue/download/${encodeURIComponent(terminal)}`,
      '_blank'
    );
  };

  // ── If not admin, show read-only message instead of form ──
  if (!isAdmin()) {
    return (
      <div className="card">
        <div className="card-title">
          📝 Daily Entry —{' '}
          <span style={{ color: '#c8982a' }}>{toiletType}</span>
        </div>
        <div style={{
          textAlign:    'center',
          padding:      '32px 24px',
          background:   '#f9fafb',
          borderRadius: '10px',
          border:       '1.5px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔒</div>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>
            View Only Mode
          </p>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.6' }}>
            You can view and download records below.<br />
            Only administrators can add, edit or delete records.
          </p>
          <button
            className="btn btn-download"
            style={{ margin: '16px auto 0', display: 'inline-flex' }}
            onClick={handleDownload}
          >
            📥 Download Excel
          </button>
        </div>
      </div>
    );
  }

  // ── Admin sees full form ──
  return (
    <div className="card">
      <div className="card-title">
        📝 New Daily Entry —{' '}
        <span style={{ color: '#c8982a' }}>{toiletType}</span>
      </div>

      {status && (
        <div className={`alert alert-${status.type}`}>{status.msg}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Day</label>
            <input
              type="text"
              value={form.day}
              readOnly
              className="calculated-field"
            />
          </div>

          <div className="form-group">
            <label>Total Amount / Day (₦)</label>
            <input
              type="number"
              name="totalAmountPerDay"
              value={form.totalAmountPerDay}
              onChange={handleChange}
              placeholder="e.g. 25000"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Expenses Description</label>
            <textarea
              name="expensesDescription"
              value={form.expensesDescription}
              onChange={handleChange}
              placeholder="e.g. Toilet paper, cleaning supplies, soap..."
              required
            />
          </div>

          <div className="form-group">
            <label>Total Expenses / Day (₦)</label>
            <input
              type="number"
              name="totalExpensesPerDay"
              value={form.totalExpensesPerDay}
              onChange={handleChange}
              placeholder="e.g. 5000"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Remaining Balance / Day (₦) — Auto</label>
            <input
              type="text"
              readOnly
              className="calculated-field"
              value={
                revenue || expenses
                  ? `₦${remaining.toLocaleString('en-NG', {
                      minimumFractionDigits: 2
                    })}`
                  : ''
              }
              placeholder="Auto-calculated"
            />
          </div>

        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '⏳ Saving...' : '💾 Save Entry & Update Excel'}
          </button>

          <button
            type="button"
            className="btn btn-download"
            onClick={handleDownload}
          >
            📥 Download Excel
          </button>
        </div>
      </form>
    </div>
  );
}