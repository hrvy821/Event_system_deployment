import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
    Calendar, MapPin, Type, Tag, BellRing, Image as ImageIcon,
    Ticket, Clock, CheckCircle2, AlertCircle, Loader2, Users,
    Eye, Save, ArrowLeft, ArrowRight, Sparkles, Check, X, FileText, ShieldCheck
} from 'lucide-react';

const STEP_KEYS = ['basic', 'schedule', 'ticketing', 'details', 'review'];

const STEP_LABELS = {
    basic: 'Basic Information',
    schedule: 'Date & Location',
    ticketing: 'Ticketing',
    details: 'Details',
    review: 'Review'
};

export default function CreateEvent() {
    const navigate = useNavigate();
    const location = useLocation();

    const eventToEdit = location.state?.eventToEdit || null;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const today = new Date().toISOString().split('T')[0];

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const initialFormData = {
        title: eventToEdit?.title || '',
        imageUrl: eventToEdit?.imageUrl || '',
        date: formatDateForInput(eventToEdit?.date),
        time: eventToEdit?.time || '',
        location: eventToEdit?.location || '',
        description: eventToEdit?.description || '',
        price: eventToEdit?.price ?? '',
        category: eventToEdit?.category || '',
        announcement: eventToEdit?.announcement || '',
        capacity: eventToEdit?.capacity ?? '',
        organizerId: eventToEdit?.organizerId || user.id || 0,
        status: eventToEdit?.status || (eventToEdit ? 'Pending Approval' : 'Draft')
    };

    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [isDraftSaving, setIsDraftSaving] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });
    const [imagePreviewError, setImagePreviewError] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(eventToEdit ? 'Loaded from database' : '');
    const [touched, setTouched] = useState({});
    const initialSnapshotRef = useRef(JSON.stringify(initialFormData));
    const [errors, setErrors] = useState({});

    const markTouched = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let next = { ...prev, [name]: value };
            if (name === 'date' && value === today && prev.time) {
                const now = new Date();
                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                if (prev.time < currentTime) {
                    next.time = '';
                }
            }
            return next;
        });

        if (name === 'imageUrl') {
            setImagePreviewError(false);
        }
    };

    const handlePriceBlur = (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            setFormData(prev => ({ ...prev, price: val.toFixed(2) }));
        }
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'No date selected';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            });
        } catch { return 'Invalid date'; }
    };

    const formatDisplayTime = (timeString) => {
        if (!timeString) return 'No time selected';
        try {
            const [hour, minute] = timeString.split(':');
            const date = new Date();
            date.setHours(Number(hour), Number(minute));
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } catch { return 'Invalid time'; }
    };

    const isTimeInPastToday = (dateString, timeString) => {
        if (!dateString || !timeString) return false;
        if (dateString !== today) return false;
        const now = new Date();
        const [h, m] = timeString.split(':').map(Number);
        const selected = new Date();
        selected.setHours(h, m, 0, 0);
        return selected < now;
    };

    const validate = (data = formData) => {
        const nextErrors = {};
        if (!data.title.trim()) nextErrors.title = 'Event title is required.';
        else if (data.title.trim().length < 4) nextErrors.title = 'Event title must be at least 4 characters.';
        if (!data.category) nextErrors.category = 'Please select a category.';
        if (!data.date) nextErrors.date = 'Please select a date.';
        else if (data.date < today) nextErrors.date = 'Date cannot be in the past.';
        if (!data.time) nextErrors.time = 'Please select a time.';
        else if (isTimeInPastToday(data.date, data.time)) nextErrors.time = 'Selected time has already passed for today.';
        if (!data.location.trim()) nextErrors.location = 'Location / venue is required.';
        else if (data.location.trim().length < 3) nextErrors.location = 'Please enter a more complete venue/location.';
        if (data.price === '' || data.price === null) nextErrors.price = 'Ticket price is required.';
        else if (Number(data.price) < 0) nextErrors.price = 'Ticket price cannot be negative.';
        if (data.capacity === '' || data.capacity === null) nextErrors.capacity = 'Maximum capacity is required.';
        else if (Number(data.capacity) < 1) nextErrors.capacity = 'Capacity must be at least 1.';
        if (!data.description.trim()) nextErrors.description = 'Event description is required.';
        else if (data.description.trim().length < 20) nextErrors.description = 'Description should be at least 20 characters.';
        if (data.announcement.length > 120) nextErrors.announcement = 'Announcement must not exceed 120 characters.';
        if (data.description.length > 600) nextErrors.description = 'Description must not exceed 600 characters.';
        if (data.imageUrl && !/^https?:\/\/.+/i.test(data.imageUrl)) nextErrors.imageUrl = 'Please enter a valid URL starting with http or https.';
        return nextErrors;
    };

    useEffect(() => {
        setErrors(validate(formData));
    }, [formData]);

    const dirty = useMemo(() => JSON.stringify(formData) !== initialSnapshotRef.current, [formData]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!dirty || isLoading || isDraftSaving) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [dirty, isLoading, isDraftSaving]);

    const progressPercent = useMemo(() => {
        const checks = [
            !!formData.title.trim(), !!formData.category, !!formData.date,
            !!formData.time, !!formData.location.trim(),
            formData.price !== '' && Number(formData.price) >= 0,
            formData.capacity !== '' && Number(formData.capacity) >= 1,
            !!formData.description.trim()
        ];
        const done = checks.filter(Boolean).length;
        return Math.round((done / checks.length) * 100);
    }, [formData]);

    const reviewChecklist = useMemo(() => {
        return [
            { label: 'Title & Category configured', done: !!formData.title.trim() && !!formData.category },
            { label: 'Date & Time selected correctly', done: !!formData.date && !!formData.time && !isTimeInPastToday(formData.date, formData.time) },
            { label: 'Location / Venue added', done: !!formData.location.trim() },
            { label: 'Price & Capacity set', done: formData.capacity !== '' && Number(formData.capacity) >= 1 && formData.price !== '' },
            { label: 'Description meets requirements', done: !!formData.description.trim() && formData.description.trim().length >= 20 },
            { label: 'Zero validation errors', done: Object.keys(errors).length === 0 }
        ];
    }, [formData, errors, today]);

    const canSubmit = Object.keys(errors).length === 0;

    const submitLabel = isLoading
        ? (eventToEdit?.id ? 'Saving Changes...' : 'Submitting...')
        : eventToEdit?.id ? 'Save Changes' : canSubmit ? 'Submit for Approval' : 'Complete Required Fields';

    const currentStepKey = STEP_KEYS[activeStep];
    const goNext = () => { if (activeStep < STEP_KEYS.length - 1) setActiveStep(prev => prev + 1); };
    const goPrev = () => { if (activeStep > 0) setActiveStep(prev => prev - 1); };
    const jumpToStep = (index) => { setActiveStep(index); };

    const persistEvent = async (mode = 'submit') => {
        const payload = {
            ...formData,
            capacity: parseInt(formData.capacity, 10) || 0,
            price: parseFloat(formData.price) || 0,
            organizerId: formData.organizerId || user.id || 0,
            status: mode === 'draft' ? 'Draft' : (eventToEdit?.status === 'Approved' ? 'Approved' : 'Pending Approval')
        };

        if (mode === 'submit') {
            const nextErrors = validate(payload);
            setErrors(nextErrors);
            setTouched({
                title: true, imageUrl: true, date: true, time: true, location: true,
                description: true, price: true, category: true, announcement: true, capacity: true
            });

            if (Object.keys(nextErrors).length > 0) {
                setModal({
                    show: true, type: 'error', title: 'Incomplete Form',
                    message: 'Please complete all required fields and fix validation errors before submitting.'
                });
                return;
            }
        }

        try {
            if (mode === 'draft') setIsDraftSaving(true);
            else setIsLoading(true);

            if (eventToEdit?.id) {
                await api.put(`/events/${eventToEdit.id}`, payload);
                setLastSavedAt(`Saved to database at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
                initialSnapshotRef.current = JSON.stringify({ ...payload, date: payload.date });
                setModal({
                    show: true, type: 'success', title: mode === 'draft' ? 'Draft Saved' : 'Success!',
                    message: mode === 'draft' ? 'Your draft has been saved.' : 'Event updated successfully.'
                });
            } else {
                const res = await api.post('/events', payload);
                const createdEvent = res?.data;
                if (createdEvent?.id) {
                    initialSnapshotRef.current = JSON.stringify({ ...payload, id: createdEvent.id });
                }
                setLastSavedAt(`Saved to database at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
                setModal({
                    show: true, type: 'success', title: mode === 'draft' ? 'Draft Saved' : 'Submitted for Approval!',
                    message: mode === 'draft' ? 'Your draft has been saved.' : 'Your event has been sent to the Admins for review.'
                });
            }
        } catch (error) {
            setModal({
                show: true, type: 'error', title: 'Error',
                message: 'Failed to save event. Please check your connection and try again.'
            });
        } finally {
            setIsLoading(false);
            setIsDraftSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await persistEvent('submit');
    };

    // 🌟 FIX: Added the missing handleSaveDraft function here!
    const handleSaveDraft = async () => {
        await persistEvent('draft');
    };

    const getFieldClass = (field) => {
        const hasError = touched[field] && errors[field];
        return `block w-full ${
            ['imageUrl', 'price', 'time', 'date', 'category', 'capacity'].includes(field) ? 'pl-11 pr-4' : 'px-4'
        } py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-gray-900 ${
            ['title', 'category', 'date', 'time', 'location', 'price', 'capacity'].includes(field) ? 'font-bold' : 'font-medium'
        } ${hasError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-600'}`;
    };

    const FieldError = ({ name }) => {
        if (!(touched[name] && errors[name])) return null;
        return (
            <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                <AlertCircle size={14} /> {errors[name]}
            </p>
        );
    };

    return (
        <div className="max-w-[1320px] mx-auto pb-16">
            {/* Header & Progress */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {eventToEdit ? 'Edit Event' : 'Create New Event'}
                        </h1>
                        <p className="text-gray-500 font-medium mt-1 text-sm">
                            Build your event step by step, preview it in real time, and save progress directly to your database.
                        </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm min-w-[260px]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completion</span>
                            <span className="text-sm font-extrabold text-gray-900">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-3">
                            {lastSavedAt || (eventToEdit ? 'Editing existing event' : 'Not saved yet')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4 mb-8 overflow-x-auto">
                <div className="flex items-center gap-3 min-w-[760px]">
                    {STEP_KEYS.map((key, index) => {
                        const active = index === activeStep;
                        const done = index < activeStep;
                        return (
                            <button
                                key={key} type="button" onClick={() => jumpToStep(index)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all whitespace-nowrap ${
                                    active ? 'bg-blue-50 border-blue-200 text-blue-700' : done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold ${
                                    active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
                                }`}>
                                    {done ? <Check size={15} /> : index + 1}
                                </div>
                                <span className="text-sm font-bold">{STEP_LABELS[key]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8">
                    
                    {/* LEFT CONTENT AREA */}
                    <div className="space-y-8">
                        
                        {/* STEP 1: BASIC INFO */}
                        {currentStepKey === 'basic' && (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Type className="text-blue-600" size={20} /> Basic Information
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Title</label>
                                        <input
                                            type="text" name="title" value={formData.title} required
                                            onChange={handleChange} onBlur={() => markTouched('title')}
                                            className={getFieldClass('title')} placeholder="e.g. Tech Summit 2026"
                                        />
                                        <FieldError name="title" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cover Image URL (Optional)</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <ImageIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="url" name="imageUrl" value={formData.imageUrl}
                                                    onChange={handleChange} onBlur={() => markTouched('imageUrl')}
                                                    className={getFieldClass('imageUrl')} placeholder="https://..."
                                                />
                                            </div>
                                            <FieldError name="imageUrl" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Tag className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <select
                                                    name="category" value={formData.category} required
                                                    onChange={handleChange} onBlur={() => markTouched('category')}
                                                    className={`${getFieldClass('category')} appearance-none`}
                                                >
                                                    <option value="" disabled>Select a category...</option>
                                                    <option value="Concert / Live Music">Concert / Live Music</option>
                                                    <option value="Conference / Summit">Conference / Summit</option>
                                                    <option value="Festival / Expo">Festival / Expo</option>
                                                    <option value="Sports / E-Sports">Sports / E-Sports</option>
                                                    <option value="Nightlife / Party">Nightlife / Party</option>
                                                </select>
                                            </div>
                                            <FieldError name="category" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: SCHEDULE & LOCATION */}
                        {currentStepKey === 'schedule' && (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Calendar className="text-blue-600" size={20} /> Date & Location
                                </h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Date</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Calendar className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="date" name="date" min={today} required
                                                    value={formData.date} onChange={handleChange} onBlur={() => markTouched('date')}
                                                    className={getFieldClass('date')}
                                                />
                                            </div>
                                            <FieldError name="date" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Time</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Clock className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="time" name="time" required
                                                    value={formData.time} onChange={handleChange} onBlur={() => markTouched('time')}
                                                    className={getFieldClass('time')}
                                                />
                                            </div>
                                            <FieldError name="time" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Venue / Location</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <MapPin className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text" name="location" required
                                                value={formData.location} onChange={handleChange} onBlur={() => markTouched('location')}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-900"
                                                placeholder="e.g. SMX Convention Center, Manila"
                                            />
                                        </div>
                                        <FieldError name="location" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: TICKETING */}
                        {currentStepKey === 'ticketing' && (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Ticket className="text-blue-600" size={20} /> Ticketing & Capacity
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ticket Price (PHP)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="font-bold text-gray-400">₱</span>
                                            </div>
                                            <input
                                                type="number" name="price" min="0" step="0.01" required
                                                value={formData.price} onChange={handleChange} onBlur={(e) => { markTouched('price'); handlePriceBlur(e); }}
                                                className={getFieldClass('price')} placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 font-medium">Leave at 0 to make the event Free.</p>
                                        <FieldError name="price" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Maximum Capacity</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Users className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="number" name="capacity" min="1" required
                                                value={formData.capacity} onChange={handleChange} onBlur={() => markTouched('capacity')}
                                                className={getFieldClass('capacity')} placeholder="e.g. 500"
                                            />
                                        </div>
                                        <FieldError name="capacity" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: DETAILS */}
                        {currentStepKey === 'details' && (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <FileText className="text-blue-600" size={20} /> Event Details
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Important Announcement (Optional)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <BellRing className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <input
                                                type="text" name="announcement" maxLength="120"
                                                value={formData.announcement} onChange={handleChange} onBlur={() => markTouched('announcement')}
                                                className="w-full pl-11 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium text-amber-900"
                                                placeholder="e.g. Bring valid ID for entry"
                                            />
                                        </div>
                                        <FieldError name="announcement" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Description</label>
                                        <textarea
                                            name="description" rows="6" required maxLength="600"
                                            value={formData.description} onChange={handleChange} onBlur={() => markTouched('description')}
                                            className={`w-full p-4 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-gray-900 resize-none ${touched.description && errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-600'}`}
                                            placeholder="Write a compelling description for your event (min 20 characters)..."
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            <FieldError name="description" />
                                            <span className={`text-xs font-bold ${formData.description.length > 550 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                {formData.description.length} / 600
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: REVIEW */}
                        {currentStepKey === 'review' && (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="text-blue-600" size={20} /> Pre-Flight Checklist
                                </h2>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                    <ul className="space-y-4">
                                        {reviewChecklist.map((item, idx) => (
                                            <li key={idx} className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                                                    {item.done ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                                                </div>
                                                <span className={`text-sm font-bold ${item.done ? 'text-gray-900' : 'text-gray-500'}`}>{item.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4">
                            {activeStep > 0 ? (
                                <button type="button" onClick={goPrev} className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-2">
                                    <ArrowLeft size={18} /> Back
                                </button>
                            ) : (
                                <div></div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <button type="button" onClick={handleSaveDraft} disabled={isDraftSaving || isLoading || !dirty} className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${dirty && !isDraftSaving && !isLoading ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}>
                                    {isDraftSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Draft
                                </button>
                                
                                {activeStep < STEP_KEYS.length - 1 ? (
                                    <button type="button" onClick={goNext} className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition shadow-sm flex items-center justify-center gap-2 active:scale-95">
                                        Next <ArrowRight size={18} />
                                    </button>
                                ) : (
                                    <button type="submit" disabled={isLoading || (!canSubmit && !eventToEdit)} className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2 active:scale-95 ${(!canSubmit && !eventToEdit) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'}`}>
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} {submitLabel}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT AREA: LIVE PREVIEW */}
                    <div className="hidden xl:block">
                        <div className="sticky top-8 bg-slate-50 border border-slate-200 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Eye size={16} /> Live Card Preview
                            </h3>
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col pointer-events-none">
                                <div className="h-40 relative bg-slate-100">
                                    {formData.imageUrl && !imagePreviewError ? (
                                        <img src={formData.imageUrl} alt="Preview" onError={() => setImagePreviewError(true)} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900"></div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-wider">
                                        {formData.category?.split('/')[0] || 'Category'}
                                    </div>
                                </div>
                                <div className="p-5 flex-col flex gap-2">
                                    <h4 className="font-extrabold text-lg line-clamp-2 text-slate-900 leading-tight">
                                        {formData.title || 'Your Event Title Here'}
                                    </h4>
                                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                        <Calendar size={14} className="text-blue-500" />
                                        {formatDisplayDate(formData.date)}
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 line-clamp-1">
                                        <MapPin size={14} className="text-rose-500 shrink-0" />
                                        {formData.location || 'Event Location'}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Starts at</span>
                                        <span className="font-black text-lg text-slate-900">
                                            {!formData.price || formData.price === '0' || formData.price === '0.00' ? 'FREE' : `₱${formData.price}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* MODALS */}
            {modal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in duration-200">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                            {modal.type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{modal.title}</h2>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">{modal.message}</p>
                        <button onClick={() => {
                            setModal({ show: false, type: '', title: '', message: '' });
                            if (modal.type === 'success') navigate(-1);
                        }} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition active:scale-95">
                            {modal.type === 'success' ? 'Return to Dashboard' : 'Got it'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}