import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  Plus, Archive, Settings, Calendar, MapPin, Ticket, 
  Search, Filter, Shield, User, Users, LayoutGrid, List, Eye, X,
  Clock, CheckCircle, XCircle, AlertTriangle, HelpCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]); 
  const [allAttendees, setAllAttendees] = useState([]); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); 

  const [viewMode, setViewMode] = useState('grid');
  const [attendeesModal, setAttendeesModal] = useState({ show: false, eventTitle: '', eventId: null });
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null, confirmText: '', confirmColor: '' });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [eventsRes, usersRes, attendeesRes] = await Promise.all([
        api.get('/events'),
        api.get('/users'),
        api.get('/attendees')
      ]);
      setEvents(eventsRes.data);
      setUsers(usersRes.data);
      setAllAttendees(attendeesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const getCleanPayload = (event, newStatus) => ({
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    category: event.category,
    description: event.description,
    price: event.price,
    announcement: event.announcement,
    capacity: event.capacity,
    organizerId: event.organizerId,
    imageUrl: event.imageUrl,
    status: newStatus
  });

  const executeApprove = async (event) => {
    setConfirmDialog({ show: false }); 
    try {
      const payload = getCleanPayload(event, 'Published');
      await api.put(`/events/${event.id}`, payload);
      
      await api.post('/notifications', {
        userId: event.organizerId,
        title: 'Event Approved! 🎉',
        message: `Great news! Your event "${event.title}" has been approved by the Admin and is now live.`,
        type: 'APPROVAL'
      });

      try {
        await api.post('/notifications/broadcast/attendees', {
          title: 'New Event Alert! 🎉',
          message: `Tickets are now available for "${event.title}". Get yours before they sell out!`,
          type: 'INFO'
        });
      } catch (broadcastError) {
        console.error('Failed to broadcast notification:', broadcastError);
      }

      setEvents(events.map(e => e.id === event.id ? { ...e, status: 'Published' } : e));
      setModal({ show: true, type: 'success', title: 'Event Published', message: `Notified the organizer that ${event.title} is live!` });
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Failed to approve event.' });
    }
  };

  const executeReject = async (event) => {
    setConfirmDialog({ show: false });
    try {
      const payload = getCleanPayload(event, 'Rejected');
      await api.put(`/events/${event.id}`, payload);
      
      await api.post('/notifications', {
        userId: event.organizerId,
        title: 'Event Update Required ⚠️',
        message: `Unfortunately, your event "${event.title}" was not approved. Please review our platform guidelines and edit your event details.`,
        type: 'SYSTEM'
      });

      setEvents(events.map(e => e.id === event.id ? { ...e, status: 'Rejected' } : e));
      setModal({ show: true, type: 'success', title: 'Event Rejected', message: 'The event was rejected and the organizer was notified.' });
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Failed to reject event.' });
    }
  };

  const executeArchive = async (eventId, title, isCurrentlyArchived) => {
    setConfirmDialog({ show: false });
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, isArchived: !isCurrentlyArchived } : event
      ));
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Action Failed', message: `Failed to archive event.` });
    }
  };

  const confirmApprove = (event) => setConfirmDialog({
    show: true, title: `Approve "${event.title}"?`, message: 'This will publish the event to the platform and notify the organizer.',
    confirmText: 'Yes, Publish', confirmColor: 'bg-emerald-600 hover:bg-emerald-700', onConfirm: () => executeApprove(event)
  });

  const confirmReject = (event) => setConfirmDialog({
    show: true, title: `Reject "${event.title}"?`, message: 'This will hide the event and ask the organizer to make changes.',
    confirmText: 'Yes, Reject', confirmColor: 'bg-red-600 hover:bg-red-700', onConfirm: () => executeReject(event)
  });

  const confirmArchive = (eventId, title, isCurrentlyArchived) => setConfirmDialog({
    show: true, title: `${isCurrentlyArchived ? 'Restore' : 'Archive'} "${title}"?`, 
    message: isCurrentlyArchived ? 'This will make the event visible again.' : 'This will hide the event from the platform.',
    confirmText: `Yes, ${isCurrentlyArchived ? 'Restore' : 'Archive'}`, confirmColor: 'bg-orange-500 hover:bg-orange-600', 
    onConfirm: () => executeArchive(eventId, title, isCurrentlyArchived)
  });

  const getOrganizerName = (organizerId) => {
    const org = users.find(u => String(u.id) === String(organizerId));
    return org ? org.name : 'Unknown Organizer';
  };

  const normalizeStatus = (status) => String(status || '').trim().toLowerCase();
  
  // 🌟 FIX: Updated logic to accurately catch "Pending Approval" events!
  const isPublishedEvent = (event) => !event?.isArchived && normalizeStatus(event?.status) === 'published';
  const isCompletedEvent = (event) => !event?.isArchived && normalizeStatus(event?.status) === 'completed';
  const isPendingEvent = (event) => !event?.isArchived && normalizeStatus(event?.status).includes('pending');
  const isRejectedEvent = (event) => normalizeStatus(event?.status) === 'rejected';

  const getStatusTheme = (event) => {
    if (event?.isArchived) {
      return {
        label: 'ARCHIVED',
        chip: 'bg-slate-200 text-slate-700 border border-slate-300',
        pill: 'bg-slate-900/80',
        panel: 'border-slate-200 shadow-slate-100',
      };
    }

    if (isPublishedEvent(event)) {
      return {
        label: 'PUBLISHED',
        chip: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        pill: 'bg-emerald-600/90',
        panel: 'border-emerald-200 shadow-emerald-100',
      };
    }

    if (isCompletedEvent(event)) {
      return {
        label: 'COMPLETED',
        chip: 'bg-slate-100 text-slate-700 border border-slate-200',
        pill: 'bg-slate-700/90',
        panel: 'border-slate-200 shadow-slate-100',
      };
    }

    if (isRejectedEvent(event)) {
      return {
        label: 'REJECTED',
        chip: 'bg-red-100 text-red-700 border border-red-200',
        pill: 'bg-red-600/90',
        panel: 'border-red-200 shadow-red-100',
      };
    }

    return {
      label: 'PENDING',
      chip: 'bg-amber-100 text-amber-700 border border-amber-200',
      pill: 'bg-amber-500/90',
      panel: 'border-amber-300 shadow-amber-100',
    };
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || event.category?.includes(categoryFilter);
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && isPublishedEvent(event)) || 
                          (statusFilter === 'Pending' && isPendingEvent(event)) ||
                          (statusFilter === 'Completed' && isCompletedEvent(event)) ||
                          (statusFilter === 'Rejected' && isRejectedEvent(event)) ||
                          (statusFilter === 'Archived' && event.isArchived);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const pendingCount = events.filter(e => isPendingEvent(e)).length;
  const currentEventAttendees = allAttendees.filter(a => String(a.eventId) === String(attendeesModal.eventId) && a.status !== 'Cancelled');
  const closeAttendeesModal = () => setAttendeesModal({ show: false, eventTitle: '', eventId: null });

  const getInitials = (name = '') =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U';

  if (loading) return <div className="text-gray-500 animate-pulse text-lg font-medium p-8">Loading platform events...</div>;

  return (
    <div className="pb-12 w-full transition-all duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
            All Platform Events <Shield className="text-blue-500 w-7 h-7" />
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage, approve, and monitor all platform events.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg flex items-center transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600 shadow-inner font-bold' : 'text-gray-400 hover:text-gray-700'}`} title="Grid View"><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg flex items-center transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600 shadow-inner font-bold' : 'text-gray-400 hover:text-gray-700'}`} title="List View"><List size={18} /></button>
          </div>
          <button onClick={() => navigate('/admin/create')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md shadow-blue-600/20 whitespace-nowrap active:scale-[0.98]">
            <Plus size={20} strokeWidth={2.5} /> Create Event
          </button>
        </div>
      </div>

      {/* Premium Pending Banner */}
      {pendingCount > 0 && (
        <div className="mx-2 bg-amber-50/80 border border-amber-200/60 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-amber-100/80 text-amber-600 rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-900 text-lg">Action Required</h3>
              <p className="text-sm text-amber-700 font-medium">You have <strong className="text-amber-900 bg-amber-200/50 px-2 py-0.5 rounded-md mx-1">{pendingCount}</strong> new event proposal(s) waiting for review.</p>
            </div>
          </div>
          <button 
            onClick={() => setStatusFilter('Pending')}
            className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap active:scale-95"
          >
            Review Pending
          </button>
        </div>
      )}

      {/* Premium Search & Filter Bar */}
      <div className="mx-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
          <input 
            type="text" placeholder="Search events by title or location..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-800"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative min-w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-4 w-4 text-gray-400" /></div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-bold text-gray-700">
              <option value="All">All Categories</option>
              <option value="Concert">Concerts</option>
              <option value="Party">Nightlife / Party</option>
              <option value="Sports">Sports / E-Sports</option>
              <option value="Festival">Festival / Expo</option>
              <option value="Theater">Theater / Comedy</option>
            </select>
          </div>
          
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-bold text-gray-700 min-w-[140px]">
            <option value="All">All Statuses</option>
            <option value="Pending">⏳ Pending Review</option>
            <option value="Active">✅ Published</option>
            <option value="Completed">🟣 Completed</option>
            <option value="Rejected">❌ Rejected</option>
            <option value="Archived">📦 Archived</option>
          </select>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 px-2">
          {filteredEvents.map(event => {
            const hasTicketsSold = Number(event.ticketsSold) > 0;
            const cannotArchive = hasTicketsSold && !event.isArchived;

            return (
            <div key={event.id} className={`bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 group ${event.isArchived ? 'opacity-70 grayscale-[50%] hover:grayscale-0 border-gray-200' : isPendingEvent(event) ? 'border-amber-300 shadow-amber-100 hover:shadow-xl hover:-translate-y-1' : isRejectedEvent(event) ? 'border-red-200 shadow-red-100 hover:shadow-xl hover:-translate-y-1' : isCompletedEvent(event) ? 'border-slate-200 shadow-slate-100 hover:shadow-xl hover:-translate-y-1' : 'border-emerald-200 shadow-emerald-100 hover:shadow-xl hover:-translate-y-1'}`}>
              
              <div className="h-52 bg-gray-100 relative overflow-hidden">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
                ) : <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900"></div>}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>

                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 text-xs font-extrabold rounded-full shadow-sm backdrop-blur-md text-white tracking-wide ${getStatusTheme(event).pill}`}>
                    {getStatusTheme(event).label}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-extrabold text-gray-900 mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors" title={event.title}>{event.title}</h3>
                
                <div className="space-y-4 mb-6 text-sm">
                  <div className="flex items-center text-gray-600 font-medium">
                    <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center text-gray-600 font-medium">
                    <MapPin className="w-5 h-5 mr-3 text-rose-500" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 font-medium bg-gray-50 border border-gray-100 py-2 px-3 -ml-1 rounded-xl inline-flex w-fit">
                    <User className="w-4 h-4 mr-2 text-slate-500" />
                    <span className="truncate text-xs">Hosted by <span className="font-bold text-gray-900">{getOrganizerName(event.organizerId)}</span></span>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tickets Sold</p>
                    <p className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-blue-500" />
                      {event.ticketsSold || 0} <span className="text-gray-400 font-medium text-xs">/ {event.capacity || '∞'}</span>
                    </p>
                  </div>
                  <div className="flex-1 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mb-1">Price</p>
                    <p className="text-sm font-extrabold text-emerald-700">
                      {event.price === '0' || event.price === '0.00' ? 'FREE' : `₱${event.price}`}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex justify-between items-center pt-5 border-t border-gray-100">
                  {isPendingEvent(event) ? (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => confirmReject(event)} className="flex-1 flex items-center justify-center text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-xl transition cursor-pointer">
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </button>
                      <button onClick={() => confirmApprove(event)} className="flex-1 flex items-center justify-center text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmArchive(event.id, event.title, event.isArchived)}
                          disabled={cannotArchive}
                          className={`flex items-center justify-center w-11 h-11 transition rounded-xl cursor-pointer ${
                            cannotArchive ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : event.isArchived ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100'
                          }`}
                          title={event.isArchived ? 'Restore' : 'Archive'}
                        >
                          <Archive className="w-5 h-5" />
                        </button>

                        {isPublishedEvent(event) ? (
                          <button
                            onClick={() => setAttendeesModal({ show: true, eventTitle: event.title, eventId: event.id })}
                            className="flex items-center justify-center px-5 h-11 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition rounded-xl cursor-pointer border border-blue-100"
                            title="View Attendees"
                          >
                            <Eye className="w-4 h-4 mr-2" /> View
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex items-center justify-center px-5 h-11 text-sm font-bold text-gray-300 bg-gray-50 rounded-xl cursor-not-allowed border border-gray-100"
                            title="Available when the event is Published"
                          >
                            <Eye className="w-4 h-4 mr-2" /> View
                          </button>
                        )}
                      </div>

                      <button onClick={() => navigate('/admin/create', { state: { eventToEdit: event } })} className="flex items-center justify-center px-5 h-11 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-md">
                        <Settings className="w-4 h-4 mr-2" /> Edit
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="mx-2 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Event Details</th>
                  <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Host</th>
                  <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEvents.map(event => {
                  const hasTicketsSold = Number(event.ticketsSold) > 0;
                  const cannotArchive = hasTicketsSold && !event.isArchived;

                  return (
                    <tr key={event.id} className={`hover:bg-gray-50/50 transition-colors ${event.isArchived ? 'bg-gray-50/30 grayscale-[30%]' : isPendingEvent(event) ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-5">
                        <p className={`font-extrabold text-base line-clamp-1 ${event.isArchived ? 'text-gray-500' : 'text-gray-900'}`}>{event.title}</p>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mt-1.5">
                          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400"/> {new Date(event.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400"/> <span className="line-clamp-1">{event.location}</span></span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                          <User size={12} className="text-blue-500" /> {getOrganizerName(event.organizerId)}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <Ticket size={14} className="text-blue-500"/> {event.ticketsSold || 0} / {event.capacity || '∞'} Sold
                          </span>
                          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                            ₱{(event.ticketsSold * event.price) || '0.00'} Rev
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                          <span className={`px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full ${getStatusTheme(event).chip}`}>
                          {getStatusTheme(event).label}
                        </span>
                      </td>
                      <td className="p-5 text-right pr-8">
                        
                        {isPendingEvent(event) ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => confirmApprove(event)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm">Approve</button>
                            <button onClick={() => confirmReject(event)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition">Reject</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {isPublishedEvent(event) ? (
                              <button
                                onClick={() => setAttendeesModal({ show: true, eventTitle: event.title, eventId: event.id })}
                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                                title="View Attendees"
                              >
                                <Eye size={18} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="p-2 text-gray-300 bg-gray-50 rounded-xl cursor-not-allowed"
                                title="Available when the event is Published"
                              >
                                <Eye size={18} />
                              </button>
                            )}
                            <button onClick={() => confirmArchive(event.id, event.title, event.isArchived)} disabled={cannotArchive} className={`p-2 rounded-xl transition ${cannotArchive ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : event.isArchived ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}><Archive size={18} /></button>
                            <button onClick={() => navigate('/admin/create', { state: { eventToEdit: event } })} className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition" title="Edit Event"><Settings size={18} /></button>
                          </div>
                        )}

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW ATTENDEES MODAL */}
      {attendeesModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg text-center animate-in zoom-in duration-200 scale-100">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-blue-50 border-8 border-blue-100/50 text-blue-600">
              <Users size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">Attendee List</h2>
            <p className="text-gray-500 font-medium leading-relaxed">{attendeesModal.eventTitle}</p>
            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-3">
              {currentEventAttendees.length} {currentEventAttendees.length === 1 ? 'person' : 'people'}
            </p>

            <div className="max-h-[50vh] overflow-y-auto pr-1 mt-8 text-left">
              {currentEventAttendees.length > 0 ? (
                <div className="space-y-2">
                  {currentEventAttendees.map(att => (
                    <div
                      key={att.id}
                      className="flex items-center gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs tracking-wider shrink-0">
                        {getInitials(att.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-900 truncate">{att.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
                  <p className="text-gray-600 font-extrabold">No attendees yet</p>
                  <p className="text-gray-500 text-sm font-medium mt-1">Names will appear here after tickets are purchased.</p>
                </div>
              )}
            </div>

            <button
              onClick={closeAttendeesModal}
              className="w-full mt-8 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-md active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Premium Confirmation Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200 scale-100">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-blue-50 border-8 border-blue-100/50 text-blue-600">
              <HelpCircle size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">{confirmDialog.title}</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog({ show: false })} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDialog.onConfirm} className={`flex-1 py-3.5 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 ${confirmDialog.confirmColor}`}>
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Success/Error Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200 scale-100">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-8 ${modal.type === 'error' ? 'bg-red-50 border-red-100/50 text-red-600' : 'bg-emerald-50 border-emerald-100/50 text-emerald-500'}`}>
              {modal.type === 'error' ? <AlertTriangle size={32} strokeWidth={2.5} /> : <CheckCircle size={32} strokeWidth={2.5} />}
            </div>
            <h2 className={`text-2xl font-extrabold mb-2 tracking-tight ${modal.type === 'error' ? 'text-red-600' : 'text-gray-900'}`}>{modal.title}</h2>
            <p className="text-gray-500 font-medium mb-8">{modal.message}</p>
            <button onClick={() => setModal({ show: false, type: '', title: '', message: '' })} className="w-full py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-md cursor-pointer active:scale-95">
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
