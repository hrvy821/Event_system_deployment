import React, { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { api } from '../../lib/api';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScannerPage() {
  const [scanStatus, setScanStatus] = useState('scanning'); // 'scanning', 'processing', 'success', 'error'
  const [scannedData, setScannedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 🌟 NEW: A strict lock to prevent double-scanning
  const isProcessing = useRef(false);

  // 🌟 NEW: Pre-load beep sounds
  const successAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
  const errorAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');

  const handleScan = async (detectedCodes) => {
    // If we are already processing a ticket, ignore all new camera frames!
    if (isProcessing.current || !detectedCodes || detectedCodes.length === 0) return;

    // Lock the scanner immediately
    isProcessing.current = true;
    
    const rawCode = detectedCodes[0].rawValue;
    const code = rawCode.trim().replace(/\s+/g, '-');
    validateTicket(code, rawCode);
  };

  const validateTicket = async (code, rawCode) => {
    setScanStatus('processing'); 

    try {
      const response = await api.post('/attendees/scan', {
        ticketId: code
      });

      if (response.data.success) {
        // Success logic
        successAudio.play().catch(e => console.log('Audio play failed', e));
        setScanStatus('success');
        setScannedData(response.data.attendee);
      } else {
        // Invalid ticket logic
        errorAudio.play().catch(e => console.log('Audio play failed', e));
        setScanStatus('error');
        setErrorMessage("Ticket not found or already scanned.");
        setScannedData({ ticketId: code, rawValue: rawCode });
      }

    } catch (error) {
      errorAudio.play().catch(e => console.log('Audio play failed', e));
      console.error("Scan validation error:", error);
      setScanStatus('error');
      setErrorMessage("Network or Server Error.");
      setScannedData({ ticketId: code, rawValue: rawCode });
    }
  };

  const resetScanner = () => {
    setScanStatus('scanning');
    setScannedData(null);
    // Unlock the scanner so it can read again
    isProcessing.current = false;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between z-10 bg-black/50 backdrop-blur-md sticky top-0">
        <Link to="/organizer/attendees" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold">Check-in Scanner</h1>
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* STATE 1: SCANNING */}
        {scanStatus === 'scanning' && (
          <div className="w-full max-w-md aspect-square relative border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl">
            <Scanner 
              onScan={handleScan}
              components={{ audio: false, finder: false }}
              styles={{ container: { width: '100%', height: '100%' } }}
            />
            <div className="absolute inset-0 border-[40px] border-black/50 flex items-center justify-center">
               <div className="w-64 h-64 border-4 border-blue-500 rounded-lg animate-pulse relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 px-3 py-1 text-xs font-bold rounded-full shadow-lg">
                    SCAN QR CODE
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* STATE 2: PROCESSING */}
        {scanStatus === 'processing' && (
          <div className="text-center">
            <RefreshCw className="animate-spin mb-4 mx-auto text-blue-500" size={48} />
            <p className="text-lg font-medium text-blue-200">Verifying Ticket...</p>
          </div>
        )}

        {/* STATE 3: SUCCESS */}
        {scanStatus === 'success' && (
          <div className="bg-green-600 w-full h-full absolute inset-0 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="bg-white rounded-full p-6 mb-6 shadow-2xl">
              <CheckCircle size={64} className="text-green-600" />
            </div>
            <h2 className="text-4xl font-extrabold mb-2 tracking-tight">Access Granted</h2>
            <p className="text-green-100 text-xl font-medium mb-8">{scannedData.name}</p>
            
            <div className="bg-white/20 rounded-xl p-6 w-full max-w-sm backdrop-blur-sm border border-white/30 shadow-inner">
              <p className="text-sm text-green-100 uppercase font-semibold tracking-wider">Status</p>
              <p className="text-2xl font-bold mt-1 text-white uppercase">{scannedData.status}</p>
              <div className="mt-4 border-t border-white/30 pt-4">
                 <p className="text-sm text-green-100 font-mono">ID: {scannedData.ticketId}</p>
              </div>
            </div>

            <button onClick={resetScanner} className="mt-12 bg-white text-green-800 px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:bg-gray-100 transition transform hover:scale-105 active:scale-95">
              <RefreshCw size={20} /> Scan Next
            </button>
          </div>
        )}

        {/* STATE 4: ERROR */}
        {scanStatus === 'error' && (
          <div className="bg-red-600 w-full h-full absolute inset-0 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="bg-white rounded-full p-6 mb-6 shadow-2xl">
              <XCircle size={64} className="text-red-600" />
            </div>
            <h2 className="text-4xl font-extrabold mb-2 tracking-tight">Invalid Ticket</h2>
            <p className="text-red-100 text-lg font-medium mb-8 text-center">{errorMessage}</p>
            
            <div className="bg-white/20 rounded-xl p-6 w-full max-w-sm backdrop-blur-sm border border-white/30 text-center shadow-inner">
              <p className="text-sm text-red-100 uppercase font-semibold tracking-wider">Scanned Value</p>
              <p className="font-mono font-bold mt-2 text-xl break-all bg-black/20 p-2 rounded">{scannedData?.rawValue}</p>
            </div>

            <button onClick={resetScanner} className="mt-12 bg-white text-red-800 px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:bg-gray-100 transition transform hover:scale-105 active:scale-95">
              <RefreshCw size={20} /> Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
