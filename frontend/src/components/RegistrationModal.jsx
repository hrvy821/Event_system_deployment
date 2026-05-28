import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, User, Mail, Ticket, Lock, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';

// 🌟 FIX: Added organizerId to the props so we know who to notify!
export default function RegistrationModal({ isOpen, onClose, eventTitle, eventId, eventPrice, organizerId, userInfo = null }) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  
  const [paymentStep, setPaymentStep] = useState('idle'); 
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    if (userInfo) {
      setFormData({ name: userInfo.name || '', email: userInfo.email || '' });
    } else {
      setFormData({ name: '', email: '' });
    }
    if (isOpen) setPaymentStep('idle');
  }, [userInfo, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentStep('processing');

    try {
      const checkResponse = await api.get(`/attendees/check-registration?email=${formData.email}&eventId=${eventId}`);
      
      if (checkResponse.data.isRegistered) {
        setPaymentStep('idle');
        setModal({ show: true, type: 'error', title: 'Already Registered', message: 'You have already registered for this event.' });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      setPaymentStep('verifying'); 
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 1. Register the attendee
      await api.post('/attendees', {
        ...formData,
        eventId: eventId.toString(),
        amountPaid: eventPrice || '0' 
      });

      // 🌟 2. NEW: Fire the Notification to the Organizer!
      if (organizerId) {
        await api.post('/notifications', {
            userId: organizerId,
            title: 'New Ticket Sold! 🎟️',
            message: `${formData.name} just registered for "${eventTitle}".`,
            type: 'TICKET' 
        });
      }
      
      setPaymentStep('done');
      setModal({ show: true, type: 'success', title: 'Payment Successful!', message: `Your digital ticket for ${eventTitle} has been sent to your email.` });
      
    } catch (error) {
      console.error("Registration failed:", error);
      setPaymentStep('idle');
      setModal({ show: true, type: 'error', title: 'Transaction Failed', message: 'There was an error processing your request. Please try again.' });
    }
  };

  const isFree = eventPrice === '0' || eventPrice === 'Free' || !eventPrice;
  const displayPrice = isFree ? 'Free' : `₱${eventPrice}`;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all relative">
        
        {paymentStep !== 'idle' && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
             {paymentStep === 'done' ? (
                <ShieldCheck size={64} className="text-green-500 mb-4 animate-in zoom-in" />
             ) : (
                <Loader2 size={64} className="text-blue-600 mb-4 animate-spin" />
             )}
             
             <h2 className="text-2xl font-bold text-gray-900 mb-2">
               {paymentStep === 'processing' && 'Connecting to Gateway...'}
               {paymentStep === 'verifying' && 'Securing Payment...'}
               {paymentStep === 'done' && 'Payment Complete!'}
             </h2>
             <p className="text-gray-500 font-medium">
               {paymentStep !== 'done' ? 'Please do not close this window.' : 'Generating your ticket...'}
             </p>
          </div>
        )}

        <div className="bg-gray-50 px-6 py-5 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={20} /> Secure Checkout
          </h3>
          <button onClick={onClose} disabled={paymentStep !== 'idle'} className="bg-gray-200 hover:bg-gray-300 p-1.5 rounded-full transition disabled:opacity-50">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4">Order Summary</h4>
            <div className="flex justify-between items-start gap-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-0.5">
                  <Ticket size={18} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 leading-tight">{eventTitle}</p>
                  <p className="text-sm text-gray-500 mt-1">General Admission</p>
                </div>
              </div>
              <span className="font-bold text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded text-sm">1x</span>
            </div>
            
            <div className="border-t border-blue-100 mt-4 pt-4 flex justify-between items-end">
              <span className="text-sm font-semibold text-gray-600">Total Due</span>
              <span className="text-2xl font-extrabold text-green-600 leading-none">{displayPrice}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Attendee Information</h4>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input required name="name" type="text"
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl font-medium ${userInfo ? 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none'}`}
                  onChange={handleChange} value={formData.name} readOnly={!!userInfo} 
                />
                {userInfo && <Lock className="absolute right-4 top-3.5 text-gray-400" size={16} />}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input required name="email" type="email"
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl font-medium ${userInfo ? 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none'}`}
                  onChange={handleChange} value={formData.email} readOnly={!!userInfo} 
                />
                {userInfo && <Lock className="absolute right-4 top-3.5 text-gray-400" size={16} />}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={paymentStep !== 'idle'}
            className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 transition-all shadow-md mt-2 flex justify-center items-center gap-2"
          >
            {isFree ? <Ticket size={20} /> : <CreditCard size={20} />}
            {isFree ? 'Get Free Ticket' : `Pay ${displayPrice}`}
          </button>
        </form>
      </div>
    </div>

    {modal.show && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${modal.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
             <ShieldCheck size={32} />
          </div>
          <h2 className={`text-xl font-extrabold mb-2 ${modal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {modal.title}
          </h2>
          <p className="text-gray-600 mb-6 font-medium">{modal.message}</p>
          <button 
            onClick={() => {
              setModal({ show: false, type: '', title: '', message: '' });
              if (modal.type === 'success') onClose();
            }}
            className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold transition shadow-sm"
          >
            Continue
          </button>
        </div>
      </div>
    )}
    </>
  );
}
