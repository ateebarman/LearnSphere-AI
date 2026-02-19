import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Search, GraduationCap,
  BookOpen, Beaker, BarChart3, User,
  LogOut, Sun, Moon, Sparkles, Code2, Shield, Calendar,
  Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { userInfo, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  return (
    <>
      <nav className="sticky top-0 z-50 glass-card !rounded-none border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 will-change-transform overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <Link to="/" className="group flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl md:text-2xl font-black font-display text-gradient hidden sm:block">
              LearnSphere
            </span>
          </Link>

          <div className="flex items-center space-x-1 md:space-x-2">
            {userInfo && (
              <div className="hidden xl:flex items-center space-x-1 mr-2 px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="nav-link flex items-center space-x-1 px-3 py-1.5 font-medium transition-all text-sm"
                  >
                    <link.icon className="w-3.5 h-3.5 opacity-70" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2 md:space-x-3">
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
                      className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 transition-colors"
                      title="Admin Panel"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="font-semibold text-xs hidden lg:block uppercase tracking-wider">Admin</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="hidden md:flex p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-semibold"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
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

              <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

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

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 xl:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Content */}
            <div className="absolute top-[72px] inset-x-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-100px)]">
              <div className="p-4 space-y-2 overflow-y-auto">
                {userInfo && (
                  <>
                    <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{userInfo.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{userInfo.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {navLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all group"
                        >
                          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                            <link.icon className="w-5 h-5 opacity-70" />
                          </div>
                          <span className="font-semibold">{link.label}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

                    {userInfo.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all mb-1"
                      >
                        <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/50 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-semibold uppercase tracking-wider text-xs">Admin Control Center</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <div className="w-9 h-9 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <span className="font-semibold">Sign Out</span>
                    </button>
                  </>
                )}

                {!userInfo && (
                  <div className="grid grid-cols-1 gap-4 p-4">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="btn-secondary w-full py-4"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="btn-primary w-full py-4"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
