import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config';

const TERMINALS_LIST = [
  'All Terminals',
  'Terminal 1',
  'Terminal 2',
  'Abakpa Terminal',
  'Gariki Terminal'
];

const emptyForm = {
  fullName:    '',
  username:    '',
  password:    '',
  role:        'user',
  terminal:    'All Terminals',
  permissions: { canAdd: false, canDelete: false }
};

export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [form,       setForm]       = useState(emptyForm);
  const [status,     setStatus]     = useState(null);
  const [saving,     setSaving]     = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/auth/users`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setShowForm(true);
    setStatus(null);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      fullName:    user.fullName,
      username:    user.username,
      password:    '',
      role:        user.role,
      terminal:    user.terminal,
      permissions: { ...user.permissions }
    });
    setShowForm(true);
    setStatus(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'canAdd' || name === 'canDelete') {
      setForm(f => ({
        ...f,
        permissions: { ...f.permissions, [name]: checked }
      }));
    } else {
      setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      if (editUser) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.put(`${API_BASE}/api/auth/users/${editUser._id}`, payload);
        setStatus({ type: 'success', msg: '✅ User updated successfully!' });
      } else {
        await axios.post(`${API_BASE}/api/auth/users`, form);
        setStatus({ type: 'success', msg: '✅ User created successfully!' });
      }
      fetchUsers();
      setTimeout(() => {
        setShowForm(false);
        setStatus(null);
      }, 1200);
    } catch (err) {
      setStatus({
        type: 'error',
        msg:  `❌ ${err.response?.data?.error || 'Something went wrong.'}`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await axios.put(`${API_BASE}/api/auth/users/${user._id}`, {
        isActive: !user.isActive
      });
      fetchUsers();
    } catch (err) {
      alert('Could not update user status.');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.fullName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/api/auth/users/${user._id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete user.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f5233' }}>
            👥 User Management
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#9ca3af', marginTop: '4px' }}>
            Create and manage user accounts and their permissions
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add New User
        </button>
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && (
        <div className="card">
          <div className="card-title">
            {editUser ? '✏️ Edit User' : '➕ Create New User'}
          </div>

          {status && (
            <div className={`alert alert-${status.type}`}>{status.msg}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. johndoe"
                  required
                  disabled={!!editUser}
                  style={editUser ? { opacity: 0.6 } : {}}
                />
              </div>

              <div className="form-group">
                <label>
                  Password {editUser && (
                    <span style={{ color: '#9ca3af', fontWeight: 400 }}>
                      (leave blank to keep current)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={editUser ? 'Leave blank to keep current' : 'Enter password'}
                  required={!editUser}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Terminal</label>
                <select name="terminal" value={form.terminal} onChange={handleChange}>
                  {TERMINALS_LIST.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Permissions — only show for user role */}
            {form.role === 'user' && (
              <div style={{
                marginTop:    '20px',
                padding:      '16px',
                background:   '#f9fafb',
                borderRadius: '10px',
                border:       '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f5233', marginBottom: '12px' }}>
                  🔐 Permissions
                </div>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      name="canAdd"
                      checked={form.permissions.canAdd}
                      onChange={handleChange}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Allow to Add Records
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      name="canDelete"
                      checked={form.permissions.canDelete}
                      onChange={handleChange}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Allow to Delete Records
                  </label>
                </div>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Saving...' : editUser ? '💾 Update User' : '➕ Create User'}
              </button>
              <button
                type="button"
                className="btn btn-download"
                onClick={() => { setShowForm(false); setStatus(null); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Users Table ── */}
      <div className="card">
        <div className="card-title" style={{ justifyContent: 'space-between' }}>
          <span>All Users</span>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 400 }}>
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        {loading ? (
          <div className="loading">⏳ Loading users...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👤</div>
            <p>No users yet. Create the first one above.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Terminal</th>
                  <th>Can Add</th>
                  <th>Can Delete</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                    <td className="mono">{user.username}</td>
                    <td>
                      <span className="badge" style={{
                        background: user.role === 'admin' ? '#fdf6e3' : '#e8f5ee',
                        color:      user.role === 'admin' ? '#c8982a' : '#1a7a4a'
                      }}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                        {user.terminal}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {user.role === 'admin' || user.permissions?.canAdd
                        ? '✅' : '❌'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {user.role === 'admin' || user.permissions?.canDelete
                        ? '✅' : '❌'}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: user.isActive ? '#e8f5ee' : '#fef2f2',
                        color:      user.isActive ? '#1a7a4a' : '#dc2626'
                      }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          className="btn"
                          style={{
                            background: '#fdf6e3', color: '#c8982a',
                            border: '1.5px solid #c8982a',
                            padding: '6px 10px', fontSize: '0.78rem'
                          }}
                          onClick={() => openEdit(user)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn"
                          style={{
                            background: user.isActive ? '#fef2f2' : '#e8f5ee',
                            color:      user.isActive ? '#dc2626'  : '#1a7a4a',
                            border:     `1.5px solid ${user.isActive ? '#fca5a5' : '#86efac'}`,
                            padding: '6px 10px', fontSize: '0.78rem'
                          }}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.isActive ? '🚫 Deactivate' : '✅ Activate'}
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleDelete(user)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}