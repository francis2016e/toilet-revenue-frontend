import { useState } from 'react';
import RevenueForm from './components/RevenueForm';
import RevenueTable from './components/RevenueTable';
import SummaryCards from './components/SummaryCards';

const TERMINALS = [
  'Terminal 1',
  'Terminal 2',
  'Abakpa Terminal',
  'Gariki Terminal'
];

export default function App() {
  const [activeTerminal, setActiveTerminal] = useState(TERMINALS[0]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => setRefreshKey(k => k + 1);

  return (
    <div>
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">🏛️</div>
          <div className="header-text">
            <h1>Enugu East Bus Terminal</h1>
            <p>Toilet Revenue Management System</p>
          </div>
        </div>

        {/* ── Terminal Tabs ── */}
        <nav className="nav-tabs">
          <div className="nav-tabs-inner">
            {TERMINALS.map(terminal => (
              <button
                key={terminal}
                className={`nav-tab ${activeTerminal === terminal ? 'active' : ''}`}
                onClick={() => setActiveTerminal(terminal)}
              >
                {terminal}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Page Body ── */}
      <main className="main-content">
        <SummaryCards terminal={activeTerminal} refreshKey={refreshKey} />
        <RevenueForm  terminal={activeTerminal} onSuccess={handleSuccess} />
        <RevenueTable terminal={activeTerminal} refreshKey={refreshKey} />
      </main>
    </div>
  );
}