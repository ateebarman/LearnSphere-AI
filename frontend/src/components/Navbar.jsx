import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Search, GraduationCap,
  BookOpen, Beaker, BarChart3, User,
  LogOut, Sun, Moon, Sparkles, Code2, Shield, Calendar
} from 'lucide-react';

const Navbar = () => {
  const { userInfo, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: Calendar },
    { to: '/tutor', label: 'AI Tutor', icon: GraduationCap },
    { to: '/explore', label: 'Explore', icon: Search },
    { to: '/library', label: 'Docs', icon: BookOpen },
    { to: '/lab', label: 'Lab', icon: Beaker },
    { to: '/coding', label: 'Coding', icon: Code2 },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-card !rounded-none border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 will-change-transform">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="group flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black font-display text-gradient hidden sm:block">
            LearnSphere
          </span>
        </Link>

        <div className="flex items-center space-x-2">
          {userInfo && (
            <div className="hidden lg:flex items-center space-x-1 mr-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="nav-link flex items-center space-x-1.5 font-medium transition-all"
                >
                  <link.icon className="w-4 h-4 opacity-70" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-3">
            {userInfo ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm hidden md:block">
                    {userInfo.name.split(' ')[0]}
                  </span>
                </Link>

                {userInfo.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 transition-colors"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="font-semibold text-xs hidden md:block uppercase tracking-wider">Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-slate-600 dark:text-slate-400 font-semibold hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary py-2 px-6 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle dark mode"
            >
              <motion.div
                initial={false}
                animate={{ rotate: darkMode ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
