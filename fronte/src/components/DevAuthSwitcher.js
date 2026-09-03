"use client";

import { useAuth } from '@/contexts/AuthContext';

export default function DevAuthSwitcher() {
  const { user, switchRole, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg z-50 shadow-xl">Loading...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 p-4 rounded-lg shadow-2xl z-50 text-sm w-72">
      <h3 className="font-semibold text-gray-800 mb-2">Dev: Role Switcher</h3>
      <div className="mb-3 text-xs text-gray-500">
        Current: <span className="font-bold text-blue-600">{user.role} ({user.tier})</span>
      </div>
      
      <div className="space-y-2">
        <button 
          onClick={logout}
          className="w-full py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-left"
        >
          👤 Anonymous (Free)
        </button>
        <button 
          onClick={() => switchRole('user', 'premium')}
          className="w-full py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-left"
        >
          ⭐ Premium User
        </button>
        <button 
          onClick={() => switchRole('business', 'free')}
          className="w-full py-1 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-left"
        >
          🏪 Business (Free)
        </button>
        <button 
          onClick={() => switchRole('business', 'business_plus')}
          className="w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-left"
        >
          🚀 Business Plus
        </button>
      </div>
    </div>
  );
}
