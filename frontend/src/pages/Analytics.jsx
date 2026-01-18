import { useState, useEffect } from 'react';
import { getAnalytics, getRoadmapStats, getQuizStats } from '../services/analyticsService';
import { FaSpinner, FaBook, FaClipboardList, FaChartBar, FaClock, FaTrophy } from 'react-icons/fa';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [roadmapStats, setRoadmapStats] = useState([]);
  const [quizStats, setQuizStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const analyticsData = await getAnalytics();
      setAnalytics(analyticsData);
      
      const roadmapData = await getRoadmapStats();
      setRoadmapStats(roadmapData || []);
      
      const quizData = await getQuizStats();
      setQuizStats(quizData || []);
    } catch (err) {
      setErrorMessage('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <FaSpinner className="animate-spin text-4xl mx-auto text-blue-500" />
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg">{errorMessage || 'Failed to load analytics'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
          <p className="text-gray-600">Track your learning progress and performance</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-0 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeView === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaChartBar className="inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveView('roadmaps')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeView === 'roadmaps'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaBook className="inline mr-2" />
            Roadmaps
          </button>
          <button
            onClick={() => setActiveView('quizzes')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeView === 'quizzes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaClipboardList className="inline mr-2" />
            Quizzes
          </button>
        </div>

        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Roadmaps</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{analytics.totalRoadmaps || 0}</p>
                  </div>
                  <FaBook className="text-4xl text-blue-200" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Quizzes</p>
                    <p className="text-4xl font-bold text-purple-600 mt-2">{analytics.totalQuizzes || 0}</p>
                  </div>
                  <FaClipboardList className="text-4xl text-purple-200" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Average Score</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">
                      {analytics.averageScore?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <FaTrophy className="text-4xl text-green-200" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Learning Time</p>
                    <p className="text-4xl font-bold text-orange-600 mt-2">
                      {Math.round(analytics.estimatedLearningTime || 0)}h
                    </p>
                  </div>
                  <FaClock className="text-4xl text-orange-200" />
                </div>
              </div>
            </div>

            {/* Progress and Topics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Module Completion */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Module Completion</h2>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-gray-700">Overall Progress</p>
                    <p className="text-lg font-bold text-blue-600">
                      {analytics.moduleCompletionRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${analytics.moduleCompletionRate || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {Math.round(analytics.moduleCompletionRate || 0)}% of roadmaps completed
                  </p>
                </div>
              </div>

              {/* Topics Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Topics Breakdown</h2>
                {analytics.topicBreakdown && Object.keys(analytics.topicBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(analytics.topicBreakdown).map(([topic, count]) => (
                      <div key={topic}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700">{topic}</p>
                          <span className="text-sm font-bold text-gray-600">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${
                                analytics.totalQuizzes > 0
                                  ? (count / analytics.totalQuizzes) * 100
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No quiz data yet</p>
                )}
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <p className="text-gray-700 font-medium mb-2">Roadmaps Created</p>
                <p className="text-5xl font-bold text-blue-600">{analytics.totalRoadmaps || 0}</p>
                <p className="text-sm text-gray-600 mt-3">Learning paths you've started</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                <p className="text-gray-700 font-medium mb-2">Quizzes Completed</p>
                <p className="text-5xl font-bold text-purple-600">{analytics.totalQuizzes || 0}</p>
                <p className="text-sm text-gray-600 mt-3">Assessment attempts made</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <p className="text-gray-700 font-medium mb-2">Success Rate</p>
                <p className="text-5xl font-bold text-green-600">
                  {analytics.averageScore?.toFixed(0) || 0}%
                </p>
                <p className="text-sm text-gray-600 mt-3">Average quiz performance</p>
              </div>
            </div>
          </div>
        )}

        {/* Roadmaps Tab */}
        {activeView === 'roadmaps' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Roadmap Statistics</h2>
              <p className="text-gray-600 mt-1">Details of your learning roadmaps</p>
            </div>

            {roadmapStats && roadmapStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Roadmap Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Topic</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Modules</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Completion</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roadmapStats.map((roadmap) => (
                      <tr key={roadmap._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{roadmap.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{roadmap.topic}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">
                          {roadmap.modules?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    roadmap.modules && roadmap.modules.length > 0
                                      ? (roadmap.modules.filter(m => m.completed).length / roadmap.modules.length) * 100
                                      : 0
                                  }%`
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">
                              {roadmap.modules && roadmap.modules.length > 0
                                ? ((roadmap.modules.filter(m => m.completed).length / roadmap.modules.length) * 100).toFixed(0)
                                : 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(roadmap.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <FaBook className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No roadmaps created yet</p>
                <p className="text-gray-500 text-sm mt-1">Start creating a roadmap to see statistics here</p>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeView === 'quizzes' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Quiz Statistics</h2>
              <p className="text-gray-600 mt-1">Details of your quiz attempts</p>
            </div>

            {quizStats && quizStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quiz</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Roadmap</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Questions</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Correct</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Score</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quizStats.map((quiz) => {
                      const correctCount = quiz.answers?.filter(a => a.isCorrect).length || 0;
                      const totalQuestions = quiz.answers?.length || 0;
                      const scorePercentage =
                        totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr key={quiz._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{quiz.quizId || 'Quiz'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{quiz.roadmapId || '-'}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">{totalQuestions}</td>
                          <td className="px-6 py-4 text-center text-sm font-medium text-green-600">
                            {correctCount}/{totalQuestions}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              scorePercentage >= 80
                                ? 'bg-green-100 text-green-800'
                                : scorePercentage >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {scorePercentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(quiz.attemptedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <FaClipboardList className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No quizzes taken yet</p>
                <p className="text-gray-500 text-sm mt-1">Complete a quiz to see statistics here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
