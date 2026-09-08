import React, { useState, useEffect } from 'react';
import { api } from './api';
import Catalog from './Catalog';
import Bookings from './Bookings';

export default function App() {
  const [view, setView] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
  }, [token]);

  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user || data);
        if (view === 'login' || view === 'signup') setView('catalog');
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.login(email, password);
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setView('catalog');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection failed: ' + err.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.register(email, password, { name });
      if (data.error) setError(data.error);
      else {
        alert('Account created! Please login.');
        setView('login');
      }
    } catch (err) {
      setError('Registration failed: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setView('login');
  };

  return (
    <div style={styles.pageBackground}>
      <div style={styles.cardContainer}>
        {token && (
          <nav style={styles.navBar}>
            <button style={view === 'catalog' ? styles.activeTab : styles.tab} onClick={() => setView('catalog')}>Events Catalog</button>
            <button style={view === 'bookings' ? styles.activeTab : styles.tab} onClick={() => setView('bookings')}>My Bookings</button>
            <button style={view === 'profile' ? styles.activeTab : styles.tab} onClick={() => setView('profile')}>Profile</button>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </nav>
        )}

        {error && <div style={styles.errorAlert}>{error}</div>}

        {view === 'login' && (
          <form onSubmit={handleLogin} style={styles.form}>
            <h2 style={styles.title}>Sign In</h2>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
            <button type="submit" style={styles.primaryBtn}>Sign In</button>
            <p style={styles.footerText}>Need an account? <span onClick={() => setView('signup')} style={styles.link}>Create Account</span></p>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignUp} style={styles.form}>
            <h2 style={styles.title}>Create Account</h2>
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={styles.input} />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
            <button type="submit" style={styles.primaryBtn}>Register</button>
            <p style={styles.footerText}>Already registered? <span onClick={() => setView('login')} style={styles.link}>Sign In</span></p>
          </form>
        )}

        {view === 'catalog' && <Catalog />}
        {view === 'bookings' && <Bookings token={token} />}

        {view === 'profile' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3>{user?.name || 'User Profile'}</h3>
            <p style={{ color: '#707eae' }}>Email: {user?.email}</p>
            <p style={{ color: '#707eae' }}>User ID: #{user?.id || '1'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageBackground: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fe', padding: '20px' },
  cardContainer: { width: '100%', maxWidth: '700px', backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  navBar: { display: 'flex', gap: '10px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '20px' },
  tab: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#e0e5f2', cursor: 'pointer' },
  activeTab: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4318ff', color: '#fff', cursor: 'pointer' },
  logoutBtn: { marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ff4d4f', color: '#fff', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  title: { textAlign: 'center', color: '#1b2559' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #e0e5f2' },
  primaryBtn: { padding: '12px', borderRadius: '8px', border: 'none', background: '#4318ff', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  footerText: { textAlign: 'center', color: '#707eae' },
  link: { color: '#4318ff', cursor: 'pointer', fontWeight: 'bold' },
  errorAlert: { background: '#ffe8e8', color: '#ee5d50', padding: '10px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center' }
};
