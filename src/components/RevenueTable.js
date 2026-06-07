import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import EditModal from './EditModal';
import DateRangeDownload from './DateRangeDownload';
import { useAuth } from '../context/AuthContext';

const fmt = (n) =>
  `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function RevenueTable({ terminal, toiletType, refreshKey }) {
  const { isAdmin } = useAuth();

  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editRecord, setEditRecord] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/revenue?terminal=${encodeURIComponent(terminal)}&toiletType=${encodeURIComponent(toiletType)}`
      );
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [terminal, toiletType]);

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

  const totalRevenue  = records.reduce((s, r) => s + r.totalAmountPerDay,      0);
  const totalExpenses = records.reduce((s, r) => s + r.totalExpensesPerDay,    0);
  const totalBalance  = records.reduce((s, r) => s + r.remainingBalancePerDay, 0);

  // Latest record at top, oldest at bottom
  const sortedRecords = [...records].reverse();

  const columns = [
    'S/N', 'Date', 'Day', 'Total Amount/Day',
    'Expenses Description', 'Total Expenses/Day', 'Remaining Balance/Day',
    ...(isAdmin() ? ['Actions'] : []),
  ];

  return (
    <div className="card">

      {/* Card Title */}
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <span>📊 Records — {terminal} › {toiletType}</span>
        <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 400 }}>
          {records.length} {records.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>
            No entries yet for {toiletType} in {terminal}.<br />
            {isAdmin() && 'Use the form above to add the first entry.'}
          </p>
        </div>
      ) : (
        <>
          {/* Scrollable table body — max ~30 rows then scrolls */}
          <div
            className="table-wrapper"
            style={{
              maxHeight:    '520px',
              overflowY:    'auto',
              overflowX:    'auto',
              borderRadius: '8px 8px 0 0',
              border:       '1px solid #e5e7eb',
              borderBottom: 'none',
            }}
          >
            <table style={{ marginBottom: 0, borderRadius: 0 }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      style={{
                        position:   'sticky',
                        top:        0,
                        zIndex:     2,
                        background: '#0f5233',
                        color:      'white',
                        boxShadow:  '0 2px 0 #0a3d24',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedRecords.map((record, idx) => (
                  <tr key={record._id}>
                    {/* S/N counts down so oldest record = 1 */}
                    <td>{records.length - idx}</td>

                    <td className="mono">
                      {new Date(record.date).toLocaleDateString('en-NG')}
                    </td>

                    <td>
                      <span className="badge" style={{ background: '#e8f5ee', color: '#1a7a4a' }}>
                        {record.day}
                      </span>
                    </td>

                    <td className="mono" style={{ color: '#1a7a4a', fontWeight: 600 }}>
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
                        color: record.remainingBalancePerDay >= 0 ? '#1a7a4a' : '#dc2626',
                      }}
                    >
                      {fmt(record.remainingBalancePerDay)}
                    </td>

                    {isAdmin() && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn"
                            style={{
                              background: '#fdf6e3',
                              color:      '#c8982a',
                              border:     '1.5px solid #c8982a',
                              padding:    '6px 12px',
                              fontSize:   '0.8rem',
                            }}
                            onClick={() => setEditRecord(record)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(record._id)}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals row — always visible outside the scroll area */}
          <div
            style={{
              overflowX:    'auto',
              border:       '1px solid #0a3d24',
              borderTop:    'none',
              borderRadius: '0 0 8px 8px',
            }}
          >
            <table style={{ marginBottom: 0, borderRadius: 0 }}>
              <tfoot>
                <tr style={{ background: '#0f5233', color: 'white', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '12px 14px', color: 'white' }}>
                    TOTALS
                  </td>
                  <td className="mono" style={{ padding: '12px 14px', color: '#86efac' }}>
                    {fmt(totalRevenue)}
                  </td>
                  <td></td>
                  <td className="mono" style={{ padding: '12px 14px', color: '#fca5a5' }}>
                    {fmt(totalExpenses)}
                  </td>
                  <td className="mono" style={{ padding: '12px 14px', color: 'white' }}>
                    {fmt(totalBalance)}
                  </td>
                  {isAdmin() && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Date Range Download */}
      <DateRangeDownload
        defaultTerminal={terminal}
        defaultToilet={toiletType}
      />

      {/* Edit Modal — admin only */}
      {isAdmin() && editRecord && (
        <EditModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={fetchRecords}
        />
      )}

    </div>
  );
}