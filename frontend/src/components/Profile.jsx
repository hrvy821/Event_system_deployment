import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  AtSign,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  X,
  ArrowLeft,
  Calendar,
  Activity,
  Ticket,
  RefreshCcw,
  Check,
  XCircle,
  BadgeCheck,
  LayoutGrid
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();

  const localUser = JSON.parse(localStorage.getItem('user') || '{}');

  const normalizeUser = (rawUser = {}) => ({
    ...rawUser
  });

  const [user, setUser] = useState(normalizeUser(localUser));

  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  const [formData, setFormData] = useState({
    name: localUser.name || '',
    username: localUser.username || '',
    email: localUser.email || '',
    currentPassword: '',
    newPassword: '',
    avatarUrl: localUser.avatarUrl || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [verifyModal, setVerifyModal] = useState({
    show: false,
    code: '',
    isVerifying: false
  });

  const [usernameStatus, setUsernameStatus] = useState('idle');

  const [userStats, setUserStats] = useState({
    ticketsBooked: 0,
    eventsJoined: 0,
    myPublishedEvents: 0,
    totalEventsCreated: 0,
    joinedDate: 'Loading...',
    lastUpdated: 'Recently',
    accountStatus: 'Active'
  });

  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    formData.name || user.name || 'User'
  )}&backgroundColor=2563eb`;

  const isEmailChanged = (formData.email || '').trim().toLowerCase() !== (user.email || '').trim().toLowerCase();

  const isDirty =
    formData.name !== (user.name || '') ||
    formData.username !== (user.username || '') ||
    formData.email !== (user.email || '') ||
    formData.newPassword !== '' ||
    formData.avatarUrl !== (user.avatarUrl || '');

  const calculateCompletion = () => {
    let score = 0;
    if (formData.name?.trim()) score += 20;
    if (formData.username?.trim()) score += 20;
    if (formData.email?.trim()) score += 20;
    if (formData.avatarUrl || user.avatarUrl) score += 20;
    if (user.createdAt) score += 10;
    if (user.role) score += 10;
    return score;
  };

  const completionPercentage = calculateCompletion();

  const pwdChecks = {
    length: formData.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(formData.newPassword),
    number: /[0-9]/.test(formData.newPassword),
    special: /[^A-Za-z0-9]/.test(formData.newPassword)
  };

  const calculatePasswordStrength = () => {
    if (!formData.newPassword) {
      return {
        percent: 0,
        text: 'None',
        color: 'bg-slate-200',
        textColor: 'text-slate-400'
      };
    }

    const passedChecks = Object.values(pwdChecks).filter(Boolean).length;

    if (passedChecks <= 1) {
      return {
        percent: 25,
        text: 'Weak',
        color: 'bg-rose-500',
        textColor: 'text-rose-600'
      };
    }
    if (passedChecks === 2 || passedChecks === 3) {
      return {
        percent: 60,
        text: 'Medium',
        color: 'bg-amber-500',
        textColor: 'text-amber-600'
      };
    }
    return {
      percent: 100,
      text: 'Strong',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    };
  };

  const passwordStrength = calculatePasswordStrength();

  const formatMonthYear = (dateValue) => {
    if (!dateValue) return 'Recently';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDateLabel = (dateValue) => {
    if (!dateValue) return 'Recently';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const updateLocalUser = (incomingUser) => {
    const normalized = normalizeUser(incomingUser);
    setUser(normalized);
    localStorage.setItem('user', JSON.stringify(normalized));
    return normalized;
  };

  const refreshProfileData = async () => {
    if (!user?.id) {
      setIsRefreshing(false);
      return;
    }

    try {
      setIsRefreshing(true);

      const results = await Promise.allSettled([
        api.get(`/users/${user.id}`),
        api.get('/attendees'),
        api.get('/events')
      ]);

      const userRes = results[0].status === 'fulfilled' ? results[0].value.data : null;
      const attendeesData = results[1].status === 'fulfilled' ? results[1].value.data : [];
      const eventsData = results[2].status === 'fulfilled' ? results[2].value.data : [];

      const refreshedUser = normalizeUser(userRes || user);
      updateLocalUser(refreshedUser);

      setFormData((prev) => ({
        ...prev,
        name: refreshedUser.name || '',
        username: refreshedUser.username || '',
        email: refreshedUser.email || '',
        avatarUrl: refreshedUser.avatarUrl || ''
      }));

      const myAllTickets = attendeesData.filter(
        (a) => (a.email || '').toLowerCase() === (refreshedUser.email || '').toLowerCase()
      );

      const myActiveTickets = myAllTickets.filter((a) => a.status !== 'Cancelled');

      // 🌟 FIX: Only counts Published events that are NOT archived!
      const myPublishedEvents = eventsData.filter(
        (e) => String(e.organizerId) === String(user.id) && !e.isArchived && e.status === 'Published'
      );

      // Total events created counts EVERYTHING (draft, pending, rejected, archived)
      const totalEventsCreated = eventsData.filter(
        (e) => String(e.organizerId) === String(user.id)
      );

      setUserStats({
        ticketsBooked: myAllTickets.length,
        eventsJoined: myActiveTickets.length,
        myPublishedEvents: myPublishedEvents.length,
        totalEventsCreated: totalEventsCreated.length,
        joinedDate: formatMonthYear(refreshedUser.createdAt),
        lastUpdated: formatDateLabel(refreshedUser.updatedAt || refreshedUser.createdAt),
        accountStatus: refreshedUser.isActive === false ? 'Inactive' : 'Active'
      });
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
      setStatus({
        type: 'error',
        message: 'Unable to fully refresh profile data. Some information may be outdated.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (formData.username === user.username) {
      setUsernameStatus('idle');
      return;
    }

    if (formData.username.length === 0) {
      setUsernameStatus('idle');
      return;
    }

    const isValidFormat = /^[A-Za-z0-9_]+$/.test(formData.username);
    if (!isValidFormat) {
      setUsernameStatus('invalid');
      return;
    }

    if (formData.username.length > 2) {
      setUsernameStatus('checking');

      const timer = setTimeout(async () => {
        try {
          const res = await api.get('/users');
          const users = Array.isArray(res.data) ? res.data : [];

          const normalizedInput = formData.username.trim().toLowerCase();
          const taken = users.some(
            (u) =>
              u.id !== user.id &&
              (u.username || '').trim().toLowerCase() === normalizedInput
          );

          setUsernameStatus(taken ? 'taken' : 'available');
        } catch {
          setUsernameStatus('idle');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.username, user.id, user.username]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const resetForm = () => {
    setFormData({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      currentPassword: '',
      newPassword: '',
      avatarUrl: user.avatarUrl || ''
    });
    setVerifyModal({ show: false, code: '', isVerifying: false });
    setUsernameStatus('idle');
    setStatus({ type: '', message: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      setStatus({
        type: 'error',
        message: 'Picture is too large. Please select an image under 1MB.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        avatarUrl: reader.result
      }));
      setStatus({ type: '', message: '' });
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: ''
    }));
  };

  const buildUpdatePayload = () => {
    const payload = {
      name: formData.name,
      username: (formData.username || '').replace('@', '').trim(),
      avatarUrl: formData.avatarUrl || null
    };

    if (formData.newPassword.trim() !== '') {
      payload.currentPassword = formData.currentPassword;
      payload.newPassword = formData.newPassword;
    }

    return payload;
  };

  const executeSave = async () => {
    setIsLoading(true);

    try {
      const payload = buildUpdatePayload();

      const response = await api.put(`/users/${user.id}`, payload);
      const updatedUserFromBackend = normalizeUser(response?.data || {});

      const updatedUser = updateLocalUser({
        ...user,
        ...updatedUserFromBackend
      });

      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        name: updatedUser.name || '',
        username: updatedUser.username || '',
        email: updatedUser.email || '',
        avatarUrl: updatedUser.avatarUrl || ''
      }));

      setVerifyModal({ show: false, code: '', isVerifying: false });
      setStatus({ type: 'success', message: 'Profile changes saved successfully.' });

      setUserStats((prev) => ({
        ...prev,
        lastUpdated: formatDateLabel(updatedUser.updatedAt || new Date().toISOString())
      }));

      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Update failed. Please verify your details and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInitiate = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!isDirty) {
      setStatus({ type: 'error', message: 'There are no changes to save.' });
      return;
    }

    if (formData.newPassword.trim() !== '' && passwordStrength.percent !== 100) {
      setStatus({
        type: 'error',
        message: 'New password does not meet all security requirements.'
      });
      return;
    }

    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setStatus({
        type: 'error',
        message: 'Please resolve username errors before saving.'
      });
      return;
    }

    if (isEmailChanged && !formData.currentPassword.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter your current password to change your email.'
      });
      return;
    }

    if (isEmailChanged) {
      try {
        setIsLoading(true);
        await api.post(`/users/${user.id}/email-change/send`, {
          newEmail: formData.email.trim().toLowerCase(),
          currentPassword: formData.currentPassword
        });

        setVerifyModal({
          show: true,
          code: '',
          isVerifying: false
        });

        setStatus({
          type: 'success',
          message: 'A verification code has been sent to your new email address.'
        });
      } catch (error) {
        setStatus({
          type: 'error',
          message:
            error.response?.data?.message ||
            'Failed to send verification code. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    executeSave();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setVerifyModal((prev) => ({ ...prev, isVerifying: true }));
    setStatus({ type: '', message: '' });

    try {
      const verifyResponse = await api.post(`/users/${user.id}/email-change/verify`, {
        code: verifyModal.code
      });

      const verifiedUser = updateLocalUser(verifyResponse?.data || user);

      setFormData((prev) => ({
        ...prev,
        email: verifiedUser.email || prev.email
      }));

      await executeSave();
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error.response?.data?.message || 'Invalid verification code. Please try again.'
      });
      setVerifyModal((prev) => ({
        ...prev,
        isVerifying: false
      }));
    }
  };

  const InfoRow = ({ icon, label, value, badge, valueClass = 'text-slate-900' }) => (
    <li className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 text-slate-500 min-w-0">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="shrink-0">
        {badge ? (
          badge
        ) : (
          <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
        )}
      </div>
    </li>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <div className="max-w-[1280px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        
        <Link
          to={isOrganizer ? "/organizer" : "/"}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-6 group w-fit"
        >
          <div className="bg-white border border-slate-200 p-1.5 rounded-lg group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors shadow-sm">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </div>
          Back to Dashboard
        </Link>

        <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-slate-950 tracking-tight">
                Account Settings
              </h1>

              {userStats.accountStatus === 'Active' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] uppercase font-black tracking-[0.18em]">
                  <BadgeCheck size={12} />
                  Active Account
                </span>
              )}

              {isDirty && (
                <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-2 py-1 rounded-md animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>

            <p className="text-slate-500 font-medium text-base">
              Manage your profile information, security, and account activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isDirty && (
              <button
                onClick={resetForm}
                type="button"
                disabled={isLoading}
                className="px-6 py-3.5 rounded-xl font-black text-sm text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <RefreshCcw size={16} />
                Cancel
              </button>
            )}

            <button
              onClick={handleSaveInitiate}
              type="submit"
              disabled={!isDirty || isLoading}
              className={`px-8 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-xl ${
                !isDirty
                  ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                  : isLoading
                  ? 'bg-slate-800 text-white shadow-slate-950/10'
                  : 'bg-slate-950 hover:bg-slate-800 text-white shadow-slate-950/10'
              }`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : status.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <Save size={18} strokeWidth={2.5} />
              )}
              {isLoading ? 'Saving...' : status.type === 'success' ? 'Saved' : 'Save Changes'}
            </button>
          </div>
        </div>

        {status.message && (
          <div
            className={`mb-8 p-5 rounded-2xl flex items-center gap-3.5 animate-in fade-in slide-in-from-top shadow-sm border ${
              status.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {status.type === 'error' ? (
              <AlertCircle size={20} className="shrink-0" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={20} className="shrink-0" strokeWidth={2.5} />
            )}
            <p className="font-bold text-sm">{status.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center h-fit">
              <div className="relative group mb-5">
                <div className="w-36 h-36 rounded-full border-4 border-slate-100 overflow-hidden shadow-xl shadow-slate-900/10 bg-slate-50">
                  <img
                    src={formData.avatarUrl || fallbackAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                <label className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={28} />
                  <span className="text-xs font-black uppercase mt-2 tracking-widest">
                    Update
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 leading-tight text-center">
                {formData.name || 'Unnamed User'}
              </h2>

              <p className="text-slate-500 font-bold mb-4">
                @{formData.username || formData.name?.toLowerCase().replace(/\s+/g, '_') || 'username'}
              </p>

              <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-xs font-black uppercase tracking-wider">
                  {user.role || 'ATTENDEE'}
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  Verified
                </div>
              </div>

              <div className="flex gap-3 w-full mb-8">
                <label className="flex-1 cursor-pointer px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <Camera size={16} />
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                </label>

                <button
                  type="button"
                  onClick={removeAvatar}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="w-full space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black text-slate-900">
                      Profile Completion
                    </span>
                    <span className="text-xs font-bold text-blue-600">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <ul className="space-y-4">
                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="Member Since"
                    value={userStats.joinedDate}
                  />

                  <InfoRow
                    icon={<Activity size={16} />}
                    label="Account Status"
                    badge={
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {userStats.accountStatus}
                      </span>
                    }
                  />

                  {!isOrganizer && (
                    <>
                      <InfoRow
                        icon={<CheckCircle2 size={16} />}
                        label="Events Joined"
                        value={userStats.eventsJoined}
                      />

                      <InfoRow
                        icon={<Ticket size={16} />}
                        label="Tickets Booked"
                        value={userStats.ticketsBooked}
                      />
                    </>
                  )}

                  {isOrganizer && (
                    <>
                      <InfoRow
                        icon={<LayoutGrid size={16} />}
                        label="Total Events Created"
                        value={userStats.totalEventsCreated}
                      />
                      <InfoRow
                        icon={<Calendar size={16} />}
                        label="Published Events"
                        value={userStats.myPublishedEvents}
                      />
                    </>
                  )}

                  <InfoRow
                    icon={<RefreshCcw size={16} />}
                    label="Last Updated"
                    value={userStats.lastUpdated}
                  />
                </ul>
              </div>
            </div>
          </div>

          <form
            id="profileForm"
            onSubmit={handleSaveInitiate}
            className="lg:col-span-8 space-y-8"
          >
            <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-3 mb-1">
                  <User size={20} className="text-blue-600" />
                  Profile Information
                </h3>
                <p className="text-sm text-slate-500 font-medium ml-8">
                  Update your display name, username, and email details used across the platform.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-bold text-slate-950 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-2 leading-relaxed">
                    This name appears on your tickets, account profile, and attendance records.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    Username
                  </label>

                  <div className="relative">
                    <AtSign className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-3.5 bg-slate-50 border rounded-xl outline-none font-extrabold transition-all ${
                        usernameStatus === 'invalid' || usernameStatus === 'taken'
                          ? 'border-rose-300 focus:ring-rose-500 text-rose-700'
                          : usernameStatus === 'available'
                          ? 'border-emerald-300 focus:ring-emerald-500 text-blue-700'
                          : 'border-slate-200 focus:ring-blue-600 text-blue-700'
                      } focus:bg-white focus:ring-2`}
                    />
                    <div className="absolute right-4 top-4">
                      {usernameStatus === 'checking' && (
                        <Loader2 size={16} className="text-slate-400 animate-spin" />
                      )}
                      {usernameStatus === 'available' && (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      )}
                      {usernameStatus === 'taken' && (
                        <XCircle size={16} className="text-rose-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-start mt-2 gap-3">
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      Only letters, numbers, and underscores are allowed.
                    </p>

                    {usernameStatus === 'taken' && (
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                        Username Taken
                      </span>
                    )}

                    {usernameStatus === 'invalid' && (
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                        Invalid Format
                      </span>
                    )}

                    {usernameStatus === 'available' && (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        Available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-slate-400" size={18} />

                  <div className="absolute right-3.5 top-3">
                    {isEmailChanged ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 text-[10px] uppercase font-black tracking-wider rounded-lg border border-amber-200 animate-pulse shadow-sm">
                        <AlertCircle size={14} strokeWidth={2.5} />
                        Verify to Save
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-black tracking-wider rounded-lg border border-emerald-100 shadow-sm">
                        <ShieldCheck size={14} strokeWidth={2.5} />
                        Email Verified
                      </div>
                    )}
                  </div>

                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-40 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold transition-all ${
                      isEmailChanged
                        ? 'text-amber-700 focus:ring-2 focus:ring-amber-500 focus:bg-white'
                        : 'text-slate-950 focus:ring-2 focus:ring-blue-600 focus:bg-white'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-slate-400 font-medium mt-2 leading-relaxed">
                  {isEmailChanged ? (
                    <span className="text-amber-600 font-bold">
                      A verification code will be sent to your new email before the change is applied.
                    </span>
                  ) : (
                    'This email is used for login alerts, ticket confirmations, and account recovery.'
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_#2563eb_var(--tw-gradient-stops))] from-[#2563eb]/20 to-transparent pointer-events-none"></div>

              <div className="mb-8 border-b border-slate-100 pb-6 relative z-10">
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-3 mb-1">
                  <Lock size={20} className="text-rose-600" />
                  Password & Security
                </h3>
                <p className="text-sm text-slate-500 font-medium ml-8">
                  Change your password and protect your account with stronger security.
                </p>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      autoComplete="current-password"
                      placeholder="Enter your current password to confirm changes"
                      className="w-full pl-10 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-950 placeholder:text-sm placeholder:font-medium placeholder:text-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    New Password
                  </label>
                  <div className="relative mb-4">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Leave blank if you do not want to change your password"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-950 placeholder:text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {formData.newPassword && (
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl animate-in fade-in zoom-in duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.percent}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs shrink-0 font-black uppercase tracking-widest ${passwordStrength.textColor}`}
                        >
                          {passwordStrength.text}
                        </span>
                      </div>

                      <ul className="grid grid-cols-2 gap-3">
                        <li
                          className={`flex items-center gap-2 text-[11px] font-bold ${
                            pwdChecks.length ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {pwdChecks.length ? (
                            <Check size={14} />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />
                          )}
                          8+ characters
                        </li>

                        <li
                          className={`flex items-center gap-2 text-[11px] font-bold ${
                            pwdChecks.uppercase ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {pwdChecks.uppercase ? (
                            <Check size={14} />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />
                          )}
                          Uppercase letter
                        </li>

                        <li
                          className={`flex items-center gap-2 text-[11px] font-bold ${
                            pwdChecks.number ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {pwdChecks.number ? (
                            <Check size={14} />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />
                          )}
                          One number
                        </li>

                        <li
                          className={`flex items-center gap-2 text-[11px] font-bold ${
                            pwdChecks.special ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {pwdChecks.special ? (
                            <Check size={14} />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1" />
                          )}
                          Special char (@#$!)
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {verifyModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200 scale-100 relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() =>
                  setVerifyModal({ show: false, code: '', isVerifying: false })
                }
                className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-amber-50 border-8 border-amber-100/50 text-amber-600">
              <KeyRound size={32} strokeWidth={2.5} />
            </div>

            <h2 className="text-2xl font-extrabold mb-2 text-slate-950 tracking-tight">
              Verify New Email
            </h2>

            <p className="text-slate-500 font-medium mb-6 text-sm leading-relaxed">
              We sent a 6-digit code to{' '}
              <strong className="text-slate-800">{formData.email}</strong>. Enter it
              below to authorize this change.
            </p>

            <form onSubmit={handleVerifyOTP}>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="000000"
                value={verifyModal.code}
                onChange={(e) =>
                  setVerifyModal({
                    ...verifyModal,
                    code: e.target.value.replace(/\D/g, '')
                  })
                }
                className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-black bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none mb-6 text-slate-900 transition-all"
              />

              <button
                type="submit"
                disabled={verifyModal.isVerifying || verifyModal.code.length < 6}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
              >
                {verifyModal.isVerifying ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  'Confirm & Save'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}