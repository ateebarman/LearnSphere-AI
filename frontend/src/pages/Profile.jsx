import { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../services/authService';
import { getAnalytics } from '../services/analyticsService';
import { useAuthStore } from '../store/useAuthStore';
import { FaSpinner, FaEdit, FaSave, FaTimes, FaLock, FaTrash, FaCheckCircle, FaUserCircle, FaEnvelope, FaTags, FaCalendarAlt, FaChartBar, FaShieldAlt } from 'react-icons/fa';

const Profile = () => {
  const { logout } = useAuthStore();

  // Profile state
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topicsOfInterest: ''
  });

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileData = await getProfile();
      setProfile(profileData);
      setFormData({
        name: profileData.name,
        email: profileData.email,
        topicsOfInterest: (profileData.topicsOfInterest || []).join(', ')
      });

      const analyticsData = await getAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      setErrorMessage('Failed to load profile data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');

      const topics = formData.topicsOfInterest
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      await updateProfile({
        name: formData.name,
        email: formData.email,
        topicsOfInterest: topics
      });

      setSuccessMessage('Profile updated successfully!');
      setEditMode(false);
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      setPasswordError('');
      setSubmitting(true);

      if (passwordForm.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }

      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      setSuccessMessage('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      setDeleteError('');
      setSubmitting(true);

      if (!deletePassword) {
        setDeleteError('Please enter your password');
        return;
      }

      await deleteAccount(deletePassword);

      setSuccessMessage('Account deleted successfully. Logging out...');
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-[60vh] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="animate-spin text-5xl text-indigo-600" />
        <p className="text-gray-500 font-medium animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card-premium py-20 text-center mx-auto max-w-lg mt-12">
        <p className="text-red-500 text-lg font-bold">Failed to load profile</p>
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
            <FaUserCircle className="text-indigo-600" />
            My Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
            Personalize your experience and track your evolution.
          </p>
        </div>

        {/* Messages */}
        <div className="fixed top-24 right-8 z-50 space-y-4 max-w-md w-full pointer-events-none">
          {successMessage && (
            <div className="p-4 bg-green-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500 pointer-events-auto">
              <FaCheckCircle className="text-xl" />
              <p className="font-bold">{successMessage}</p>
            </div>
          )}
          {errorMessage && (activeTab === 'profile') && (
            <div className="p-4 bg-red-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500 pointer-events-auto">
              <FaTimes className="text-xl" />
              <p className="font-bold">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card-premium text-center space-y-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center text-4xl text-white shadow-xl shadow-indigo-500/20 mx-auto">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white dark:border-gray-950 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-xl font-black dark:text-white">{profile.name}</h3>
                <p className="text-sm font-bold text-gray-400">{profile.email}</p>
              </div>
            </div>

            <div className="card-premium space-y-6">
              <h2 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Mastery Metrics</h2>
              <div className="space-y-4">
                {[
                  { label: 'Paths', value: analytics?.totalRoadmaps || 0, color: 'blue' },
                  { label: 'Quizzes', value: analytics?.totalQuizzes || 0, color: 'purple' },
                  { label: 'Mastery', value: `${analytics?.averageScore?.toFixed(0) || 0}%`, color: 'green' },
                  { label: 'Focus', value: `${Math.round(analytics?.estimatedLearningTime || 0)}h`, color: 'orange' },
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-${stat.color}-500/20 transition-all`}>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Navigation Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl w-fit border border-gray-200 dark:border-gray-800">
              {[
                { id: 'profile', label: 'Identity', icon: FaEdit },
                { id: 'security', label: 'Security', icon: FaShieldAlt },
                { id: 'statistics', label: 'Analytics', icon: FaChartBar },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-lg'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <tab.icon className="text-lg" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card-premium space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black dark:text-white">Profile Information</h2>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <FaEdit /> Edit Account
                    </button>
                  )}
                </div>

                {editMode ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <FaUserCircle className="text-indigo-600" /> Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleEditChange}
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <FaEnvelope className="text-indigo-600" /> Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleEditChange}
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <FaTags className="text-indigo-600" /> Topics of Interest
                        </label>
                        <textarea
                          name="topicsOfInterest"
                          value={formData.topicsOfInterest}
                          onChange={handleEditChange}
                          placeholder="e.g., JavaScript, React, Node.js"
                          className="form-input min-h-[100px] py-4"
                        />
                        <p className="text-[10px] font-bold text-gray-400">Separate multiple topics with commas for better AI personalization.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t dark:border-gray-800">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary flex items-center gap-2 px-10"
                      >
                        {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        Update Identity
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            name: profile.name,
                            email: profile.email,
                            topicsOfInterest: (profile.topicsOfInterest || []).join(', ')
                          });
                        }}
                        className="btn-secondary"
                      >
                        Discard Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="group">
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Display Name</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white transition-all group-hover:translate-x-1">{profile.name}</p>
                      </div>
                      <div className="group">
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Account Email</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white transition-all group-hover:translate-x-1">{profile.email}</p>
                      </div>
                      <div className="group">
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2 font-black flex items-center gap-2">
                          <FaCalendarAlt /> Member Since
                        </p>
                        <p className="text-lg font-bold text-gray-500 dark:text-gray-400">{new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Learning Passions</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.topicsOfInterest && profile.topicsOfInterest.length > 0 ? (
                          profile.topicsOfInterest.map((topic, i) => (
                            <span key={i} className="px-5 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-2xl text-xs font-black border border-indigo-100 dark:border-indigo-800 transition-all hover:scale-105 active:scale-95 cursor-default">
                              {topic}
                            </span>
                          ))
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 text-center w-full opacity-50">
                            <FaTags className="mx-auto mb-2" />
                            <p className="text-xs font-bold">No interests defined yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="card-premium space-y-8">
                  <h2 className="text-3xl font-black dark:text-white flex items-center gap-4">
                    <FaLock className="text-indigo-600" />
                    Authentication Keys
                  </h2>

                  {passwordError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm">
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Token</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">New Secret</label>
                        <input
                          type="password"
                          placeholder="New password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confirm Secret</label>
                        <input
                          type="password"
                          placeholder="Repeat new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary flex items-center gap-2 px-10"
                    >
                      {submitting ? <FaSpinner className="animate-spin" /> : <FaShieldAlt />}
                      Rotate Credentials
                    </button>
                  </form>
                </div>

                {/* Delete Account */}
                <div className="card-premium border-red-500/20 bg-red-50/50 dark:bg-red-950/10 space-y-6">
                  <h3 className="text-2xl font-black text-red-600">Volatile Action Zone</h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Permanently purge your account, learning history, and generated nodes from our global network.</p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition transform hover:scale-105"
                    >
                      <FaTrash /> Purge Account
                    </button>
                  ) : (
                    <div className="space-y-6 animate-in zoom-in duration-300">
                      <div className="p-6 bg-red-600 text-white rounded-3xl space-y-4 shadow-xl shadow-red-500/30">
                        <p className="font-black text-lg">⚠️ Final Warning</p>
                        <p className="text-sm opacity-90 font-medium">This action is irreversible. All your proved roadmaps and analytics data will be destroyed forever.</p>

                        <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2">
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your security token to confirm"
                            className="w-full px-6 py-4 bg-white/20 border-2 border-white/30 rounded-2xl focus:outline-none focus:bg-white/30 placeholder:text-white/60 text-white"
                            required
                          />

                          <div className="flex flex-col sm:flex-row gap-4">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="flex-1 bg-white text-red-600 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
                            >
                              {submitting ? <FaSpinner className="animate-spin inline mr-2" /> : 'PURGE EVERYTHING'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeletePassword('');
                                setDeleteError('');
                              }}
                              className="px-8 py-4 bg-white/10 text-white border-2 border-white/20 rounded-2xl font-black hover:bg-white/20 transition-all"
                            >
                              ABORT
                            </button>
                          </div>
                        </form>
                      </div>
                      {deleteError && (
                        <p className="text-red-600 font-black text-center animate-bounce">{deleteError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Completion Rate */}
                  <div className="card-premium flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Efficiency</h3>
                      <div className="flex items-end gap-3">
                        <p className="text-6xl font-black dark:text-white">{analytics?.moduleCompletionRate?.toFixed(0) || 0}%</p>
                        <p className="text-sm font-bold text-gray-500 mb-2">Completion</p>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 relative overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/40"
                          style={{ width: `${analytics?.moduleCompletionRate || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Topics Insight */}
                  <div className="card-premium space-y-6">
                    <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">Focus Breakdown</h3>
                    {analytics?.topicBreakdown && Object.keys(analytics.topicBreakdown).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(analytics.topicBreakdown).map(([topic, count]) => (
                          <div key={topic} className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-tight">
                              <span className="dark:text-gray-300">{topic}</span>
                              <span className="text-indigo-600">{count} EXP</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                              <div
                                className="bg-purple-600 h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${analytics.totalQuizzes > 0 ? (count / analytics.totalQuizzes) * 100 : 0}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 opacity-40">
                        <p className="font-bold text-sm">Awaiting your first assessment...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Network Points', value: analytics?.totalRoadmaps || 0, color: 'indigo' },
                    { label: 'Solved Puzzles', value: analytics?.totalQuizzes || 0, color: 'purple' },
                    { label: 'Success IQ', value: `${analytics?.averageScore?.toFixed(0) || 0}%`, color: 'green' },
                    { label: 'Grind Hours', value: `${Math.round(analytics?.estimatedLearningTime || 0)}h`, color: 'orange' },
                  ].map((stat, i) => (
                    <div key={i} className="card-premium text-center hover:scale-105 transition-transform">
                      <p className="text-[10px] uppercase font-black text-gray-500 mb-2">{stat.label}</p>
                      <p className={`text-3xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;