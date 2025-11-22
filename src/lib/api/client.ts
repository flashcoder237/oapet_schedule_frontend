// src/lib/api/client.ts
import { getApiUrl } from './config';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private requestCache = new Map<string, { data: any; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  public setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  public clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    // Vider le cache lors de la déconnexion
    this.clearCache();
  }

  public clearCache() {
    this.requestCache.clear();
    this.pendingRequests.clear();
  }

  public invalidateCache(pattern?: string) {
    if (!pattern) {
      this.clearCache();
      return;
    }
    
    for (const key of this.requestCache.keys()) {
      if (key.includes(pattern)) {
        this.requestCache.delete(key);
      }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    return headers;
  }

  private getCacheKey(method: string, url: string, data?: any): string {
    return `${method}:${url}:${data ? JSON.stringify(data) : ''}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    this.requestCache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.requestCache.set(key, { data, timestamp: Date.now() });
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Gestion spéciale pour les erreurs d'authentification
      if (response.status === 401) {
        // Token expiré ou invalide, nettoyer l'authentification
        this.clearToken();
        // Recharger la page pour déclencher la redirection vers login
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }

      const errorText = await response.text();
      let errorMessage: string;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.error || errorData.message || 'Une erreur est survenue';
      } catch {
        errorMessage = errorText || `Erreur ${response.status}: ${response.statusText}`;
      }

      // Créer une erreur avec le statut HTTP attaché
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = { status: response.status, statusText: response.statusText };

      throw error;
    }

    const text = await response.text();
    if (!text) return {} as T;

    try {
      return JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>, useCache = true): Promise<T> {
    const url = new URL(getApiUrl(endpoint));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const urlString = url.toString();
    const cacheKey = this.getCacheKey('GET', urlString);

    // Vérifier le cache
    if (useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }

      // Vérifier les requêtes en cours
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) {
        return pending;
      }
    }

    // Créer une nouvelle requête
    const requestPromise = (async () => {
      try {
        const response = await fetch(urlString, {
          method: 'GET',
          headers: this.getHeaders(),
          cache: 'no-store', // Prevent browser caching
        });

        const data = await this.handleResponse<T>(response);
        
        // Mettre en cache si c'est un succès
        if (useCache) {
          this.setCache(cacheKey, data);
        }
        
        return data;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(getApiUrl(endpoint), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(getApiUrl(endpoint), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(getApiUrl(endpoint), {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

// Instance globale du client API
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');

export default apiClient;