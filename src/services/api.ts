/**
 * API service for WhimsyWall
 * Handles all HTTP requests and API interactions
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

const makeRequest = async <T,>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
};

export const apiService = {
  /**
   * GET request
   */
  get: async <T,>(endpoint: string, headers?: Record<string, string>) => {
    return makeRequest<T>(endpoint, { method: 'GET', headers });
  },

  /**
   * POST request
   */
  post: async <T,>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>
  ) => {
    return makeRequest<T>(endpoint, { method: 'POST', body, headers });
  },

  /**
   * PUT request
   */
  put: async <T,>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>
  ) => {
    return makeRequest<T>(endpoint, { method: 'PUT', body, headers });
  },

  /**
   * DELETE request
   */
  delete: async <T,>(endpoint: string, headers?: Record<string, string>) => {
    return makeRequest<T>(endpoint, { method: 'DELETE', headers });
  },

  /**
   * PATCH request
   */
  patch: async <T,>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>
  ) => {
    return makeRequest<T>(endpoint, { method: 'PATCH', body, headers });
  },
};
