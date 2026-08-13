'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Award, Activity } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose, userId, setUserId }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(userId || '');
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (inputValue.trim()) {
      setUserId(inputValue.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 bg-slate-900/50 p-1.5 rounded-full border border-slate-800 z-10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">Reporter Profile</h2>
            <p className="text-[10px] text-slate-400 font-mono">Manage your CrowdSense identity</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1.5">
              Reporter ID / Username
            </label>
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. UrbanExplorer99"
              className="w-full px-3 py-2 text-sm bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <p className="text-[9px] text-slate-500 mt-1 font-mono leading-tight">
              This ID is used to track your reputation score across reports. Keeping a consistent ID builds trust!
            </p>
          </div>

          {/* Simulated Stats for MVP - Ideally fetched from backend later */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center">
              <Award className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-xs font-bold text-white font-mono">0.5</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-widest">Reputation</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400 mb-1" />
              <span className="text-xs font-bold text-white font-mono">--</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-widest">Reports</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button 
            onClick={handleSave}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono py-2 rounded-lg transition"
          >
            SAVE PROFILE
          </button>
        </div>
      </div>
    </div>
  );
}
