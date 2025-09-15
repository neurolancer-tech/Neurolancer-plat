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
    try {
      // Try GPS first for better accuracy
      const gpsResult = await this.getCurrentLocation();
      
      if (gpsResult.success) {
        return gpsResult;
      }

      // Fallback to direct client-side IP location
      console.log('GPS failed, using client-side IP location');
      return await this.getClientSideLocation();
      
    } catch (error) {
      console.error('Auto-detect location error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to detect location'
      };
    }
  }

  /**
   * Get location using client-side free APIs directly
   */
  static async getClientSideLocation(): Promise<LocationData> {
    const services = [
      {
        url: 'https://ipapi.co/json/',
        parser: (data: any) => ({
          success: true,
          country: data.country_name || '',
          country_code: data.country_code || '',
          state: data.region || '',
          city: data.city || '',
          ip_address: data.ip || ''
        })
      },
      {
        url: 'http://ip-api.com/json/',
        parser: (data: any) => ({
          success: data.status === 'success',
          country: data.country || '',
          country_code: data.countryCode || '',
          state: data.regionName || '',
          city: data.city || '',
          ip_address: data.query || ''
        })
      }
    ];

    for (const service of services) {
      try {
        console.log(`Trying client-side service: ${service.url}`);
        
        const response = await fetch(service.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Service response:`, data);
        
        const result = service.parser(data);
        if (result.success && result.country) {
          console.log(`Successfully got location:`, result);
          return result;
        }
      } catch (error) {
        console.error(`Service ${service.url} failed:`, error);
        continue;
      }
    }

    return {
      success: false,
      error: 'All location services failed',
      message: 'Could not determine location'
    };
  }
}