// API Configuration
const API_BASE_URL = 'http://localhost:3001';

/**
 * Fetches data from the API with error handling
 */
const fetchFromApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API endpoints
export const api = {
  // Health check
  health: () => fetchFromApi<{ status: string }>('/health'),

  // Producers
  getProducers: () => fetchFromApi<{
    success: boolean;
    data: Array<{
      id: number;
      user_id: number;
      plant_name: string;
      location: string;
      renewable_source: string;
      capacity_mw: number;
      monthly_limit: number;
      kyc_verified: boolean;
      wallet_address: string;
      created_at: string;
    }>;
    count: number;
  }>('/api/producers'),

  // Marketplace
  getMarketplaceListings: () => fetchFromApi<{
    success: boolean;
    data: Array<{
      id: number;
      listing_id: number;
      seller_address: string;
      amount: string;
      price_per_unit: string;
      is_active: boolean;
      created_at: string;
    }>;
    count: number;
  }>('/api/marketplace/listings'),

  getMarketplaceStats: () => fetchFromApi<{
    success: boolean;
    data: {
      totalListings: number;
      activeListings: number;
      totalVolume: number;
      platformFee: number;
    };
  }>('/api/marketplace/stats'),
};

export default api;
