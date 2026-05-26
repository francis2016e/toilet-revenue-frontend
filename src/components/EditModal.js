import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config';

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday'
];

const getDayName = (dateString) => {
  const d = new Date(dateString + 'T00:00:00');
  const jsDay = d.getDay();
  const index = jsDay === 0 ? 6 : jsDay - 1;
  return DAYS[index];
};

export default function EditModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: '',
    day: '',
    totalAmountPerDay: '',
    expensesDescription: '',
    totalExpensesPerDay: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Pre-fill the form with the existing record data when modal opens
  useEffect(() => {
    if (record) {
      const dateOnly = new Date(record.date).toISOString().split('T')[0];
      setForm({
        date: dateOnly,
        day: record.day,
        totalAmountPerDay: record.totalAmountPerDay,
        expensesDescription: record.expensesDescription,
        totalExpensesPerDay: record.totalExpensesPerDay
      });
    }
  }, [record]);

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
      await axios.put(`${API_BASE}/api/revenue/${record._id}`, form);
      setStatus({ type: 'success', msg: '✅ Record updated successfully!' });
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } catch (err) {
      setStatus({
        type: 'error',
        msg: `❌ Error: ${err.response?.data?.error || 'Could not update record.'}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>✏️ Edit Record</h2>
            <p style={styles.modalSubtitle}>{record.terminal}</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
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
                    ? `₦${remaining.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                    : ''
                }
              />
            </div>

          </div>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-download"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px'
  },
  modal: {
    background: '#fff',
    borderRadius: '14px',
    padding: '28px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#0f5233'
  },
  modalSubtitle: {
    fontSize: '0.85rem',
    color: '#9ca3af',
    marginTop: '4px'
  },
  closeBtn: {
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#4b5563'
  }
};