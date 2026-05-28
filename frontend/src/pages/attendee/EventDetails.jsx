import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Share2, Calendar, Clock, MapPin, BellRing, CheckCircle2, Ticket, Map as MapIcon } from 'lucide-react';
import RegistrationModal from '../../components/RegistrationModal'; 

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); 

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isLoggedIn = !!user;

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        setEvent(response.data);

        if (isLoggedIn && user?.email) {
          // 🌟 FIX: We fetch the attendees and explicitly make sure the ticket is NOT Cancelled!
          const attendeesRes = await api.get('/attendees');
          const hasActiveTicket = attendeesRes.data.some(
            a => a.email === user.email && String(a.eventId) === String(id) && a.status !== 'Cancelled'
          );
          setIsRegistered(hasActiveTicket);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching event details:", error);
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [id, isLoggedIn, user?.email]);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold animate-pulse">Loading Event...</p>
    </div>
  );

  if (!event) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold text-xl">Event not found.</div>;

  const displayImage = event.imageUrl || event.bannerUrl;
  const isFree = event.price === '0' || event.price === 'Free' || !event.price;

  const getCategoryStyle = (category) => {
    const lowerCat = category?.toLowerCase() || '';
    if (lowerCat.includes('nightlife') || lowerCat.includes('party')) return 'from-slate-900 to-indigo-950';
    if (lowerCat.includes('tech') || lowerCat.includes('conference')) return 'from-gray-900 to-slate-800';
    if (lowerCat.includes('concert') || lowerCat.includes('music')) return 'from-zinc-900 to-stone-800';
    if (lowerCat.includes('festival') || lowerCat.includes('expo')) return 'from-emerald-950 to-teal-900';
    if (lowerCat.includes('theater') || lowerCat.includes('comedy')) return 'from-slate-800 to-gray-900';
    if (lowerCat.includes('sport')) return 'from-orange-950 to-amber-950';
    return 'from-slate-800 to-slate-900'; 
  };

  const formatDate = (dateStr) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); } 
    catch { return dateStr; }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 font-sans animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto pt-6 px-4">
        
        {/* SCALED DOWN HERO IMAGE SECTION */}
        <div className="relative h-[280px] md:h-[360px] rounded-[2rem] overflow-hidden shadow-xl shadow-blue-900/5">
          {displayImage ? (
            <img src={displayImage} alt={event.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center">
               <Ticket className="text-white/10 w-32 h-32 rotate-12" />
            </div>
          )}
          
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-5 left-5 z-10 bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>

          <button 
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Event link copied to clipboard!'); }}
            className="absolute top-5 right-5 z-10 bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg"
            title="Copy Link to Share"
          >
            <Share2 size={20} strokeWidth={2.5} />
          </button>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-90"></div>
        </div>

        {/* SCALED DOWN CONTENT CARD */}
        <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 p-6 md:p-10 -mt-10 relative z-20 mx-3 md:mx-8">
          
          <div className="flex flex-col mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg border border-blue-100">
                {event.category || "General"}
              </span>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <CheckCircle2 size={14} strokeWidth={2.5} /> Active
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-slate-950 leading-tight tracking-tight">
              {event.title}
            </h1>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date & Time</p>
                <p className="text-base font-extrabold text-slate-900 leading-snug">{formatDate(event.date)}</p>
                <p className="text-slate-500 font-bold text-sm">{event.time} PM</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-rose-200 shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                <p className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Announcement */}
          {event.announcement && (
            <div className="mb-10 relative overflow-hidden bg-amber-50 border-l-4 border-amber-400 p-6 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="bg-amber-400 text-white p-2 rounded-lg shadow-sm shrink-0">
                   <BellRing size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-amber-900 font-black uppercase text-[10px] tracking-widest mb-1.5">Important Announcement</h3>
                  <p className="text-amber-800 font-bold text-sm md:text-base leading-relaxed">{event.announcement}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                About this Event
            </h2>
            <p className="text-slate-600 font-medium text-base leading-relaxed whitespace-pre-wrap">
              {event.description || 'Join us for an unforgettable experience filled with excitement and great company! Limited slots available.'}
            </p>
          </div>
        </div>
      </div>

      {/* COMPACT STICKY CHECKOUT BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 p-4 md:p-5 z-50">
        <div className="max-w-4xl mx-auto flex flex-row justify-between items-center gap-4 px-2 sm:px-6">
          
          <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Price</p>
              <p className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight leading-none">
                  {isFree ? 'FREE' : `₱${event.price}`}
              </p>
          </div>
          
          <div className="flex-shrink-0">
            {!isLoggedIn ? (
               <button onClick={() => navigate('/login')} className="bg-slate-950 text-white px-6 md:px-10 py-3 md:py-3.5 rounded-xl font-black text-sm md:text-base hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                 Sign in to Register
               </button>
            ) : isRegistered ? (
               <Link to="/my-tickets" className="bg-emerald-500 text-white px-6 md:px-10 py-3 md:py-3.5 rounded-xl font-black text-sm md:text-base hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 active:scale-95">
                 <CheckCircle2 size={18} /> You're Going!
               </Link>
            ) : (
               <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 md:px-10 py-3 md:py-3.5 rounded-xl font-black text-sm md:text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center gap-2">
                 <Ticket size={18} strokeWidth={2.5} /> {isFree ? 'Claim Free Ticket' : 'Buy Ticket'}
               </button>
            )}
          </div>
        </div>
      </div>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); window.location.reload(); }}
        eventTitle={event.title}
        eventId={event.id}
        eventPrice={event.price} 
        organizerId={event.organizerId}
        userInfo={user}
      />
    </div>
  );
}
