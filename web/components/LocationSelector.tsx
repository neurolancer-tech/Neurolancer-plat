'use client';

import React, { useState, useEffect } from 'react';
import { LocationService, LocationData } from '@/lib/location';

interface LocationSelectorProps {
  onLocationChange?: (location: LocationData) => void;
  showAutoDetect?: boolean;
  className?: string;
  placeholder?: string;
}

export default function LocationSelector({ 
  onLocationChange, 
  showAutoDetect = true, 
  className = '',
  placeholder = 'Select your location...'
}: LocationSelectorProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [manualCountry, setManualCountry] = useState('');
  const [manualState, setManualState] = useState('');

  // Auto-detect location on component mount
  useEffect(() => {
    if (showAutoDetect) {
      handleAutoDetect();
    }
  }, [showAutoDetect]);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const result = await LocationService.autoDetectLocation();
      if (result.success) {
        setLocation(result);
        setManualCountry(result.country || '');
        setManualState(result.state || '');
        onLocationChange?.(result);
      }
    } catch (error) {
      console.error('Auto-detect failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualChange = () => {
    const manualLocation: LocationData = {
      success: true,
      country: manualCountry,
      state: manualState,
      city: '',
    };
    setLocation(manualLocation);
    onLocationChange?.(manualLocation);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Auto-detect section */}
      {showAutoDetect && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex-1">
            {location?.success ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-900">
                  {location.city && `${location.city}, `}
                  {location.state && `${location.state}, `}
                  {location.country}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-blue-700">
                  Auto-detect your location for better experience
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDetecting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isDetecting ? 'Detecting...' : 'Detect Location'}
          </button>
        </div>
      )}

      {/* Manual input section */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              value={manualCountry}
              onChange={(e) => {
                setManualCountry(e.target.value);
                handleManualChange();
              }}
              placeholder="Enter country"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Province
            </label>
            <input
              type="text"
              value={manualState}
              onChange={(e) => {
                setManualState(e.target.value);
                handleManualChange();
              }}
              placeholder="Enter state or province"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Location status */}
      {location?.success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>Location set successfully</span>
        </div>
      )}
    </div>
  );
}