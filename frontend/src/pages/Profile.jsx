import { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../services/authService';
import { getAnalytics } from '../services/analyticsService';
import { useAuthStore } from '../store/useAuthStore';
import { FaSpinner, FaEdit, FaSave, FaTimes, FaLock, FaTrash, FaCheckCircle } from 'react-icons/fa';

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
      <div className="text-center py-20">
        <FaSpinner className="animate-spin text-4xl mx-auto text-blue-500" />
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account and view learning statistics</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <FaCheckCircle className="text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Roadmaps Created</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics?.totalRoadmaps || 0}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Quizzes Taken</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics?.totalQuizzes || 0}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Quiz Score</p>
                  <p className="text-2xl font-bold text-green-600">{analytics?.averageScore?.toFixed(1) || 0}%</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Learning Time</p>
                  <p className="text-2xl font-bold text-orange-600">{Math.round(analytics?.estimatedLearningTime || 0)}h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium border-b-2 transition ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaEdit className="inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-3 font-medium border-b-2 transition ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaLock className="inline mr-2" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`px-6 py-3 font-medium border-b-2 transition ${
                  activeTab === 'statistics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaCheckCircle className="inline mr-2" />
                Statistics
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <FaEdit /> Edit
                    </button>
                  )}
                </div>

                {editMode ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Topics of Interest (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="topicsOfInterest"
                        value={formData.topicsOfInterest}
                        onChange={handleEditChange}
                        placeholder="e.g., JavaScript, React, Node.js"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple topics with commas</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition"
                      >
                        {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        Save Changes
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
                        className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Full Name</p>
                      <p className="text-lg text-gray-900 mt-1">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email Address</p>
                      <p className="text-lg text-gray-900 mt-1">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Topics of Interest</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.topicsOfInterest && profile.topicsOfInterest.length > 0 ? (
                          profile.topicsOfInterest.map((topic, i) => (
                            <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {topic}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No topics added yet</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Member Since</p>
                      <p className="text-lg text-gray-900 mt-1">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>

                {/* Change Password */}
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h3>
                  
                  {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{passwordError}</p>
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          currentPassword: e.target.value
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          newPassword: e.target.value
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          confirmPassword: e.target.value
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
                    >
                      {submitting ? <FaSpinner className="animate-spin inline mr-2" /> : null}
                      Update Password
                    </button>
                  </form>
                </div>

                {/* Delete Account */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 text-red-600">Danger Zone</h3>
                  <p className="text-gray-600 mb-4">Permanently delete your account and all associated data.</p>
                  
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <FaTrash /> Delete Account
                    </button>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      {deleteError && (
                        <div className="mb-4 p-3 bg-red-100 rounded">
                          <p className="text-red-800 text-sm">{deleteError}</p>
                        </div>
                      )}
                      
                      <p className="text-red-800 font-medium mb-4">
                        This action cannot be undone. Please enter your password to confirm.
                      </p>
                      
                      <form onSubmit={handleDeleteAccount} className="space-y-4">
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          required
                        />
                        
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                          >
                            {submitting ? <FaSpinner className="animate-spin inline mr-2" /> : null}
                            Delete Account Permanently
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeletePassword('');
                              setDeleteError('');
                            }}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Statistics</h2>
                
                {analytics && (
                  <div className="space-y-6">
                    {/* Completion Rate */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-600">Module Completion Rate</p>
                        <p className="text-lg font-bold text-blue-600">
                          {analytics.moduleCompletionRate?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${analytics.moduleCompletionRate || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Topics Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics Breakdown</h3>
                      {analytics.topicBreakdown && Object.keys(analytics.topicBreakdown).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(analytics.topicBreakdown).map(([topic, count]) => (
                            <div key={topic}>
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-medium text-gray-700">{topic}</p>
                                <p className="text-sm text-gray-600">{count} quiz(zes)</p>
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
                        <p className="text-gray-500">No quiz data yet</p>
                      )}
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Roadmaps</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.totalRoadmaps || 0}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Quizzes</p>
                        <p className="text-3xl font-bold text-purple-600 mt-1">{analytics.totalQuizzes || 0}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Average Score</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                          {analytics.averageScore?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Learning Time</p>
                        <p className="text-3xl font-bold text-orange-600 mt-1">
                          {Math.round(analytics.estimatedLearningTime || 0)}h
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;