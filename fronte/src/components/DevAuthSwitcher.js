"use client";

import { useAuth } from '@/contexts/AuthContext';

export default function DevAuthSwitcher() {
  const { user, switchRole, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="fixed bottom-4 right-4 bg-black/90 text-yellow-400 p-4 rounded-lg z-50 shadow-xl border border-neutral-800">Loading...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-neutral-950 border border-neutral-800 p-4 rounded-xl shadow-2xl z-50 text-sm w-72 text-white">
      <h3 className="font-semibold text-white mb-1 flex items-center justify-between">
        <span>Dev: Role Switcher</span>
        <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
      </h3>
      <div className="mb-3 text-xs text-neutral-400">
        Current: <span className="font-bold text-yellow-400">{user.role} ({user.tier})</span>
      </div>
      
      <div className="space-y-1.5">
        <button 
          onClick={logout}
          className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition border cursor-pointer ${
            user.role === 'user' && user.tier === 'free'
              ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400 font-bold'
              : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          👤 Anonymous (Free)
        </button>
        <button 
          onClick={() => switchRole('user', 'premium')}
          className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition border cursor-pointer ${
            user.role === 'user' && user.tier === 'premium'
              ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400 font-bold'
              : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          ⭐ Premium User
        </button>
        <button 
          onClick={() => switchRole('business', 'free')}
          className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition border cursor-pointer ${
            user.role === 'business' && user.tier === 'free'
              ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400 font-bold'
              : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          🏪 Business (Free)
        </button>
        <button 
          onClick={() => switchRole('business', 'business_plus')}
          className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition border cursor-pointer ${
            user.role === 'business' && user.tier === 'business_plus'
              ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400 font-bold'
              : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          🚀 Business Plus
        </button>
      </div>
    </div>
  );
}
