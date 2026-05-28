import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Calendar, MapPin, Search, Ticket, CheckCircle2, Sparkles, Flame, 
  ArrowRight, TrendingUp, Users, Zap, Filter, Compass, Star, PartyPopper
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';

const getCategoryStyle = (category) => {
  const lowerCat = category?.toLowerCase() || '';
  if (lowerCat.includes('nightlife') || lowerCat.includes('party')) return 'from-slate-900 to-indigo-950';
  if (lowerCat.includes('tech') || lowerCat.includes('conference')) return 'from-gray-900 to-slate-800';
  if (lowerCat.includes('concert') || lowerCat.includes('music')) return 'from-zinc-900 to-stone-800';
  if (lowerCat.includes('festival') || lowerCat.includes('expo')) return 'from-emerald-950 to-teal-900';
  if (lowerCat.includes('theater') || lowerCat.includes('comedy')) return 'from-slate-800 to-gray-900';
  if (lowerCat.includes('sport')) return 'from-orange-950 to-amber-950';
  if (lowerCat.includes('workshop') || lowerCat.includes('masterclass')) return 'from-violet-950 to-fuchsia-950';
  return 'from-slate-800 to-slate-900';
};

const getCategoryIcon = (category) => {
  const lowerCat = category?.toLowerCase() || '';
  if (lowerCat.includes('concert') || lowerCat.includes('music')) return '🎵';
  if (lowerCat.includes('festival') || lowerCat.includes('expo')) return '🎉';
  if (lowerCat.includes('sport')) return '🏅';
  if (lowerCat.includes('workshop') || lowerCat.includes('masterclass')) return '🧠';
  if (lowerCat.includes('conference') || lowerCat.includes('tech')) return '💡';
  return '✨';
};

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

const EventCard = ({ event, featured = false, isGoing, soldCount }) => {
  const capacity = Number(event.capacity) || 0;
  const percentSold = capacity > 0 ? Math.min(100, Math.round((soldCount / capacity) * 100)) : 0;
  const isSoldOut = capacity > 0 && soldCount >= capacity;
  const isSellingFast = capacity > 0 && capacity - soldCount <= 10 && !isSoldOut;
  const isFree = !event.price || String(event.price).trim() === '' || String(event.price).trim() === '0' || String(event.price).toLowerCase() === 'free';

  const progressColor = percentSold >= 90 ? 'bg-rose-500' : percentSold >= 60 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 overflow-hidden group flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${featured ? 'shadow-lg' : 'shadow-sm'}`}>
      <div className="h-56 relative overflow-hidden shrink-0 bg-slate-100">
        {event.imageUrl || event.bannerUrl ? (
          <img src={event.imageUrl || event.bannerUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getCategoryStyle(event.category)}`}></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent"></div>

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] uppercase tracking-widest font-extrabold rounded-lg shadow-sm">
            {event.category?.split('/')[0] || 'General'}
          </span>
          {isSoldOut && (
            <span className="px-3 py-1.5 bg-red-600/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-extrabold rounded-lg shadow-sm">Sold Out</span>
          )}
          {!isSoldOut && isSellingFast && (
            <span className="px-3 py-1.5 bg-amber-500/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-extrabold rounded-lg shadow-sm">Almost Full</span>
          )}
          {!isSoldOut && percentSold < 50 && (
            <span className="px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-extrabold rounded-lg shadow-sm">Available</span>
          )}
        </div>

        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <Link to={`/event/${event.id}`} className="px-3 py-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 text-xs font-extrabold shadow-sm">
            Quick View
          </Link>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Users size={14} className="text-blue-500" /> {soldCount} people going
          </span>
          <span className="text-[11px] font-bold text-slate-400 truncate max-w-[130px] text-right" title={event.organizer?.name || 'Harmony Events'}>
            by {event.organizer?.name || event.organizerName || 'Harmony Events'}
          </span>
        </div>

        <h3 className="text-2xl font-black text-slate-950 mb-4 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors tracking-tight">{event.title}</h3>

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

        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-none">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration</span>
            <span className="text-xs font-extrabold text-slate-700">{soldCount} {capacity > 0 ? `/ ${capacity}` : 'registered'}</span>
          </div>
          <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all duration-700 ${capacity > 0 ? progressColor : 'bg-slate-400'}`} style={{ width: capacity > 0 ? `${percentSold}%` : '100%' }}></div>
          </div>
          <div className="h-4 mt-1">
            {isSellingFast && (
              <p className="text-[10px] font-black text-rose-600 flex items-center gap-1 uppercase tracking-wider animate-pulse">
                <Flame size={14} /> Only {capacity - soldCount} spots left!
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-auto pt-2 gap-3">
          {isGoing ? (
            <span className="flex items-center gap-1.5 font-extrabold text-sm bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)] border border-emerald-100 tracking-wide">
              <CheckCircle2 size={18} strokeWidth={2.5} /> You're Going!
            </span>
          ) : (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starts at</span>
              <span className="font-black text-2xl text-slate-950 tracking-tight leading-none">{isFree ? 'FREE' : `₱${event.price}`}</span>
            </div>
          )}
          <Link to={`/event/${event.id}`} className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm ${isGoing ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30'}`}>
            View Event <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};


