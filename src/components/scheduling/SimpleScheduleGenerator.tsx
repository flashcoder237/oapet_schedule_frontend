'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  RefreshCw,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiResponse } from '@/lib/api/client';

interface Curriculum {
  id: number;
  name: string;
  code: string;
  level: string;
}

interface SimpleScheduleGeneratorProps {
  onScheduleGenerated?: () => void;
}

export function SimpleScheduleGenerator({ onScheduleGenerated }: SimpleScheduleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [loadingCurriculums, setLoadingCurriculums] = useState(true);

  // États du formulaire
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('S1');
  const [startDate, setStartDate] = useState('2024-09-25');
  const [endDate, setEndDate] = useState('2025-02-28');

  const { addToast } = useToast();

  // Calculer automatiquement les dates selon le semestre
  useEffect(() => {
    const year = parseInt(academicYear.split('-')[0]);

    if (semester === 'S1') {
      // Semestre 1: Fin septembre à Fin février
      setStartDate(`${year}-09-25`);
      setEndDate(`${year + 1}-02-28`);
    } else if (semester === 'S2') {
      // Semestre 2: Début mars à Fin août
      setStartDate(`${year + 1}-03-01`);
      setEndDate(`${year + 1}-08-31`);
    } else {
      // Annuel: Fin septembre à Fin août
      setStartDate(`${year}-09-25`);
      setEndDate(`${year + 1}-08-31`);
    }
  }, [academicYear, semester]);

  // Charger les curriculums disponibles
  useEffect(() => {
    const loadCurriculums = async () => {
      try {
        const data = await apiClient.get<Curriculum[]>('/courses/curricula/');
        setCurriculums(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des cursus:', error);
        addToast({
          title: "Erreur",
          description: "Impossible de charger les cursus",
          variant: "destructive"
        });
      } finally {
        setLoadingCurriculums(false);
      }
    };

    loadCurriculums();
  }, []);

  const handleGenerate = async () => {
    if (!selectedCurriculum) {
      addToast({
        title: "Erreur",
        description: "Veuillez sélectionner une classe",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await apiClient.post<ApiResponse>('/schedules/schedules/generate_for_period/', {
        period_type: 'semester',
        academic_year: academicYear,
        semester: semester,
        start_date: startDate,
        end_date: endDate,
        curriculum_ids: [selectedCurriculum]
      });

      addToast({
        title: "✅ Génération réussie",
        description: response?.message || "L'emploi du temps a été généré avec succès"
      });

      // Appeler le callback pour recharger
      if (onScheduleGenerated) {
        onScheduleGenerated();
      }
    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);

      const errorMessage = error.response?.data?.error ||
                          error.message ||
                          "Une erreur est survenue lors de la génération";

      addToast({
        title: "❌ Erreur de génération",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Obtenir l'année courante pour générer les options
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Générer un Emploi du Temps
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Sélectionnez une classe et une période pour générer automatiquement un emploi du temps optimisé
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Sélection de la classe */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Classe / Cursus
          </label>
          <Select
            value={selectedCurriculum}
            onValueChange={setSelectedCurriculum}
            disabled={loadingCurriculums}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingCurriculums ? "Chargement..." : "Sélectionner une classe"} />
            </SelectTrigger>
            <SelectContent>
              {curriculums.map((curriculum) => (
                <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                  {curriculum.code} - {curriculum.name} ({curriculum.level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {curriculums.length === 0 && !loadingCurriculums && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Aucune classe disponible. Créez-en une d'abord.
            </p>
          )}
        </div>

        {/* Année académique */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Année Académique
          </label>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Semestre */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Semestre
          </label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S1">
                <div className="flex flex-col">
                  <span className="font-medium">Semestre 1</span>
                  <span className="text-xs text-muted-foreground">Fin Septembre à Février</span>
                </div>
              </SelectItem>
              <SelectItem value="S2">
                <div className="flex flex-col">
                  <span className="font-medium">Semestre 2</span>
                  <span className="text-xs text-muted-foreground">Mars à Août</span>
                </div>
              </SelectItem>
              <SelectItem value="ANNUEL">
                <div className="flex flex-col">
                  <span className="font-medium">Année Complète</span>
                  <span className="text-xs text-muted-foreground">Septembre à Août</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dates de début et fin */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date de début *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date de fin *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        {/* Informations */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Ce qui sera généré automatiquement
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-6">
            <li className="list-disc">Sessions de cours pour tous les cours de la classe</li>
            <li className="list-disc">Affectation automatique des salles disponibles</li>
            <li className="list-disc">Respect des préférences des enseignants</li>
            <li className="list-disc">Évitement des conflits d'horaires</li>
            <li className="list-disc">Optimisation de l'utilisation des ressources</li>
          </ul>
        </div>

        {/* Résumé de la sélection */}
        {selectedCurriculum && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4"
          >
            <h4 className="text-sm font-semibold mb-2">Résumé de la génération</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Classe :</span>{' '}
                <span className="font-medium">
                  {curriculums.find(c => c.id.toString() === selectedCurriculum)?.name}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Période :</span>{' '}
                <span className="font-medium">{academicYear} - {semester}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Dates :</span>{' '}
                <span className="font-medium">
                  {new Date(startDate).toLocaleDateString('fr-FR')} → {new Date(endDate).toLocaleDateString('fr-FR')}
                </span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Bouton de génération */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedCurriculum || loadingCurriculums}
          className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Générer l'Emploi du Temps
            </>
          )}
        </Button>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center">
          La génération peut prendre quelques secondes. Les préférences des enseignants seront automatiquement respectées.
        </p>
      </CardContent>
    </Card>
  );
}
