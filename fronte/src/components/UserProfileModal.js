'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Award, Activity, AlertCircle, Check } from 'lucide-react';
import { validateUsername } from '../utils/helpers';

export default function UserProfileModal({ isOpen, onClose, userId, setUserId }) {
  const [inputValue, setInputValue] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue(userId || '');
      setTouched(false);
    }
  }, [isOpen, userId]);

  const validation = useMemo(() => {
    return validateUsername(inputValue);
  }, [inputValue]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (validation.isValid) {
      setUserId(inputValue.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-900/60 p-1.5 rounded-full border border-neutral-800 z-10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">Reporter Profile</h2>
            <p className="text-[10px] text-neutral-400 font-mono">Manage your CrowdSense identity</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1.5 font-semibold">
              Reporter ID / Username
            </label>
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder="e.g. UrbanExplorer99"
              className={`w-full px-3 py-2 text-sm bg-neutral-900/90 border rounded-lg text-white placeholder-neutral-500 focus:outline-none transition ${
                touched && !validation.isValid
                  ? 'border-red-500/80 focus:border-red-500'
                  : 'border-neutral-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30'
              }`}
            />
            {touched && !validation.isValid ? (
              <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {validation.error}
              </p>
            ) : (
              <p className="text-[9px] text-neutral-400 mt-1 font-mono leading-tight">
                Backend requirements: 3-30 chars (letters, numbers, hyphens, dots, underscores).
              </p>
            )}
          </div>

          {/* User Reputation & Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex flex-col items-center justify-center">
              <Award className="w-5 h-5 text-yellow-400 mb-1" />
              <span className="text-xs font-bold text-white font-mono">0.5</span>
              <span className="text-[8px] text-neutral-400 uppercase tracking-widest">Reputation</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex flex-col items-center justify-center">
              <Activity className="w-5 h-5 text-neutral-400 mb-1" />
              <span className="text-xs font-bold text-white font-mono">Verified</span>
              <span className="text-[8px] text-neutral-400 uppercase tracking-widest">Status</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button 
            onClick={handleSave}
            disabled={!validation.isValid}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold font-mono py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            SAVE PROFILE
          </button>
        </div>
      </div>
    </div>
  );
}
