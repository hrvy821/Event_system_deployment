import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, AlertCircle, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time Validation for New Password
  const passwordRules = {
    length: passwords.newPassword.length >= 6,
    uppercase: /[A-Z]/.test(passwords.newPassword),
    number: /[0-9]/.test(passwords.newPassword),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(passwords.newPassword),
  };
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to send OTP. Please check your email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await api.post('/auth/verify-otp', { email, otp });
      setStep(3);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    // Check if it meets the strong password rules
    if (!isPasswordValid) {
      setErrorMessage("Please make sure your new password meets all the security requirements.");
      setIsLoading(false);
      return;
    }

    // Check if passwords match
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMessage("Passwords do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', { 
        email, 
        otp, 
        newPassword: passwords.newPassword 
      });
      
      // Redirect to login after success
      navigate('/login');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const RequirementItem = ({ isValid, text }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${isValid ? 'text-green-600' : 'text-gray-400'}`}>
      {isValid ? <CheckCircle size={14} /> : <XCircle size={14} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 relative">
        
        {/* Back to Login Link */}
        <Link to="/login" className="absolute top-6 left-6 text-gray-400 hover:text-purple-600 transition flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="text-center mb-8 mt-6">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Enter OTP' : 'Reset Password'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 && "Enter your email to receive an OTP"}
            {step === 2 && `We sent a code to ${email}`}
            {step === 3 && "Create a new strong password"}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-5 animate-pulse">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendEmail} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  required type="email" placeholder="john@example.com" value={email}
                  autoComplete="off"
                  readOnly 
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                />
              </div>
            </div>
            <button disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition shadow-lg mt-2 disabled:opacity-50">
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">One Time Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  required type="text" placeholder="123456" value={otp} maxLength={6}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition tracking-widest text-center font-bold text-lg"
                  onChange={(e) => { setOtp(e.target.value); setErrorMessage(''); }}
                />
              </div>
            </div>
            <button disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition shadow-lg mt-2 disabled:opacity-50">
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-purple-600 transition">
                Change email address
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">New Password</label>
              <div className="relative mb-2">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  required type={showNewPassword ? 'text' : 'password'} placeholder="--------" value={passwords.newPassword}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  onChange={(e) => { setPasswords({...passwords, newPassword: e.target.value}); setErrorMessage(''); }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5 mt-1">
                <RequirementItem isValid={passwordRules.length} text="At least 6 characters long" />
                <RequirementItem isValid={passwordRules.uppercase} text="Contains 1 uppercase letter" />
                <RequirementItem isValid={passwordRules.number} text="Contains 1 number" />
                <RequirementItem isValid={passwordRules.specialChar} text="Contains 1 special character" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  required type={showConfirmPassword ? 'text' : 'password'} placeholder="--------" value={passwords.confirmPassword}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  onChange={(e) => { setPasswords({...passwords, confirmPassword: e.target.value}); setErrorMessage(''); }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              disabled={isLoading || (passwords.newPassword.length > 0 && !isPasswordValid)} 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
