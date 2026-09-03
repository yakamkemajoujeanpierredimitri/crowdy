"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function BusinessClaimPage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState('');
  const [documents, setDocuments] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const res = await fetch('http://localhost:3001/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId,
          userId: user.id,
          documents,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit claim');
      }

      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-12 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Claim Your Venue</h1>
      </div>
      
      <p className="text-gray-600 mb-8">
        Take control of your CrowdSense presence. Claiming your venue allows you to upload Highlights (photos/video) and view engagement analytics.
      </p>

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-green-900 mb-2">Claim Submitted!</h2>
          <p className="text-green-700">
            Our team will review your verification documents. You will be notified once your business account is activated.
          </p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Venue ID</label>
            <input 
              type="text" 
              required
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can find your Venue ID in the URL when viewing your venue on the map.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Documents</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
              <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Upload a utility bill or business license</p>
              <p className="text-xs text-gray-400">(Mock upload: just paste a text or link for now)</p>
            </div>
            <textarea
              required
              value={documents}
              onChange={(e) => setDocuments(e.target.value)}
              placeholder="Mock Document URL or Verification Text..."
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Claim'}
          </button>
        </form>
      )}
    </div>
  );
}
