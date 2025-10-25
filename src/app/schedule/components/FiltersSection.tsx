'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ScheduleSession } from '@/types/api';

type FilterType = 'all' | 'CM' | 'TD' | 'TP' | 'TPE' | 'EXAM' | 'CONF';

interface FiltersSectionProps {
  sessions: ScheduleSession[];
  filteredSessions: ScheduleSession[];
  onFilterChange: (filter: FilterType) => void;
  activeFilter: FilterType;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function FiltersSection({
  sessions,
  filteredSessions,
  onFilterChange,
  activeFilter,
  searchTerm,
  onSearchChange
}: FiltersSectionProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filterOptions = [
    { value: 'all', label: 'Tous', count: sessions.length },
    { value: 'CM', label: 'CM', count: sessions.filter((s: ScheduleSession) => s.session_type === 'CM').length },
    { value: 'TD', label: 'TD', count: sessions.filter((s: ScheduleSession) => s.session_type === 'TD').length },
    { value: 'TP', label: 'TP', count: sessions.filter((s: ScheduleSession) => s.session_type === 'TP').length },
    { value: 'TPE', label: 'TPE', count: sessions.filter((s: ScheduleSession) => s.session_type === 'TPE').length },
    { value: 'EXAM', label: 'Examens', count: sessions.filter((s: ScheduleSession) => s.session_type === 'EXAM').length },
    { value: 'CONF', label: 'Conférences', count: sessions.filter((s: ScheduleSession) => s.session_type === 'CONF').length }
  ];

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-border p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filtres et recherche</h3>
        <Badge variant="secondary">
          {filteredSessions.length} session{filteredSessions.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Barre de recherche */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par cours, enseignant, salle..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtres par type */}
        <div className="flex gap-2">
          {filterOptions.map(option => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(option.value as FilterType)}
              className="relative"
            >
              {option.label}
              <Badge 
                variant={filter === option.value ? 'secondary' : 'default'}
                className="ml-2 text-xs"
              >
                {option.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}