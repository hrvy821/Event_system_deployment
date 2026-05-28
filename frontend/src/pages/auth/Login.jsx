import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, apiUrl } from '../../lib/api';
import { Mail, Lock, AlertCircle, KeyRound, LogIn} from 'lucide-react';
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

  const handleSocialLogin = (provider) => {
    if (provider === 'google') {
      window.location.href = apiUrl('/auth/google');
    } else {
      alert(`${provider} login clicked! You need API keys to activate this.`);
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
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  readOnly 
                  onFocus={(e) => e.target.removeAttribute('readonly')} 
                  autoComplete="off" 
                  className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium bg-white shadow-sm"
                  placeholder="••••••••"
                />
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

          <div className="mt-8 flex items-center justify-center space-x-4">
            <span className="h-px w-full bg-gray-200"></span>
            <span className="text-sm font-medium text-gray-400 whitespace-nowrap">Or continue with</span>
            <span className="h-px w-full bg-gray-200"></span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-bold text-gray-700 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button 
              type="button" 
              onClick={() => handleSocialLogin('facebook')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-bold text-gray-700 shadow-sm"
            >
              <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

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