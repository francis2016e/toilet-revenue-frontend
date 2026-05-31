import { useState, useRef, useEffect } from 'react';
import RevenueForm  from './components/RevenueForm';
import RevenueTable from './components/RevenueTable';
import SummaryCards from './components/SummaryCards';
import Dashboard    from './pages/Dashboard';
import Login        from './pages/Login';
import AdminUsers   from './pages/AdminUsers';
import { useAuth }  from './context/AuthContext';
import EnuguLogo    from './assets/logo.png';

const TERMINALS    = ['Terminal 1', 'Terminal 2', 'Abakpa Terminal', 'Gariki Terminal'];
const TOILET_TYPES = ['Inside Toilet', 'Outside Toilet'];

const dropdownStyles = {
  menu: {
    position:     'fixed',
    top:          'auto',
    left:         'auto',
    background:   '#fff',
    borderRadius: '10px',
    boxShadow:    '0 8px 24px rgba(0,0,0,0.18)',
    minWidth:     '190px',
    zIndex:       9999,
    overflow:     'hidden',
    border:       '1px solid #e5e7eb'
  },
  arrow: {
    position:     'absolute',
    top:          '-6px',
    left:         '50%',
    transform:    'translateX(-50%)',
    width:        0,
    height:       0,
    borderLeft:   '6px solid transparent',
    borderRight:  '6px solid transparent',
    borderBottom: '6px solid #fff',
    filter:       'drop-shadow(0 -1px 1px rgba(0,0,0,0.08))'
  },
  menuHeader: {
    padding:       '10px 14px 8px',
    fontSize:      '0.72rem',
    fontWeight:    700,
    color:         '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom:  '1px solid #f3f4f6',
    background:    '#fafafa'
  },
  menuItem: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    width:        '100%',
    padding:      '11px 14px',
    border:       'none',
    borderBottom: '1px solid #f9fafb',
    cursor:       'pointer',
    fontSize:     '0.9rem',
    fontFamily:   'DM Sans, sans-serif',
    textAlign:    'left',
    transition:   'background 0.15s'
  },
  menuIcon:  { fontSize: '1.1rem' },
  checkmark: {
    marginLeft: 'auto',
    color:      '#1a7a4a',
    fontWeight: 700,
    fontSize:   '0.9rem'
  }
};

const breadcrumbStyles = {
  bar: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    background:     '#fff',
    borderRadius:   '10px',
    padding:        '12px 18px',
    marginBottom:   '20px',
    boxShadow:      '0 1px 4px rgba(0,0,0,0.07)',
    flexWrap:       'wrap',
    gap:            '8px'
  },
  left:     { display: 'flex', alignItems: 'center', gap: '10px' },
  terminal: { fontSize: '0.95rem', fontWeight: 700, color: '#0f5233' },
  sep:      { color: '#9ca3af', fontSize: '1.1rem' },
  toilet: {
    fontSize:     '0.9rem',
    fontWeight:   600,
    color:        '#c8982a',
    background:   '#fdf6e3',
    padding:      '3px 10px',
    borderRadius: '999px',
    border:       '1px solid #c8982a'
  },
  hint: {
    fontSize:  '0.78rem',
    color:     '#9ca3af',
    fontStyle: 'italic'
  }
};

