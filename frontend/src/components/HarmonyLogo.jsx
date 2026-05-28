import React from 'react';

export default function HarmonyLogo({ className = "w-10 h-10" }) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Deep Blue to Violet Gradient */}
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" /> 
          <stop offset="100%" stopColor="#7C3AED" /> 
        </linearGradient>
        {/* Magenta to Indigo Gradient */}
        <linearGradient id="grad2" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#D946EF" /> 
          <stop offset="100%" stopColor="#4F46E5" /> 
        </linearGradient>
      </defs>
      
      {/* Left Pillar */}
      <rect x="22" y="25" width="26" height="70" rx="13" fill="url(#grad1)" />
      
      {/* Right Pillar */}
      <rect x="72" y="45" width="26" height="50" rx="13" fill="url(#grad2)" />
      
      {/* The Connecting Bridge (Forms the 'H') */}
      <path d="M35 60 L85 60" stroke="url(#grad1)" strokeWidth="26" strokeLinecap="round" />
      
      {/* Spotlight / Event Dot (Floating above right pillar) */}
      <circle cx="85" cy="25" r="12" fill="#F472B6" />
    </svg>
  );
}