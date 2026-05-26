import { useState, useEffect, useCallback } from 'react';
import API_BASE from '../config';
import axios from 'axios';

const fmt = (n) =>
  `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function RevenueTable({ terminal, refreshKey }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/revenue?terminal=${encodeURIComponent(terminal)}`);
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [terminal]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, refreshKey]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this record?\nThe Excel file will be updated automatically.'
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/api/revenue/${id}`);
      fetchRecords();
    } catch (err) {
      alert('Could not delete this record. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">⏳ Loading records...</div>
      </div>
    );
  }

  const totalRevenue  = records.reduce((s, r) => s + r.totalAmountPerDay, 0);
  const totalExpenses = records.reduce((s, r) => s + r.totalExpensesPerDay, 0);
  const totalBalance  = records.reduce((s, r) => s + r.remainingBalancePerDay, 0);

  return (
    <div className="card">
      <div
        className="card-title"
        style={{ justifyContent: 'space-between' }}
      >
        <span>📊 Records — {terminal}</span>
        <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 400 }}>
          {records.length} {records.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>
            No entries yet for {terminal}.<br />
            Use the form above to add the first entry.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Date</th>
                <th>Day</th>
                <th>Total Amount/Day</th>
                <th>Expenses Description</th>
                <th>Total Expenses/Day</th>
                <th>Remaining Balance/Day</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record, idx) => (
                <tr key={record._id}>
                  <td>{idx + 1}</td>

                  <td className="mono">
                    {new Date(record.date).toLocaleDateString('en-NG')}
                  </td>

                  <td>
                    <span
                      className="badge"
                      style={{ background: '#e8f5ee', color: '#1a7a4a' }}
                    >
                      {record.day}
                    </span>
                  </td>

                  <td
                    className="mono"
                    style={{ color: '#1a7a4a', fontWeight: 600 }}
                  >
                    {fmt(record.totalAmountPerDay)}
                  </td>

                  <td style={{ maxWidth: 220 }}>
                    {record.expensesDescription}
                  </td>

                  <td className="mono" style={{ color: '#dc2626' }}>
                    {fmt(record.totalExpensesPerDay)}
                  </td>

                  <td
                    className="mono"
                    style={{
                      fontWeight: 700,
                      color: record.remainingBalancePerDay >= 0
                        ? '#1a7a4a'
                        : '#dc2626'
                    }}
                  >
                    {fmt(record.remainingBalancePerDay)}
                  </td>

                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(record._id)}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr style={{ background: '#0f5233', color: 'white', fontWeight: 700 }}>
                <td
                  colSpan={3}
                  style={{ padding: '12px 14px', color: 'white' }}
                >
                  TOTALS
                </td>
                <td
                  className="mono"
                  style={{ padding: '12px 14px', color: '#86efac' }}
                >
                  {fmt(totalRevenue)}
                </td>
                <td></td>
                <td
                  className="mono"
                  style={{ padding: '12px 14px', color: '#fca5a5' }}
                >
                  {fmt(totalExpenses)}
                </td>
                <td
                  className="mono"
                  style={{ padding: '12px 14px', color: 'white' }}
                >
                  {fmt(totalBalance)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}