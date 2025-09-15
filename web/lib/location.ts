const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neurolancer-plat.onrender.com';

export interface LocationData {
  success: boolean;
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  locality?: string;
  full_address?: string;
  ip_address?: string;
  error?: string;
  message?: string;
}

export class LocationService {
  /**
   * Get user's location by IP address
   */
  static async getLocationByIP(): Promise<LocationData> {
    try {
      console.log('Fetching location by IP from:', `${API_BASE_URL}/api/location/ip/`);
      
      const response = await fetch(`${API_BASE_URL}/location/ip/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('IP location response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('IP location error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('IP location result:', result);
      return result;
    } catch (error) {
      console.error('Location by IP error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get location by IP'
      };
    }
  }

  /**
   * Get user's location by coordinates (GPS)
   */
  static async getLocationByCoordinates(latitude: number, longitude: number): Promise<LocationData> {
    try {
      console.log('Fetching location by coordinates:', latitude, longitude);
      
      const response = await fetch(`${API_BASE_URL}/location/coordinates/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude
        }),
      });

      console.log('Coordinates location response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Coordinates location error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Coordinates location result:', result);
      return result;
    } catch (error) {
      console.error('Location by coordinates error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get location by coordinates'
      };
    }
  }

  /**
   * Get user's current location using browser geolocation
   */
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: 'Geolocation not supported',
          message: 'Browser does not support geolocation'
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const result = await this.getLocationByCoordinates(latitude, longitude);
          resolve(result);
        },
        async (error) => {
          console.warn('Geolocation error, falling back to client-side IP:', error);
          // Fallback to client-side location
          const result = await this.getClientSideLocation();
          resolve(result);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Auto-detect user location with smart fallback
   */
  static async autoDetectLocation(): Promise<LocationData> {
    // Skip GPS for now, go directly to IP-based detection for reliability
    console.log('Using IP-based location detection');
    return await this.getClientSideLocation();
  }

  /**
   * Get location using reliable free API
   */
  static async getClientSideLocation(): Promise<LocationData> {
    try {
      console.log('Trying ipify + ipapi.co for location detection');
      
      // First get IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const userIP = ipData.ip;
      
      console.log('User IP:', userIP);
      
      // Then get location data using the IP
      const locationResponse = await fetch(`https://ipapi.co/${userIP}/json/`);
      const locationData = await locationResponse.json();
      
      console.log('Location data:', locationData);
      
      if (locationData.country_name) {
        return {
          success: true,
          country: locationData.country_name,
          country_code: locationData.country_code,
          state: locationData.region,
          city: locationData.city,
          ip_address: userIP
        };
      }
      
      throw new Error('No location data received');
      
    } catch (error) {
      console.error('Location detection failed:', error);
      
      // Fallback: Return a default location or let user input manually
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Could not detect location automatically. Please enter manually.'
      };
    }
  }
}