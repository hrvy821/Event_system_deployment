import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, BarChart3, LogOut, Calendar, Menu } from 'lucide-react'; 
import NotificationBell from './NotificationBell';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // 🌟 FIX: Set to FALSE so the sidebar is hidden and dashboard is MAX layout by default!
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-gray-50/50 font-sans overflow-hidden">
      {isSidebarOpen && (
        <button
          className="fixed inset-0 bg-slate-950/40 z-10 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      
      {/* 🌟 BULLETPROOF SIDEBAR: Completely collapses to 0px width when closed */}
      <aside 
        className={`bg-slate-950 text-slate-300 flex flex-col z-20 shadow-2xl transition-all duration-300 ease-in-out shrink-0 overflow-hidden fixed lg:static inset-y-0 left-0 ${
          isSidebarOpen ? 'w-72 border-r border-slate-800 opacity-100 translate-x-0' : 'w-0 border-r-0 opacity-0 -translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="w-72 flex flex-col h-full">
          {/* Brand / Logo Area */}
          <div className="h-20 px-8 border-b border-slate-800/60 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-white tracking-tight leading-tight">Admin Portal</span>
              <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Harmony Events</span>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            <Link 
              to="/admin" 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                location.pathname === '/admin' || location.pathname === '/admin/'
                  ? 'bg-blue-500/10 text-blue-400 shadow-inner border-l-2 border-blue-500' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
              }`}
            >
              <Calendar size={18} strokeWidth={location.pathname === '/admin' ? 2.5 : 2} className="shrink-0" />
              <span>All Events</span>
            </Link>
            
            <Link 
              to="/admin/users" 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                location.pathname === '/admin/users' 
                  ? 'bg-blue-500/10 text-blue-400 shadow-inner border-l-2 border-blue-500' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
              }`}
            >
              <Users size={18} strokeWidth={location.pathname === '/admin/users' ? 2.5 : 2} className="shrink-0" />
              <span>Manage Users</span>
            </Link>
            
            <Link 
              to="/admin/reports" 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                location.pathname === '/admin/reports' 
                  ? 'bg-blue-500/10 text-blue-400 shadow-inner border-l-2 border-blue-500' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
              }`}
            >
              <BarChart3 size={18} strokeWidth={location.pathname === '/admin/reports' ? 2.5 : 2} className="shrink-0" />
              <span>Reports & Stats</span>
            </Link>
          </nav>

          {/* Logout Area */}
          <div className="p-4 border-t border-slate-800/60 shrink-0">
            <button 
              onClick={() => setShowLogoutModal(true)} 
              className="flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all w-full text-left font-bold text-sm cursor-pointer"
            >
              <LogOut size={18} className="shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 w-full">
        
        {/* TOP HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-8 flex items-center justify-between z-10 sticky top-0 shrink-0">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm active:scale-95 cursor-pointer"
              title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>

            {/* Branding smoothly appears when sidebar is closed so you know you are in Admin */}
            {!isSidebarOpen && (
               <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                 <ShieldCheck className="text-blue-600 w-6 h-6" strokeWidth={2.5} />
                 <span className="font-extrabold text-gray-900 tracking-tight text-lg hidden sm:block">Admin Portal</span>
               </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            
            <NotificationBell />
            
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 py-1.5 pl-3 sm:pl-4 pr-1.5 rounded-full shadow-sm">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-extrabold text-gray-900 leading-none">{user.name || 'System Admin'}</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5 tracking-wider">Admin</span>
              </div>
              <div className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-sm">
                <ShieldCheck size={18} strokeWidth={2.5} />
              </div>
            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth w-full">
          <Outlet />
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200 transform scale-100">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-50 border-8 border-red-100/50 text-red-600">
              <LogOut size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold mb-2 text-gray-900">Confirm Logout</h2>
            <p className="text-gray-500 font-medium mb-8">Are you sure you want to end your session?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-600/20 active:scale-[0.98] cursor-pointer">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
