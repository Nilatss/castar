/**
 * Castar — API Client
 * Currently a stub for future backend integration.
 * All data operations go through local SQLite for now.
 */

const BASE_URL = ''; // Will be set when backend is ready

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) =>
        url.searchParams.append(key, value)
      );
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { ...this.getHeaders(), ...config?.headers },
    });

    if (!response.ok) throw new Error(`GET ${endpoint} failed: ${response.status}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`POST ${endpoint} failed: ${response.status}`);
    return response.json();
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`PUT ${endpoint} failed: ${response.status}`);
    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error(`DELETE ${endpoint} failed: ${response.status}`);
  }
}

export const apiClient = new ApiClient(BASE_URL);
