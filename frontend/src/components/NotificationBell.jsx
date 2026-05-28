import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Bell, CheckCircle, AlertCircle, Info, Check, Trash2 } from 'lucide-react';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user'));

    // Helper to format "2 minutes ago", "1 hour ago", etc.
    const timeAgo = (dateString) => {
        const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const res = await api.get(`/notifications/user/${user.id}`);
            setNotifications(res.data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // 🌟 REAL-TIME MAGIC: Polls the database every 10 seconds for new alerts
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            // 🌟 FIX: Use functional state update to prevent stale data bugs
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        if (unread.length === 0) return;

        try {
            // 🌟 FIX: Fire all API calls efficiently in parallel
            await Promise.all(unread.map(n => api.patch(`/notifications/${n.id}/read`)));
            
            // 🌟 FIX: Update the React state exactly once for all of them
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Chooses the right icon and color based on the notification type
    const getIcon = (type) => {
        switch(type) {
            case 'APPROVAL': return <CheckCircle className="text-emerald-500 w-5 h-5 mt-0.5" />;
            case 'SYSTEM': return <AlertCircle className="text-amber-500 w-5 h-5 mt-0.5" />;
            default: return <Info className="text-blue-500 w-5 h-5 mt-0.5" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* The Bell Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition duration-200 focus:outline-none cursor-pointer"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                    </span>
                )}
            </button>

            {/* The Dropdown Panel */}
            {isOpen && (
                <div className="fixed left-3 right-3 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-slate-900 px-4 py-3 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            Notifications {unreadCount > 0 && <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                        </h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer">
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-0 m-0">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                                <p className="font-medium text-sm">You're all caught up!</p>
                                <p className="text-xs mt-1">No new notifications.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <li 
                                        key={notif.id} 
                                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                                        className={`p-4 hover:bg-gray-50 transition cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-blue-50/30' : 'opacity-70'}`}
                                    >
                                        <div className="shrink-0">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-sm font-bold truncate pr-2 ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                                                    {timeAgo(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="shrink-0 flex items-center">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
