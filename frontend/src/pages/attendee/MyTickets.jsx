import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Calendar, MapPin, Ticket, Clock, CheckCircle2, Search, History, X, XCircle } from 'lucide-react'; // 🌟 FIX: Added XCircle
import { QRCodeCanvas } from 'qrcode.react';
import PageLoader from '../../components/PageLoader'; 

export default function MyTickets() {
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); 
  const [selectedQr, setSelectedQr] = useState(null); 

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const fetchMyTickets = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [eventsRes, attendeesRes] = await Promise.all([
        api.get('/events'),
        api.get('/attendees')
      ]);
      
      if (user?.email) {
        const myActiveTickets = attendeesRes.data.filter(
          a => a.email === user.email && a.status !== 'Cancelled'
        );
        
        const myEventIds = myActiveTickets.map(t => String(t.eventId));
        const myDetailedEvents = eventsRes.data.filter(e => myEventIds.includes(String(e.id)));
        
        setEvents(myDetailedEvents);
        setMyTickets(myActiveTickets);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      if (!silent) setTimeout(() => setLoading(false), 500);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user) {
      fetchMyTickets();
      const interval = setInterval(() => fetchMyTickets(true), 15000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [fetchMyTickets, user]);

  const upcomingEvents = events.filter(e => e.status === 'Published');
  const pastEvents = events.filter(e => e.status === 'Completed' || e.isArchived);
  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  const formatDateTime = (dateStr, timeStr) => {
    try {
      const dateObj = new Date(dateStr);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      let formattedTime = timeStr;
      if (timeStr) {
          const [hours, minutes] = timeStr.split(':');
          const h = parseInt(hours, 10);
          const ampm = h >= 12 ? 'PM' : 'AM';
          formattedTime = `${h % 12 || 12}:${minutes} ${ampm}`;
      }
      return `${formattedDate} • ${formattedTime}`;
    } catch { return `${dateStr} • ${timeStr}`; }
  };

  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return ''; }
  };

  // 🌟 SMART LOGIC: Check if this user missed the event!
  const getTicketStatus = (ticket, event) => {
    if (ticket.status === 'Cancelled') return 'Cancelled';
    if (ticket.status === 'Checked In') return 'Checked In';

    const eventStart = new Date(`${event.date}T${event.time || '00:00:00'}`);
    const noShowTime = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000); // 4 hours after start

    if (new Date() >= noShowTime) {
      return 'No Show';
    }
    return 'Ready';
  };

  return (
    <PageLoader isLoading={loading} message="Fetching your tickets...">
      <div className="min-h-screen bg-slate-50/50 font-sans pb-20 relative">
        
        {/* HEADER SECTION */}
        <div className="bg-white border-b border-gray-200/80 pt-10 pb-8 px-6 mb-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">My Tickets</h1>
                <p className="text-slate-500 font-medium">Manage your upcoming experiences and view past events.</p>
              </div>
              <Link to="/" className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
                <Search size={18} /> Browse More Events
              </Link>
            </div>

            {/* TAB TOGGLE SYSTEM */}
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'upcoming' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Ticket size={18} /> Upcoming ({upcomingEvents.length})
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'past' 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <History size={18} /> Past Events ({pastEvents.length})
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6">
          {!loading && displayedEvents.length === 0 ? (
            <div className="text-center bg-white p-16 rounded-3xl border border-slate-200 shadow-sm mt-8 animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === 'upcoming' ? (
                  <Ticket size={40} className="text-slate-400" />
                ) : (
                  <History size={40} className="text-slate-400" />
                )}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950 mb-3 tracking-tight">
                {activeTab === 'upcoming' ? "No upcoming events" : "No past events yet"}
              </h3>
              <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
                {activeTab === 'upcoming' 
                  ? "You haven't registered for any future events yet. Explore the platform to find your next adventure!"
                  : "Once you attend an event and it is completed, it will show up here as a memory."}
              </p>
              {activeTab === 'upcoming' && (
                <Link to="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-sm font-extrabold hover:bg-blue-700 transition-all shadow-md active:scale-95">
                  Explore Events
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {displayedEvents.map((event) => {
                const userTicket = myTickets.find(t => String(t.eventId) === String(event.id));
                const ticketStatus = getTicketStatus(userTicket, event); // 🌟 Runs our new dynamic check!

                return (
                  <div key={event.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col hover:-translate-y-1">
                    
                    <div className="h-48 relative overflow-hidden shrink-0 bg-slate-100">
                      {event.imageUrl || event.bannerUrl ? (
                        <img src={event.imageUrl || event.bannerUrl} alt={event.title} className={`w-full h-full object-cover transition-transform duration-700 ease-in-out ${activeTab === 'upcoming' ? 'group-hover:scale-105' : 'grayscale'}`} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900"></div>
                      )}
                      
                      <div className="absolute top-4 right-4 flex gap-2">
                        {/* 🌟 Dynamic Status Badges */}
                        {ticketStatus === 'Checked In' && (
                          <span className="px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-extrabold rounded-lg shadow-sm flex items-center gap-1">
                            <CheckCircle2 size={12} /> Checked In
                          </span>
                        )}
                        {ticketStatus === 'No Show' && (
                          <span className="px-3 py-1.5 bg-red-600/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-extrabold rounded-lg shadow-sm flex items-center gap-1">
                            <XCircle size={12} /> No Show
                          </span>
                        )}
                        {ticketStatus === 'Ready' && activeTab === 'upcoming' && (
                          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] uppercase tracking-widest font-extrabold rounded-lg shadow-sm">
                            Ready
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-2xl font-black text-slate-950 mb-4 line-clamp-2 leading-tight tracking-tight">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-3 text-slate-500 mb-6 flex-1">
                        <div className="flex items-start gap-3 text-sm font-medium">
                          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500 mt-0.5"><Calendar size={16} /></div>
                          <span className="text-slate-700 leading-snug">{formatDateTime(event.date, event.time)}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm font-medium">
                          <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500 mt-0.5"><MapPin size={16} /></div>
                          <span className="text-slate-700 leading-snug line-clamp-2">{event.location}</span>
                        </div>
                      </div>

                      {/* 🌟 QR CODE BOX */}
                      <div 
                        onClick={() => {
                          if (ticketStatus === 'No Show') return; // Disable clicks if they missed it
                          if (userTicket?.ticketId) setSelectedQr(userTicket.ticketId);
                        }}
                        className={`mb-6 p-4 rounded-2xl border transition-all group ${
                          ticketStatus === 'No Show'
                            ? 'bg-red-50 border-red-100 opacity-80 cursor-not-allowed'
                            : userTicket?.ticketId 
                              ? 'bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer' 
                              : 'bg-slate-50 border-slate-100 opacity-70'
                        }`}
                        title={ticketStatus === 'No Show' ? "Event Missed" : userTicket?.ticketId ? "Click to view QR Code" : "Processing ticket..."}
                      >
                         <div className="flex items-center justify-between">
                            <div>
                               <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${ticketStatus === 'No Show' ? 'text-red-400' : 'text-slate-400'}`}>Ticket ID</span>
                               <span className={`text-sm font-extrabold font-mono tracking-wider ${ticketStatus === 'No Show' ? 'text-red-700 line-through' : userTicket?.ticketId ? 'text-slate-900 group-hover:text-blue-700' : 'text-slate-500'}`}>
                                 {userTicket?.ticketId || 'PROCESSING...'}
                               </span>
                            </div>
                            
                            {/* Checked In Time vs Missed Event Icon */}
                            {ticketStatus === 'Checked In' && userTicket?.checkedInAt ? (
                              <div className="text-right">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Scanned At</span>
                                <span className="text-xs font-bold text-slate-700">{formatTimeOnly(userTicket.checkedInAt)}</span>
                              </div>
                            ) : ticketStatus === 'No Show' ? (
                               <div className="p-2 text-red-500">
                                 <XCircle size={20} />
                               </div>
                            ) : (
                              <div className={`p-2 rounded-xl transition-transform ${userTicket?.ticketId ? 'bg-white shadow-sm border border-slate-200 group-hover:scale-110 group-hover:text-blue-600' : 'text-slate-300'}`}>
                                <Ticket size={20} />
                              </div>
                            )}
                         </div>
                      </div>

                      <div className="mt-auto pt-2">
                        <Link 
                          to={`/event/${event.id}`} 
                          className="w-full block text-center px-6 py-3 rounded-xl text-sm font-black transition-all active:scale-95 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
                        >
                          View Details
                        </Link>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* The QR Code Popup Modal */}
        {selectedQr && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
            onClick={() => setSelectedQr(null)} 
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-in zoom-in-95 duration-300" 
              onClick={e => e.stopPropagation()} 
            >
              <button 
                onClick={() => setSelectedQr(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
              
              <h3 className="text-2xl font-black text-slate-900 mb-1">Your E-Ticket</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">Present this QR code at the entrance</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block border-2 border-slate-100 mb-6 shadow-sm">
                <QRCodeCanvas
                  value={selectedQr}
                  size={192}
                  level="M"
                  includeMargin
                />
              </div>
              <div className="bg-blue-50 text-blue-700 py-3 px-4 rounded-xl font-mono font-bold tracking-widest border border-blue-100">
                {selectedQr}
              </div>
            </div>
          </div>
        )}

      </div>
    </PageLoader>
  );
}
