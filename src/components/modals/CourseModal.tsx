// src/components/modals/CourseModal.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  User,
  Users,
  Clock,
  MapPin,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Brain,
  Zap,
  Lightbulb,
  TrendingUp,
  Target,
  Sparkles,
  Wand2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { mlService } from '@/lib/api/services/ml';
import { apiClient } from '@/lib/api/client';
import { teacherService } from '@/lib/api/services/teachers';
import SmartFormAssistant from '@/components/forms/SmartFormAssistant';
import type { Course } from '@/types/api';

interface CourseFormData {
  id?: number;
  name: string;
  code: string;
  teacher: number;
  department: number;
  level: string;
  credits: number;
  max_students: number;
  description?: string;
  course_type: 'CM' | 'TD' | 'TP' | 'CONF' | 'EXAM';
  hours_per_week: number;
  total_hours: number;
  min_room_capacity: number;
  requires_computer: boolean;
  requires_projector: boolean;
  requires_laboratory: boolean;
  semester: string;
  academic_year: string;
  is_active: boolean;
  use_manual_priority?: boolean;
  manual_scheduling_priority?: 1 | 2 | 3 | 4 | 5;
}

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  onSave: (course: CourseFormData) => Promise<void>;
}

export default function CourseModal({ isOpen, onClose, course, onSave }: CourseModalProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    code: '',
    teacher: 0,
    department: 0,
    level: 'L1',
    credits: 3,
    max_students: 50,
    description: '',
    course_type: 'CM',
    hours_per_week: 2,
    total_hours: 30,
    min_room_capacity: 30,
    requires_computer: false,
    requires_projector: false,
    requires_laboratory: false,
    semester: 'S1',
    academic_year: '2025-2026',
    is_active: true,
    use_manual_priority: false,
    manual_scheduling_priority: 3
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  // États pour les dropdowns
  const [teachers, setTeachers] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [loadingData, setLoadingData] = useState(true);

  // IA - États pour la prédiction de difficulté
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [showFormAssistant, setShowFormAssistant] = useState(true);

  // États pour la génération automatique
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [creditHours, setCreditHours] = useState(15); // 1 crédit = 15H par défaut
  const [courseDistribution, setCourseDistribution] = useState({
    CM: 40,
    TD: 30,
    TP: 20,
    TPE: 10
  });
  const [courseDetails, setCourseDetails] = useState({
    CM: { hours_per_week: 2, requires_projector: false, requires_computer: false, requires_laboratory: false },
    TD: { hours_per_week: 2, requires_projector: false, requires_computer: false, requires_laboratory: false },
    TP: { hours_per_week: 2, requires_projector: false, requires_computer: true, requires_laboratory: false },
    TPE: { hours_per_week: 1, requires_projector: false, requires_computer: false, requires_laboratory: false }
  });

  // Charger les enseignants et départements
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;

      setLoadingData(true);
      try {
        const [mappedTeachers, departmentsData] = await Promise.all([
          teacherService.getTeachersForSelect(),
          apiClient.get<any>('/courses/departments/')
        ]);

        console.log(`✅ ${mappedTeachers.length} enseignants chargés`);

        // Mapper les départements
        const mappedDepartments = (departmentsData.results || departmentsData || []).map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code
        }));

        setTeachers(mappedTeachers);
        setDepartments(mappedDepartments);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données du formulaire:', error);
        addToast({
          title: "Erreur de chargement",
          description: "Impossible de charger les enseignants et départements",
          variant: "destructive"
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (course) {
      setFormData({
        id: course.id,
        name: course.name,
        code: course.code,
        teacher: course.teacher,
        department: course.department,
        level: course.level,
        credits: course.credits,
        max_students: course.max_students,
        description: course.description || '',
        course_type: course.course_type,
        hours_per_week: course.hours_per_week,
        total_hours: course.total_hours,
        min_room_capacity: course.min_room_capacity,
        requires_computer: course.requires_computer,
        requires_projector: course.requires_projector,
        requires_laboratory: course.requires_laboratory,
        semester: course.semester,
        academic_year: course.academic_year,
        is_active: course.is_active
      });
    } else {
      setFormData({
        name: '',
        code: '',
        teacher: 0,
        department: 0,
        level: 'L1',
        credits: 3,
        max_students: 50,
        description: '',
        course_type: 'CM',
        hours_per_week: 2,
        total_hours: 30,
        min_room_capacity: 30,
        requires_computer: false,
        requires_projector: false,
        requires_laboratory: false,
        semester: 'S1',
        academic_year: '2025-2026',
        is_active: true
      });
    }
    setCurrentStep(1);
    setErrors({});
  }, [course, isOpen]);

  const levels = [
    'L1', 'L2', 'L3', 'L4', 'L5', 'L6',
    'M1', 'M2', 'D1', 'D2', 'D3'
  ];

  const equipmentOptions = [
    'Projecteur',
    'Tableau interactif',
    'Ordinateurs',
    'Microscopes',
    'Équipement médical',
    'Laboratoire',
    'Climatisation',
    'Microphone',
    'Enregistrement'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Le nom du cours est requis';
      if (!formData.code.trim()) newErrors.code = 'Le code du cours est requis';
      if (!formData.teacher) newErrors.teacher = 'L\'enseignant est requis';
      if (!formData.department) newErrors.department = 'Le département est requis';
    }

    if (step === 2) {
      if (!formData.level) newErrors.level = 'Le niveau est requis';
      if (formData.credits < 1 || formData.credits > 10) {
        newErrors.credits = 'Les crédits doivent être entre 1 et 10';
      }
      if (formData.max_students < 0) {
        newErrors.max_students = 'Le nombre d\'étudiants ne peut pas être négatif';
      }
      if (formData.hours_per_week < 1) {
        newErrors.hours_per_week = 'Le nombre d\'heures par semaine doit être positif';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // IA - Déclencher l'analyse si les champs clés changent (DÉSACTIVÉ car cause des problèmes de modal)
    // Vous pouvez l'activer manuellement via un bouton si nécessaire
    // if (['name', 'credits', 'max_students', 'hours_per_week', 'course_type'].includes(field)) {
    //   debouncedAnalyzeCourse({ ...formData, [field]: value });
    // }
  };

  const handleBooleanToggle = (field: keyof CourseFormData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Ref pour le timeout du debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // IA - Fonction d'analyse de la difficulté du cours (useCallback pour stabiliser)
  const analyzeCourse = useCallback(async (courseData: CourseFormData) => {
    if (!courseData.name.trim() || !courseData.credits) return;

    setIsAnalyzing(true);
    try {
      const prediction = await mlService.predictCourseDifficulty({
        course_name: courseData.name,
        lectures: courseData.hours_per_week,
        min_days: Math.ceil(courseData.hours_per_week / 2),
        students: courseData.max_students,
        teacher: `teacher_${courseData.teacher}`,
        total_courses: 50,
        total_rooms: 20,
        total_days: 5,
        periods_per_day: 6,
        lecture_density: courseData.hours_per_week / 30,
        student_lecture_ratio: courseData.max_students / courseData.hours_per_week,
        course_room_ratio: 2.5,
        utilization_pressure: 0.7
      });

      setAiPrediction(prediction);
      setAiRecommendations(prediction.recommendations || []);
    } catch (error) {
      console.error('Erreur d\'analyse IA:', error);
      // Ne pas afficher de toast d'erreur pour éviter de spammer l'utilisateur
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // IA - Fonction avec debounce pour éviter trop d'appels
  const debouncedAnalyzeCourse = useCallback((courseData: CourseFormData) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      analyzeCourse(courseData);
    }, 1500); // Augmenté à 1.5s pour réduire les appels
  }, [analyzeCourse]);

  const courseTypes = [
    { value: 'CM', label: 'Cours Magistral' },
    { value: 'TD', label: 'Travaux Dirigés' },
    { value: 'TP', label: 'Travaux Pratiques' },
    { value: 'CONF', label: 'Conférence' },
    { value: 'EXAM', label: 'Examen' }
  ];

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);
    try {
      if (autoGenerate && !course) {
        // Génération automatique de plusieurs types de cours
        const totalHours = formData.credits * creditHours;
        const coursesToCreate: Array<{ type: string; hours: number }> = [];

        // Calculer les heures pour chaque type
        Object.entries(courseDistribution).forEach(([type, percentage]) => {
          if (percentage > 0) {
            const hours = Math.round((totalHours * percentage) / 100);
            if (hours > 0) {
              coursesToCreate.push({ type, hours });
            }
          }
        });

        // Créer chaque cours avec ses détails spécifiques
        for (const { type, hours } of coursesToCreate) {
          const details = courseDetails[type as keyof typeof courseDetails];
          const courseData = {
            ...formData,
            code: `${formData.code}-${type}`,
            course_type: type as any,
            total_hours: hours,
            hours_per_week: details.hours_per_week,
            requires_projector: details.requires_projector,
            requires_computer: details.requires_computer,
            requires_laboratory: details.requires_laboratory
          };
          await onSave(courseData);
        }

        addToast({
          title: 'Succès',
          description: `${coursesToCreate.length} cours créés automatiquement`,
          variant: 'default'
        });
      } else {
        // Création/modification normale d'un seul cours
        await onSave(formData);
        addToast({
          title: 'Succès',
          description: course ? 'Cours modifié avec succès' : 'Cours créé avec succès',
          variant: 'default'
        });
      }
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);

      // Extraire les messages d'erreur de l'API
      let errorMessage = 'Une erreur est survenue lors de la sauvegarde';

      if (error?.code) {
        errorMessage = Array.isArray(error.code) ? error.code.join(', ') : error.code;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.detail) {
        errorMessage = error.detail;
      } else if (typeof error === 'object') {
        // Si c'est un objet d'erreurs de champs
        const fieldErrors = Object.entries(error)
          .map(([field, msgs]: [string, any]) => {
            const messages = Array.isArray(msgs) ? msgs : [msgs];
            return `${field}: ${messages.join(', ')}`;
          })
          .join('\n');

        if (fieldErrors) {
          errorMessage = fieldErrors;
        }
      }

      addToast({
        title: 'Erreur de validation',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Nom du cours *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground ${
            errors.name ? 'border-destructive/50' : 'border-border'
          }`}
          placeholder="Ex: Anatomie Générale"
        />
        {errors.name && (
          <p className="text-destructive text-sm mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Code du cours *
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
          className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground ${
            errors.code ? 'border-destructive/50' : 'border-border'
          }`}
          placeholder="Ex: ANAT101"
        />
        {errors.code && (
          <p className="text-destructive text-sm mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.code}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Enseignant *
        </label>
        {loadingData ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Chargement...</span>
          </div>
        ) : (
          <select
            value={formData.teacher || ''}
            onChange={(e) => handleInputChange('teacher', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground ${
              errors.teacher ? 'border-destructive/50' : 'border-border'
            }`}
          >
            <option value="">Sélectionner un enseignant</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.code})
              </option>
            ))}
          </select>
        )}
        {errors.teacher && (
          <p className="text-destructive text-sm mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.teacher}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Département *
        </label>
        {loadingData ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Chargement...</span>
          </div>
        ) : (
          <select
            value={formData.department || ''}
            onChange={(e) => handleInputChange('department', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground ${
              errors.department ? 'border-destructive/50' : 'border-border'
            }`}
          >
            <option value="">Sélectionner un département</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        )}
        {errors.department && (
          <p className="text-destructive text-sm mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.department}
          </p>
        )}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Génération automatique - Seulement en mode création */}
      {!course && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
              className="rounded w-5 h-5"
            />
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-foreground">
                Générer automatiquement les types de cours (CM, TD, TP, TPE)
              </span>
            </div>
          </label>

          {autoGenerate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 mt-3 pt-3 border-t border-blue-200"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Heures par crédit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={creditHours}
                    onChange={(e) => setCreditHours(parseInt(e.target.value) || 15)}
                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                  />
                </div>
                <div className="text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Total</span>
                  <p className="text-lg font-bold text-primary">
                    {formData.credits * creditHours}H
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-foreground">Configuration par type de cours</p>

                {(['CM', 'TD', 'TP', 'TPE'] as const).map((type) => {
                  const totalHours = Math.round((formData.credits * creditHours * courseDistribution[type]) / 100);
                  return (
                    <div key={type} className="p-3 bg-background border border-border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{type}</span>
                        <Badge variant="secondary" className="text-xs">
                          {totalHours}H total
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">% du total</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={courseDistribution[type]}
                            onChange={(e) => setCourseDistribution({
                              ...courseDistribution,
                              [type]: parseInt(e.target.value) || 0
                            })}
                            className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">H/semaine</label>
                          <input
                            type="number"
                            min="0"
                            value={courseDetails[type].hours_per_week}
                            onChange={(e) => setCourseDetails({
                              ...courseDetails,
                              [type]: {
                                ...courseDetails[type],
                                hours_per_week: parseInt(e.target.value) || 0
                              }
                            })}
                            className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={courseDetails[type].requires_projector}
                            onChange={(e) => setCourseDetails({
                              ...courseDetails,
                              [type]: {
                                ...courseDetails[type],
                                requires_projector: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-muted-foreground">Projecteur</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={courseDetails[type].requires_computer}
                            onChange={(e) => setCourseDetails({
                              ...courseDetails,
                              [type]: {
                                ...courseDetails[type],
                                requires_computer: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-muted-foreground">Ordinateurs</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={courseDetails[type].requires_laboratory}
                            onChange={(e) => setCourseDetails({
                              ...courseDetails,
                              [type]: {
                                ...courseDetails[type],
                                requires_laboratory: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-muted-foreground">Laboratoire</span>
                        </label>
                      </div>
                    </div>
                  );
                })}

                <div className="text-xs text-center pt-2 border-t border-border">
                  <span className={`font-medium ${
                    (courseDistribution.CM + courseDistribution.TD + courseDistribution.TP + courseDistribution.TPE) === 100
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}>
                    Total répartition : {courseDistribution.CM + courseDistribution.TD + courseDistribution.TP + courseDistribution.TPE}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Niveau *
          </label>
          <select
            value={formData.level}
            onChange={(e) => handleInputChange('level', e.target.value)}
            className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground ${
              errors.level ? 'border-destructive/50' : 'border-border'
            }`}
          >
            <option value="">Sélectionner un niveau</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {errors.level && (
            <p className="text-destructive text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.level}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Crédits *
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.credits}
            onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
            className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground ${
              errors.credits ? 'border-destructive/50' : 'border-border'
            }`}
          />
          {errors.credits && (
            <p className="text-destructive text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.credits}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nombre max d'étudiants
          </label>
          <input
            type="number"
            min="0"
            value={formData.max_students}
            onChange={(e) => handleInputChange('max_students', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground ${
              errors.max_students ? 'border-destructive/50' : 'border-border'
            }`}
            placeholder="50"
          />
          {errors.max_students && (
            <p className="text-destructive text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.max_students}
            </p>
          )}
        </div>

        {!autoGenerate && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Heures par semaine
            </label>
            <input
              type="number"
              min="1"
              value={formData.hours_per_week}
              onChange={(e) => handleInputChange('hours_per_week', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground ${
                errors.hours_per_week ? 'border-destructive/50' : 'border-border'
              }`}
              placeholder="2"
            />
            {errors.hours_per_week && (
              <p className="text-destructive text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.hours_per_week}
              </p>
            )}
          </div>
        )}
      </div>
      
      {!autoGenerate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type de cours
            </label>
            <select
              value={formData.course_type}
              onChange={(e) => handleInputChange('course_type', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            >
              {courseTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Total d'heures
            </label>
            <input
              type="number"
              min="1"
              value={formData.total_hours}
              onChange={(e) => handleInputChange('total_hours', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              placeholder="30"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
          placeholder="Description du cours..."
        />
      </div>

      {/* IA - Panel d'analyse de difficulté */}
      {(aiPrediction || isAnalyzing) && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Brain className="w-4 h-4 text-white" />
              )}
            </div>
            <h4 className="font-semibold text-foreground flex items-center gap-1">
              Analyse IA du cours
              <Sparkles className="w-4 h-4 text-purple-500" />
            </h4>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center gap-2 text-blue-600">
              <span className="text-sm">Analyse en cours...</span>
            </div>
          ) : aiPrediction && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">Difficulté</span>
                  </div>
                  <Badge 
                    variant={aiPrediction.complexity_level === 'Élevée' ? 'destructive' : 
                            aiPrediction.complexity_level === 'Moyenne' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {aiPrediction.complexity_level}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">Score</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">
                    {Math.round(aiPrediction.difficulty_score * 100)}%
                  </span>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-600">Priorité</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">
                    {aiPrediction.priority}/3
                  </span>
                </div>
              </div>

              {aiRecommendations.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-600">Recommandations IA</span>
                  </div>
                  <div className="space-y-1">
                    {aiRecommendations.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        <span className="text-blue-500">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {!autoGenerate && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Équipements requis
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={formData.requires_projector}
                onChange={() => handleBooleanToggle('requires_projector')}
                className="rounded"
              />
              <span className="text-sm text-foreground">Projecteur</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={formData.requires_computer}
                onChange={() => handleBooleanToggle('requires_computer')}
                className="rounded"
              />
              <span className="text-sm text-foreground">Ordinateurs</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={formData.requires_laboratory}
                onChange={() => handleBooleanToggle('requires_laboratory')}
                className="rounded"
              />
              <span className="text-sm text-foreground">Laboratoire</span>
            </label>
          </div>
        </div>
      )}

      {autoGenerate && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-2">
            ℹ️ Mode génération automatique activé
          </p>
          <p className="text-xs text-blue-700">
            Les équipements ont été configurés pour chaque type de cours dans l'étape précédente.
            Les cours seront créés avec ces configurations.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Semestre
          </label>
          <select
            value={formData.semester}
            onChange={(e) => handleInputChange('semester', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          >
            <option value="S1">Semestre 1</option>
            <option value="S2">Semestre 2</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Année académique
          </label>
          <input
            type="text"
            value={formData.academic_year}
            onChange={(e) => handleInputChange('academic_year', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            placeholder="2025-2026"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Capacité min. de salle
        </label>
        <input
          type="number"
          min="1"
          value={formData.min_room_capacity}
          onChange={(e) => handleInputChange('min_room_capacity', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
          placeholder="30"
        />
      </div>

      {/* Section Priorité de Programmation */}
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Priorité de Programmation
        </h3>

        <div className="space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.use_manual_priority || false}
              onChange={() => handleBooleanToggle('use_manual_priority')}
              className="rounded"
            />
            <span className="text-sm text-foreground">Utiliser une priorité manuelle</span>
          </label>

          {formData.use_manual_priority && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Niveau de priorité
              </label>
              <select
                value={formData.manual_scheduling_priority || 3}
                onChange={(e) => handleInputChange('manual_scheduling_priority', parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              >
                <option value={1}>1 - Très Haute (à planifier en premier)</option>
                <option value={2}>2 - Haute</option>
                <option value={3}>3 - Moyenne</option>
                <option value={4}>4 - Basse</option>
                <option value={5}>5 - Très Basse (flexible)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Les cours avec priorité haute seront programmés avant les cours de priorité basse lors de la génération automatique.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={() => handleBooleanToggle('is_active')}
            className="rounded"
          />
          <span className="text-sm text-foreground">Cours actif</span>
        </label>
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="w-full max-w-6xl max-h-[90vh] overflow-auto"
        >
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
                {/* Formulaire principal - 2/3 */}
                <div className="lg:col-span-2 p-6 border-r border-border">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">
                      {course ? 'Modifier le cours' : 'Nouveau cours'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Étape {currentStep} sur 3
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress bar */}
              <div className="flex items-center mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === currentStep
                          ? 'bg-primary text-white'
                          : step < currentStep
                          ? 'bg-emerald-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step < currentStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step
                      )}
                    </div>
                    {step < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          step < currentStep ? 'bg-emerald-500' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Form content */}
              <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t">
                <div>
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={isLoading}
                    >
                      Précédent
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  {currentStep < 3 ? (
                    <Button onClick={handleNext} disabled={isLoading}>
                      Suivant
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {course ? 'Modifier' : 'Créer'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
                </div>

                {/* Assistant IA - 1/3 */}
                <div className="p-4 bg-muted/30">
                  <SmartFormAssistant
                    formData={formData}
                    formFields={[
                      { name: 'name', value: formData.name, type: 'text', label: 'Nom du cours', required: true },
                      { name: 'code', value: formData.code, type: 'text', label: 'Code du cours', required: true },
                      { name: 'credits', value: formData.credits, type: 'number', label: 'Crédits', required: true },
                      { name: 'max_students', value: formData.max_students, type: 'number', label: 'Max étudiants' },
                      { name: 'hours_per_week', value: formData.hours_per_week, type: 'number', label: 'Heures/semaine' },
                      { name: 'description', value: formData.description, type: 'textarea', label: 'Description' },
                      { name: 'teacher', value: formData.teacher, type: 'number', label: 'Enseignant', required: true },
                      { name: 'department', value: formData.department, type: 'number', label: 'Département', required: true }
                    ]}
                    formType="course"
                    isOpen={showFormAssistant}
                    onToggle={() => setShowFormAssistant(!showFormAssistant)}
                    onFieldSuggestion={(field: string, value: any) => {
                      setFormData(prev => ({ ...prev, [field]: value }));
                    }}
                    onValidationChange={(result) => {
                      // Utiliser les résultats de validation pour ajuster l'UI
                    }}
                    className="h-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}