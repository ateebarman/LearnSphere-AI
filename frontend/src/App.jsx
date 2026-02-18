import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import RoadmapView from './pages/RoadmapView';
import QuizPage from './pages/QuizPage';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import TutorChat from './pages/TutorChat';
import ResourceLibrary from './pages/ResourceLibrary';
import Explore from './pages/Explore';
import AdvancedStudy from './pages/AdvancedStudy';
import KnowledgeLibrary from './pages/KnowledgeLibrary';
import CodingArena from './pages/CodingArena';
import CodingList from './pages/CodingList';
import AdminDashboard from './pages/AdminDashboard';
import ScrollToTop from './components/ScrollToTop';

import { useEffect } from 'react';
import { useThemeStore } from './store/useThemeStore';
import { Toaster } from 'react-hot-toast';

function App() {
  const { darkMode } = useThemeStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-slate-900 dark:text-white dark:border-slate-800 border',
          duration: 4000,
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="explore" element={<Explore />} />

          {/* Private Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="roadmap/:id" element={<RoadmapView />} />
            <Route path="quiz/:roadmapId/:moduleTitle" element={<QuizPage />} />
            <Route path="profile" element={<Profile />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="tutor" element={<TutorChat />} />
            <Route path="resources" element={<ResourceLibrary />} />
            <Route path="library" element={<KnowledgeLibrary />} />
            <Route path="lab" element={<AdvancedStudy />} />
            <Route path="coding" element={<CodingList />} />
            <Route path="coding/:slug" element={<CodingArena />} />

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;