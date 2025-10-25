'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Sparkles, 
  Settings, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Save,
  Download,
  Eye,
  Zap,
  Target,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { mlService } from '@/lib/api/services/ml';
import { apiClient } from '@/lib/api/client';

interface GenerationConstraints {
  preferredTimeSlots: string[];
  avoidTimeSlots: string[];
  maxHoursPerDay: number;
  lunchBreakDuration: number;
  prioritizeTeacherPreferences: boolean;
  allowRoomConflicts: boolean;
  balanceWorkload: boolean;
  // Nouvelles contraintes
  minBreakBetweenSessions: number;
  maxConsecutiveSessions: number;
  preferredStartTime: string;
  preferredEndTime: string;
  maxHoursPerDayStudents: number;
  maxHoursPerWeekStudents: number;
  maxHoursPerDayTeachers: number;
  minRestTimeTeachers: number;
  distributeEvenly: boolean;
  avoidSingleSessions: boolean;
  groupSameSubject: boolean;
  preferredDays: string[];
  excludedDays: string[];
}

interface GenerationResult {
  success: boolean;
  scheduleId: string;
  conflicts: ConflictInfo[];
  metrics: ScheduleMetrics;
  suggestions: string[];
}

interface ConflictInfo {
  type: 'teacher' | 'room' | 'student_group' | 'time_preference';
  severity: 'high' | 'medium' | 'low';
  message: string;
  sessionId: string;
  suggestions: string[];
}

interface ScheduleMetrics {
  totalHours: number;
  utilizationRate: number;
  conflictScore: number;
  balanceScore: number;
  teacherSatisfaction: number;
  roomUtilization: number;
}

interface StudentClass {
  id: number;
  name: string;
  code: string;
  level: string;
  department_name: string;
  student_count: number;
  max_capacity: number;
}

interface AIScheduleGeneratorProps {
  selectedClass?: string;
  onScheduleGenerated?: (scheduleId?: string) => void;
  onPreview?: (schedule: any) => void;
}

