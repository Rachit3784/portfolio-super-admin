// D:\Portfolio\rachit-super-admin-portfolio\src\components\Login.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail]       = useState('grachit736@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch {}
    }

    let devId = localStorage.getItem('rachit_admin_device_id');
    if (!devId) {
      devId = 'admin_dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('rachit_admin_device_id', devId);
    }
    const notifId = `admin_notif_${devId}`;

    try {
      const SERVER_URL =
        import.meta.env.VITE_SERVER_URL ||
        import.meta.env.VITE_SOCKET_URL ||
        import.meta.env.NEXT_PUBLIC_SERVER_URL ||
        'http://localhost:5000';
      const res = await fetch(`${SERVER_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, deviceId: devId, notificationId: notifId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      onLoginSuccess(data.admin);
    } catch {
      setError('Could not connect to standalone server on port 5000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#030303] relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-orange-600/8 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md relative"
      >
        {/* macOS Window Border */}
        <div className="p-8 sm:p-10 rounded-3xl glass-panel border border-white/10 shadow-2xl shadow-black/80 relative z-10">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Portal</h1>
            <p className="text-xs text-gray-400 mt-2">Rachit Gupta · Live Calls &amp; Recruiter Messaging</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Admin Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-orange-500/50 text-sm text-white outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-orange-500/50 text-sm text-white outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Login to Portal <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
