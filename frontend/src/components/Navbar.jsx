import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react'; 
import NotificationBell from './NotificationBell'; 
import HarmonyLogo from './HarmonyLogo'; 

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // 🌟 NEW: Track scroll position state
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 🌟 NEW: Listen to window scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get the saved avatar or generate the initials avatar
  const displayAvatar = user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=2563eb`;

  return (
    <nav 
      className={`sticky top-0 z-50 w-full font-sans transition-all duration-300 ${
        isScrolled 
          ? 'bg-[rgba(255,255,255,0.7)] backdrop-blur-[12px] border-b border-[rgba(99,102,241,0.08)] shadow-[0_6px_20px_rgba(0,0,0,0.06)]' 
          : 'bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm'
      }`}
    >
      
      {/* 🌟 INJECTED SLOW 3D FLIP CSS */}
      <style>{`
        @keyframes slow-flip {
          0%, 15% { transform: rotateY(0deg); }
          45%, 65% { transform: rotateY(180deg); }
          95%, 100% { transform: rotateY(360deg); }
        }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .animate-slow-flip {
          animation: slow-flip 10s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto px-6">
        <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-16' : 'h-20'}`}>
          
          {/* 🌟 UPGRADED: Left Side Premium Custom Logo with 3D Flip */}
          <Link to="/" className="flex items-center gap-3 group perspective-1000">
            <div className="w-11 h-11 relative animate-slow-flip preserve-3d group-hover:scale-110 transition-transform duration-300">
              
              {/* FRONT FACE */}
              <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center">
                <HarmonyLogo className="w-11 h-11 drop-shadow-md" />
              </div>
              
              {/* BACK FACE (Same logo so it looks like a solid, 2-sided coin!) */}
              <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center rotate-y-180">
                <HarmonyLogo className="w-11 h-11 drop-shadow-md" />
              </div>

            </div>
            
            <div className="hidden sm:block leading-tight">
              <span className="block font-extrabold text-xl text-gray-900 tracking-tight">Harmony Events</span>
              <span className="block text-[10px] text-gray-500 font-bold tracking-widest mt-0.5">PLATFORM</span>
            </div>
          </Link>

          {/* Right Side: Auth / Profile */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-full p-1 flex items-center">
                  <NotificationBell />
                </div>

                <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                {/* Profile Pill with Dynamic Picture */}
                <Link 
                  to="/profile" 
                  className="hidden sm:flex items-center gap-3 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all py-1.5 pl-1.5 pr-5 rounded-full shadow-sm cursor-pointer active:scale-95 group"
                  title="Edit Profile"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-blue-100 shadow-inner shrink-0 group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                    <img src={displayAvatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-extrabold text-gray-900 leading-none group-hover:text-blue-700 transition-colors">{user.name || 'User'}</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5 tracking-wider">{user.role || 'ATTENDEE'}</span>
                  </div>
                </Link>
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 px-4 py-2.5 rounded-full sm:rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                  title="Logout"
                >
                  <LogOut size={18} strokeWidth={2.5} />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Logged Out Buttons */}
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition px-4 py-2">
                  Sign In
                </Link>
                <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95">
                  Get Started
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}