export function AIScheduleGenerator({
  selectedClass = '',
  onScheduleGenerated,
  onPreview
}: AIScheduleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // États pour la génération par période
  const [periodType, setPeriodType] = useState<'semester' | 'year' | 'custom'>('semester');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [semester, setSemester] = useState('S1');
  const [startDate, setStartDate] = useState('2024-10-01');
  const [endDate, setEndDate] = useState('2025-02-28');

  // Gestion des classes disponibles
  const [availableClasses, setAvailableClasses] = useState<StudentClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(selectedClass ? [selectedClass] : []);

  const classIds = selectedClasses;
  const [constraints, setConstraints] = useState<GenerationConstraints>({
    preferredTimeSlots: ['09:00-17:00'],
    avoidTimeSlots: ['12:00-13:00'],
    maxHoursPerDay: 8,
    lunchBreakDuration: 60,
    prioritizeTeacherPreferences: true,
    allowRoomConflicts: false,
    balanceWorkload: true,
    // Nouvelles contraintes avec valeurs par défaut
    minBreakBetweenSessions: 15,
    maxConsecutiveSessions: 3,
    preferredStartTime: '08:00',
    preferredEndTime: '18:00',
    maxHoursPerDayStudents: 8,
    maxHoursPerWeekStudents: 30,
    maxHoursPerDayTeachers: 6,
    minRestTimeTeachers: 30,
    distributeEvenly: true,
    avoidSingleSessions: true,
    groupSameSubject: false,
    preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    excludedDays: ['saturday', 'sunday']
  });

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

  // Charger les classes disponibles au montage du composant
  useEffect(() => {
    const loadClasses = async () => {
      if (selectedClass) {
        // Si une classe est déjà sélectionnée, pas besoin de charger
        return;
      }

      setLoadingClasses(true);
      try {
        const data = await apiClient.get<any>('/courses/classes/');
        console.log('Classes chargées:', data);

        // L'API retourne une réponse paginée {count, next, previous, results}
        if (data && Array.isArray(data.results)) {
          setAvailableClasses(data.results as StudentClass[]);
        } else if (Array.isArray(data)) {
          setAvailableClasses(data as StudentClass[]);
        } else {
          console.error('Format de données inattendu:', data);
          setAvailableClasses([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error);
        addToast({
          title: "Erreur",
          description: "Impossible de charger les classes",
          variant: "destructive"
        });
        setAvailableClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, [selectedClass]);

  const handleGenerateForPeriod = async () => {
    if (classIds.length === 0) {
      addToast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une classe",
        variant: "destructive"
      });
      return;
    }

    if (!academicYear) {
      addToast({
        title: "Erreur",
        description: "Veuillez spécifier l'année académique",
        variant: "destructive"
      });
      return;
    }

    // FAILLE 2: Validation des dates
    if (!startDate || !endDate) {
      addToast({
        title: "Erreur",
        description: "Les dates de début et de fin sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      addToast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date de fin",
        variant: "destructive"
      });
      return;
    }

    // Limite de période maximale (1 an)
    const maxPeriodDays = 365;
    const periodDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (periodDays > maxPeriodDays) {
      addToast({
        title: "Erreur",
        description: `La période ne peut pas dépasser ${maxPeriodDays} jours (actuellement: ${periodDays} jours)`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const data = await apiClient.post<{ message?: string; schedule_ids?: number[]; total_sessions?: number; error?: string }>('/schedules/schedules/generate_for_period/', {
        period_type: 'semester',
        academic_year: academicYear,
        semester: semester,
        start_date: startDate,
        end_date: endDate,
        class_ids: classIds,
      });

      addToast({
        title: "Generation reussie",
        description: data?.message || `${data?.total_sessions || 0} sessions generees avec succes`,
      });

      // Appeler le callback pour recharger
      if (onScheduleGenerated) {
        onScheduleGenerated();
      }
    } catch (error: any) {
      // FAILLE 4: Gestion des erreurs améliorée
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.message ||
                          error?.message ||
                          "Erreur de communication avec le serveur";

      const errorDetails = error?.response?.data?.details;

      addToast({
        title: "Erreur de génération",
        description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedClass) {
      addToast({
        title: "Erreur",
        description: "Veuillez sélectionner une classe",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationResult(null);

    try {
      // Appel à l'API backend pour générer l'emploi du temps avec l'IA
      const result = await mlService.generateSchedule({
        selectedClass,
        constraints
      });

      const generationResult: GenerationResult = {
        success: result.success,
        scheduleId: result.scheduleId,
        conflicts: result.conflicts.map(conflict => ({
          type: conflict.type as 'teacher' | 'room' | 'student_group' | 'time_preference',
          severity: conflict.severity as 'high' | 'medium' | 'low',
          message: conflict.message,
          sessionId: conflict.sessionId,
          suggestions: conflict.suggestions
        })),
        metrics: result.metrics,
        suggestions: result.suggestions
      };

      setGenerationResult(generationResult);

      addToast({
        title: "Emploi du temps généré par IA avec succès",
        description: `${generationResult.conflicts.length} conflits détectés - Score de qualité: ${generationResult.metrics.balanceScore}% (Modèle: ${result.model_used})`,
        variant: generationResult.conflicts.length === 0 ? "default" : "destructive"
      });

    } catch (error) {
      addToast({
        title: "Erreur lors de la génération",
        description: "Impossible de générer l'emploi du temps",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSchedule = () => {
    if (generationResult && onScheduleGenerated) {
      onScheduleGenerated(generationResult.scheduleId);
      addToast({
        title: "Emploi du temps accepte",
        description: "L'emploi du temps a ete sauvegarde",
        variant: "default"
      });
    }
  };

  const getMetricColor = (value: number, type: 'positive' | 'negative' = 'positive') => {
    if (type === 'positive') {
      if (value >= 90) return 'text-emerald-600 bg-emerald-50';
      if (value >= 70) return 'text-blue-600 bg-blue-50';
      if (value >= 50) return 'text-amber-600 bg-amber-50';
      return 'text-red-600 bg-red-50';
    } else {
      if (value <= 2) return 'text-emerald-600 bg-emerald-50';
      if (value <= 5) return 'text-blue-600 bg-blue-50';
      if (value <= 8) return 'text-amber-600 bg-amber-50';
      return 'text-red-600 bg-red-50';
    }
  };

  // Charger les infos de la classe sélectionnée si besoin
  const [selectedClassInfo, setSelectedClassInfo] = useState<StudentClass | null>(null);

  useEffect(() => {
    const loadSelectedClass = async () => {
      if (selectedClass && !selectedClassInfo) {
        try {
          // Vérifier si c'est un ID numérique ou un code
          const isNumericId = /^\d+$/.test(selectedClass);

          if (isNumericId) {
            // Si c'est un ID, charger directement
            const data = await apiClient.get<StudentClass>(`/courses/classes/${selectedClass}/`);
            setSelectedClassInfo(data);
          } else {
            // Si c'est un code, charger la liste et trouver la classe
            const allClasses = await apiClient.get<any>('/courses/classes/');
            const classes = Array.isArray(allClasses) ? allClasses : allClasses.results || [];
            const found = classes.find((c: StudentClass) => c.code === selectedClass || c.id.toString() === selectedClass);

            if (found) {
              setSelectedClassInfo(found);
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la classe:', error);
          // Ne pas afficher d'erreur à l'utilisateur, juste continuer sans info
        }
      }
    };
    loadSelectedClass();
  }, [selectedClass]);

  // Si une classe est sélectionnée, afficher uniquement le formulaire simplifié
  if (selectedClass) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Génération IA d'Emploi du Temps</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Génération intelligente avec optimisation et respect des préférences
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Info classe */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Classe sélectionnée
            </div>
            {selectedClassInfo ? (
              <div>
                <p className="font-semibold text-base">{selectedClassInfo.code} - {selectedClassInfo.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedClassInfo.level} • {selectedClassInfo.department_name}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                L'emploi du temps sera généré pour la classe actuellement sélectionnée
              </p>
            )}
          </div>

          {/* Année et semestre */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Année Académique
              </label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Semestre
              </label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">Semestre 1 (Fin Sept-Fév)</SelectItem>
                  <SelectItem value="S2">Semestre 2 (Mar-Août)</SelectItem>
                  <SelectItem value="ANNUEL">Année Complète (Sept-Août)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Paramètres avancés */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            {showAdvancedSettings ? 'Masquer' : 'Afficher'} les paramètres avancés
          </Button>

          <AnimatePresence>
            {showAdvancedSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-muted/30 rounded-lg p-6 space-y-6"
              >
                {/* Section 1: Contraintes Horaires */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" />
                    Contraintes Horaires
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Pause minimum (min)
                      </label>
                      <Input
                        type="number"
                        min="5"
                        max="60"
                        value={constraints.minBreakBetweenSessions}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          minBreakBetweenSessions: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Sessions consécutives max
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="6"
                        value={constraints.maxConsecutiveSessions}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          maxConsecutiveSessions: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Heure début préférée
                      </label>
                      <Input
                        type="time"
                        value={constraints.preferredStartTime}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          preferredStartTime: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Heure fin préférée
                      </label>
                      <Input
                        type="time"
                        value={constraints.preferredEndTime}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          preferredEndTime: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4" />

                {/* Section 2: Charge de Travail Étudiants */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-600">
                    <Users className="w-4 h-4" />
                    Charge de Travail Étudiants
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Heures max/jour
                      </label>
                      <Input
                        type="number"
                        min="4"
                        max="12"
                        value={constraints.maxHoursPerDayStudents}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          maxHoursPerDayStudents: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Heures max/semaine
                      </label>
                      <Input
                        type="number"
                        min="15"
                        max="40"
                        value={constraints.maxHoursPerWeekStudents}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          maxHoursPerWeekStudents: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4" />

                {/* Section 3: Contraintes Enseignants */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-purple-600">
                    <BookOpen className="w-4 h-4" />
                    Contraintes Enseignants
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Heures max/jour
                      </label>
                      <Input
                        type="number"
                        min="2"
                        max="10"
                        value={constraints.maxHoursPerDayTeachers}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          maxHoursPerDayTeachers: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Repos minimum (min)
                      </label>
                      <Input
                        type="number"
                        min="15"
                        max="120"
                        value={constraints.minRestTimeTeachers}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          minRestTimeTeachers: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4" />

                {/* Section 4: Distribution des Cours */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-green-600">
                    <Target className="w-4 h-4" />
                    Distribution des Cours
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={constraints.distributeEvenly}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          distributeEvenly: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Distribuer équitablement sur la semaine</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={constraints.avoidSingleSessions}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          avoidSingleSessions: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Éviter les journées avec une seule session</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={constraints.groupSameSubject}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          groupSameSubject: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Grouper les sessions d'une même matière</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={constraints.prioritizeTeacherPreferences}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          prioritizeTeacherPreferences: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Priorité aux préférences enseignants</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={constraints.balanceWorkload}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          balanceWorkload: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Équilibrer la charge de travail</span>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 Ces contraintes permettent une génération plus intelligente et personnalisée selon vos besoins
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info génération */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              L'IA va générer automatiquement
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-6">
              <li className="list-disc">Emploi du temps complet du semestre</li>
              <li className="list-disc">Affectation optimale des salles</li>
              <li className="list-disc">Respect des préférences enseignants</li>
              <li className="list-disc">Évitement des conflits</li>
              <li className="list-disc">Équilibrage de la charge</li>
            </ul>
          </div>

          {/* Bouton génération */}
          <Button
            onClick={handleGenerateForPeriod}
            disabled={isGenerating}
            className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Génération IA en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Générer avec l'IA
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            L'IA optimise automatiquement en respectant toutes les contraintes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                Génération IA
                <Sparkles className="w-5 h-5 text-primary" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Créez automatiquement un emploi du temps optimisé
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <Settings className="w-4 h-4 mr-1" />
              {showAdvancedSettings ? 'Masquer' : 'Paramètres'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Formulaire de génération */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 space-y-4 border-2 border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Génération par période
              </h4>

              {/* Type de période */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Type de période
                </label>
                <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">Semestre</SelectItem>
                    <SelectItem value="year">Année académique complète</SelectItem>
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Année académique et Semestre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Année académique
                  </label>
                  <Select
                    value={academicYear}
                    onValueChange={setAcademicYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'année" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                      <SelectItem value="2026-2027">2026-2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Semestre
                  </label>
                  <Select
                    value={semester}
                    onValueChange={setSemester}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S1">Semestre 1 (Fin Sept-Fév)</SelectItem>
                      <SelectItem value="S2">Semestre 2 (Mar-Août)</SelectItem>
                      <SelectItem value="ANNUEL">Année Complète (Sept-Août)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates (affichées pour toutes les périodes) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Date de début *
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Date de fin *
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Sélection des classes */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Classes à générer
                </label>
                {loadingClasses ? (
                  <div className="text-sm text-muted-foreground">Chargement des classes...</div>
                ) : availableClasses.length === 0 ? (
                  <div className="text-sm text-amber-600">
                    Aucune classe disponible. Créez-en une d'abord.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                    {availableClasses.map((classe) => (
                      <label
                        key={classe.id}
                        className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(classe.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses([...selectedClasses, classe.id.toString()]);
                            } else {
                              setSelectedClasses(selectedClasses.filter(id => id !== classe.id.toString()));
                            }
                          }}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{classe.code} - {classe.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {classe.level} • {classe.department_name}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedClasses.length > 0 && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {selectedClasses.length} classe{selectedClasses.length > 1 ? 's' : ''} sélectionnée{selectedClasses.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Bouton de génération */}
              <Button
                onClick={handleGenerateForPeriod}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer les emplois du temps
                  </>
                )}
              </Button>
            </div>

        {/* Paramètres avancés - Bouton */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full"
        >
          <Settings className="w-4 h-4 mr-2" />
          {showAdvancedSettings ? 'Masquer' : 'Afficher'} les paramètres avancés
        </Button>

        {/* Paramètres avancés */}
        <AnimatePresence>
          {showAdvancedSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted/50 rounded-lg p-4 space-y-4"
            >
              <h4 className="font-semibold text-foreground mb-3">Contraintes de génération</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Heures max par jour
                  </label>
                  <Input
                    type="number"
                    min="4"
                    max="12"
                    value={constraints.maxHoursPerDay}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      maxHoursPerDay: parseInt(e.target.value)
                    }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Pause déjeuner (minutes)
                  </label>
                  <Select 
                    value={constraints.lunchBreakDuration.toString()}
                    onValueChange={(value) => setConstraints(prev => ({
                      ...prev,
                      lunchBreakDuration: parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-foreground">Options d'optimisation</h5>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={constraints.prioritizeTeacherPreferences}
                      onChange={(e) => setConstraints(prev => ({
                        ...prev,
                        prioritizeTeacherPreferences: e.target.checked
                      }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">Prioriser les préférences des enseignants</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={constraints.balanceWorkload}
                      onChange={(e) => setConstraints(prev => ({
                        ...prev,
                        balanceWorkload: e.target.checked
                      }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">Équilibrer la charge de travail</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!constraints.allowRoomConflicts}
                      onChange={(e) => setConstraints(prev => ({
                        ...prev,
                        allowRoomConflicts: !e.target.checked
                      }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">Éviter les conflits de salles</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton de génération */}
        <div className="text-center">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedClass}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Générer l'emploi du temps
              </>
            )}
          </Button>
          
          {!selectedClass && (
            <p className="text-sm text-muted-foreground mt-2">
              Sélectionnez d'abord une classe dans les filtres
            </p>
          )}
        </div>

        {/* Indicateur de progression */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/50 rounded-lg p-4 text-center"
          >
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Génération IA en cours...</p>
                <p className="text-xs text-muted-foreground">
                  Optimisation des créneaux et résolution des conflits
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Résultats de génération */}
        <AnimatePresence>
          {generationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Métriques de qualité */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Métriques de qualité
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg ${getMetricColor(generationResult.metrics.balanceScore)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-xs font-medium">Équilibre</span>
                    </div>
                    <div className="text-lg font-bold">{generationResult.metrics.balanceScore}%</div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getMetricColor(generationResult.metrics.utilizationRate)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">Utilisation</span>
                    </div>
                    <div className="text-lg font-bold">{generationResult.metrics.utilizationRate}%</div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getMetricColor(generationResult.metrics.conflictScore, 'negative')}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-medium">Conflits</span>
                    </div>
                    <div className="text-lg font-bold">{generationResult.metrics.conflictScore}</div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getMetricColor(generationResult.metrics.teacherSatisfaction)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium">Satisfaction</span>
                    </div>
                    <div className="text-lg font-bold">{generationResult.metrics.teacherSatisfaction}%</div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getMetricColor(generationResult.metrics.roomUtilization)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-xs font-medium">Salles</span>
                    </div>
                    <div className="text-lg font-bold">{generationResult.metrics.roomUtilization}%</div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">Total</span>
                    </div>
                    <div className="text-lg font-bold">{generationResult.metrics.totalHours}h</div>
                  </div>
                </div>
              </div>

              {/* Conflits détectés */}
              {generationResult.conflicts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Conflits détectés ({generationResult.conflicts.length})
                  </h4>
                  
                  <div className="space-y-2">
                    {generationResult.conflicts.map((conflict, index) => (
                      <div key={index} className="bg-white rounded p-3 border border-amber-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-800">{conflict.message}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {conflict.type}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  conflict.severity === 'high' ? 'border-red-300 text-red-700' :
                                  conflict.severity === 'medium' ? 'border-amber-300 text-amber-700' :
                                  'border-blue-300 text-blue-700'
                                }`}
                              >
                                {conflict.severity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {conflict.suggestions.length > 0 && (
                          <div className="mt-2 text-xs text-amber-700">
                            <p className="font-medium">Suggestions:</p>
                            <ul className="list-disc list-inside">
                              {conflict.suggestions.map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions d'amélioration */}
              {generationResult.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Suggestions d'amélioration
                  </h4>
                  
                  <ul className="space-y-1">
                    {generationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                {onPreview && (
                  <Button
                    onClick={() => onPreview(generationResult)}
                    variant="outline"
                    className="flex-1"
                  >
                  <Eye className="w-4 h-4 mr-1" />
                  Apercu
                </Button>
                )}

                <Button
                  onClick={handleAcceptSchedule}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Accepter
                </Button>
                
                <Button
                  onClick={handleGenerate}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Régénérer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}