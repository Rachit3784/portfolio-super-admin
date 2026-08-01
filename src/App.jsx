// D:\Portfolio\rachit-super-admin-portfolio\src\App.jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [admin, setAdmin] = useState(null);

  // Restore session from localStorage if saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rachit_super_admin_session');
      if (saved) {
        setAdmin(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleLoginSuccess = (adminData) => {
    setAdmin(adminData);
    try {
      localStorage.setItem('rachit_super_admin_session', JSON.stringify(adminData));
    } catch {}
  };

  const handleLogout = () => {
    setAdmin(null);
    try {
      localStorage.removeItem('rachit_super_admin_session');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#030303]">
      {!admin ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard admin={admin} onLogout={handleLogout} />
      )}
    </div>
  );
}
