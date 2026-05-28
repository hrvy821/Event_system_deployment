import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Users, ScanLine, LogOut, User } from 'lucide-react';
import NotificationBell from './NotificationBell'; 
import HarmonyLogo from './HarmonyLogo'; // 🌟 Added Logo Import

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/organizer', icon: LayoutDashboard },
    { name: 'Create Event', path: '/organizer/create', icon: PlusCircle },
    { name: 'Attendees', path: '/organizer/attendees', icon: Users },
    { name: 'Scan Tickets', path: '/organizer/scan', icon: ScanLine },
  ];

  // Get the saved avatar or generate the initials avatar
  const displayAvatar = user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=2563eb`;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      
      {/* 🌟 INJECTED SLOW 3D FLIP CSS for Logo */}
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

      {/* 🌟 PREMIUM ORGANIZER NAVBAR WITH GLASSMORPHISM */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo Section */}
            <div className="flex items-center gap-12">
              <Link to="/" className="flex items-center gap-3 group perspective-1000">
                {/* 🌟 Premium Animated Logo Injection */}
                <div className="w-11 h-11 relative animate-slow-flip preserve-3d group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center">
                    <HarmonyLogo className="w-11 h-11 drop-shadow-md" />
                  </div>
                  <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center rotate-y-180">
                    <HarmonyLogo className="w-11 h-11 drop-shadow-md" />
                  </div>
                </div>
                
                <div>
                  <span className="block font-extrabold text-xl text-gray-900 leading-none tracking-tight">Harmony Events</span>
                  <span className="block text-[10px] text-gray-500 font-bold tracking-widest mt-0.5">PLATFORM</span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1.5 bg-gray-100/50 p-1 rounded-2xl border border-gray-200/60">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 font-bold text-sm ${
                        isActive 
                          ? 'bg-white text-blue-700 shadow-sm border border-gray-200/50' 
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 border border-transparent'
                      }`}
                    >
                      <link.icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile & Notifications Section */}
            <div className="flex items-center gap-4">
              
              <div className="bg-white border border-gray-200 shadow-sm rounded-full p-1 flex items-center">
                <NotificationBell />
              </div>

              <div className="h-8 w-px bg-gray-200 mx-2"></div>

              {/* Polished Profile Chip */}
              <Link 
                to="/profile" 
                className="flex items-center gap-3 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all py-1.5 pl-1.5 pr-5 rounded-full shadow-sm cursor-pointer active:scale-95 group"
                title="Edit Profile"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-blue-100 shadow-inner shrink-0 group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                  <img src={displayAvatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-gray-900 leading-none group-hover:text-blue-700 transition-colors">{user?.name || 'User'}</span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5 tracking-wider">{user?.role || 'ORGANIZER'}</span>
                </div>
              </Link>

              <button 
                onClick={() => setShowLogoutModal(true)} 
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100 ml-1" 
                title="Logout"
              >
                <LogOut size={18} strokeWidth={2.5} />
              </button>

            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8">
        <Outlet />
      </main>

      {/* Logout Modal for Organizer */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200 transform scale-100">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-50 border-8 border-red-100/50 text-red-600">
              <LogOut size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold mb-2 text-gray-900">Confirm Logout</h2>
            <p className="text-gray-500 font-medium mb-8">Are you sure you want to log out of your Organizer account?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-600/20 active:scale-[0.98]">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}