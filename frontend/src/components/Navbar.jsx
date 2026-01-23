import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { FaUserCircle, FaSignOutAlt, FaChartBar } from 'react-icons/fa';

const Navbar = () => {
  const { userInfo, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent hover:opacity-80 transition">
          LearnSphere AI
        </Link>
        <div className="flex items-center space-x-6">
          {userInfo ? (
            <>
              <Link
                to="/dashboard"
                className="text-gray-700 font-semibold hover:text-indigo-600 transition duration-200"
              >
                📊 Dashboard
              </Link>
              <Link
                to="/tutor"
                className="text-gray-700 font-semibold hover:text-indigo-600 transition duration-200"
              >
                🎓 AI Tutor
              </Link>
              <Link
                to="/explore"
                className="text-gray-700 font-semibold hover:text-indigo-600 transition duration-200"
              >
                🔍 Explore
              </Link>
              <Link
                to="/resources"
                className="text-gray-700 font-semibold hover:text-indigo-600 transition duration-200"
              >
                📚 Resources
              </Link>
              <Link
                to="/analytics"
                className="flex items-center text-gray-700 font-semibold hover:text-indigo-600 transition duration-200"
              >
                <FaChartBar className="mr-2" />
                Analytics
              </Link>
              <Link
                to="/profile"
                className="flex items-center text-gray-700 font-semibold hover:text-indigo-600 transition duration-200"
              >
                <FaUserCircle className="mr-2 text-xl" />
                {userInfo.name}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold transition duration-200"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 font-semibold hover:text-indigo-600 transition duration-200">
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;