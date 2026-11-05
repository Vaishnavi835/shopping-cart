import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Toast, useToast } from '../components/Toast';

export default function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [activeTab, setActiveTab] = useState('update');
  const [putForm, setPutForm] = useState({ username: user?.username || '', age: user?.age || '', password: '' });
  const [patchForm, setPatchForm] = useState({ username: '', age: '', password: '' });
  const [deleteEmail, setDeleteEmail] = useState(user?.emailId || '');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const clearMessages = () => { setMsg(''); setError(''); };

  // PUT - full update (uses JWT identity, no emailId query param needed)
  const handlePut = async (e) => {
    e.preventDefault(); clearMessages();
    const res = await fetch('/api/users', {
      method: 'PUT', headers: authHeader,
      body: JSON.stringify({ ...putForm, age: Number(putForm.age) }),
    });
    const data = await res.json();
    res.ok ? setMsg(data.message) : setError(data.message);
  };

  // PATCH - partial update (uses JWT identity)
  const handlePatch = async (e) => {
    e.preventDefault(); clearMessages();
    const body = {};
    if (patchForm.username) body.username = patchForm.username;
    if (patchForm.age) body.age = Number(patchForm.age);
    if (patchForm.password) body.password = patchForm.password;

    if (!Object.keys(body).length) { setError('Enter at least one field to update.'); return; }

    const res = await fetch('/api/users', {
      method: 'PATCH', headers: authHeader, body: JSON.stringify(body),
    });
    const data = await res.json();
    res.ok ? setMsg(data.message) : setError(data.message);
  };

  // DELETE (uses JWT identity)
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    clearMessages();
    const res = await fetch('/api/users', {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      setTimeout(() => { logout(); navigate('/register'); }, 2000);
    } else {
      setError(data.message);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">👤</div>
        <h2 style={{ textAlign: 'center', marginBottom: '0.3rem' }}>{user?.username}</h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '1.5rem' }}>{user?.emailId}</p>

        <div className="tab-bar">
          {[['update', '✏️ Full Update (PUT)'], ['patch', '🔧 Partial Update (PATCH)'], ['delete', '🗑️ Delete Account']].map(([key, label]) => (
            <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => { setActiveTab(key); clearMessages(); }}>
              {label}
            </button>
          ))}
        </div>

        {msg && <div className="alert alert-success">✅ {msg}</div>}
        {error && <div className="alert alert-error">❌ {error}</div>}

        {/* PUT TAB */}
        {activeTab === 'update' && (
          <form onSubmit={handlePut}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={putForm.username} onChange={(e) => setPutForm({ ...putForm, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input type="number" value={putForm.age} onChange={(e) => setPutForm({ ...putForm, age: e.target.value })} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" placeholder="Enter new password" value={putForm.password}
                onChange={(e) => setPutForm({ ...putForm, password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Update All Details</button>
          </form>
        )}

        {/* PATCH TAB */}
        {activeTab === 'patch' && (
          <form onSubmit={handlePatch}>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Fill only the fields you want to update.
            </p>
            <div className="form-group">
              <label>Username (optional)</label>
              <input type="text" placeholder="New username" value={patchForm.username}
                onChange={(e) => setPatchForm({ ...patchForm, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Age (optional)</label>
              <input type="number" placeholder="New age" value={patchForm.age}
                onChange={(e) => setPatchForm({ ...patchForm, age: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password (optional)</label>
              <input type="password" placeholder="New password" value={patchForm.password}
                onChange={(e) => setPatchForm({ ...patchForm, password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Update Selected Fields</button>
          </form>
        )}

        {/* DELETE TAB */}
        {activeTab === 'delete' && (
          <div>
            <div className="alert alert-error">
              ⚠️ This will permanently delete your account and all data.
            </div>
            <div className="form-group">
              <label>Confirm your Email ID</label>
              <input type="email" value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)} />
            </div>
            <button className="btn btn-danger btn-block" onClick={handleDelete}>
              🗑️ Delete My Account
            </button>
          </div>
        )}
      </div>
      <Toast message={toast} />
    </div>
  );
}

