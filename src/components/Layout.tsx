import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, BookOpen, User, LogOut, LayoutDashboard, Settings, Sparkles, Trophy, Bell, Menu, X } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { cn } from '../lib/utils';
import { Leaderboard } from '../types';

export default function Layout() {
  const { profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);

  useEffect(() => {
    // Apply theme to body
    if (profile?.theme) {
      document.body.setAttribute('data-theme', profile.theme);
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [profile?.theme]);

  useEffect(() => {
    const qLeaderboards = query(collection(db, 'leaderboards'));
    const unsubscribeLeaderboards = onSnapshot(qLeaderboards, (snapshot) => {
      setLeaderboards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leaderboard)));
    });
    return () => unsubscribeLeaderboards();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/mocks', icon: BookOpen, label: 'Mocks' },
    { path: '/profile', icon: User, label: 'Profile' },
    ...(isAdmin ? [{ path: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
          <Sparkles size={24} />
        </div>
        <span className="text-xl font-display font-bold text-slate-800 tracking-tight">Reminders<span className="text-primary-500">24x7</span></span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300",
              location.pathname === item.path
                ? "bg-primary-500 text-white shadow-xl shadow-primary-200 scale-105"
                : "text-slate-500 hover:bg-primary-50 hover:text-primary-600"
            )}
          >
            <item.icon size={22} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Pet Section in Sidebar removed for RoamingPet */}

      <div className="pt-6 border-t border-primary-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
        >
          <LogOut size={22} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-primary-50">
      {/* Desktop Sidebar */}
      <aside className="w-80 bg-white/80 backdrop-blur-xl border-r border-primary-100 hidden lg:flex flex-col h-screen sticky top-0 overflow-y-auto no-scrollbar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-80 z-50 lg:hidden bg-white"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-primary-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between lg:justify-end gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white rounded-xl shadow-sm border border-primary-100 lg:hidden"
          >
            <Menu size={24} className="text-slate-600" />
          </button>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-primary-100 text-slate-400 hover:text-primary-500 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full border-2 border-white"></span>
            </button>
            
            <Link to="/profile" className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-white rounded-2xl shadow-sm border border-primary-100 hover:border-primary-300 transition-all group">
              <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-primary-50 group-hover:border-primary-200 transition-all">
                <img src={profile?.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">{profile?.name}</div>
                <div className="text-[10px] text-slate-400 font-medium">{profile?.role}</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto no-scrollbar">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-primary-100 px-6 py-3 flex justify-around items-center z-30">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "p-3 rounded-2xl transition-all",
              location.pathname === item.path ? "text-primary-600 bg-primary-50" : "text-slate-400"
            )}
          >
            <item.icon size={24} />
          </Link>
        ))}
      </div>
    </div>
  );
}
