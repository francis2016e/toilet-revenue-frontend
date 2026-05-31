import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import EditModal from '../components/EditModal';
import DateRangeDownload from '../components/DateRangeDownload';

const fmt = (n) =>
  `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const TERMINALS = [
  'All Terminals',
  'Terminal 1',
  'Terminal 2',
  'Abakpa Terminal',
  'Gariki Terminal'
];

const TOILET_FILTER = ['All', 'Inside Toilet', 'Outside Toilet'];

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
  const [filterToilet,   setFilterToilet]   = useState('All');
  const [filterMonth,    setFilterMonth]    = useState('');
  const [searchText,     setSearchText]     = useState('');
  const [editRecord,     setEditRecord]     = useState(null);
  const [summary,        setSummary]        = useState([]);

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

  // ── Apply filters ──────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...records];

    if (filterTerminal !== 'All Terminals') {
      result = result.filter(r => r.terminal === filterTerminal);
    }
    if (filterToilet !== 'All') {
      result = result.filter(r => r.toiletType === filterToilet);
    }
    if (filterMonth) {
      result = result.filter(r => {
        const d  = new Date(r.date);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return ym === filterMonth;
      });
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(r =>
        r.expensesDescription.toLowerCase().includes(q) ||
        r.terminal.toLowerCase().includes(q) ||
        r.toiletType.toLowerCase().includes(q) ||
        r.day.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [filterTerminal, filterToilet, filterMonth, searchText, records]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record? Excel will be updated.')) return;
    try {
      await axios.delete(`${API_BASE}/api/revenue/${id}`);
      fetchAll();
    } catch (err) {
      alert('Could not delete record.');
    }
  };

  // Grand totals across filtered records
  const grandRevenue  = filtered.reduce((s, r) => s + r.totalAmountPerDay,      0);
  const grandExpenses = filtered.reduce((s, r) => s + r.totalExpensesPerDay,    0);
  const grandBalance  = filtered.reduce((s, r) => s + r.remainingBalancePerDay, 0);

  return (
    <div>

                  {/* ── Page Title ── */}
                  <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f5233' }}>
                📊 All Records Dashboard
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#9ca3af', marginTop: '4px' }}>
                View, filter, edit and manage all terminal records in one place
              </p>
            </div>

            {/* Date range download — all terminals */}
            <DateRangeDownload
              defaultTerminal="All Terminals"
              defaultToilet="All"
            />

      {/* ── Terminal Summary Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {['Terminal 1', 'Terminal 2', 'Abakpa Terminal', 'Gariki Terminal'].map(t => {
          const badge   = TERMINAL_BADGE_COLORS[t];
          const inside  = summary.find(x => x._id.terminal === t && x._id.toiletType === 'Inside Toilet');
          const outside = summary.find(x => x._id.terminal === t && x._id.toiletType === 'Outside Toilet');

          // Combined totals — now used in the display below
          const totalRev = (inside?.totalRevenue  || 0) + (outside?.totalRevenue  || 0);
          const totalExp = (inside?.totalExpenses || 0) + (outside?.totalExpenses || 0);
          const totalBal = (inside?.totalBalance  || 0) + (outside?.totalBalance  || 0);
          const totalEnt = (inside?.entryCount    || 0) + (outside?.entryCount    || 0);

          return (
            <div key={t} style={{
              background:    '#fff',
              borderRadius:  '12px',
              padding:       '18px',
              boxShadow:     '0 1px 3px rgba(0,0,0,0.08)',
              borderTop:     `4px solid ${badge.color}`
            }}>

              {/* Terminal name badge */}
              <div style={{
                display:       'inline-block',
                padding:       '4px 12px',
                borderRadius:  '999px',
                fontSize:      '0.8rem',
                fontWeight:    700,
                marginBottom:  '14px',
                background:    badge.bg,
                color:         badge.color
              }}>
                {t}
              </div>

              {/* ── Inside Toilet section ── */}
              <div style={cardStyles.sectionLabel}>🚻 Inside Toilet</div>

              <div style={cardStyles.statRow}>
                <span style={cardStyles.statKey}>Revenue</span>
                <span style={{ ...cardStyles.statVal, color: '#1a7a4a' }}>
                  {fmt(inside?.totalRevenue)}
                </span>
              </div>
              <div style={cardStyles.statRow}>
                <span style={cardStyles.statKey}>Expenses</span>
                <span style={{ ...cardStyles.statVal, color: '#dc2626' }}>
                  {fmt(inside?.totalExpenses)}
                </span>
              </div>
              <div style={{ ...cardStyles.statRow, marginBottom: '12px' }}>
                <span style={cardStyles.statKey}>Balance</span>
                <span style={{ ...cardStyles.statVal, color: '#1a7a4a', fontWeight: 700 }}>
                  {fmt(inside?.totalBalance)}
                </span>
              </div>

              {/* ── Outside Toilet section ── */}
              <div style={cardStyles.sectionLabel}>🚾 Outside Toilet</div>

              <div style={cardStyles.statRow}>
                <span style={cardStyles.statKey}>Revenue</span>
                <span style={{ ...cardStyles.statVal, color: '#1a7a4a' }}>
                  {fmt(outside?.totalRevenue)}
                </span>
              </div>
              <div style={cardStyles.statRow}>
                <span style={cardStyles.statKey}>Expenses</span>
                <span style={{ ...cardStyles.statVal, color: '#dc2626' }}>
                  {fmt(outside?.totalExpenses)}
                </span>
              </div>
              <div style={{ ...cardStyles.statRow, marginBottom: '12px' }}>
                <span style={cardStyles.statKey}>Balance</span>
                <span style={{ ...cardStyles.statVal, color: '#1a7a4a', fontWeight: 700 }}>
                  {fmt(outside?.totalBalance)}
                </span>
              </div>

              {/* ── Combined totals section ── */}
              <div style={{
                borderTop:   '2px solid #f3f4f6',
                paddingTop:  '10px',
                marginTop:   '4px',
                background:  '#f9fafb',
                borderRadius: '8px',
                padding:     '10px'
              }}>
                <div style={{
                  fontSize:     '0.75rem',
                  fontWeight:   700,
                  color:        badge.color,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Combined Total
                </div>

                <div style={cardStyles.statRow}>
                  <span style={cardStyles.statKey}>Total Revenue</span>
                  <span style={{ ...cardStyles.statVal, color: '#1a7a4a' }}>
                    {fmt(totalRev)}
                  </span>
                </div>
                <div style={cardStyles.statRow}>
                  <span style={cardStyles.statKey}>Total Expenses</span>
                  <span style={{ ...cardStyles.statVal, color: '#dc2626' }}>
                    {fmt(totalExp)}
                  </span>
                </div>
                <div style={cardStyles.statRow}>
                  <span style={{ ...cardStyles.statKey, fontWeight: 700, color: '#0f5233' }}>
                    Net Balance
                  </span>
                  <span style={{
                    ...cardStyles.statVal,
                    fontWeight: 700,
                    fontSize:   '0.92rem',
                    color:      totalBal >= 0 ? '#0f5233' : '#dc2626'
                  }}>
                    {fmt(totalBal)}
                  </span>
                </div>
                <div style={{ ...cardStyles.statRow, marginTop: '6px' }}>
                  <span style={cardStyles.statKey}>Total Entries</span>
                  <span style={{ ...cardStyles.statVal, color: '#4b5563' }}>
                    {totalEnt} {totalEnt === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Grand Total Bar ── */}
      <div style={{
        background:   'linear-gradient(135deg, #0f5233 0%, #1a7a4a 100%)',
        borderRadius: '12px',
        padding:      '18px 24px',
        display:      'flex',
        flexWrap:     'wrap',
        gap:          '24px',
        marginBottom: '24px',
        boxShadow:    '0 4px 16px rgba(15,82,51,0.3)'
      }}>
        {[
          { label: '📋 Showing',        value: `${filtered.length} records`, color: 'rgba(255,255,255,0.9)' },
          { label: '💰 Total Revenue',  value: fmt(grandRevenue),            color: '#86efac'               },
          { label: '📤 Total Expenses', value: fmt(grandExpenses),           color: '#fca5a5'               },
          { label: '🏦 Net Balance',    value: fmt(grandBalance),            color: 'white'                 }
        ].map(item => (
          <div key={item.label}>
            <div style={{
              fontSize:      '0.75rem',
              color:         'rgba(255,255,255,0.65)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {item.label}
            </div>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize:   '1rem',
              fontWeight: 600,
              color:      item.color,
              marginTop:  '4px'
            }}>
              {item.value}
            </div>
          </div>
        ))}
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
            <label>Filter by Toilet Type</label>
            <select
              value={filterToilet}
              onChange={e => setFilterToilet(e.target.value)}
            >
              {TOILET_FILTER.map(t => (
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

        {(filterTerminal !== 'All Terminals' || filterToilet !== 'All' || filterMonth || searchText) && (
          <button
            className="btn btn-download"
            style={{ marginTop: 12 }}
            onClick={() => {
              setFilterTerminal('All Terminals');
              setFilterToilet('All');
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
                  <th>Toilet Type</th>
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
                        <span className="badge"
                          style={{ background: badge.bg, color: badge.color }}>
                          {record.terminal}
                        </span>
                      </td>

                      <td>
                        <span className="badge" style={{
                          background: record.toiletType === 'Inside Toilet' ? '#e8f5ee' : '#fdf6e3',
                          color:      record.toiletType === 'Inside Toilet' ? '#1a7a4a' : '#c8982a'
                        }}>
                          {record.toiletType === 'Inside Toilet' ? '🚻' : '🚾'} {record.toiletType}
                        </span>
                      </td>

                      <td className="mono">
                        {new Date(record.date).toLocaleDateString('en-NG')}
                      </td>

                      <td>
                        <span className="badge"
                          style={{ background: '#e8f5ee', color: '#1a7a4a' }}>
                          {record.day}
                        </span>
                      </td>

                      <td className="mono"
                        style={{ color: '#1a7a4a', fontWeight: 600 }}>
                        {fmt(record.totalAmountPerDay)}
                      </td>

                      <td style={{ maxWidth: 180 }}>
                        {record.expensesDescription}
                      </td>

                      <td className="mono" style={{ color: '#dc2626' }}>
                        {fmt(record.totalExpensesPerDay)}
                      </td>

                      <td className="mono" style={{
                        fontWeight: 700,
                        color: record.remainingBalancePerDay >= 0 ? '#1a7a4a' : '#dc2626'
                      }}>
                        {fmt(record.remainingBalancePerDay)}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn"
                            style={{
                              background: '#fdf6e3',
                              color:      '#c8982a',
                              border:     '1.5px solid #c8982a',
                              padding:    '6px 12px',
                              fontSize:   '0.8rem'
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
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr style={{ background: '#0f5233', color: 'white', fontWeight: 700 }}>
                  <td colSpan={5} style={{ padding: '12px 14px', color: 'white' }}>
                    TOTALS ({filtered.length} records)
                  </td>
                  <td className="mono"
                    style={{ padding: '12px 14px', color: '#86efac' }}>
                    {fmt(grandRevenue)}
                  </td>
                  <td></td>
                  <td className="mono"
                    style={{ padding: '12px 14px', color: '#fca5a5' }}>
                    {fmt(grandExpenses)}
                  </td>
                  <td className="mono"
                    style={{ padding: '12px 14px', color: 'white' }}>
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

// ── Shared card row styles ─────────────────────────────────────────────────────
const cardStyles = {
  sectionLabel: {
    fontSize:     '0.75rem',
    color:        '#9ca3af',
    marginBottom: '6px',
    fontWeight:   600,
    marginTop:    '4px'
  },
  statRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '3px 0',
    borderBottom:   '1px solid #f9fafb'
  },
  statKey: {
    fontSize: '0.78rem',
    color:    '#6b7280'
  },
  statVal: {
    fontFamily: 'Space Mono, monospace',
    fontSize:   '0.82rem',
    fontWeight: 600,
    color:      '#1f2937'
  }
};