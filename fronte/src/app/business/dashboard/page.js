"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Image as ImageIcon, Zap, Upload, TrendingUp, Users, MapPin, Lock } from 'lucide-react';

export default function BusinessDashboard() {
  const { user, isBusiness, isBusinessPlus } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isBusiness) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 p-6">
        <div className="text-center max-w-md bg-neutral-900 p-8 rounded-2xl shadow-xl border border-neutral-800 text-white">
          <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            This dashboard is strictly for verified business owners. Please log in with a business account or claim a venue first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 p-4">
        <div className="flex items-center gap-2 mb-8 px-2 mt-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">
            Crowd<span className="text-yellow-400">Sense</span>
          </span>
        </div>
        
        <nav className="space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-semibold' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics Overview
          </button>
          <button 
            onClick={() => setActiveTab('highlights')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === 'highlights' 
                ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-semibold' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Manage Highlights
          </button>
          <button 
            onClick={() => setActiveTab('promote')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === 'promote' 
                ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-semibold' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Promote Locale
          </button>
        </nav>

        <div className="mt-8 px-3.5 py-4 bg-neutral-950 rounded-xl border border-neutral-800">
          <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider mb-1">CURRENT PLAN</p>
          <p className="text-sm font-bold text-white capitalize">{user.tier.replace('_', ' ')}</p>
          {!isBusinessPlus && (
            <button className="mt-3 w-full text-xs bg-yellow-400 hover:bg-yellow-300 text-black py-2 rounded-lg font-bold transition shadow-sm cursor-pointer">
              Upgrade to Plus
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {user.name}</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage your venue presence and drive foot traffic.</p>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-sm">
                <div className="flex items-center gap-3 text-neutral-400 mb-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-mono uppercase tracking-wider">Total Profile Views</span>
                </div>
                <div className="text-3xl font-bold text-white font-mono">12,450</div>
                <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" /> +14% this week
                </p>
              </div>
              
              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-sm">
                <div className="flex items-center gap-3 text-neutral-400 mb-2">
                  <MapPin className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-mono uppercase tracking-wider">Click-to-Directions</span>
                </div>
                <div className="text-3xl font-bold text-white font-mono">842</div>
                <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" /> +5% this week
                </p>
              </div>

              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-sm relative overflow-hidden">
                {!isBusinessPlus && (
                  <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10">
                    <Lock className="w-6 h-6 text-yellow-400 mb-2" />
                    <p className="text-xs font-bold text-white">Advanced Analytics Locked</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Upgrade to Business Plus</p>
                  </div>
                )}
                <div className="flex items-center gap-3 text-neutral-400 mb-2">
                  <BarChart3 className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-mono uppercase tracking-wider">Competitor Benchmarking</span>
                </div>
                <div className="text-3xl font-bold text-white font-mono">Top 10%</div>
                <p className="text-neutral-400 text-xs mt-2 font-mono">in your category</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'highlights' && (
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Your Highlights</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Upload photos and short videos to attract visitors.</p>
              </div>
              <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer">
                <Upload className="w-4 h-4" />
                Upload New
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="aspect-square bg-neutral-950 rounded-xl border border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-400 hover:border-yellow-400/50 hover:text-white cursor-pointer transition">
                <Upload className="w-8 h-8 mb-2 text-neutral-500" />
                <span className="text-xs font-semibold">Drop image here</span>
              </div>
              
              {/* Media images */}
              <div className="aspect-square bg-neutral-950 rounded-xl overflow-hidden relative group border border-neutral-800">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80" alt="Highlight" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="text-white text-xs font-bold bg-red-600 px-3 py-1 rounded cursor-pointer">Delete</button>
                </div>
              </div>
            </div>
            
            {!isBusinessPlus && (
              <div className="mt-6 bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Unlock Unlimited Video Reels</h4>
                  <p className="text-xs text-neutral-400 mt-1">Free business accounts are limited to standard photos. Upgrade to Business Plus to upload immersive videos and unlimited highlights.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'promote' && (
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-sm max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Promote Your Locale</h3>
            <p className="text-neutral-400 text-xs mb-8">Boost your visibility in search and nearby discovery. Promoted venues appear at the top of category searches.</p>
            
            <div className="border border-yellow-400/40 bg-neutral-950 rounded-2xl p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg font-mono">
                Most Popular
              </div>
              <h4 className="text-lg font-bold text-white">Weekend Boost</h4>
              <p className="text-neutral-400 text-xs mt-1 mb-4">Appear as a 'Sponsored' pin on the map from Friday 5PM to Sunday 11PM.</p>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-3xl font-bold text-yellow-400 font-mono">$49</span>
                <span className="text-neutral-400 text-xs pb-1">/ weekend</span>
              </div>
              <button className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold font-mono py-2.5 rounded-xl transition cursor-pointer">
                Activate Boost
              </button>
            </div>

            <div className="border border-neutral-800 bg-neutral-950 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-white">Pay-Per-Click Promotion</h4>
              <p className="text-neutral-400 text-xs mt-1 mb-4">Set a daily budget. You only pay when a user taps your sponsored pin or card.</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-mono uppercase text-neutral-400 tracking-wider">Daily Budget</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-neutral-400">$</span>
                    <input type="number" defaultValue={10} className="w-24 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white" />
                  </div>
                </div>
              </div>
              
              <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold font-mono py-2.5 rounded-xl transition cursor-pointer">
                Start Campaign
              </button>
            </div>

            <div className="mt-8 p-4 bg-neutral-950 rounded-xl text-xs text-neutral-400 border border-neutral-800">
              <strong className="text-yellow-400 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Note on Trust:</strong>
              Promotions only affect your visibility and ranking. You cannot pay to alter your live Crowd Score.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
