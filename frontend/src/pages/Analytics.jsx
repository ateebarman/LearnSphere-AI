import { useState, useEffect } from 'react';
import { getAnalytics, getRoadmapStats, getQuizStats, getCodingAnalytics } from '../services/analyticsService';
import { FaSpinner, FaBook, FaClipboardList, FaChartBar, FaClock, FaTrophy, FaCalendarAlt, FaCode, FaFire, FaCheckCircle, FaExclamationCircle, FaHistory } from 'react-icons/fa';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [roadmapStats, setRoadmapStats] = useState([]);
  const [quizStats, setQuizStats] = useState([]);
  const [codingAnalytics, setCodingAnalytics] = useState(null);
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

      const codingData = await getCodingAnalytics();
      setCodingAnalytics(codingData);
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
            { id: 'coding', label: 'Coding Arena', icon: FaCode },
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
                        ? (roadmap.modules.filter(m => m.isCompleted).length / roadmap.modules.length) * 100
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
                            <div className="font-bold text-gray-900 dark:text-white truncate max-w-xs">{quiz.moduleTitle}</div>
                            <div className="text-xs text-gray-500 mt-1">{quiz.roadmapTitle}</div>
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
                              {quiz.attemptedAt ? new Date(quiz.attemptedAt).toLocaleDateString() : 'N/A'}
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

        {/* Coding Arena Tab */}
        {activeView === 'coding' && codingAnalytics && (
          <div className="space-y-12 animate-in slide-in-from-bottom duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Problems Solved', value: codingAnalytics.stats.totalSolved, icon: FaCheckCircle, color: 'emerald' },
                { label: 'Current Streak', value: `${codingAnalytics.stats.streak} Days`, icon: FaFire, color: 'orange' },
                { label: 'Global Accuracy', value: `${codingAnalytics.stats.accuracy}%`, icon: FaTrophy, color: 'indigo' },
              ].map((stat, idx) => (
                <div key={idx} className="card-premium group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-4xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-950/30 text-${stat.color}-600 dark:text-${stat.color}-400 transition-transform group-hover:scale-110`}>
                      <stat.icon size={28} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Difficulty Breakdown */}
              <div className="card-premium h-full">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                  Proficiency Level
                </h2>
                <div className="space-y-8">
                  {Object.entries(codingAnalytics.difficultyBreakdown).map(([level, count]) => {
                    const total = codingAnalytics.stats.totalSolved || 1;
                    const percent = (count / total) * 100;
                    const colorClasses = {
                      Easy: 'bg-emerald-500',
                      Medium: 'bg-amber-500',
                      Hard: 'bg-rose-500'
                    };
                    const textClasses = {
                      Easy: 'text-emerald-500',
                      Medium: 'text-amber-500',
                      Hard: 'text-rose-500'
                    };
                    return (
                      <div key={level} className="space-y-3">
                        <div className="flex justify-between items-end">
                          <p className={`font-bold transition-colors ${textClasses[level]}`}>{level}</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">{count}</p>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${colorClasses[level]}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Activity */}
              <div className="card-premium">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
                  Contribution Heatmap
                </h2>
                <div className="flex items-end justify-between h-48 gap-3 pt-4 px-2">
                  {codingAnalytics.activity.map((day, idx) => {
                    const max = Math.max(...codingAnalytics.activity.map(a => a.count), 5);
                    const height = (day.count / max) * 100;
                    const dateObj = new Date(day.date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                        <div className="relative w-full flex flex-col items-center justify-end h-full">
                          <div className="absolute -top-10 px-3 py-1.5 bg-gray-900 dark:bg-indigo-600 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-10 shadow-xl font-bold">
                            {day.count} submissons
                          </div>
                          <div
                            className="w-full bg-orange-100 dark:bg-orange-900/20 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40 transition-all rounded-t-xl"
                            style={{ height: `${height}%`, minHeight: day.count > 0 ? '6px' : '0' }}
                          >
                            <div className="w-full h-full bg-orange-500 rounded-t-xl opacity-80" />
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{dayName.charAt(0)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submission History */}
            <div className="card-premium border-none p-0 overflow-hidden shadow-2xl">
              <div className="p-8 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                <h2 className="text-3xl font-bold flex items-center gap-4">
                  <FaHistory className="text-indigo-600" />
                  Recent Submissions
                </h2>
              </div>
              {codingAnalytics.recentSubmissions && codingAnalytics.recentSubmissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-950/50 text-gray-400 uppercase text-xs font-black tracking-widest border-b dark:border-gray-800">
                        <th className="px-8 py-5">Problem</th>
                        <th className="px-8 py-5">Result</th>
                        <th className="px-8 py-5">Lang</th>
                        <th className="px-8 py-5 text-center">Runtime</th>
                        <th className="px-8 py-5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                      {codingAnalytics.recentSubmissions.map((sub) => (
                        <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{sub.question?.title}</div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${sub.question?.difficulty === 'Easy' ? 'text-emerald-500' :
                                sub.question?.difficulty === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                              }`}>
                              {sub.question?.difficulty}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black w-fit ${sub.status === 'Accepted'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                              }`}>
                              {sub.status === 'Accepted' ? <FaCheckCircle /> : <FaExclamationCircle />}
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-mono text-[10px] uppercase font-bold text-gray-400">{sub.language}</td>
                          <td className="px-8 py-6 text-center font-black text-gray-700 dark:text-gray-300">{sub.runtime ? `${sub.runtime}ms` : '--'}</td>
                          <td className="px-8 py-6 text-sm text-gray-400 font-medium">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center opacity-30">
                  <FaCode size={48} className="mx-auto mb-4" />
                  <p className="text-xl font-bold">No submissions found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
