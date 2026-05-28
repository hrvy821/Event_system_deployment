import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
    Calendar, MapPin, PhilippinePeso, Type, AlignLeft, Tag, 
    Image as ImageIcon, Users, Ticket, Megaphone, Loader2, CheckCircle2, 
    AlertCircle, Clock, ArrowRight, ArrowLeft, Check, ShieldCheck, Eye // 🌟 FIX: Added Eye here!
} from 'lucide-react';

export default function CreateEvent() {
    const navigate = useNavigate();
    const location = useLocation();

    const eventToEdit = location.state?.eventToEdit || null;
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [organizers, setOrganizers] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try { return new Date(dateString).toISOString().split('T')[0]; } 
        catch (e) { return ''; }
    };

    const [formData, setFormData] = useState({
        title: eventToEdit?.title || '',
        date: formatDateForInput(eventToEdit?.date),
        time: eventToEdit?.time || '',
        location: eventToEdit?.location || '',
        description: eventToEdit?.description || '',
        price: eventToEdit?.price !== undefined && eventToEdit?.price !== null ? String(eventToEdit.price) : '',
        category: eventToEdit?.category || '',
        organizerId: eventToEdit?.organizerId || '',
        imageUrl: eventToEdit?.imageUrl || '',
        capacity: eventToEdit?.capacity || '', 
        announcement: eventToEdit?.announcement || '', 
    });

    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        if (user.role === 'Admin') {
            api.get('/users')
                .then(response => {
                    const activeOrganizers = response.data.filter(u => u.role === 'Organizer' && u.isActive);
                    setOrganizers(activeOrganizers);
                })
                .catch(error => console.error('Error fetching organizers:', error));
        }
    }, [user.role]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'organizerId' ? Number(value) : value });
    };

    const handlePriceBlur = (e) => {
        if (e.target.value !== '') {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) setFormData({ ...formData, price: val.toFixed(2) });
        }
    };

    const calculateCompletion = () => {
        const requiredFields = [
            formData.organizerId, formData.title, formData.category, 
            formData.date, formData.time, formData.location, 
            formData.price, formData.capacity, formData.description
        ];
        const filledFields = requiredFields.filter(field => field !== '' && field !== null && field !== undefined).length;
        return Math.round((filledFields / requiredFields.length) * 100);
    };

    const completion = calculateCompletion();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);

        const payload = {
            ...formData,
            capacity: parseInt(formData.capacity, 10) || 0,
            price: parseFloat(formData.price) || 0
        };

        // 🌟 Admin automatically bypasses pending approval
        if (user.role === 'Admin' && !eventToEdit) {
            payload.status = 'Published';
        }

        try {
            if (eventToEdit?.id) {
                await api.put(`/events/${eventToEdit.id}`, payload);
                setModal({ show: true, type: 'success', title: 'Success!', message: 'Event updated successfully.' });
            } else {
                await api.post('/events', payload);
                
                // 🌟 NEW: Trigger the broadcast to all attendees!
                if (payload.status === 'Published') {
                    try {
                        await api.post('/notifications/broadcast/attendees', {
                            title: 'New Event Alert! 🎉',
                            message: `Tickets are now available for "${formData.title}". Get yours before they sell out!`,
                            type: 'INFO'
                        });
                    } catch (broadcastError) {
                        console.error('Failed to broadcast notification:', broadcastError);
                    }
                }

                setModal({ show: true, type: 'success', title: 'Published!', message: 'The event is now live on the platform.' });
            }
        } catch (error) {
            console.error('Error saving event:', error);
            setModal({ show: true, type: 'error', title: 'Error', message: 'Failed to save event. Please check required fields.' });
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const steps = [
        { id: 1, label: 'Basic Information' },
        { id: 2, label: 'Date & Location' },
        { id: 3, label: 'Ticketing' },
        { id: 4, label: 'Details' },
        { id: 5, label: 'Review' }
    ];

    const getCategoryStyle = (category) => {
        const lowerCat = category?.toLowerCase() || '';
        if (lowerCat.includes('nightlife') || lowerCat.includes('party')) return 'from-slate-900 to-indigo-950';
        if (lowerCat.includes('tech') || lowerCat.includes('conference') || lowerCat.includes('summit')) return 'from-gray-900 to-slate-800';
        if (lowerCat.includes('concert') || lowerCat.includes('music')) return 'from-zinc-900 to-stone-800';
        if (lowerCat.includes('festival') || lowerCat.includes('expo')) return 'from-emerald-950 to-teal-900';
        if (lowerCat.includes('theater') || lowerCat.includes('comedy')) return 'from-slate-800 to-gray-900';
        if (lowerCat.includes('sport')) return 'from-orange-950 to-amber-950';
        if (lowerCat.includes('workshop') || lowerCat.includes('masterclass')) return 'from-violet-950 to-fuchsia-950';
        return 'from-slate-800 to-slate-900';
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-16 font-sans">
            
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                    {eventToEdit ? 'Edit Event' : 'Create New Event'}
                </h1>
                <p className="text-gray-500 font-medium mt-1">
                    Build your event step by step, preview it in real time, and save progress directly to the database.
                    {!eventToEdit && <span className="ml-2 text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider shadow-sm border border-blue-200">Admin Override</span>}
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                
                {/* LEFT COLUMN: FORM */}
                <div className="xl:col-span-2 space-y-6">
                    
                    {/* Stepper Navigation */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                        <div className="flex items-center min-w-max">
                            {steps.map((step, idx) => (
                                <React.Fragment key={step.id}>
                                    <button 
                                        onClick={() => setCurrentStep(step.id)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                            currentStep === step.id 
                                                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                                                : currentStep > step.id 
                                                    ? 'text-gray-600 hover:bg-gray-50' 
                                                    : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                                            currentStep === step.id ? 'bg-blue-600 text-white' : 
                                            currentStep > step.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {currentStep > step.id ? <Check size={12} strokeWidth={3} /> : step.id}
                                        </div>
                                        {step.label}
                                    </button>
                                    {idx < steps.length - 1 && (
                                        <div className="w-8 h-px bg-gray-200 mx-2 shrink-0" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Active Step Content */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[450px]">
                        
                        {/* STEP 1: Basic Information */}
                        {currentStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                                    <Type className="text-blue-600" size={24} /> Basic Information
                                </h2>
                                
                                <div className="space-y-6">
                                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-6">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-blue-600" /> Assign to Organizer (Required)
                                        </label>
                                        <select
                                            name="organizerId" required value={formData.organizerId} onChange={handleChange}
                                            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-gray-900 shadow-sm cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled>Select an Organizer...</option>
                                            {organizers.map(org => (
                                                <option key={org.id} value={org.id}>{org.name} ({org.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Title</label>
                                        <input type="text" name="title" required value={formData.title} onChange={handleChange} className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-extrabold" placeholder="e.g. Tech Summit 2026" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between"><span>Cover Image URL</span><span className="text-gray-400 font-normal tracking-normal text-[10px]">Optional</span></label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ImageIcon className="h-5 w-5 text-gray-400" /></div>
                                                <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-medium" placeholder="https://..." />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Tag className="h-5 w-5 text-gray-400" /></div>
                                                <select name="category" required value={formData.category} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-bold appearance-none cursor-pointer">
                                                    <option value="" disabled>Select a category...</option>
                                                    <optgroup label="Professional & Educational"><option value="Conference / Summit">Conference / Summit</option><option value="Workshop / Masterclass">Workshop / Masterclass</option><option value="Networking / Gala">Networking / Gala</option></optgroup>
                                                    <optgroup label="Entertainment & Arts"><option value="Concert / Live Music">Concert / Live Music</option><option value="Theater / Comedy">Theater / Comedy</option><option value="Festival / Expo">Festival / Expo</option></optgroup>
                                                    <optgroup label="Competitions & Lifestyle"><option value="Sports / E-Sports">Sports / E-Sports</option><option value="Nightlife / Party">Nightlife / Party</option></optgroup>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Date & Location */}
                        {currentStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                                    <MapPin className="text-blue-600" size={24} /> Date & Location
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-gray-400" /></div>
                                            <input type="date" name="date" required min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-bold" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Time</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Clock className="h-5 w-5 text-gray-400" /></div>
                                            <input type="time" name="time" required value={formData.time} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-bold" />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location / Venue</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin className="h-5 w-5 text-gray-400" /></div>
                                            <input type="text" name="location" required value={formData.location} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-bold" placeholder="e.g. SMX Convention Center, Manila" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Ticketing */}
                        {currentStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                                    <Ticket className="text-blue-600" size={24} /> Ticketing Options
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ticket Price (PHP)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><PhilippinePeso className="h-5 w-5 text-gray-400" /></div>
                                            <input type="number" name="price" step="0.01" min="0" required value={formData.price} onChange={handleChange} onBlur={handlePriceBlur} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-extrabold" placeholder="0 for Free" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Maximum Capacity</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Users className="h-5 w-5 text-gray-400" /></div>
                                            <input type="number" name="capacity" min="1" required value={formData.capacity} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-extrabold" placeholder="e.g. 500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Details */}
                        {currentStep === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                                    <AlignLeft className="text-blue-600" size={24} /> Event Details
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                        <textarea name="description" rows="5" required value={formData.description} onChange={handleChange} className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-medium resize-none leading-relaxed" placeholder="What can attendees expect at this event? Be descriptive!" />
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 shadow-sm">
                                        <label className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                            <Megaphone size={14} /> Important Announcement <span className="text-amber-600/70 lowercase font-medium tracking-normal">(Optional)</span>
                                        </label>
                                        <textarea name="announcement" rows="2" value={formData.announcement} onChange={handleChange} className="block w-full mt-2 px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-gray-900 font-medium resize-none" placeholder="e.g. Strictly formal attire..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: Review */}
                        {currentStep === 5 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border-8 border-emerald-100">
                                        <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Ready to Publish!</h2>
                                    <p className="text-gray-500 font-medium max-w-sm mb-8">
                                        Review your live card preview on the right. If everything looks perfect, click below to save to the database.
                                    </p>
                                    
                                    {completion < 100 && (
                                        <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold border border-amber-200 mb-8">
                                            <AlertCircle size={18} />
                                            You have missing fields. Please go back and complete them.
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}

                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all ${
                                currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm active:scale-95'
                            }`}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                        
                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md active:scale-95"
                            >
                                Next <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                onClick={handleSubmit}
                                disabled={isLoading || completion < 100} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                                {isLoading ? 'Saving...' : eventToEdit ? 'Save Changes' : 'Publish to Platform'}
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW & STATS */}
                <div className="xl:col-span-1 space-y-6 sticky top-28">
                    
                    {/* Completion Widget */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Completion</span>
                            <span className={`text-lg font-black ${completion === 100 ? 'text-emerald-600' : 'text-gray-900'}`}>{completion}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-700 ease-out ${completion === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                        <p className="text-xs font-bold text-gray-400">
                            {completion === 100 ? 'All required fields filled! ✨' : 'Complete all fields to publish.'}
                        </p>
                    </div>

                    {/* LIVE CARD PREVIEW */}
                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-200 shadow-inner">
                        <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                            <Eye size={14} /> Live Card Preview
                        </h3>
                        
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md flex flex-col pointer-events-none transition-all duration-300 transform scale-100 hover:scale-[1.02]">
                            <div className="h-44 relative overflow-hidden bg-slate-100 shrink-0">
                                {formData.imageUrl ? (
                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${getCategoryStyle(formData.category)}`}></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] uppercase tracking-widest font-extrabold rounded-md shadow-sm">
                                        {formData.category?.split('/')[0] || 'CATEGORY'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-lg font-black text-slate-950 mb-3 line-clamp-2 leading-tight">
                                    {formData.title || 'Your Event Title Here'}
                                </h3>

                                <div className="space-y-2 text-slate-500 mb-5">
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        <Calendar size={14} className="text-blue-500" />
                                        <span>
                                            {formData.date ? new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date selected'}
                                            {formData.time && ` • ${formData.time}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        <MapPin size={14} className="text-rose-500" />
                                        <span className="truncate">{formData.location || 'Event Location'}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Starts at</span>
                                    <span className="font-black text-lg text-slate-950 tracking-tight">
                                        {!formData.price || formData.price === '0' || formData.price === '0.00' ? 'FREE' : `₱${formData.price}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            {modal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center transform transition-all animate-in zoom-in duration-200">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-8 ${modal.type === 'error' ? 'bg-red-50 border-red-100/50 text-red-500' : 'bg-emerald-50 border-emerald-100/50 text-emerald-500'}`}>
                            {modal.type === 'error' ? <AlertCircle size={32} strokeWidth={2.5} /> : <CheckCircle2 size={32} strokeWidth={2.5} />}
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">{modal.title}</h2>
                        <p className="text-gray-500 font-medium mb-8">{modal.message}</p>
                        <button 
                            onClick={() => {
                                setModal({ show: false, type: '', title: '', message: '' });
                                navigate('/admin'); 
                            }}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition shadow-md active:scale-95"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}