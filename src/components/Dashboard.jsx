// D:\Portfolio\rachit-super-admin-portfolio\src\components\Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, Video, LogOut, MessageSquare, Shield, CheckCheck, Loader2, ChevronLeft } from 'lucide-react';
import { socket } from '../socket';
import VideoCallOverlay from './VideoCallOverlay';
import { playMessageSound } from '../utils/audioUtils';

const Dashboard = ({ admin, onLogout }) => {
  const [users, setUsers]                 = useState([]);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [inputText, setInputText]         = useState('');
  const [loading, setLoading]             = useState(true);

  const [callModalOpen, setCallModalOpen]   = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingSignal, setIncomingSignal] = useState(null);
  const [callerUser, setCallerUser]         = useState(null);

  const bottomRef = useRef(null);

  const SERVER_URL =
    import.meta.env.VITE_SERVER_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.NEXT_PUBLIC_SERVER_URL ||
    'http://localhost:5000';

  /* ── Load Recruiter Contacts ── */
  const fetchUsers = async () => {
    try {
      const res  = await fetch(`${SERVER_URL}/api/admin/users`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        // Auto select first user on desktop if none selected
        if (typeof window !== 'undefined' && window.innerWidth >= 768 && !selectedUser && data.users?.length) {
          setSelectedUser(data.users[0]);
        }
      }
    } catch (err) {
      console.error('Fetch users error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  /* ── Load Messages for Selected Recruiter ── */
  useEffect(() => {
    if (!selectedUser) return;
    (async () => {
      try {
        const res  = await fetch(`${SERVER_URL}/api/chat/history?userId=${selectedUser._id}`);
        const data = await res.json();
        if (res.ok) {
          setMessages(data.messages || []);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch (err) {
        console.error('Fetch messages error', err);
      }
    })();
  }, [selectedUser]);

  /* ── Socket.io Listeners ── */
  useEffect(() => {
    let devId = typeof window !== 'undefined' ? localStorage.getItem('rachit_admin_device_id') : null;
    if (!devId) {
      devId = 'admin_dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      if (typeof window !== 'undefined') localStorage.setItem('rachit_admin_device_id', devId);
    }

    socket.connect();
    socket.emit('join_room', { userId: 'admin', role: 'admin', deviceId: devId, notificationId: `admin_notif_${devId}` });

    // Single active admin session invalidation
    socket.on('admin_session_invalidated', (data) => {
      console.warn('Admin session invalidated:', data);
      alert(data.message || 'Super Admin portal logged in on another device or browser. Session ended.');
      if (onLogout) onLogout();
    });

    // Live new recruiter message
    socket.on('new_recruiter_message', ({ userId, message }) => {
      playMessageSound();
      fetchUsers(); // Refresh user list order
      if (selectedUser && selectedUser._id === userId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });

    // Confirmation of admin reply sent
    socket.on('admin_reply_sent', ({ userId, message }) => {
      if (selectedUser && selectedUser._id === userId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Incoming WebRTC Video Call from recruiter
    socket.on('incoming_call', ({ signal, from, name }) => {
      const callingUser = users.find((u) => u._id === from) || { id: from, name: name || 'Recruiter' };
      setCallerUser(callingUser);
      setIncomingSignal(signal);
      setIsIncomingCall(true);
      setCallModalOpen(true);

      // Trigger OS / Service Worker Background Notification
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('📹 Incoming WebRTC Video Call', {
            body: `${name || 'Recruiter'} is calling you... Tap to answer.`,
            icon: '/favicon.ico',
            vibrate: [400, 200, 400, 200, 400],
            tag: 'incoming-admin-call',
            renotify: true,
            requireInteraction: true,
            data: { url: '/' },
          });
        }).catch(() => {
          new Notification('📹 Incoming WebRTC Video Call', {
            body: `${name || 'Recruiter'} is calling you on WebRTC Video Meeting...`,
            icon: '/favicon.ico',
          });
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('📹 Incoming WebRTC Video Call', {
          body: `${name || 'Recruiter'} is calling you on WebRTC Video Meeting...`,
          icon: '/favicon.ico',
        });
      }
    });

    return () => {
      socket.off('admin_session_invalidated');
      socket.off('new_recruiter_message');
      socket.off('admin_reply_sent');
      socket.off('incoming_call');
      socket.disconnect();
    };
  }, [selectedUser, users, onLogout]);

  /* ── Send Admin Reply ── */
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    const content = inputText.trim();
    setInputText('');

    socket.emit('admin_send_message', {
      userId: selectedUser._id,
      message: { type: 'text', content },
    });
  };

  return (
    <div className="h-screen w-screen bg-[#030303] text-white flex overflow-hidden font-sans">

      {/* WebRTC Video Call Overlay */}
      <VideoCallOverlay
        isOpen={callModalOpen}
        onClose={() => { setCallModalOpen(false); setIsIncomingCall(false); }}
        targetUser={callerUser || selectedUser}
        isIncoming={isIncomingCall}
        incomingSignal={incomingSignal}
      />

      {/* ── Left Sidebar: Recruiter Contact List (Master View) ── */}
      <div className={`w-full md:w-[320px] lg:w-[360px] h-full bg-white/[0.02] backdrop-blur-2xl border-r border-white/10 flex flex-col flex-shrink-0 ${
        selectedUser ? 'hidden md:flex' : 'flex'
      }`}>

        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 bg-white/[0.03] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
              R
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight font-display">{admin.name}</h2>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Super Admin Online
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Recruiter Contacts Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><Users size={13} /> Recruiter Contacts</span>
          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-extrabold">{users.length}</span>
        </div>

        {/* User Contact List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500 text-xs">
              <Loader2 size={20} className="text-orange-500 animate-spin" /> Loading recruiters...
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-500">
              No recruiter contacts yet. When visitors chat on your portfolio, they will appear here live!
            </div>
          )}

          {users.map((u) => {
            const isSelected = selectedUser && selectedUser._id === u._id;
            return (
              <button
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`w-full p-3 rounded-2xl transition-all flex items-center gap-3 text-left cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500/15 border border-orange-500/30 text-white shadow-md'
                    : 'bg-white/[0.02] hover:bg-white/5 border border-transparent text-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/80 to-orange-600/80 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate leading-tight font-display">{u.name}</p>
                  <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5 font-mono">{u.email}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main View: Selected Recruiter Live Chat & WebRTC Call (Detail View) ── */}
      <div className={`flex-1 h-full flex flex-col bg-[#030303] ${
        selectedUser ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedUser ? (
          <>
            {/* Top Bar */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-white/10 bg-white/[0.03] backdrop-blur-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer flex-shrink-0"
                  title="Back to Contacts"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                  {selectedUser.name[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight font-display truncate">{selectedUser.name}</h3>
                  <p className="text-[11px] sm:text-xs text-gray-400 font-mono truncate">{selectedUser.email}</p>
                </div>
              </div>

              {/* Start WebRTC Video Call Button */}
              <button
                onClick={() => { setCallerUser(selectedUser); setIsIncomingCall(false); setCallModalOpen(true); }}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/30 transition-all cursor-pointer flex-shrink-0"
              >
                <Video size={15} /> <span className="hidden sm:inline">Call Recruiter (WebRTC)</span>
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {messages.map((m, i) => {
                const isAdmin = m.role === 'admin';
                return (
                  <div key={m._id || i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isAdmin
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tr-sm shadow-lg'
                          : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                      }`}
                    >
                      <p>{m.content}</p>
                      <span className="block text-[10px] opacity-60 text-right mt-1 font-mono">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-white/10 bg-white/[0.02] flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Reply to ${selectedUser.name}...`}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-orange-500/50 text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-11 h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center disabled:opacity-40 shadow-lg shadow-orange-500/30 cursor-pointer flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center gap-3">
            <MessageSquare size={36} className="text-orange-500/40" />
            <p className="text-sm font-semibold">Select a recruiter contact from the sidebar to view conversation</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
