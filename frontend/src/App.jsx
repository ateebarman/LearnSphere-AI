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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* Private Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="roadmap/:id" element={<RoadmapView />} />
          <Route path="quiz/:roadmapId/:moduleTitle" element={<QuizPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;