export default function App() {
  const { user, loading, logout } = useAuth();

  const [activePage,     setActivePage]     = useState('entry');
  const [activeTerminal, setActiveTerminal] = useState('Terminal 1');
  const [toiletType,     setToiletType]     = useState('Inside Toilet');
  const [openDropdown,   setOpenDropdown]   = useState(null);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [showLogin,      setShowLogin]      = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const dropdownRef = useRef(null);

  // Check admin directly from user object — no function dependency issue
  const admin = user?.role === 'admin';

  const handleSuccess = () => setRefreshKey(k => k + 1);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When admin logs in go to dashboard automatically
  // Uses user.role directly — no ESLint warning
  useEffect(() => {
    if (user && user.role === 'admin') {
      setActivePage('dashboard');
      setShowLogin(false);
    }
  }, [user]);

  // When admin logs out go back to entry page
  const handleLogout = () => {
    logout();
    setActivePage('entry');
  };

  const handleTerminalClick = (terminal) => {
    setOpenDropdown(prev => prev === terminal ? null : terminal);
  };

  const handleToiletSelect = (terminal, type) => {
    setActiveTerminal(terminal);
    setToiletType(type);
    setActivePage('entry');
    setOpenDropdown(null);
  };

  const isTerminalActive = (terminal) =>
    activePage === 'entry' && activeTerminal === terminal;

  // Show loading spinner while restoring session from token
  if (loading) {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#f0f4f1',
        color:          '#0f5233',
        fontSize:       '1rem',
        gap:            '10px'
      }}>
        ⏳ Loading...
      </div>
    );
  }

  return (
    <div>

      {/* Login modal — only shown when Admin Login button is clicked */}
      {showLogin && !user && (
        <Login onClose={() => setShowLogin(false)} />
      )}

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">

          {/* Logo */}
          <div className="header-logo">
            <img
              src={EnuguLogo}
              alt="Enugu East Bus Terminal Logo"
              style={{
                width:           '80px',
                height:          '80px',
                borderRadius:    '50%',
                objectFit:       'contain',
                backgroundColor: 'white',
                padding:         '6px'
              }}
            />
          </div>

          {/* Title */}
          <div className="header-text">
            <h1>Enugu East Bus Terminal</h1>
            <p>Toilet Revenue Management System</p>
          </div>

          {/* Right side of header */}
          <div style={{
            marginLeft: 'auto',
            display:    'flex',
            alignItems: 'center',
            gap:        '12px',
            flexShrink: 0
          }}>
            {admin ? (
              // Admin is logged in — show name and logout
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize:   '0.88rem',
                    fontWeight: 700,
                    color:      'white'
                  }}>
                    {user.fullName}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color:    'rgba(255,255,255,0.65)'
                  }}>
                    👑 Administrator
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    background:   'rgba(255,255,255,0.15)',
                    border:       '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    color:        'white',
                    padding:      '7px 14px',
                    fontSize:     '0.82rem',
                    cursor:       'pointer',
                    fontFamily:   'DM Sans, sans-serif',
                    fontWeight:   600
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              // Not logged in — show Admin Login button
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  background:   'rgba(255,255,255,0.15)',
                  border:       '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color:        'white',
                  padding:      '7px 16px',
                  fontSize:     '0.85rem',
                  cursor:       'pointer',
                  fontFamily:   'DM Sans, sans-serif',
                  fontWeight:   600,
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '6px'
                }}
              >
                Admin Login
              </button>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="nav-tabs">
          <div className="nav-tabs-inner" ref={dropdownRef}>

            {/* Dashboard tab — admin only */}
            {admin && (
              <button
                className={`nav-tab ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setActivePage('dashboard');
                  setOpenDropdown(null);
                }}
              >
                📊 Dashboard
              </button>
            )}

            {/* Users tab — admin only */}
            {admin && (
              <button
                className={`nav-tab ${activePage === 'users' ? 'active' : ''}`}
                onClick={() => {
                  setActivePage('users');
                  setOpenDropdown(null);
                }}
              >
                👥 Users
              </button>
            )}

            {/* Divider — only when admin tabs are visible */}
            {admin && (
              <div style={{
                width:      '1px',
                background: 'rgba(255,255,255,0.2)',
                margin:     '8px 4px'
              }} />
            )}

           {/* Terminal tabs — visible to everyone */}
{TERMINALS.map(terminal => (
  <div
    key={terminal}
    style={{ position: 'relative', zIndex: 9999 }}
  >
    <button
      className={`nav-tab ${isTerminalActive(terminal) ? 'active' : ''}`}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setDropdownPos({
          top:  rect.bottom + 8,
          left: rect.left + rect.width / 2
        });
        handleTerminalClick(terminal);
      }}
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      {terminal}
      <span style={{
        fontSize:   '0.65rem',
        display:    'inline-block',
        transition: 'transform 0.2s',
        transform:  openDropdown === terminal
          ? 'rotate(180deg)'
          : 'rotate(0deg)',
        opacity: 0.8
      }}>▼</span>
    </button>

    {/* Toilet type dropdown */}
    {openDropdown === terminal && (
      <div style={{
        ...dropdownStyles.menu,
        top:       dropdownPos.top,
        left:      dropdownPos.left,
        transform: 'translateX(-50%)'
      }}>
        <div style={dropdownStyles.arrow} />
        <div style={dropdownStyles.menuHeader}>
          Select Toilet Type
        </div>
        {TOILET_TYPES.map(type => {
          const isSelected =
            isTerminalActive(terminal) && toiletType === type;
          return (
            <button
              key={type}
              style={{
                ...dropdownStyles.menuItem,
                background: isSelected ? '#e8f5ee' : '#fff',
                color:      isSelected ? '#0f5233' : '#1f2937',
                fontWeight: isSelected ? 700 : 500
              }}
              onClick={() => handleToiletSelect(terminal, type)}
            >
              <span style={dropdownStyles.menuIcon}>
                {type === 'Inside Toilet' ? '🚻' : '🚾'}
              </span>
              <span>{type}</span>
              {isSelected && (
                <span style={dropdownStyles.checkmark}>✓</span>
              )}
            </button>
          );
        })}
      </div>
    )}
  </div>
))}

          </div>
        </nav>
      </header>

      {/* ── Page Body ── */}
      <main className="main-content">

        {/* Dashboard — admin only */}
        {activePage === 'dashboard' && admin && (
          <Dashboard />
        )}

        {/* Users management — admin only */}
        {activePage === 'users' && admin && (
          <AdminUsers />
        )}

        {/* Entry page — visible to everyone */}
        {activePage === 'entry' && (
          <>
            <div style={breadcrumbStyles.bar}>
              <div style={breadcrumbStyles.left}>
                <span style={breadcrumbStyles.terminal}>{activeTerminal}</span>
                <span style={breadcrumbStyles.sep}>›</span>
                <span style={breadcrumbStyles.toilet}>
                  {toiletType === 'Inside Toilet' ? '🚻' : '🚾'} {toiletType}
                </span>
              </div>
              <span style={breadcrumbStyles.hint}>
                {admin
                  ? 'To switch, click any terminal tab above'
                  : '👁 View only — login as admin to make changes'
                }
              </span>
            </div>

            <SummaryCards
              terminal={activeTerminal}
              toiletType={toiletType}
              refreshKey={refreshKey}
            />
            <RevenueForm
              terminal={activeTerminal}
              toiletType={toiletType}
              onSuccess={handleSuccess}
            />
            <RevenueTable
              terminal={activeTerminal}
              toiletType={toiletType}
              refreshKey={refreshKey}
            />
          </>
        )}

      </main>
    </div>
  );
}