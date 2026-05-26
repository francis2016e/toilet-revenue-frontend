import { useState, useEffect } from 'react';
import axios from 'axios';

const fmt = (n) =>
  `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function SummaryCards({ terminal, refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get('/api/revenue/summary')
      .then(res => {
        const found = res.data.find(s => s._id === terminal);
        setData(found || null);
      })
      .catch(() => setData(null));
  }, [terminal, refreshKey]);

  return (
    <div className="summary-grid">
      <div className="summary-card">
        <div className="summary-label">📅 Total Entries</div>
        <div className="summary-value">{data?.entryCount ?? 0}</div>
      </div>

      <div className="summary-card gold">
        <div className="summary-label">💰 Total Revenue</div>
        <div className="summary-value" style={{ fontSize: '1.1rem' }}>
          {fmt(data?.totalRevenue)}
        </div>
      </div>

      <div className="summary-card red">
        <div className="summary-label">📤 Total Expenses</div>
        <div className="summary-value" style={{ fontSize: '1.1rem' }}>
          {fmt(data?.totalExpenses)}
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-label">🏦 Net Balance</div>
        <div
          className="summary-value"
          style={{
            fontSize: '1.1rem',
            color: (data?.totalBalance ?? 0) >= 0 ? '#1a7a4a' : '#dc2626'
          }}
        >
          {fmt(data?.totalBalance)}
        </div>
      </div>
    </div>
  );
}