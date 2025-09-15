'use client';

import React, { useState, useEffect } from 'react';
import { LocationService, LocationData } from '@/lib/location';
import { MapPin, Loader2, RefreshCw, Globe } from 'lucide-react';

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
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {location.city && `${location.city}, `}
                  {location.state && `${location.state}, `}
                  {location.country}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
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
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
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
          <MapPin className="w-4 h-4" />
          <span>Location set successfully</span>
        </div>
      )}
    </div>
  );
}