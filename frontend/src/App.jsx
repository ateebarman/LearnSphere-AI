import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
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

import { useEffect } from 'react';
import { useThemeStore } from './store/useThemeStore';

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

        </Route>
      </Route>
    </Routes>
  );
}

export default App;