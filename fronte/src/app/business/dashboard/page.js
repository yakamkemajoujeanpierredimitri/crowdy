"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Image as ImageIcon, Zap, Upload, TrendingUp, Users, MapPin, Lock } from 'lucide-react';

export default function BusinessDashboard() {
  const { user, isBusiness, isBusinessPlus } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isBusiness) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">This dashboard is strictly for verified business owners. Please log in with a business account or claim a venue first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-8 px-2 mt-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          <span className="font-bold text-gray-900 text-xl tracking-tight">CrowdSense</span>
        </div>
        
        <nav className="space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics Overview
          </button>
          <button 
            onClick={() => setActiveTab('highlights')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'highlights' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Manage Highlights
          </button>
          <button 
            onClick={() => setActiveTab('promote')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'promote' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Zap className="w-4 h-4" />
            Promote Locale
          </button>
        </nav>

        <div className="mt-8 px-3 py-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 font-mono mb-1">CURRENT PLAN</p>
          <p className="text-sm font-bold text-gray-800 capitalize">{user.tier.replace('_', ' ')}</p>
          {!isBusinessPlus && (
            <button className="mt-3 w-full text-xs bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition">
              Upgrade to Plus
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-500 mt-1">Manage your venue presence and drive foot traffic.</p>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-semibold">Total Profile Views</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">12,450</div>
                <p className="text-emerald-600 text-sm mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +14% this week</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-semibold">Click-to-Directions</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">842</div>
                <p className="text-emerald-600 text-sm mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +5% this week</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                {!isBusinessPlus && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10">
                    <Lock className="w-6 h-6 text-indigo-500 mb-2" />
                    <p className="text-xs font-bold text-gray-800">Advanced Analytics Locked</p>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Competitor Benchmarking</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">Top 10%</div>
                <p className="text-gray-500 text-sm mt-2">in your category</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'highlights' && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Your Highlights</h3>
                <p className="text-sm text-gray-500">Upload photos and short videos to attract visitors.</p>
              </div>
              <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                <Upload className="w-4 h-4" />
                Upload New
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-500 cursor-pointer transition-colors">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">Drop image here</span>
              </div>
              
              {/* Dummy images */}
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80" alt="Highlight" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="text-white text-xs font-bold bg-red-600 px-3 py-1 rounded">Delete</button>
                </div>
              </div>
            </div>
            
            {!isBusinessPlus && (
              <div className="mt-6 bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">Unlock Unlimited Video Reels</h4>
                  <p className="text-xs text-indigo-700 mt-1">Free business accounts are limited to 5 standard photos. Upgrade to Business Plus to upload immersive videos and unlimited highlights.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'promote' && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Promote Your Locale</h3>
            <p className="text-gray-500 text-sm mb-8">Boost your visibility in search and nearby discovery. Promoted venues appear at the top of category searches.</p>
            
            <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg">
                Most Popular
              </div>
              <h4 className="text-lg font-bold text-emerald-900">Weekend Boost</h4>
              <p className="text-emerald-700 text-sm mt-1 mb-4">Appear as a 'Sponsored' pin on the map from Friday 5PM to Sunday 11PM.</p>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-3xl font-bold text-emerald-900">$49</span>
                <span className="text-emerald-700 text-sm pb-1">/ weekend</span>
              </div>
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-colors">
                Activate Boost
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900">Pay-Per-Click Promotion</h4>
              <p className="text-gray-500 text-sm mt-1 mb-4">Set a daily budget. You only pay when a user taps your sponsored pin or card.</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Daily Budget</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">$</span>
                    <input type="number" defaultValue={10} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
              
              <button className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-lg transition-colors">
                Start Campaign
              </button>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 border border-gray-200">
              <strong className="text-gray-700 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Note on Trust:</strong>
              Promotions only affect your visibility and ranking. You cannot pay to alter your live Crowd Score.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
