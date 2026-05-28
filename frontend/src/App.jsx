import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword'; 
import Navbar from './components/Navbar';

import Home from './pages/attendee/Home'; 
import EventDetails from './pages/attendee/EventDetails';
import MyTickets from './pages/attendee/MyTickets';
import Profile from './components/Profile'; // 🌟 NEW: Import the Profile component (adjust path if needed)

import DashboardLayout from './components/DashboardLayout';
import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import Attendees from './pages/organizer/Attendees';
import ScannerPage from './pages/organizer/Scanner';

import AdminLayout from './components/AdminLayout';
import ManageUsers from './pages/admin/ManageUsers';
import Reports from './pages/admin/Reports';
import AdminCreateEvent from './pages/admin/CreateEvent'; 
import AdminDashboard from './pages/admin/AdminDashboard';

// 🌟 BULLETPROOF NAVBAR HIDER
function AppContent() {
  const location = useLocation();
  
  // We force the URL to lowercase so "/Signup", "/SIGNUP", and "/signup" all work!
  const currentPath = location.pathname.toLowerCase();
  
  // 🌟 FIX: Added '/organizer' and '/admin' so the global navbar hides on dashboards too!
  const hideNavbar = currentPath.includes('/login') || 
                     currentPath.includes('/signup') || 
                     currentPath.includes('/register') || 
                     currentPath.includes('/forgot-password') ||
                     currentPath.includes('/organizer') || 
                     currentPath.includes('/admin');

  return (
    <>
      {/* If it's an auth page OR a dashboard, hide it completely! */}
      {!hideNavbar && <Navbar />}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> 

        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/profile" element={<Profile />} /> {/* 🌟 NEW: Profile Route */}

        <Route path="/organizer" element={<DashboardLayout />}>
          <Route index element={<OrganizerDashboard />} />
          <Route path="create" element={<CreateEvent />} />
          <Route path="attendees" element={<Attendees />} />
        </Route>
        <Route path="/organizer/scan" element={<ScannerPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="create" element={<AdminCreateEvent />} /> 
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}