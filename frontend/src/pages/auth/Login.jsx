import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { Mail, Lock, AlertCircle, KeyRound, LogIn, Eye, EyeOff } from 'lucide-react';
import HarmonyLogo from '../../components/HarmonyLogo'; 

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ==========================================
  // SLIDESHOW LOGIC
  // ==========================================
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=2070&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=2070&auto=format&fit=crop"  
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [images.length]);

  // ==========================================
  // FORM LOGIC
  // ==========================================
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [reactivateModal, setReactivateModal] = useState({ show: false, email: '', otp: '', loading: false });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const userParam = queryParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        sessionStorage.removeItem('hasSeenWelcome');

        if (user.role === 'Admin') navigate('/admin');
        else if (user.role === 'Organizer') navigate('/organizer');
        else navigate('/');
      } catch (error) {
        setErrorMessage("Failed to complete Google login. Please try again.");
      }
    }
  }, [location.search, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(''); 

    try {
      const response = await api.post('/auth/login', formData);
      const { access_token, user } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      sessionStorage.removeItem('hasSeenWelcome');

      if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Organizer') navigate('/organizer');
      else navigate('/');

    } catch (error) {
      if (error.response?.data?.message === 'INACTIVE_ACCOUNT') {
        try {
          await api.post('/auth/reactivate/send', { email: formData.email });
          setReactivateModal({ show: true, email: formData.email, otp: '', loading: false });
        } catch (mailError) {
          setErrorMessage("Account is inactive, but we failed to send the verification email.");
        }
      } else {
        setErrorMessage("Invalid Email or Password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateSubmit = async (e) => {
    e.preventDefault();
    setReactivateModal(prev => ({ ...prev, loading: true }));
    setErrorMessage('');

    try {
      const response = await api.post('/auth/reactivate/verify', {
        email: reactivateModal.email,
        otp: reactivateModal.otp
      });

      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      setReactivateModal({ show: false, email: '', otp: '', loading: false });

      if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Organizer') navigate('/organizer');
      else navigate('/');

    } catch (error) {
      setErrorMessage("Invalid or expired OTP. Please try again.");
      setReactivateModal(prev => ({ ...prev, loading: false }));
    }
  };

  // 🌟 FIX: Determine if the input type should be 'text' (for admin) or 'email'
  const isInputAdmin = formData.email.trim().toLowerCase() === 'admin';

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

      {/* LEFT SIDE: Fixed Image Slideshow */}
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
              Create unforgettable experiences.
            </h1>
            <p className="text-lg text-gray-200 font-medium drop-shadow-md">
              Join Harmony Events to discover, manage, and scale the best events around the world.
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

      {/* RIGHT SIDE: Beautiful Airy Light Theme */}
      <div className="w-full lg:w-[45%] h-full flex flex-col relative bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 z-30 shadow-[-25px_0_50px_-12px_rgba(0,0,0,0.6)]">
        <div className="flex-1 w-full max-w-md mx-auto py-12 px-8 sm:px-4 flex flex-col justify-center">
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 perspective-1000">
              <div className="relative w-full h-full animate-card-flip preserve-3d">
                
                {/* FRONT FACE: New Harmony Logo */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/10">
                  <HarmonyLogo className="w-12 h-12" />
                </div>
                
                {/* BACK FACE: LogIn Icon */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/10 rotate-y-180 text-indigo-600">
                  <LogIn size={36} strokeWidth={2.5} />
                </div>

              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 font-medium">Please login to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && !reactivateModal.show && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={18} />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                {/* 🌟 FIX: Dynamic type attribute allows "admin" to bypass HTML email validation */}
                <input
                  type={isInputAdmin ? "text" : "email"}
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
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
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  readOnly 
                  onFocus={(e) => e.target.removeAttribute('readonly')} 
                  autoComplete="off" 
                  className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium bg-white shadow-sm"
                  placeholder="password"
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
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-600 mt-8">
            Don't have an account?{' '}
            <Link to="/Signup" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign Up
            </Link>
          </p>

        </div>
      </div>

      {/* REACTIVATION MODAL */}
      {reactivateModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-orange-500">
              <KeyRound size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Account Inactive</h2>
            <p className="text-gray-600 text-sm mb-6">
              Your account has been archived. We just sent a 6-digit code to <strong>{reactivateModal.email}</strong> to verify your identity and reactivate your account.
            </p>

            {errorMessage && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-4 border border-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleReactivateSubmit}>
              <input
                type="text"
                maxLength="6"
                required
                placeholder="Enter 6-digit OTP"
                className="w-full text-center tracking-widest text-2xl font-bold py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-orange-500 outline-none"
                value={reactivateModal.otp}
                onChange={(e) => setReactivateModal({ ...reactivateModal, otp: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReactivateModal({ show: false, email: '', otp: '', loading: false })}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reactivateModal.loading}
                  className="flex-1 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {reactivateModal.loading ? 'Verifying...' : 'Reactivate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
