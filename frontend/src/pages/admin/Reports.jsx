import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  DollarSign, Users, Calendar as CalendarIcon, 
  UserCheck, UserX, Activity, Trophy, Ticket, Award, Filter, Tag
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('All Time');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [eventsRes, usersRes, attendeesRes] = await Promise.all([
          api.get('/events'),
          api.get('/users'),
          api.get('/attendees') 
        ]);
        setEvents(eventsRes.data);
        setUsers(usersRes.data);
        setAttendees(attendeesRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching report data:", error);
      }
    };
    fetchDashboardData(); 
    const intervalId = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(intervalId); 
  }, []);

  const getFilteredEvents = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return events.filter(event => {
      if (event.isArchived) return false;
      if (timeFilter === 'All Time') return true;
      const eventDate = new Date(event.date);
      if (timeFilter === 'This Month') return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      if (timeFilter === 'Upcoming') return eventDate >= now;
      if (timeFilter === 'Past') return eventDate < now;
      return true;
    });
  };

  const activeFilteredEvents = getFilteredEvents();
  const activeFilteredEventIds = activeFilteredEvents.map(e => String(e.id));
  
  const filteredAttendees = attendees.filter(a => a.status !== 'Cancelled' && activeFilteredEventIds.includes(String(a.eventId)));

  const activeUsers = users.filter(u => u.isActive !== false);
  const inactiveUsers = users.filter(u => u.isActive === false);
  const totalOrganizers = users.filter(u => u.role === 'Organizer').length;
  const totalRevenue = filteredAttendees.reduce((sum, a) => sum + (parseFloat(a.amountPaid) || 0), 0);

  const revenueByMonth = events.filter(e => !e.isArchived).reduce((acc, event) => {
    if (!event.date) return acc;
    const month = new Date(event.date).toLocaleString('default', { month: 'short' });
    const eventRevenue = attendees.filter(a => String(a.eventId) === String(event.id) && a.status !== 'Cancelled').reduce((sum, a) => sum + (parseFloat(a.amountPaid) || 0), 0);
    acc[month] = (acc[month] || 0) + eventRevenue;
    return acc;
  }, {});

  const monthOrder = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
  const areaChartData = Object.keys(revenueByMonth).map(key => ({ name: key, revenue: revenueByMonth[key] })).sort((a, b) => monthOrder[a.name] - monthOrder[b.name]); 

  const categoryCounts = activeFilteredEvents.reduce((acc, event) => {
    const cat = event.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const pieChartData = Object.keys(categoryCounts).map(key => ({ name: key, value: categoryCounts[key] }));

  const topEvents = [...activeFilteredEvents]
    .map(event => {
      const eventAttendees = attendees.filter(a => String(a.eventId) === String(event.id) && a.status !== 'Cancelled');
      const rev = eventAttendees.reduce((sum, a) => sum + (parseFloat(a.amountPaid) || 0), 0);
      return { ...event, ticketsSold: eventAttendees.length, revenueGenerated: rev };
    })
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
    .slice(0, 5);

  const topOrganizers = users
    .filter(u => u.role === 'Organizer')
    .map(org => {
      const orgEvents = events.filter(e => String(e.organizerId) === String(org.id));
      const orgEventIds = orgEvents.map(e => String(e.id));
      const orgAttendees = attendees.filter(a => orgEventIds.includes(String(a.eventId)) && a.status !== 'Cancelled');
      const rev = orgAttendees.reduce((sum, a) => sum + (parseFloat(a.amountPaid) || 0), 0);
      return { name: org.name, revenue: rev, ticketsSold: orgAttendees.length };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4); 

  const recentTransactions = [...attendees]
    .reverse() 
    .slice(0, 5)
    .map(att => {
      const eventInfo = events.find(e => String(e.id) === String(att.eventId));
      return {
        id: att.id,
        user: att.name, 
        event: eventInfo ? eventInfo.title : 'Unknown Event',
        amount: att.amountPaid === '0' || att.amountPaid === 'Free' ? 'Free' : `₱${att.amountPaid}`,
        ticketId: att.ticketId
      };
    });

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse font-medium text-lg">Analyzing database...</div>;

  return (
    <div className="pb-12 max-w-7xl mx-auto">
      
      {/* Header & Date Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
            <Activity className="text-blue-500 w-7 h-7" /> Platform Analytics
            <span className="ml-2 text-[10px] font-extrabold bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Live
            </span>
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Real-time view of your ecosystem performance.</p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select 
            value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}
            className="pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none min-w-[160px]"
          >
            <option value="All Time">All Time</option>
            <option value="This Month">This Month</option>
            <option value="Upcoming">Upcoming Events</option>
            <option value="Past">Past Events</option>
          </select>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-500"><DollarSign size={28} strokeWidth={2.5} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Revenue {timeFilter !== 'All Time' && `(${timeFilter})`}</p>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              ₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-500 mt-1 font-bold">{filteredAttendees.length} tickets sold</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-500"><CalendarIcon size={28} strokeWidth={2.5} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Filtered Events</p>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{activeFilteredEvents.length}</h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">Based on selection</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-fuchsia-50 p-4 rounded-2xl text-fuchsia-500"><Users size={28} strokeWidth={2.5} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Users</p>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{users.length}</h3>
            <p className="text-xs text-fuchsia-500 mt-1 font-bold">{totalOrganizers} Organizers</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-orange-50 p-4 rounded-2xl text-orange-500"><UserCheck size={28} strokeWidth={2.5} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Accounts</p>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{activeUsers.length}</h3>
            <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1">
              <UserX size={12} strokeWidth={2.5}/> {inactiveUsers.length} Inactive
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* REVENUE AREA CHART */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Activity className="text-emerald-500" size={20}/> Revenue Trajectory</h3>
          <div className="h-60 md:h-72">
            {areaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `₱${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#111827' }}
                    formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium text-sm">Not enough data to graph.</div>
            )}
          </div>
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2"><Tag className="text-blue-500" size={20}/> Categories</h3>
          <div className="flex-1 min-h-[200px] md:min-h-[250px]">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium text-sm">No category data yet</div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
            {pieChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TOP EVENTS */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col w-full overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-gray-100 bg-white flex items-center gap-3">
            <div className="bg-amber-50 text-amber-500 p-2 rounded-xl"><Trophy size={20} strokeWidth={2.5}/></div>
            <h3 className="text-lg font-extrabold text-gray-900">Top Performing Events</h3>
          </div>
          <div className="p-0 flex-1 overflow-x-auto w-full">
            {topEvents.length > 0 ? (
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Event Name</th>
                    <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider text-center">Tickets Sold</th>
                    <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topEvents.map(event => (
                    <tr key={event.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                      <td className="p-5 font-extrabold text-gray-900 truncate max-w-[150px]">{event.title}</td>
                      <td className="p-5"><span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider">{event.category}</span></td>
                      <td className="p-5 text-center font-extrabold text-blue-600">{event.ticketsSold}</td>
                      <td className="p-5 text-right font-extrabold text-emerald-600">₱{event.revenueGenerated.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500 font-medium">No active events found.</div>
            )}
          </div>
        </div>

        {/* TOP ORGANIZERS */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col w-full overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-white flex items-center gap-3">
            <div className="bg-fuchsia-50 text-fuchsia-500 p-2 rounded-xl"><Award size={20} strokeWidth={2.5} /></div>
            <h3 className="text-lg font-extrabold text-gray-900">Top Organizers</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-3">
            {topOrganizers.length > 0 ? topOrganizers.map((org, index) => (
              <div key={index} className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-white hover:border-gray-300 transition-colors shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm leading-tight">{org.name}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5"><span className="text-blue-500 font-bold">{org.ticketsSold}</span> tickets</p>
                  </div>
                </div>
                <div className="text-right font-extrabold text-emerald-600 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg">
                  ₱{org.revenue.toLocaleString()}
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-sm text-gray-500 font-medium">No organizer data available.</div>
            )}
          </div>
        </div>

        {/* RECENT SALES (Bottom Full Width) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col w-full overflow-hidden lg:col-span-3 mt-2">
          <div className="p-6 border-b border-gray-100 bg-white flex items-center gap-3">
            <div className="bg-purple-50 text-purple-500 p-2 rounded-xl"><Ticket size={20} strokeWidth={2.5}/></div>
            <h3 className="text-lg font-extrabold text-gray-900">Live Ticket Sales</h3>
          </div>
          <div className="p-0 flex-1 overflow-x-auto w-full">
            {recentTransactions.length > 0 ? (
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Attendee</th>
                    <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider text-right pr-8">TIX ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                      <td className="p-5 font-extrabold text-gray-900">{tx.user}</td>
                      <td className="p-5 text-gray-600 font-medium truncate max-w-[200px]">{tx.event}</td>
                      <td className="p-5 text-right text-emerald-600 font-extrabold">{tx.amount}</td>
                      <td className="p-5 text-right pr-8">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-md tracking-wider">{tx.ticketId}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500 font-medium">No tickets sold yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
