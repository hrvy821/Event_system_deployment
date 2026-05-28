import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Mail, Lock, User, ShieldCheck, AlertCircle, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import HarmonyLogo from '../../components/HarmonyLogo'; 

export default function Signup() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"  
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [images.length]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Attendee'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = {
    length: formData.password.length >= 8, 
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!Object.values(passwordRules).every(Boolean)) {
      setErrorMessage("Please ensure your password meets all requirements.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(''); 

    try {
      const safeUsername = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
      
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        // 🌟 FIX: Force the role to lowercase so MySQL doesn't crash on ENUM mismatch!
        role: formData.role.toLowerCase(), 
        username: safeUsername
      };
      
      await api.post('/users', payload);
      setStep(2); 

    } catch (error) {
      // 🌟 DEEP LOGGING: This will print the exact backend error to your browser console
      console.error("SIGNUP CRASH REPORT:", error.response?.data || error);
      
      const backendError = error.response?.data?.message || 'Server Error. This email might already exist, or the database rejected the data format.';
      setErrorMessage(Array.isArray(backendError) ? backendError[0] : backendError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await api.post('/users/verify', { 
        email: formData.email, 
        code: verificationCode 
      });
      
      setShowSuccessModal(true);
      
    } catch (error) {
      const backendError = error.response?.data?.message || 'Invalid verification code.';
      setErrorMessage(Array.isArray(backendError) ? backendError[0] : backendError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-900">
      
      <style>{`
        @keyframes card-flip {
          0%, 25% { transform: rotateY(0deg); }
          45%, 75% { transform: rotateY(180deg); }
          95%, 100% { transform: rotateY(360deg); }
        }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .animate-card-flip {
          animation: card-flip 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }
      `}</style>
      
      <div className="relative hidden lg:block lg:w-[55%] h-full bg-black z-0">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-16 z-10">
          <div className="max-w-xl relative z-20">
            <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
              Join the movement.
            </h1>
            <p className="text-lg text-gray-200 font-medium drop-shadow-md">
              Sign up today and get instant access to exclusive events, seamless ticketing, and powerful organizer tools.
            </p>
          </div>
          
          <div className="flex gap-2 mt-8 relative z-20">
            {images.map((_, index) => (
              <div 
                key={index} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === currentImageIndex ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-4 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] h-full flex flex-col relative bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 z-30 shadow-[-25px_0_50px_-12px_rgba(0,0,0,0.6)] overflow-y-auto">
        <div className="flex-1 w-full max-w-md mx-auto py-12 px-8 sm:px-4 flex flex-col justify-center">
          
          <div className="text-center mb-10">
            
            <div className="w-20 h-20 mx-auto mb-6 perspective-1000">
              <div className="relative w-full h-full animate-card-flip preserve-3d">
                
                <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/10">
                  <HarmonyLogo className="w-12 h-12" />
                </div>
                
                <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/10 rotate-y-180 text-indigo-600">
                  {step === 1 ? <User size={36} strokeWidth={2.5} /> : <ShieldCheck size={36} strokeWidth={2.5} />}
                </div>

              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              {step === 1 ? 'Create Account' : 'Verify your email'}
            </h2>
            <p className="text-gray-500 font-medium">
              {step === 1 ? 'Join the event management platform' : `We sent a code to ${formData.email}`}
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm mb-6 shadow-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text" name="firstName" required value={formData.firstName} onChange={handleChange}
                      readOnly 
                      onFocus={(e) => e.target.removeAttribute('readonly')} 
                      autoComplete="off"
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium bg-white shadow-sm"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text" name="lastName" required value={formData.lastName} onChange={handleChange}
                    readOnly 
                    onFocus={(e) => e.target.removeAttribute('readonly')} 
                    autoComplete="off"
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium bg-white shadow-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email" name="email" required value={formData.email} onChange={handleChange}
                    readOnly 
                    onFocus={(e) => e.target.removeAttribute('readonly')} 
                    autoComplete="off"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium bg-white shadow-sm"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange}
                    readOnly 
                    onFocus={(e) => e.target.removeAttribute('readonly')} 
                    autoComplete="off"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium bg-white shadow-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-700 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4 mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.length ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    <span className={passwordRules.length ? 'text-gray-900 font-medium' : 'text-gray-500'}>At least 8 characters long</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.uppercase ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    <span className={passwordRules.uppercase ? 'text-gray-900 font-medium' : 'text-gray-500'}>Contains 1 uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.number ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    <span className={passwordRules.number ? 'text-gray-900 font-medium' : 'text-gray-500'}>Contains 1 number</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.special ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    <span className={passwordRules.special ? 'text-gray-900 font-medium' : 'text-gray-500'}>Contains 1 special character</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                    readOnly 
                    onFocus={(e) => e.target.removeAttribute('readonly')} 
                    autoComplete="off"
                    className={`block w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all text-gray-900 font-medium bg-white shadow-sm ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword 
                        ? 'border-red-300 focus:ring-red-200 bg-red-50 text-red-900' 
                        : 'border-gray-200 focus:ring-indigo-500'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-700 transition"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">I am an...</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="role" value={formData.role} onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium bg-white shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="Attendee">Attendee (I want to go to events)</option>
                    <option value="Organizer">Organizer (I want to host events)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit" disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-6 flex justify-center"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Create Account'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">Enter Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="block w-full text-center tracking-[0.75em] text-3xl py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-extrabold transition-all text-gray-900 bg-white shadow-sm outline-none"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} 
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Verify & Continue'}
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600 transition"
                >
                  Go back and fix email
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <p className="text-center text-sm font-medium text-gray-600 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                Log In
              </Link>
            </p>
          )}

        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 text-center transform transition-all scale-100 opacity-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Verified!</h2>
            <p className="text-gray-500 font-medium mb-8">
              Your email has been successfully verified. You can now log into your account.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
