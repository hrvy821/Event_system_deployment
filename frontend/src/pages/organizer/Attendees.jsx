import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import {
  Search, Mail, CheckCircle2, Download,
  Users, UserCheck, DollarSign, Calendar, XCircle, Filter,
  Clock3, ChevronDown, ChevronUp, CheckSquare, Square, AlertTriangle
} from 'lucide-react';

export default function Attendees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [attendees, setAttendees] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast({ show: false, type: 'success', message: '' });
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const eventEndpoint = isAdmin
        ? '/events'
        : `/events/organizer/${user.id}`;

      const [eventsRes, attendeesRes] = await Promise.all([
        api.get(eventEndpoint),
        api.get('/attendees')
      ]);

      setEvents(eventsRes.data || []);
      setAttendees(attendeesRes.data || []);

      setSelectedEventId(prev => {
        if (prev && (eventsRes.data || []).some(e => String(e.id) === String(prev))) return prev;
        return eventsRes.data?.length > 0 ? String(eventsRes.data[0].id) : '';
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!silent) {
        setModal({
          show: true,
          type: 'error',
          title: 'Load Failed',
          message: 'Failed to load attendees and events.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAdmin, user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const selectedEvent = useMemo(
    () => events.find(e => String(e.id) === String(selectedEventId)),
    [events, selectedEventId]
  );

  const getEventStart = (event) => {
    if (!event?.date) return null;
    return new Date(`${event.date}T${event.time || '00:00:00'}`);
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeOnly = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getRegistrationDate = (person) => person.createdAt || person.registeredAt || person.created_at || person.registrationDate;
  
  const getCheckInDate = (person) => {
    if (person.checkedInAt || person.checkInTime || person.checked_in_at) {
      return person.checkedInAt || person.checkInTime || person.checked_in_at;
    }
    if (person.status === 'Checked In') {
      return person.updatedAt || person.updated_at;
    }
    return null;
  };

  const eventAttendees = useMemo(() => {
    const rawAttendees = attendees.filter(a => String(a.eventId) === String(selectedEventId));
    const latestTicketsMap = new Map();
    
    rawAttendees.forEach(ticket => {
      const existing = latestTicketsMap.get(ticket.email);
      if (!existing || ticket.id > existing.id) {
        latestTicketsMap.set(ticket.email, ticket);
      }
    });
    
    return Array.from(latestTicketsMap.values());
  }, [attendees, selectedEventId]);

  const getDisplayStatus = useCallback((person) => {
    if (person.status === 'Cancelled') return 'Cancelled';
    if (person.status === 'Checked In') return 'Checked In';

    const eventStart = getEventStart(selectedEvent);
    if (!eventStart) return person.status || 'Pending';

    const now = new Date();
    const lateThreshold = new Date(eventStart.getTime() + 30 * 60 * 1000);   
    const noShowThreshold = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000); 

    if ((person.status === 'Pending' || !person.status) && now >= noShowThreshold) return 'No Show';
    if ((person.status === 'Pending' || !person.status) && now >= lateThreshold) return 'Late';

    return person.status || 'Pending';
  }, [selectedEvent]);

  const filteredList = eventAttendees.filter(person => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (person.name || '').toLowerCase().includes(q) ||
      (person.email || '').toLowerCase().includes(q) ||
      (person.ticketId || '').toLowerCase().includes(q);

    const displayStatus = getDisplayStatus(person);
    const matchesStatus = statusFilter === 'All' || displayStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeAttendees = eventAttendees.filter(a => a.status !== 'Cancelled');
  const cancelledCount = eventAttendees.filter(a => a.status === 'Cancelled').length;

  const totalRegistered = activeAttendees.length;
  const checkedInCount = activeAttendees.filter(a => getDisplayStatus(a) === 'Checked In').length;
  const totalRevenue = activeAttendees.reduce((sum, a) => sum + (parseFloat(a.amountPaid) || 0), 0);

  const checkInRate = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;
  const lateCount = activeAttendees.filter(a => getDisplayStatus(a) === 'Late').length;
  const noShowCount = activeAttendees.filter(a => getDisplayStatus(a) === 'No Show').length;

  const checkedInAttendees = activeAttendees.filter(a => a.status === 'Checked In' && getCheckInDate(a));

  const averageArrivalText = useMemo(() => {
    if (!checkedInAttendees.length || !selectedEvent) return '—';

    const eventStart = getEventStart(selectedEvent);
    if (!eventStart) return '—';

    const avgMs =
      checkedInAttendees.reduce((sum, a) => sum + new Date(getCheckInDate(a)).getTime(), 0) /
      checkedInAttendees.length;

    const avgDate = new Date(avgMs);
    const diffMinutes = Math.round((avgDate.getTime() - eventStart.getTime()) / 60000);
    const absMinutes = Math.abs(diffMinutes);

    let timeString = '';
    if (absMinutes >= 1440) {
      timeString = `${Math.round(absMinutes / 1440)} days`;
    } else if (absMinutes >= 60) {
      timeString = `${Math.round(absMinutes / 60)} hours`;
    } else {
      timeString = `${absMinutes} min`;
    }

    if (diffMinutes === 0) return 'On time';
    if (diffMinutes > 0) return `${timeString} late`;
    return `${timeString} early`;
  }, [checkedInAttendees, selectedEvent]);

  const peakCheckInWindow = useMemo(() => {
    if (!checkedInAttendees.length) return '—';

    const buckets = {};
    checkedInAttendees.forEach(a => {
      const d = new Date(getCheckInDate(a));
      const hour = d.getHours();
      const minuteBucket = d.getMinutes() < 30 ? '00' : '30';
      const key = `${hour}:${minuteBucket}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });

    const peak = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
    if (!peak) return '—';

    const [hourStr, minuteStr] = peak[0].split(':');
    const start = new Date();
    start.setHours(Number(hourStr), Number(minuteStr), 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }, [checkedInAttendees]);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const selectableRows = filteredList.filter(p => p.status !== 'Cancelled');
  const allSelectableSelected =
    selectableRows.length > 0 && selectableRows.every(p => selectedRows.includes(p.id));

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedRows(prev => prev.filter(id => !selectableRows.some(p => p.id === id)));
      return;
    }

    const ids = selectableRows.map(p => p.id);
    setSelectedRows(prev => [...new Set([...prev, ...ids])]);
  };

  const handleManualCheckIn = async (person) => {
    const displayStatus = getDisplayStatus(person);

    if (displayStatus === 'Checked In') {
      showToast('error', `${person.name} is already checked in.`);
      return;
    }

    if (displayStatus === 'Cancelled') {
      showToast('error', 'Cancelled tickets cannot be checked in.');
      return;
    }

    // 🌟 FIX: Safety guard against No Shows
    if (displayStatus === 'No Show') {
      showToast('error', 'Cannot check in an attendee marked as No Show.');
      return;
    }

    try {
      await api.post('/attendees/scan', { ticketId: person.ticketId });
      showToast('success', `${person.name} checked in successfully.`);
      loadData(true); 
    } catch (error) {
      console.error(error);
      setModal({
        show: true,
        type: 'error',
        title: 'Check-in Failed',
        message: 'Failed to check in attendee. Please verify their ticket ID.'
      });
    }
  };

  const handleBulkCheckIn = async () => {
    const selectedPeople = filteredList.filter(p => selectedRows.includes(p.id));
    
    // 🌟 FIX: Ensure No Shows are excluded from bulk check-ins too
    const eligible = selectedPeople.filter(p => {
      const status = getDisplayStatus(p);
      return status !== 'Checked In' && status !== 'Cancelled' && status !== 'No Show';
    });

    if (eligible.length === 0) {
      showToast('error', 'No eligible attendees selected for check-in.');
      return;
    }

    try {
      await Promise.all(eligible.map(person => api.post('/attendees/scan', { ticketId: person.ticketId })));
      showToast('success', `${eligible.length} attendee(s) checked in.`);
      setSelectedRows([]);
      loadData(true); 
    } catch (error) {
      console.error(error);
      setModal({
        show: true,
        type: 'error',
        title: 'Bulk Check-in Failed',
        message: 'Some attendees could not be checked in. Check your connection.'
      });
    }
  };

  const buildCsvRows = (rows) => {
    const headers = [
      'ID', 'Name', 'Email', 'Ticket ID', 'Display Status',
      'Stored Status', 'Amount Paid', 'Check-in Time', 'Registration Date'
    ];

    return [
      headers.join(','),
      ...rows.map(row => {
        const checkIn = getCheckInDate(row);
        const regDate = getRegistrationDate(row);
        return [
          row.id,
          `"${row.name || ''}"`,
          `"${row.email || ''}"`,
          row.ticketId || '',
          getDisplayStatus(row),
          row.status || '',
          row.amountPaid || '0',
          checkIn ? `"${formatDateTime(checkIn)}"` : '',
          regDate ? `"${formatDateTime(regDate)}"` : ''
        ].join(',');
      })
    ];
  };

  const exportRowsToCSV = (rows, fileLabel = 'attendees') => {
    if (!rows.length) {
      setModal({ show: true, type: 'error', title: 'No Data', message: 'No data available to export.' });
      return;
    }

    const csvString = buildCsvRows(rows).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileLabel}_${selectedEventId || 'event'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('success', 'CSV exported successfully.');
  };

  const downloadCSV = () => {
    const selectedExportRows = filteredList.filter(row => selectedRows.includes(row.id));
    if (selectedExportRows.length > 0) {
      exportRowsToCSV(selectedExportRows, 'selected_attendees');
      return;
    }
    exportRowsToCSV(filteredList, 'attendees');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      {toast.show && (
        <div className="fixed top-5 right-5 z-[60]">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {toast.message}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Attendee Manager</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">View, manage, and check in your guests.</p>
        </div>

        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold transition shadow-sm"
        >
          <Download size={18} strokeWidth={2.5} />
          {selectedRows.length > 0 ? `Export Selected (${selectedRows.length})` : 'Export CSV'}
        </button>
      </div>

      {events.length > 0 ? (
        <>
          <div className="mb-8 max-w-md">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <Calendar size={14} /> Select Event
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border border-gray-200 text-gray-900 font-bold py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition-all cursor-pointer"
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setSelectedRows([]);
                  setExpandedRows({});
                  setStatusFilter('All');
                  setSearchTerm('');
                }}
              >
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title} ({new Date(event.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                <Users size={28} strokeWidth={2} />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Registrations</span>
                <span className="block text-3xl font-extrabold text-gray-900">{totalRegistered}</span>
                {cancelledCount > 0 && <span className="text-xs font-bold text-red-400 mt-1 block">{cancelledCount} Cancelled</span>}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <UserCheck size={28} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Checked In</span>
                <div className="flex items-baseline gap-2">
                  <span className="block text-3xl font-extrabold text-gray-900">{checkedInCount}</span>
                  <span className="text-gray-400 font-bold text-sm">/ {totalRegistered}</span>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${checkInRate}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs font-bold text-emerald-600">{checkInRate}% Checked In</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                <DollarSign size={28} strokeWidth={2} />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Revenue Collected</span>
                <span className="block text-3xl font-extrabold text-gray-900">
                  ₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Completion Rate</div>
              <div className="text-lg font-extrabold text-gray-900">{checkInRate}%</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Peak Check-in</div>
              <div className="text-lg font-extrabold text-gray-900">{peakCheckInWindow}</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Average Arrival</div>
              <div className="text-lg font-extrabold text-gray-900">{averageArrivalText}</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Late / No Show</div>
              <div className="text-lg font-extrabold text-gray-900">{lateCount} / {noShowCount}</div>
            </div>
          </div>

          {selectedRows.length > 0 && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm font-bold text-blue-700">
                {selectedRows.length} attendee(s) selected
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBulkCheckIn}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition"
                >
                  Check-in Selected
                </button>
                <button
                  onClick={() => exportRowsToCSV(filteredList.filter(row => selectedRows.includes(row.id)), 'selected_attendees')}
                  className="px-4 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 text-sm font-bold hover:bg-blue-100 transition"
                >
                  Export Selected
                </button>
                <button
                  onClick={() => setSelectedRows([])}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or ticket ID..."
                  className="block w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm font-medium transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Filter size={18} className="text-gray-400 hidden sm:block" />
                <select
                  className="bg-white border border-gray-200 text-gray-700 text-sm font-bold py-2.5 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 shadow-sm appearance-none cursor-pointer w-full sm:w-auto"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Pending">Pending</option>
                  <option value="Late">Late</option>
                  <option value="No Show">No Show</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[52px]">
                      <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-900 transition">
                        {allSelectableSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Attendee</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Check-in Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-14 text-center">
                        <div className="text-gray-900 font-bold mb-1">No attendees found</div>
                        <div className="text-gray-500 font-medium text-sm">Try changing your search term or status filter.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((person) => {
                      const displayStatus = getDisplayStatus(person);
                      const isCancelled = displayStatus === 'Cancelled';
                      const isCheckedIn = displayStatus === 'Checked In';
                      const isNoShow = displayStatus === 'No Show'; // 🌟 Computed No Show
                      const rowSelected = selectedRows.includes(person.id);
                      
                      const checkInDateValue = getCheckInDate(person);
                      const registrationDateValue = getRegistrationDate(person);

                      return (
                        <React.Fragment key={person.id}>
                          <tr className={`transition-colors ${isCancelled ? 'bg-gray-50 opacity-70' : 'hover:bg-gray-50/80'}`}>
                            <td className="px-4 py-4 align-top">
                              <button
                                onClick={() => toggleSelectRow(person.id)}
                                disabled={isCancelled}
                                className={`mt-2 ${isCancelled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-900 transition'}`}
                              >
                                {rowSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                              </button>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                                  isCancelled ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                  {getInitials(person.name)}
                                </div>
                                <div>
                                  <div className={`font-extrabold ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {person.name}
                                  </div>
                                  <div className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
                                    <Mail size={12} /> {person.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                                {person.ticketId}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${
                                displayStatus === 'Checked In'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : displayStatus === 'Cancelled'
                                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                                    : displayStatus === 'No Show'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : displayStatus === 'Late'
                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {displayStatus === 'Checked In' && <CheckCircle2 size={14} />}
                                {displayStatus === 'Cancelled' && <XCircle size={14} />}
                                {(displayStatus === 'Pending' || displayStatus === 'Late' || displayStatus === 'No Show') && (
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    displayStatus === 'No Show'
                                      ? 'bg-red-500'
                                      : displayStatus === 'Late'
                                        ? 'bg-orange-500'
                                        : 'bg-amber-500'
                                  }`} />
                                )}
                                {displayStatus}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-gray-700">
                                {checkInDateValue ? formatTimeOnly(checkInDateValue) : '—'}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-3">
                                {/* 🌟 FIX: Handle UI for No Show / Check In properly */}
                                {isCancelled ? (
                                  <span className="text-xs font-bold text-gray-400 px-3 py-1.5">Voided</span>
                                ) : isCheckedIn ? (
                                  <span className="text-xs font-bold text-gray-400 px-3 py-1.5 flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Done
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleManualCheckIn(person)}
                                    disabled={isNoShow}
                                    title={isNoShow ? 'Cannot check in after event has ended' : 'Check In Attendee'}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 border border-transparent rounded-lg text-xs font-bold transition-all shadow-sm ${
                                      isNoShow
                                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
                                        : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700'
                                    }`}
                                  >
                                    <CheckCircle2 size={14} /> Check In
                                  </button>
                                )}

                                <button
                                  onClick={() => toggleRow(person.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
                                  title="View Details"
                                >
                                  {expandedRows[person.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expandedRows[person.id] && (
                            <tr className="bg-gray-50/70">
                              <td colSpan="6" className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Paid</div>
                                    <div className="text-sm font-extrabold text-gray-900">
                                      ₱{(parseFloat(person.amountPaid) || 0).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registration Date</div>
                                    <div className="text-sm font-extrabold text-gray-900">
                                      {formatDateOnly(registrationDateValue)}
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in Time</div>
                                    <div className="text-sm font-extrabold text-gray-900">
                                      {checkInDateValue ? formatTimeOnly(checkInDateValue) : '—'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center shadow-sm mt-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Calendar size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Events Yet</h3>
          <p className="text-gray-500 max-w-sm mb-0">
            You haven't created any events yet! Create one first to start managing attendees.
          </p>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100">
            <h2 className={`text-xl font-bold mb-2 ${modal.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {modal.title}
            </h2>
            <p className="text-gray-600 font-medium mb-6">{modal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setModal({ show: false, type: '', title: '', message: '' })}
                className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}