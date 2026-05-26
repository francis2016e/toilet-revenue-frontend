import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import EditModal from '../components/EditModal';

const fmt = (n) =>
  `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const TERMINALS = [
  'All Terminals',
  'Terminal 1',
  'Terminal 2',
  'Abakpa Terminal',
  'Gariki Terminal'
];

const TERMINAL_BADGE_COLORS = {
  'Terminal 1':      { bg: '#D6E4F0', color: '#1F4E79' },
  'Terminal 2':      { bg: '#D6EAC8', color: '#375623' },
  'Abakpa Terminal': { bg: '#F4D3C0', color: '#7B2D00' },
  'Gariki Terminal': { bg: '#E8D5F0', color: '#4A235A' }
};

export default function Dashboard() {
  const [records,        setRecords]        = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filterTerminal, setFilterTerminal] = useState('All Terminals');
  const [filterMonth,    setFilterMonth]    = useState('');
  const [searchText,     setSearchText]     = useState('');
  const [editRecord,     setEditRecord]     = useState(null);
  const [summary,        setSummary]        = useState([]);

  // Fetch all records
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, sumRes] = await Promise.all([
        axios.get(`${API_BASE}/api/revenue`),
        axios.get(`${API_BASE}/api/revenue/summary`)
      ]);
      setRecords(recRes.data);
      setFiltered(recRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Apply filters whenever filter values change
  useEffect(() => {
    let result = [...records];

    if (filterTerminal !== 'All Terminals') {
      result = result.filter(r => r.terminal === filterTerminal);
    }

    if (filterMonth) {
      result = result.filter(r => {
        const d = new Date(r.date);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return ym === filterMonth;
      });
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(r =>
        r.expensesDescription.toLowerCase().includes(q) ||
        r.terminal.toLowerCase().includes(q) ||
        r.day.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [filterTerminal, filterMonth, searchText, records]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this record?\nThe Excel file will be updated automatically.'
    );
    if (!confirmed) return;
    try {
      await axios.delete(`${API_BASE}/api/revenue/${id}`);
      fetchAll();
    } catch (err) {
      alert('Could not delete record. Please try again.');
    }
  };

  // Grand totals across filtered records
  const grandRevenue  = filtered.reduce((s, r) => s + r.totalAmountPerDay,      0);
  const grandExpenses = filtered.reduce((s, r) => s + r.totalExpensesPerDay,    0);
  const grandBalance  = filtered.reduce((s, r) => s + r.remainingBalancePerDay, 0);

  return (
    <div>
      {/* ── Page Title ── */}
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>📊 All Records Dashboard</h2>
        <p style={styles.pageSubtitle}>
          View, filter, edit and manage all terminal records in one place
        </p>
      </div>

      {/* ── Summary Cards Per Terminal ── */}
      <div style={styles.terminalSummaryGrid}>
        {['Terminal 1','Terminal 2','Abakpa Terminal','Gariki Terminal'].map(t => {
          const s = summary.find(x => x._id === t);
          const badge = TERMINAL_BADGE_COLORS[t];
          return (
            <div key={t} style={{ ...styles.terminalCard, borderTopColor: badge.color }}>
              <div style={{ ...styles.terminalBadge, background: badge.bg, color: badge.color }}>
                {t}
              </div>
              <div style={styles.terminalStat}>
                <span style={styles.terminalStatLabel}>Revenue</span>
                <span style={{ ...styles.terminalStatValue, color: '#1a7a4a' }}>
                  {fmt(s?.totalRevenue)}
                </span>
              </div>
              <div style={styles.terminalStat}>
                <span style={styles.terminalStatLabel}>Expenses</span>
                <span style={{ ...styles.terminalStatValue, color: '#dc2626' }}>
                  {fmt(s?.totalExpenses)}
                </span>
              </div>
              <div style={styles.terminalStat}>
                <span style={styles.terminalStatLabel}>Balance</span>
                <span style={{ ...styles.terminalStatValue, color: '#0f5233', fontWeight: 700 }}>
                  {fmt(s?.totalBalance)}
                </span>
              </div>
              <div style={styles.terminalStat}>
                <span style={styles.terminalStatLabel}>Entries</span>
                <span style={styles.terminalStatValue}>{s?.entryCount ?? 0}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Grand Total Bar ── */}
      <div style={styles.grandTotalBar}>
        <div style={styles.grandItem}>
          <span style={styles.grandLabel}>📋 Showing</span>
          <span style={styles.grandValue}>{filtered.length} records</span>
        </div>
        <div style={styles.grandItem}>
          <span style={styles.grandLabel}>💰 Total Revenue</span>
          <span style={{ ...styles.grandValue, color: '#86efac' }}>{fmt(grandRevenue)}</span>
        </div>
        <div style={styles.grandItem}>
          <span style={styles.grandLabel}>📤 Total Expenses</span>
          <span style={{ ...styles.grandValue, color: '#fca5a5' }}>{fmt(grandExpenses)}</span>
        </div>
        <div style={styles.grandItem}>
          <span style={styles.grandLabel}>🏦 Net Balance</span>
          <span style={{ ...styles.grandValue, color: 'white', fontWeight: 700 }}>{fmt(grandBalance)}</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card">
        <div className="card-title">🔍 Filter Records</div>
        <div className="form-grid">

          <div className="form-group">
            <label>Filter by Terminal</label>
            <select
              value={filterTerminal}
              onChange={e => setFilterTerminal(e.target.value)}
            >
              {TERMINALS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Filter by Month</label>
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Search Description / Day</label>
            <input
              type="text"
              placeholder="e.g. soap, Monday..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

        </div>

        {(filterTerminal !== 'All Terminals' || filterMonth || searchText) && (
          <button
            className="btn btn-download"
            style={{ marginTop: 12 }}
            onClick={() => {
              setFilterTerminal('All Terminals');
              setFilterMonth('');
              setSearchText('');
            }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* ── Records Table ── */}
      <div className="card">
        <div className="card-title" style={{ justifyContent: 'space-between' }}>
          <span>📋 All Records</span>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 400 }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} found
          </span>
        </div>

        {loading ? (
          <div className="loading">⏳ Loading all records...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No records found matching your filters.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Terminal</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Total Amount/Day</th>
                  <th>Expenses Description</th>
                  <th>Total Expenses/Day</th>
                  <th>Remaining Balance/Day</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => {
                  const badge = TERMINAL_BADGE_COLORS[record.terminal];
                  return (
                    <tr key={record._id}>
                      <td>{idx + 1}</td>

                      <td>
                        <span
                          className="badge"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {record.terminal}
                        </span>
                      </td>

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

                      <td className="mono" style={{ color: '#1a7a4a', fontWeight: 600 }}>
                        {fmt(record.totalAmountPerDay)}
                      </td>

                      <td style={{ maxWidth: 200 }}>
                        {record.expensesDescription}
                      </td>

                      <td className="mono" style={{ color: '#dc2626' }}>
                        {fmt(record.totalExpensesPerDay)}
                      </td>

                      <td
                        className="mono"
                        style={{
                          fontWeight: 700,
                          color: record.remainingBalancePerDay >= 0 ? '#1a7a4a' : '#dc2626'
                        }}
                      >
                        {fmt(record.remainingBalancePerDay)}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn"
                            style={styles.editBtn}
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
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr style={{ background: '#0f5233', color: 'white', fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: '12px 14px', color: 'white' }}>
                    TOTALS ({filtered.length} records)
                  </td>
                  <td className="mono" style={{ padding: '12px 14px', color: '#86efac' }}>
                    {fmt(grandRevenue)}
                  </td>
                  <td></td>
                  <td className="mono" style={{ padding: '12px 14px', color: '#fca5a5' }}>
                    {fmt(grandExpenses)}
                  </td>
                  <td className="mono" style={{ padding: '12px 14px', color: 'white' }}>
                    {fmt(grandBalance)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editRecord && (
        <EditModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}

const styles = {
  pageHeader: {
    marginBottom: '24px'
  },
  pageTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#0f5233'
  },
  pageSubtitle: {
    fontSize: '0.88rem',
    color: '#9ca3af',
    marginTop: '4px'
  },
  terminalSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  terminalCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    borderTop: '4px solid #ccc'
  },
  terminalBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 700,
    marginBottom: '12px'
  },
  terminalStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  terminalStatLabel: {
    fontSize: '0.78rem',
    color: '#9ca3af',
    fontWeight: 500
  },
  terminalStatValue: {
    fontFamily: 'Space Mono, monospace',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#1f2937'
  },
  grandTotalBar: {
    background: 'linear-gradient(135deg, #0f5233 0%, #1a7a4a 100%)',
    borderRadius: '12px',
    padding: '18px 24px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(15,82,51,0.3)'
  },
  grandItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  grandLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.65)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  grandValue: {
    fontFamily: 'Space Mono, monospace',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.9)'
  },
  editBtn: {
    background: '#fdf6e3',
    color: '#c8982a',
    border: '1.5px solid #c8982a',
    padding: '6px 12px',
    fontSize: '0.8rem'
  }
};