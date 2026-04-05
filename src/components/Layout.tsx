import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, BookOpen, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../App';
import { cn } from '../lib/utils';

export default function Layout() {
  const { profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/mocks', icon: BookOpen, label: 'Mocks' },
    ...(isAdmin ? [{ path: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-pink-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-pink-100 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-pink-400 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-pink-200">
              R
            </div>
            <span className="text-xl font-bold text-gray-800">Reminders24x7</span>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-pink-100 text-pink-600 font-medium"
                    : "text-gray-500 hover:bg-pink-50 hover:text-pink-400"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-pink-50">
          <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-pink-50/50">
            <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 text-lg font-bold overflow-hidden">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.name?.[0]
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-800 truncate">{profile?.name}</span>
              <span className="text-xs text-pink-400 capitalize">{profile?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 px-6 py-3 flex justify-around items-center z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "p-2 rounded-xl",
              location.pathname === item.path ? "text-pink-600 bg-pink-50" : "text-gray-400"
            )}
          >
            <item.icon size={24} />
          </Link>
        ))}
        <button onClick={handleLogout} className="p-2 text-gray-400">
          <LogOut size={24} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
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
  );
}
