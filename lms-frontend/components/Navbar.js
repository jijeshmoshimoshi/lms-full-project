'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../lib/api';
import io from 'socket.io-client';
import NavbarGamificationPill from './NavbarGamificationPill';
import { 
  BookOpen, GraduationCap, LayoutDashboard, LogOut, 
  Sparkles, Shield, ShoppingCart, Menu, X, User,
  Bell, Radio, Clock, CheckCheck, ExternalLink, Calendar, Code2, Trophy, Flame, Users, ChevronDown
} from 'lucide-react';


export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, mounted } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const notifRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Real-time socket connection for live session reminders & alerts
  useEffect(() => {
    if (!user) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.emit('join_user', user._id);

    socket.on('new_notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setActiveToast({
        title: notif.title,
        message: notif.message,
        link: notif.link,
        type: notif.type,
      });
    });

    socket.on('live_session_reminder_toast', (data) => {
      setActiveToast({
        title: data.title || '🔴 Live Session Starting Soon!',
        message: data.message,
        link: `/live/${data.sessionId}`,
        type: 'live_reminder',
      });
      fetchNotifications();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Close notification & user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setShowNotifs(false);
        router.push(link);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Close menus whenever navigation path changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close menus on Esc key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
        setShowNotifs(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
              SkillPulse
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-indigo-600 -mt-1 hidden sm:inline">
              Learning Ecosystem
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 xl:gap-2">
          <Link
            href="/courses"
            className={`flex items-center gap-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 ${
              isActive('/courses')
                ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Courses</span>
          </Link>

          <Link
            href="/playground"
            className={`flex items-center gap-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 ${
              isActive('/playground')
                ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Code2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Playground</span>
            <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-full leading-none shrink-0">
              New
            </span>
          </Link>

          <Link
            href="/leaderboard"
            className={`flex items-center gap-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 ${
              isActive('/leaderboard')
                ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Leaderboard</span>
          </Link>

          <Link
            href="/study-rooms"
            className={`flex items-center gap-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 ${
              isActive('/study-rooms') || pathname?.startsWith('/study-rooms')
                ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Users className="w-4 h-4 text-violet-600 shrink-0" />
            <span>Study Rooms</span>
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </Link>

          {user && (
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 ${
                isActive('/dashboard')
                  ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </Link>
          )}


          {user && (user.role === 'admin' || user.role === 'instructor') && (
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200/60 transition ml-1 whitespace-nowrap shrink-0"
            >
              <Shield className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>Admin Panel</span>
            </a>
          )}
        </nav>

        {/* Right Action Area (Desktop + Mobile Cart, Gamification Pill, Notifications & Toggle) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Gamification Streak & XP Widget (when logged in) */}
          {user && <NavbarGamificationPill />}
          
          {/* Notification Bell Button (when logged in) */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className={`relative p-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  showNotifs
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70'
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white min-w-[17px] h-[17px] flex items-center justify-center leading-none shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-500">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => markAsRead(notif._id, notif.link)}
                          className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                            !notif.isRead ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {notif.type === 'live_reminder' || notif.type === 'live_started' ? (
                              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                                <Radio className="w-4 h-4 animate-pulse" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Bell className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                                {notif.title}
                              </p>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <div className="flex items-center justify-between mt-1.5 pt-1 text-[10px] text-slate-400">
                              <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {notif.link && (
                                <span className="text-indigo-600 font-semibold flex items-center gap-1">
                                  Join <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shopping Cart Button - Always visible on both mobile and desktop */}
          <Link
            href="/cart"
            className={`relative flex items-center justify-center p-2 sm:px-2.5 xl:px-3 sm:py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 ${
              isActive('/cart')
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70'
            }`}
            title="Shopping Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-600 text-white min-w-[17px] h-[17px] flex items-center justify-center leading-none shadow-sm animate-in zoom-in duration-200">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden xl:inline ml-2 text-xs font-bold">Cart</span>
          </Link>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-1.5 xl:gap-2.5 shrink-0">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all duration-200 cursor-pointer shadow-xs group"
                  aria-label="User profile and account settings"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-xs font-bold flex items-center justify-center uppercase shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 max-w-[90px] xl:max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-11 w-56 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {user.role || 'student'}
                      </span>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 rounded-xl transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                        <span>Dashboard</span>
                      </Link>

                      {(user.role === 'admin' || user.role === 'instructor') && (
                        <a
                          href="http://localhost:3001"
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50 rounded-xl transition"
                        >
                          <Shield className="w-4 h-4 text-violet-600" />
                          <span>Admin Panel</span>
                        </a>
                      )}
                    </div>

                    <div className="p-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 xl:px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/60 rounded-xl transition whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-3.5 xl:px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition duration-200 whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-900" />
            ) : (
              <Menu className="w-5 h-5 text-slate-900" />
            )}
          </button>

        </div>
      </div>

      {/* Floating Live Session Alert Toast */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-950 text-white rounded-2xl shadow-2xl p-4 border border-rose-500/40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/30">
                  Live Alert
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">{activeToast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{activeToast.message}</p>
              
              {activeToast.link && (
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={activeToast.link}
                    onClick={() => setActiveToast(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
                  >
                    <span>Join Stream</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => setActiveToast(null)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-2xl px-5 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          
          {/* User Profile Preview on Mobile */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center uppercase shadow-sm">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                {user.role || 'student'}
              </span>
            </div>
          )}

          {/* Mobile Navigation Links */}
          <nav className="space-y-1">
            <Link
              href="/courses"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/courses')
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Explore Courses</span>
            </Link>

            <Link
              href="/playground"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/playground')
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Code2 className="w-4 h-4 text-indigo-500" />
                <span>Code Sandbox / Lab</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
                New
              </span>
            </Link>

            <Link
              href="/leaderboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/leaderboard')
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Leaderboard & Streaks</span>
            </Link>

            <Link
              href="/study-rooms"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/study-rooms') || pathname?.startsWith('/study-rooms')
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-violet-600" />
                <span>Virtual Study Rooms</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </Link>


            <Link
              href="/cart"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/cart')
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 text-indigo-500" />
                <span>Cart</span>
              </div>
              {mounted && cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                  {cartCount} item{cartCount > 1 ? 's' : ''}
                </span>
              )}
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive('/dashboard')
                    ? 'bg-indigo-50 text-indigo-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                <span>My Dashboard</span>
              </Link>
            )}

            {user && (user.role === 'admin' || user.role === 'instructor') && (
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/60 transition"
              >
                <Shield className="w-4 h-4 text-violet-600" />
                <span>Creator & Admin Studio</span>
              </a>
            )}
          </nav>

          {/* Mobile Auth Actions */}
          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/80 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/70 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
