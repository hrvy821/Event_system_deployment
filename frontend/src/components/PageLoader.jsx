import React, { useState, useEffect } from 'react';
import HarmonyLogo from './HarmonyLogo'; 

export default function PageLoader({ children, message = "Preparing your workspace..." }) {
  const [isLoading, setIsLoading] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Start fading out the loader after 1.5 seconds
    const fadeTimer = setTimeout(() => setFade(true), 1500);
    
    // Completely remove it from the DOM after 1.8 seconds (allowing 0.3s for the fade transition)
    const removeTimer = setTimeout(() => setIsLoading(false), 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {isLoading && (
        <div 
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 transition-opacity duration-300 ease-in-out ${
            fade ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* INJECTED CSS FOR LOADER ANIMATIONS */}
          <style>{`
            @keyframes fast-flip {
              0%, 10% { transform: perspective(1000px) rotateY(0deg); }
              45%, 55% { transform: perspective(1000px) rotateY(180deg); }
              90%, 100% { transform: perspective(1000px) rotateY(360deg); }
            }
            .animate-fast-flip {
              animation: fast-flip 2.5s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
              transform-style: preserve-3d;
            }
            .backface-hidden { 
              backface-visibility: hidden; 
              -webkit-backface-visibility: hidden; 
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            .animate-shimmer {
              animation: shimmer 1.5s infinite linear;
            }
          `}</style>

          {/* 🌟 3D Flipping Logo */}
          <div className="w-24 h-24 mb-8 relative">
            <div className="w-full h-full animate-fast-flip">
              <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center">
                <HarmonyLogo className="w-16 h-16 drop-shadow-xl" />
              </div>
              <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center rotate-y-180">
                <HarmonyLogo className="w-16 h-16 drop-shadow-xl" />
              </div>
            </div>
          </div>

          {/* Text & Loading Bar */}
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-4 animate-pulse">
            {message}
          </h2>
          
          <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-shimmer"></div>
          </div>

        </div>
      )}

      {/* Render the actual dashboard content behind the loader */}
      <div className={`${isLoading ? 'h-screen overflow-hidden' : 'animate-in fade-in duration-500'}`}>
        {children}
      </div>
    </>
  );
}