// src/components/search/SmartSearch.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Filter,
  X,
  Clock,
  History,
  TrendingUp,
  Star,
  Hash,
  User,
  MapPin,
  BookOpen,
  Calendar,
  Building,
  Tag,
  Zap,
  Brain,
  Target,
  Compass,
  Eye,
  ArrowRight,
  ChevronDown,
  Settings,
  Sparkles,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  FileText,
  Database,
  BarChart3,
  Users,
  Globe,
  Shield,
  Layers,
  Grid3x3,
  List,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mlService } from '@/lib/api/services/ml';

interface SearchResult {
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

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion' | 'filter';
  count?: number;
  category?: string;
}

interface SmartSearchProps {
  placeholder?: string;
  onSearch?: (query: string, filters: Record<string, any>) => void;
  onResultClick?: (result: SearchResult) => void;
  showFilters?: boolean;
  showSuggestions?: boolean;
  showHistory?: boolean;
  data?: SearchResult[];
  className?: string;
}

export default function SmartSearch({
  placeholder = "Rechercher des cours, enseignants, salles...",
  onSearch,
  onResultClick,
  showFilters = true,
  showSuggestions = true,
  showHistory = true,
  data = [],
  className = ""
}: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    department: 'all',
    level: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'name'>('relevance');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Les données viennent maintenant des props uniquement

  // Chargement des suggestions depuis l'API IA
  const loadSuggestions = async (searchQuery?: string) => {
    try {
      setIsLoading(true);
      const response = await mlService.getSearchSuggestions(searchQuery, 8);
      
      const aiSuggestions: SearchSuggestion[] = response.suggestions.map((item, index) => ({
        id: `ai-${index}`,
        text: item.text,
        type: item.type as 'recent' | 'popular' | 'suggestion' | 'filter',
        category: item.category,
        count: Math.floor(Math.random() * 50) + 1 // Simulation du count
      }));
      
      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions IA:', error);
      // Fallback sur des suggestions par défaut en cas d'erreur
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulation de recherche
  useEffect(() => {
    if (query.length > 0) {
      setIsLoading(true);
      
      // Recherche dans les données fournies uniquement
      const searchTimeout = setTimeout(() => {
        const filtered = data.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          Object.values(item.metadata).some(value => 
            String(value).toLowerCase().includes(query.toLowerCase())
          )
        );

        // Application des filtres
        const filteredResults = filtered.filter(item => {
          if (filters.type !== 'all' && item.type !== filters.type) return false;
          if (filters.department !== 'all' && item.metadata.department !== filters.department) return false;
          if (filters.level !== 'all' && item.metadata.level !== filters.level) return false;
          return true;
        });

        // Tri des résultats
        const sortedResults = filteredResults.sort((a, b) => {
          switch (sortBy) {
            case 'relevance':
              return b.relevance - a.relevance;
            case 'date':
              return new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime();
            case 'name':
              return a.title.localeCompare(b.title);
            default:
              return 0;
          }
        });

        setResults(sortedResults);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(searchTimeout);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [query, filters, sortBy, data]);

  // Gestion des suggestions IA
  useEffect(() => {
    if (showSuggestions) {
      if (query.length === 0) {
        // Charger les suggestions populaires
        loadSuggestions();
      } else if (query.length >= 2) {
        // Charger les suggestions basées sur la query
        const debounceTimeout = setTimeout(() => {
          loadSuggestions(query);
        }, 300);
        
        return () => clearTimeout(debounceTimeout);
      }
    }
  }, [query, showSuggestions]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          } else if (query) {
            handleSearch();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, query]);

  // Fermeture au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSearch = () => {
    if (query.trim()) {
      // Ajouter à l'historique
      setSearchHistory(prev => {
        const updated = [query, ...prev.filter(h => h !== query)].slice(0, 10);
        return updated;
      });
      
      onSearch?.(query, filters);
      setIsOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    setIsOpen(false);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch();
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'teacher': return <User className="w-4 h-4" />;
      case 'room': return <MapPin className="w-4 h-4" />;
      case 'schedule': return <Calendar className="w-4 h-4" />;
      case 'student': return <Users className="w-4 h-4" />;
      case 'department': return <Building className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent': return <Clock className="w-4 h-4" />;
      case 'popular': return <TrendingUp className="w-4 h-4" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4" />;
      case 'filter': return <Filter className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'course': return 'text-blue-600 bg-blue-50 dark:text-blue-200 dark:bg-blue-900/30';
      case 'teacher': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-900/30';
      case 'room': return 'text-violet-600 bg-violet-50 dark:text-violet-200 dark:bg-violet-900/30';
      case 'schedule': return 'text-orange-600 bg-orange-50 dark:text-orange-200 dark:bg-orange-900/30';
      case 'student': return 'text-indigo-600 bg-indigo-50 dark:text-indigo-200 dark:bg-indigo-900/30';
      case 'department': return 'text-red-600 bg-red-50 dark:text-red-200 dark:bg-red-900/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Barre de recherche principale */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
          {query && (
            <button
              onClick={clearQuery}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`text-muted-foreground hover:text-foreground transition-colors ${
                showAdvancedFilters ? 'text-primary' : ''
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtres avancés */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    >
                      <option value="all">Tous</option>
                      <option value="course">Cours</option>
                      <option value="teacher">Enseignants</option>
                      <option value="room">Salles</option>
                      <option value="schedule">Plannings</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Département
                    </label>
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    >
                      <option value="all">Tous</option>
                      <option value="Médecine">Médecine</option>
                      <option value="Pharmacie">Pharmacie</option>
                      <option value="Dentaire">Dentaire</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Niveau
                    </label>
                    <select
                      value={filters.level}
                      onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    >
                      <option value="all">Tous</option>
                      <option value="L1">L1</option>
                      <option value="L2">L2</option>
                      <option value="L3">L3</option>
                      <option value="M1">M1</option>
                      <option value="M2">M2</option>
                      <option value="D1">D1</option>
                      <option value="D2">D2</option>
                      <option value="D3">D3</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Tri
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    >
                      <option value="relevance">Pertinence</option>
                      <option value="date">Date</option>
                      <option value="name">Nom</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({
                      type: 'all',
                      department: 'all',
                      level: 'all',
                      status: 'all',
                      dateRange: 'all'
                    })}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résultats et suggestions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-40"
          >
            <Card className="max-h-96 overflow-hidden">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Recherche en cours...</span>
                  </div>
                ) : query.length > 0 && results.length > 0 ? (
                  <div className="divide-y divide-border">
                    {/* En-tête des résultats */}
                    <div className="px-4 py-2 bg-muted flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="w-3 h-3" />
                        Recherche intelligente
                      </div>
                    </div>

                    {/* Liste des résultats */}
                    <div className="max-h-80 overflow-y-auto">
                      {results.map((result, index) => (
                        <motion.div
                          key={result.id}
                          className={`
                            px-4 py-3 cursor-pointer transition-colors
                            ${selectedIndex === index ? 'bg-primary/10' : 'hover:bg-muted'}
                          `}
                          onClick={() => handleResultClick(result)}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                                {getTypeIcon(result.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-foreground truncate">
                                    {result.title}
                                  </h4>
                                  {result.isFavorite && (
                                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {result.description}
                                </p>
                                
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {result.category}
                                  </span>
                                  
                                  {result.lastAccessed && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {result.lastAccessed.toLocaleDateString('fr-FR')}
                                    </span>
                                  )}
                                  
                                  <span className="flex items-center gap-1">
                                    <BarChart3 className="w-3 h-3" />
                                    {Math.round(result.relevance * 100)}% pertinent
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <ArrowRight className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : query.length > 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Aucun résultat trouvé</p>
                    <p className="text-xs text-muted-foreground">
                      Essayez d'autres mots-clés ou modifiez vos filtres
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {/* Suggestions et historique */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Suggestions populaires
                        </h4>
                        <div className="space-y-2">
                          {suggestions.slice(0, 5).map(suggestion => (
                            <motion.div
                              key={suggestion.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                              onClick={() => handleSuggestionClick(suggestion)}
                              whileHover={{ x: 4 }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-muted-foreground">
                                  {getSuggestionIcon(suggestion.type)}
                                </div>
                                <span className="text-sm text-foreground">{suggestion.text}</span>
                                {suggestion.category && (
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {suggestion.category}
                                  </span>
                                )}
                              </div>
                              {suggestion.count && (
                                <span className="text-xs text-muted-foreground">
                                  {suggestion.count} résultats
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Historique de recherche */}
                    {showHistory && searchHistory.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Recherches récentes
                        </h4>
                        <div className="space-y-2">
                          {searchHistory.slice(0, 3).map((term, index) => (
                            <motion.div
                              key={index}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                              onClick={() => {
                                setQuery(term);
                                handleSearch();
                              }}
                              whileHover={{ x: 4 }}
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">{term}</span>
                              </div>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aide rapide */}
                    <div className="p-4 bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Conseils de recherche</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Utilisez des guillemets pour une recherche exacte</p>
                        <p>• Tapez "prof:" pour rechercher des enseignants</p>
                        <p>• Utilisez "*" comme caractère joker</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}