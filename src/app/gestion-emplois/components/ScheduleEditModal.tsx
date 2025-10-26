'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Save, Calendar, BookOpen } from 'lucide-react';
import { Schedule, AcademicPeriod } from '@/types/api';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Schedule>) => void;
  schedule: Schedule | null;
  academicPeriods: AcademicPeriod[];
}

interface Curriculum {
  id: number;
  code: string;
  name: string;
  level: string;
}

export function ScheduleEditModal({
  isOpen,
  onClose,
  onSave,
  schedule,
  academicPeriods,
}: ScheduleEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    academic_period: '',
    curriculum: '',
    level: '',
    description: '',
  });
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurricula();
      if (schedule) {
        setFormData({
          name: schedule.name || '',
          academic_period: schedule.academic_period?.toString() || '',
          curriculum: schedule.curriculum?.toString() || '',
          level: schedule.level || '',
          description: schedule.description || '',
        });
      } else {
        setFormData({
          name: '',
          academic_period: '',
          curriculum: '',
          level: '',
          description: '',
        });
      }
    }
  }, [isOpen, schedule]);

  const loadCurricula = async () => {
    try {
      const response = await apiClient.get<{ results: Curriculum[] }>(API_ENDPOINTS.CURRICULA);
      setCurricula(response.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des filières:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Partial<Schedule> = {
      name: formData.name,
      description: formData.description,
    };

    if (formData.academic_period) {
      data.academic_period = parseInt(formData.academic_period);
    }
    if (formData.curriculum) {
      data.curriculum = parseInt(formData.curriculum);
    }
    if (formData.level) {
      data.level = formData.level;
    }

    onSave(data);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                {schedule ? 'Modifier l\'emploi du temps' : 'Nouvel emploi du temps'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div className="space-y-2">
                <Label>Nom de l'emploi du temps *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Emploi du temps L3 Info - Semestre 1"
                  required
                />
              </div>

              {/* Période académique et Filière */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Période académique *
                  </Label>
                  <Select
                    value={formData.academic_period}
                    onValueChange={(value) => handleChange('academic_period', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id.toString()}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    Filière
                  </Label>
                  <Select
                    value={formData.curriculum}
                    onValueChange={(value) => handleChange('curriculum', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une filière" />
                    </SelectTrigger>
                    <SelectContent>
                      {curricula.map((curriculum) => (
                        <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                          {curriculum.code} - {curriculum.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Niveau */}
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleChange('level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">Licence 1</SelectItem>
                    <SelectItem value="L2">Licence 2</SelectItem>
                    <SelectItem value="L3">Licence 3</SelectItem>
                    <SelectItem value="M1">Master 1</SelectItem>
                    <SelectItem value="M2">Master 2</SelectItem>
                    <SelectItem value="D">Doctorat 1</SelectItem>
                    <SelectItem value="D">Doctorat 2</SelectItem>
                    <SelectItem value="D">Doctorat 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Description de l'emploi du temps..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {schedule ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
