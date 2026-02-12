import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { FaUserCircle, FaSignOutAlt, FaChartBar, FaSun, FaMoon } from 'react-icons/fa';

const Navbar = () => {
  const { userInfo, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-3xl font-bold text-gradient hover:opacity-80 transition-opacity">
          LearnSphere AI
        </Link>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-6 mr-4">
            {userInfo ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 dark:text-gray-300 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                  📊 Dashboard
                </Link>
                <Link
                  to="/tutor"
                  className="text-gray-700 dark:text-gray-300 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                  🎓 AI Tutor
                </Link>
                <Link
                  to="/explore"
                  className="text-gray-700 dark:text-gray-300 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                  🔍 Explore
                </Link>
                <Link
                  to="/lab"
                  className="text-gray-700 dark:text-gray-300 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                  🧬 Lab
                </Link>

                <Link
                  to="/analytics"
                  className="flex items-center text-gray-700 dark:text-gray-300 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                  <FaChartBar className="mr-2" />
                  Analytics
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center text-gray-700 dark:text-gray-300 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                  <FaUserCircle className="mr-2 text-xl" />
                  {userInfo.name.split(' ')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                >
                  <FaSignOutAlt className="mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 dark:text-gray-300 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary py-2 px-6"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;