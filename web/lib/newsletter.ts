const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface NewsletterSubscription {
  email: string;
  first_name?: string;
  last_name?: string;
  interests?: string;
  user_type_preference?: 'all' | 'client' | 'freelancer' | 'learning' | 'platform_updates';
  source?: string;
}

export interface NewsletterResponse {
  message: string;
  verification_sent?: boolean;
  subscriber_id?: number;
  already_subscribed?: boolean;
}

export interface NewsletterVerificationResponse {
  message: string;
  verified?: boolean;
  already_verified?: boolean;
}

export interface NewsletterUnsubscribeResponse {
  message: string;
  unsubscribed?: boolean;
  already_unsubscribed?: boolean;
}

class NewsletterService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async subscribe(data: NewsletterSubscription): Promise<NewsletterResponse> {
    return this.makeRequest<NewsletterResponse>('/newsletter/subscribe/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verify(token: string): Promise<NewsletterVerificationResponse> {
    return this.makeRequest<NewsletterVerificationResponse>(`/newsletter/verify/${token}/`, {
      method: 'POST',
    });
  }

  async unsubscribe(token: string): Promise<NewsletterUnsubscribeResponse> {
    return this.makeRequest<NewsletterUnsubscribeResponse>(`/newsletter/unsubscribe/${token}/`, {
      method: 'POST',
    });
  }

  // Track newsletter open (called automatically when email is opened)
  trackOpen(trackingId: string): void {
    // This creates an image request to track opens
    const img = new Image();
    img.src = `${API_BASE_URL}/newsletter/track/open/${trackingId}/`;
  }

  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get subscription preferences for authenticated users
  async getSubscriptionPreferences(): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    return this.makeRequest('/user/newsletter-preferences/', {
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
  }

  // Update subscription preferences for authenticated users
  async updateSubscriptionPreferences(preferences: Partial<NewsletterSubscription>): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    return this.makeRequest('/user/newsletter-preferences/', {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(preferences),
    });
  }
}

export const newsletterService = new NewsletterService();
export default newsletterService;