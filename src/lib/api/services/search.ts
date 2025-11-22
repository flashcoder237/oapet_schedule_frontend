// src/lib/api/services/search.ts
import { apiClient } from '../client';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'teacher' | 'room' | 'schedule' | 'student' | 'department';
  category: string;
  relevance: number;
  metadata: Record<string, any>;
  lastAccessed?: Date;
  isFavorite?: boolean;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion' | 'filter';
  category?: string;
  count?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  type: string;
  user_role: string;
}

export interface SuggestionsResponse {
  suggestions: SearchSuggestion[];
  query: string;
  user_role: string;
}

export type SearchType = 'all' | 'course' | 'teacher' | 'room' | 'schedule' | 'student' | 'department';

export const searchService = {
  /**
   * Recherche globale avec filtrage par rôle utilisateur
   * @param query - Terme de recherche (minimum 2 caractères)
   * @param type - Type de résultat à filtrer (défaut: 'all')
   * @param limit - Nombre maximum de résultats par catégorie (défaut: 10, max: 50)
   */
  async search(query: string, type: SearchType = 'all', limit: number = 10): Promise<SearchResponse> {
    // Ne pas mettre en cache les résultats de recherche (données dynamiques)
    const response = await apiClient.get<SearchResponse>('/search/', {
      q: query,
      type,
      limit: Math.min(limit, 50)
    }, false);

    return response;
  },

  /**
   * Récupère les suggestions de recherche basées sur le rôle utilisateur
   * @param query - Terme de recherche partiel (optionnel)
   */
  async getSuggestions(query?: string): Promise<SuggestionsResponse> {
    const params: Record<string, any> = {};
    if (query) {
      params.q = query;
    }

    // Mettre en cache les suggestions pendant un court moment
    const response = await apiClient.get<SuggestionsResponse>('/search/suggestions/', params, true);

    return response;
  },

  /**
   * Navigation vers un résultat de recherche
   * Retourne l'URL appropriée selon le type de résultat
   */
  getResultUrl(result: SearchResult): string {
    const href = result.metadata?.href;
    if (href) return href;

    // Fallback basé sur le type
    switch (result.type) {
      case 'course':
        return `/courses/${result.metadata?.id || ''}`;
      case 'teacher':
        return `/teachers/${result.metadata?.id || ''}`;
      case 'room':
        return `/rooms/${result.metadata?.id || ''}`;
      case 'schedule':
        return `/schedule?session=${result.metadata?.id || ''}`;
      case 'student':
        return `/students/${result.metadata?.id || ''}`;
      case 'department':
        return `/departments/${result.metadata?.id || ''}`;
      default:
        return '/';
    }
  }
};

export default searchService;