export default function Home() {
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!(user && token);

  const [isFirstLogin] = useState(() => !sessionStorage.getItem('hasSeenWelcome'));

  const fetchHomeData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      
      const eventsRes = await api.get('/events');
      setEvents(eventsRes.data);

      if (isLoggedIn && user?.email) {
        const attendeesRes = await api.get('/attendees');
        const myTix = attendeesRes.data.filter((a) => a.email === user.email && a.status !== 'Cancelled');
        setMyRegistrations(myTix.map((t) => String(t.eventId)));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [isLoggedIn, user?.email]);

  useEffect(() => {
    if (isFirstLogin) sessionStorage.setItem('hasSeenWelcome', 'true');
    
    fetchHomeData(true); 
    
    const interval = setInterval(() => { fetchHomeData(false); }, 15000);
    return () => clearInterval(interval);
  }, [fetchHomeData, isFirstLogin]);

  const publishedEvents = useMemo(() => {
    return events.filter((e) => !e.isArchived && e.status === 'Published');
  }, [events]);

  const categories = useMemo(() => {
    return ['All', ...new Set(publishedEvents.map((e) => e.category).filter(Boolean))];
  }, [publishedEvents]);

  const activeEventsCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return publishedEvents.filter(event => event.date >= today).length;
  }, [publishedEvents]);

  const totalRegistrations = useMemo(() => {
    return publishedEvents.reduce((sum, event) => sum + (Number(event.ticketsSold) || 0), 0);
  }, [publishedEvents]);

  const filteredEvents = useMemo(() => {
    return publishedEvents.filter((event) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = event.title?.toLowerCase().includes(search) || event.location?.toLowerCase().includes(search) || event.category?.toLowerCase().includes(search);
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [publishedEvents, searchTerm, selectedCategory]);

  const myUpcomingEvents = filteredEvents.filter((event) => myRegistrations.includes(String(event.id)));

  const trendingEvents = useMemo(() => {
    return [...publishedEvents]
      .sort((a, b) => (Number(b.ticketsSold) || 0) - (Number(a.ticketsSold) || 0))
      .slice(0, 3);
  }, [publishedEvents]);

  const recommendedEvents = useMemo(() => {
    if (selectedCategory !== 'All') return publishedEvents.filter((e) => e.category === selectedCategory).slice(0, 3);
    return publishedEvents.slice(0, 3);
  }, [publishedEvents, selectedCategory]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const pageContent = (
    <div className="min-h-screen bg-slate-50/60 font-sans pb-20">
      <div className="relative overflow-hidden bg-white border-b border-gray-200/80 pt-16 pb-20 px-4 sm:px-6 mb-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-90px] left-[10%] w-80 h-80 bg-blue-300/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-[-70px] right-[10%] w-80 h-80 bg-purple-300/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-110px] left-1/2 -translate-x-1/2 w-[480px] h-[240px] bg-cyan-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-wide uppercase mb-5 shadow-sm">
            <Sparkles size={14} /> Discover What’s Next
          </div>

          {/* 🌟 FIX: Personalized Greeting based on Login Status */}
          {isLoggedIn && user?.name ? (
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
              Welcome back, {user.name.split(' ')[0]}!{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Ready for your next adventure?</span>
            </h1>
          ) : (
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
              Find events happening{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">near you today.</span>
            </h1>
          )}

          <p className="text-slate-600 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
            Discover concerts, festivals, workshops, and more around your area.
          </p>

          <div className="w-full max-w-3xl mb-6">
            <div className="flex flex-col sm:flex-row gap-3 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 p-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search for events, artists, venues, or categories..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 font-medium"
                  value={searchTerm}
                  onChange={(e) => {
                     setSearchTerm(e.target.value);
                     if(e.target.value !== '') scrollToSection('explore-section');
                  }}
                />
              </div>
              <button 
                onClick={() => scrollToSection('explore-section')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20"
              >
                <Search size={18} /> Search
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
            <button onClick={() => scrollToSection('explore-section')} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95">
              <Compass size={18} /> Browse Events
            </button>
            <button onClick={() => scrollToSection('trending-section')} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold shadow-sm hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all active:scale-95">
              <TrendingUp size={18} /> Trending Now
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2 bg-white/90 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-slate-600">
              <PartyPopper size={16} className="text-purple-500" /> {activeEventsCount} active events
            </span>
            <span className="inline-flex items-center gap-2 bg-white/90 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-slate-600">
              <Users size={16} className="text-blue-500" /> {totalRegistrations} attendees
            </span>
            <span className="inline-flex items-center gap-2 bg-white/90 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-slate-600">
              <Zap size={16} className="text-amber-500" /> Live ticket tracking
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        
        {/* TRENDING SECTION */}
        {!loading && trendingEvents.length > 0 && searchTerm === '' && selectedCategory === 'All' && (
          <section id="trending-section" className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="text-rose-500" size={24} /> Trending This Week
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Most active events based on registrations</p>
              </div>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory xl:grid xl:grid-cols-3 xl:overflow-visible scrollbar-hide">
              {trendingEvents.map((event) => (
                <div key={`trending-${event.id}`} className="min-w-[310px] sm:min-w-[360px] xl:min-w-0 snap-start">
                  <EventCard event={event} featured isGoing={myRegistrations.includes(String(event.id))} soldCount={Number(event.ticketsSold) || 0} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LOGGED IN UPCOMING */}
        {isLoggedIn && myUpcomingEvents.length > 0 && searchTerm === '' && selectedCategory === 'All' && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Upcoming Events</h2>
              <Link to="/my-tickets" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-extrabold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95 group">
                <Ticket size={18} strokeWidth={2.5} className="group-hover:-rotate-12 transition-transform" /> View My Tickets
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {myUpcomingEvents.slice(0, 3).map((event) => (
                <Link to={`/event/${event.id}`} key={`upcoming-${event.id}`} className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-blue-200 transition-all group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                    {event.imageUrl || event.bannerUrl ? (
                      <img src={event.imageUrl || event.bannerUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getCategoryStyle(event.category)}`}></div>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <h4 className="font-extrabold text-slate-900 truncate">{event.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                      <Calendar size={12} className="text-blue-500" /> {formatDateTime(event.date, event.time)}
                    </div>
                    <span className="mt-2 inline-flex w-fit items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-extrabold uppercase tracking-widest rounded-md border border-emerald-100">
                      <CheckCircle2 size={12} /> Registered
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div id="explore-section" className="flex items-center justify-between mb-4 pt-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Explore Platform</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Browse by category and discover what matches your vibe</p>
          </div>
        </div>

        {/* CATEGORY FILTER */}
        {!loading && categories.length > 1 && (
          <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-xl -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 border-y border-slate-200/70">
            <div className="flex overflow-x-auto gap-3 scrollbar-hide">
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm whitespace-nowrap">
                <Filter size={16} /> <span className="font-bold text-sm">Categories</span>
              </div>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative whitespace-nowrap px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 border ${
                    selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 shadow-sm'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{cat === 'All' ? '🌐' : getCategoryIcon(cat)}</span> {cat}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RECOMMENDED SECTION */}
        {!loading && recommendedEvents.length > 0 && searchTerm === '' && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Star className="text-amber-500" size={24} /> {selectedCategory === 'All' ? 'Recommended For You' : `More in ${selectedCategory}`}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Curated events you may want to check out</p>
              </div>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible scrollbar-hide">
              {recommendedEvents.map((event) => (
                <div key={`recommended-${event.id}`} className="min-w-[310px] sm:min-w-[360px] lg:min-w-0 snap-start">
                  <EventCard event={event} isGoing={myRegistrations.includes(String(event.id))} soldCount={Number(event.ticketsSold) || 0} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ALL EVENTS GRID OR LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
                <div className="h-56 bg-slate-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-slate-200 rounded-xl w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded-lg w-2/3 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded-lg w-1/2 mb-6"></div>
                  <div className="h-20 bg-slate-100 rounded-2xl mb-6"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-10 bg-slate-200 rounded-xl w-24"></div>
                    <div className="h-11 bg-slate-200 rounded-xl w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} isGoing={myRegistrations.includes(String(event.id))} soldCount={Number(event.ticketsSold) || 0} />
            ))}

            {filteredEvents.length === 0 && (
              <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center bg-white p-16 rounded-3xl border border-slate-200 shadow-sm mt-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-950 mb-2 tracking-tight">No events found</h3>
                <p className="text-slate-500 font-medium">Try adjusting your filters or search term to find what you're looking for.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isFirstLogin) {
    return (
      <PageLoader message={user?.name ? `Welcome back, ${user.name.split(' ')[0]}...` : 'Preparing your dashboard...'}>
        {pageContent}
      </PageLoader>
    );
  }

  return pageContent;
}