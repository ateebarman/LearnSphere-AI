import { useState, useEffect } from 'react';
import { getAnalytics, getRoadmapStats, getQuizStats } from '../services/analyticsService';
import { FaSpinner, FaBook, FaClipboardList, FaChartBar, FaClock, FaTrophy, FaCalendarAlt } from 'react-icons/fa';

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="animate-spin text-5xl text-indigo-600" />
        <p className="text-gray-500 font-medium animate-pulse">Calculating your achievements...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card-premium py-20 text-center mx-auto max-w-lg mt-12">
        <p className="text-red-500 text-lg font-bold">{errorMessage || 'Failed to load analytics'}</p>
        <button onClick={fetchData} className="btn-primary mt-6">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-5xl font-extrabold text-gradient flex items-center gap-4">
            <FaChartBar className="text-indigo-600" />
            Learning Analytics
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
            Visualizing your journey from curiosity to mastery.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl w-fit border border-gray-200 dark:border-gray-800">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartBar },
            { id: 'roadmaps', label: 'Roadmaps', icon: FaBook },
            { id: 'quizzes', label: 'Quizzes', icon: FaClipboardList },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${activeView === tab.id
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-lg'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <tab.icon className="text-lg" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Total Roadmaps', value: analytics.totalRoadmaps, icon: FaBook, color: 'indigo' },
                { label: 'Total Quizzes', value: analytics.totalQuizzes, icon: FaClipboardList, color: 'purple' },
                { label: 'Average Score', value: `${analytics.averageScore?.toFixed(1) || 0}%`, icon: FaTrophy, color: 'green' },
                { label: 'Learning Time', value: `${Math.round(analytics.estimatedLearningTime || 0)}h`, icon: FaClock, color: 'orange' },
              ].map((stat, idx) => (
                <div key={idx} className="card-premium group hover:border-indigo-500/30">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-4xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-950/30 text-${stat.color}-600 dark:text-${stat.color}-400 transition-transform group-hover:scale-110`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress and Topics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Module Completion */}
              <div className="card-premium flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                    Module Completion
                  </h2>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Overall Mastery Rate</p>
                        <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
                          {analytics.moduleCompletionRate?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <FaTrophy className="text-5xl text-indigo-100 dark:text-indigo-900/40" />
                    </div>
                    <div className="relative pt-4">
                      <div className="flex mb-2 items-center justify-between">
                        <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200 dark:bg-indigo-900/50">
                          Progress
                        </span>
                      </div>
                      <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-indigo-100 dark:bg-gray-800">
                        <div
                          style={{ width: `${analytics.moduleCompletionRate || 0}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-1000 ease-out"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics Breakdown */}
              <div className="card-premium">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
                  Knowledge Map
                </h2>
                {analytics.topicBreakdown && Object.keys(analytics.topicBreakdown).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(analytics.topicBreakdown).map(([topic, count]) => (
                      <div key={topic} className="group">
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-bold text-gray-700 dark:text-gray-300">{topic}</p>
                          <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-black">{count} Quizzes</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all duration-700 group-hover:bg-purple-500"
                            style={{
                              width: `${analytics.totalQuizzes > 0
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
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-50">
                    <FaBook className="text-5xl mb-4" />
                    <p className="font-medium">No quiz deep-dives recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Roadmaps Tab */}
        {activeView === 'roadmaps' && (
          <div className="card-premium border-none p-0 overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="p-8 border-b dark:border-gray-800">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <FaBook className="text-indigo-600" />
                Active Learning Paths
              </h2>
            </div>

            {roadmapStats && roadmapStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-950/50 text-gray-400 uppercase text-xs font-black tracking-widest border-b dark:border-gray-800">
                      <th className="px-8 py-5">Title</th>
                      <th className="px-8 py-5">Topic</th>
                      <th className="px-8 py-5 text-center">Modules</th>
                      <th className="px-8 py-5">Progress</th>
                      <th className="px-8 py-5">Started</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {roadmapStats.map((roadmap) => {
                      const completion = roadmap.modules && roadmap.modules.length > 0
                        ? (roadmap.modules.filter(m => m.completed).length / roadmap.modules.length) * 100
                        : 0;

                      return (
                        <tr key={roadmap._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-8 py-6 font-bold text-gray-900 dark:text-white">{roadmap.title}</td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                              {roadmap.topic}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center font-black">{roadmap.modules?.length || 0}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="flex-grow w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${completion}%` }} />
                              </div>
                              <span className="font-bold text-sm min-w-[3rem]">{Math.round(completion)}%</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-gray-500 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt />
                              {new Date(roadmap.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center opacity-50">
                <FaBook className="text-6xl mx-auto mb-6" />
                <p className="text-xl font-bold">Your library is currently empty.</p>
                <p className="mt-2">Generate a roadmap to start tracking your progress.</p>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeView === 'quizzes' && (
          <div className="card-premium border-none p-0 overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="p-8 border-b dark:border-gray-800">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <FaClipboardList className="text-purple-600" />
                Assessment History
              </h2>
            </div>

            {quizStats && quizStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-950/50 text-gray-400 uppercase text-xs font-black tracking-widest border-b dark:border-gray-800">
                      <th className="px-8 py-5">Topic</th>
                      <th className="px-8 py-5 text-center">Questions</th>
                      <th className="px-8 py-5 text-center">Correct</th>
                      <th className="px-8 py-5">Score</th>
                      <th className="px-8 py-5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {quizStats.map((quiz) => {
                      const correctCount = quiz.answers?.filter(a => a.isCorrect).length || 0;
                      const totalQuestions = quiz.answers?.length || 0;
                      const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

                      return (
                        <tr key={quiz._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-gray-900 dark:text-white truncate max-w-xs">{quiz.quizId || 'Community Topic'}</div>
                            <div className="text-xs text-gray-500 mt-1">ID: {quiz.roadmapId?.substring(0, 8)}...</div>
                          </td>
                          <td className="px-8 py-6 text-center font-black">{totalQuestions}</td>
                          <td className="px-8 py-6 text-center font-black text-green-600 dark:text-green-400">{correctCount}</td>
                          <td className="px-8 py-6">
                            <span className={`inline-block w-20 text-center py-2 rounded-xl text-sm font-black ${scorePercentage >= 80
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : scorePercentage >= 60
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              }`}>
                              {scorePercentage.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm text-gray-500 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt />
                              {new Date(quiz.attemptedAt).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center opacity-50">
                <FaClipboardList className="text-6xl mx-auto mb-6" />
                <p className="text-xl font-bold">No quiz attempts yet.</p>
                <p className="mt-2">Testing your knowledge is the fastest way to learn!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
