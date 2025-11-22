'use client';

import React, { useState, useEffect, useImperativeHandle, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AnimatedBackground from '@/components/ui/animated-background';
import { BulkActions, CommonBulkActions } from '@/components/ui/BulkActions';
import { Plus, Settings2, X, Calendar, CheckSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getChatbotActionExecutor } from '@/services/chatbotActionExecutor';

// Import des composants créés
import {
  FloatingHeader,
  FiltersSection,
  FloatingStats,
  SessionCard,
  FloatingAIDetector,
  SessionForm,
  ScheduleGrid,
  ManagementPanel,
  UnifiedFloatingMenu
} from './components';

// Import des services API
import { scheduleService } from '@/lib/api/services/schedules';
import { occurrenceService } from '@/lib/api/services/occurrences';
import { courseService } from '@/lib/api/services/courses';
import { roomService } from '@/lib/api/services/rooms';
import { classService } from '@/lib/api/services/classes';

// Import du système de feature flags
import { FEATURE_FLAGS, debugLog, getActiveSystem } from '@/lib/featureFlags';

// Import du générateur IA
import { AIScheduleGenerator } from '@/components/scheduling/AIScheduleGenerator';

// Import des composants de gestion des occurrences
import OccurrenceManager from '@/components/scheduling/OccurrenceManager';

// Import des types
import {
  ScheduleSession as ApiScheduleSession,
  SessionOccurrence,
  Teacher,
  Course,
  Room,
  TimeSlot
} from '@/types/api';

// Types locaux
interface StudentClass {
  id: number;
  code: string;
  name: string;
  level: string;
  department_name: string;
  student_count: number;
}

type ScheduleSession = ApiScheduleSession;
type FilterType = 'all' | 'CM' | 'TD' | 'TP' | 'TPE' | 'EXAM' | 'CONF';
type ViewMode = 'week' | 'day' | 'month';
type EditMode = 'view' | 'edit' | 'drag';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function SchedulePage() {
  // Hook d'authentification et permissions
  const { user, isLoading: authLoading, isTeacher, isStudent, canManageSchedules } = useAuth();
  const isReadOnly = isTeacher() || isStudent();
  const searchParams = useSearchParams();
  const router = useRouter();

  // États principaux
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  
  // États de vue et mode
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [editMode, setEditMode] = useState<EditMode>('view');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // États pour les données auxiliaires
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // États de conflit et statistiques
  const [backendConflicts, setBackendConflicts] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  
  // États d'édition
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedSession, setDraggedSession] = useState<ScheduleSession | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: string; time: string; y?: number; isValid?: boolean } | null>(null);
  
  // États de filtrage
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyMyCourses, setShowOnlyMyCourses] = useState(false);
  
  // États de formulaire
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleSession | null>(null);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // États pour les nouveaux composants d'occurrences
  const [showOccurrenceManager, setShowOccurrenceManager] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState<number | undefined>(undefined);

  // États de sélection pour les actions groupées
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { addToast } = useToast();

  // Enregistrement auprès du ChatbotActionExecutor
  useEffect(() => {
    const executor = getChatbotActionExecutor(router);

    // Exposer les méthodes que le chatbot peut appeler
    const pageAPI = {
      // Sélection de classe
      selectClass: (classCode: string) => {
        console.log('[Schedule] Chatbot action: selectClass', classCode);
        setSelectedClass(classCode);
        addToast({
          title: "Classe sélectionnée",
          description: `Affichage de la classe ${classCode}`,
        });
      },

      // Changement de vue
      setViewMode: (mode: ViewMode) => {
        console.log('[Schedule] Chatbot action: setViewMode', mode);
        setViewMode(mode);
        addToast({
          title: "Vue changée",
          description: `Mode de vue: ${mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}`,
        });
      },

      // Filtrage
      setFilter: (filter: FilterType) => {
        console.log('[Schedule] Chatbot action: setFilter', filter);
        setActiveFilter(filter);
        addToast({
          title: "Filtre appliqué",
          description: `Affichage des sessions: ${filter}`,
        });
      },

      // Affichage/masquage statistiques
      toggleStatistics: (show: boolean) => {
        console.log('[Schedule] Chatbot action: toggleStatistics', show);
        // La logique des stats est gérée par UnifiedFloatingMenu
        addToast({
          title: show ? "Statistiques affichées" : "Statistiques masquées",
          description: "Consultez le menu flottant",
        });
      },

      // Changement de mode d'édition
      setEditMode: (mode: EditMode) => {
        console.log('[Schedule] Chatbot action: setEditMode', mode);
        setEditMode(mode);
        const modeNames = {
          'view': 'Lecture seule',
          'edit': 'Édition',
          'drag': 'Drag & Drop'
        };
        addToast({
          title: "Mode changé",
          description: `Mode: ${modeNames[mode]}`,
        });
      },

      // Ouverture formulaire session
      openSessionForm: (sessionId?: number) => {
        console.log('[Schedule] Chatbot action: openSessionForm', sessionId);
        if (sessionId) {
          const session = sessions.find(s => s.id === sessionId);
          setEditingSession(session || null);
        } else {
          setEditingSession(null);
        }
        setShowSessionForm(true);
        addToast({
          title: sessionId ? "Modification de session" : "Nouvelle session",
          description: "Formulaire ouvert",
        });
      },

      // Export
      exportSchedule: (format: 'excel' | 'pdf' | 'csv') => {
        console.log('[Schedule] Chatbot action: exportSchedule', format);
        // Déclencher l'export (la fonction handleExport existe déjà dans le composant)
        if (format === 'excel') {
          // On va appeler handleExport qui est défini plus bas
          setTimeout(() => {
            const exportButton = document.querySelector('[data-export-button]') as HTMLElement;
            if (exportButton) {
              exportButton.click();
            }
          }, 100);
        }
        addToast({
          title: "Export en cours",
          description: `Format: ${format.toUpperCase()}`,
        });
      }
    };

    executor.registerSchedulePage(pageAPI);

    return () => {
      // Cleanup si nécessaire
    };
  }, [router, sessions, addToast]);

  // Génération d'une grille très fine (intervalles de 5 minutes) sur horaires réduits
  const generateTimeSlots = () => {
    const slots = [];
    // Horaires concentrés de 8h à 19h avec intervalles de 10 minutes
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Fonctions de chargement des données
  const loadStudentClasses = async () => {
    try {
      // Si l'utilisateur est un enseignant, filtrer par son ID
      let data: any[] = [];
      if (isTeacher()) {
        if (user?.teacher_id) {
          console.log('🔍 Chargement des classes pour l\'enseignant ID:', user.teacher_id);
          console.log('👤 Utilisateur:', user);
          data = await classService.getClasses(`?teacher=${user.teacher_id}`);
          console.log('📚 Classes trouvées pour l\'enseignant:', data.length, data);
        } else {
          console.warn('⚠️ Enseignant sans teacher_id! User:', user);
          addToast({
            title: "Attention",
            description: "Votre profil enseignant n'est pas encore configuré. Contactez l'administrateur.",
            variant: "destructive"
          });
          data = [];
        }
      } else {
        console.log('🔍 Chargement de toutes les classes');
        data = await classService.getClasses();
        console.log('📚 Total des classes:', data.length);
      }
      const classesArray = Array.isArray(data) ? data : [];
      setStudentClasses(classesArray);

      // Vérifier si un ID d'emploi du temps est passé dans l'URL
      const scheduleIdFromUrl = searchParams.get('id');

      if (scheduleIdFromUrl && classesArray.length > 0) {
        try {
          // Récupérer l'emploi du temps pour connaître sa classe
          console.log('🔍 Récupération de l\'emploi du temps ID:', scheduleIdFromUrl);
          const schedule = await scheduleService.getSchedule(parseInt(scheduleIdFromUrl));

          if (schedule && schedule.student_class) {
            // Chercher la classe correspondante dans la liste
            const classFromSchedule = classesArray.find(c =>
              c.id === schedule.student_class || c.code === schedule.student_class_code
            );

            if (classFromSchedule) {
              setSelectedClass(classFromSchedule.code);
              console.log('✅ Classe sélectionnée depuis l\'emploi du temps (Schedule ID:', scheduleIdFromUrl, '):', classFromSchedule.name, 'Code:', classFromSchedule.code);
              return;
            } else {
              console.warn('⚠️ Classe de l\'emploi du temps', scheduleIdFromUrl, 'non trouvée dans les classes disponibles');
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération de l\'emploi du temps:', error);
          addToast({
            title: "Attention",
            description: "Impossible de charger l'emploi du temps demandé",
            variant: "default"
          });
        }
      }

      // Sélectionner automatiquement la première classe par défaut si aucune n'est déjà sélectionnée
      if (classesArray.length > 0 && !selectedClass) {
        const firstClassCode = classesArray[0].code; // Utiliser le code au lieu de l'ID
        setSelectedClass(firstClassCode);
        console.log('✅ Première classe sélectionnée automatiquement:', classesArray[0].name, 'Code:', firstClassCode);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de charger les classes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuxiliaryData = async () => {
    // Les enseignants et étudiants n'ont pas besoin de ces données (mode lecture seule)
    if (!canManageSchedules()) {
      console.log('👀 Mode lecture seule - Pas de chargement des ressources auxiliaires');
      setCourses([]);
      setTeachers([]);
      setRooms([]);
      return;
    }

    try {
      console.log('📚 Chargement des ressources auxiliaires (admin/planificateur)');
      const [coursesResponse, teachersResponse, roomsResponse] = await Promise.all([
        courseService.getCourses(),
        courseService.getTeachers(),
        roomService.getRooms({ page_size: 1000 })
      ]);

      setCourses(coursesResponse.results || []);
      setTeachers(teachersResponse.results || []);
      setRooms(roomsResponse.results || []);
      console.log(`✅ Chargé: ${coursesResponse.results?.length || 0} cours, ${teachersResponse.results?.length || 0} enseignants, ${roomsResponse.results?.length || 0} salles`);
    } catch (error) {
      console.error('Erreur lors du chargement des données auxiliaires:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de charger certaines données",
        variant: "destructive"
      });
    }
  };

  const loadSessions = async () => {
    if (!selectedClass) {
      setSessions([]);
      setFilteredSessions([]);
      return;
    }

    setSessionsLoading(true);
    const systemType = getActiveSystem();
    debugLog(`Loading ${systemType} for class ${selectedClass}`, { viewMode, selectedDate });

    try {
      let data;

      // ===== NOUVEAU SYSTÈME (Occurrences) =====
      if (FEATURE_FLAGS.USE_OCCURRENCES_SYSTEM) {
        debugLog('Using NEW occurrences system');

        // Récupérer le schedule ID à partir du code de classe
        let scheduleId: number | undefined;
        try {
          const schedule = await scheduleService.getScheduleByClass(selectedClass);
          scheduleId = schedule.id;
          setCurrentScheduleId(scheduleId); // Store it for OccurrenceManager
          debugLog('Schedule found for class', selectedClass, 'ID:', scheduleId);
        } catch (error: any) {
          // Afficher une notification à l'utilisateur (sans console.error)
          const errorMessage = error?.error || error?.message || 'Aucun emploi du temps trouvé';
          const className = error?.student_class?.name || selectedClass;

          addToast({
            title: 'Aucun emploi du temps',
            description: `Aucun emploi du temps n'a été trouvé pour la classe ${className}`,
            variant: 'default'
          });

          // Arrêter le chargement et vider les sessions
          setSessions([]);
          setFilteredSessions([]);
          setSessionsLoading(false);
          return;
        }

        if (viewMode === 'week') {
          const weekStart = occurrenceService.getWeekStart(selectedDate);
          data = await occurrenceService.getWeeklyOccurrences({
            week_start: weekStart,
            schedule: scheduleId
          });

          // Convertir les occurrences en format compatible avec l'ancien système
          const allOccurrences = data?.occurrences_by_day
            ? Object.values(data.occurrences_by_day).flat() as SessionOccurrence[]
            : [];

          debugLog('WEEKLY OCCURRENCES LOADED:', allOccurrences.length, allOccurrences);

          console.log('🔍 RAW OCCURRENCE SAMPLE (before adaptation):', allOccurrences[0]);

          // Adapter les occurrences pour qu'elles ressemblent aux sessions
          const adaptedSessions = allOccurrences.map((occ: any) => ({
            ...occ,
            // Ajouter les champs manquants pour compatibilité
            schedule: occ.session_template,
            course: occ.session_template_details?.course || 0,
            specific_date: occ.actual_date,
            specific_start_time: occ.start_time,
            specific_end_time: occ.end_time,
            session_type: occ.session_template_details?.session_type || 'CM',
            expected_students: occ.session_template_details?.expected_students || 0,
            // Adapter les détails de cours depuis le format simplifié
            course_details: {
              code: occ.course_code,
              name: occ.course_name,
            },
            room_details: {
              code: occ.room_code,
            },
            teacher_details: {
              user_details: {
                last_name: occ.teacher_name,
              },
            },
            // Garder les données d'origine pour le composant
            __is_occurrence: true,
          })) as any[];

          console.log('✅ ADAPTED SESSION SAMPLE (after adaptation):', adaptedSessions[0]);

          setSessions(adaptedSessions);
          setWeeklyData(data);

        } else if (viewMode === 'day') {
          // Le scheduleId a déjà été récupéré ci-dessus
          const dateStr = occurrenceService.formatDate(selectedDate);
          data = await occurrenceService.getDailyOccurrences({
            date: dateStr,
            schedule: scheduleId
          });

          const occurrences = data?.occurrences || [];
          debugLog('DAILY OCCURRENCES LOADED:', occurrences.length, occurrences);

          // Adapter les occurrences
          const adaptedSessions = occurrences.map((occ: any) => ({
            ...occ,
            schedule: occ.session_template,
            course: occ.session_template_details?.course || 0,
            specific_date: occ.actual_date,
            specific_start_time: occ.start_time,
            specific_end_time: occ.end_time,
            session_type: occ.session_template_details?.session_type || 'CM',
            expected_students: occ.session_template_details?.expected_students || 0,
            // Adapter les détails de cours depuis le format simplifié
            course_details: {
              code: occ.course_code,
              name: occ.course_name,
            },
            room_details: {
              code: occ.room_code,
            },
            teacher_details: {
              user_details: {
                last_name: occ.teacher_name,
              },
            },
            __is_occurrence: true,
          })) as any[];

          setSessions(adaptedSessions);
          setDailyData(data);

        } else if (viewMode === 'month') {
          // Le scheduleId a déjà été récupéré ci-dessus
          const dateStr = occurrenceService.formatDate(selectedDate);
          data = await occurrenceService.getMonthlyOccurrences({
            date: dateStr,
            schedule: scheduleId
          });

          // Extraire toutes les occurrences de occurrences_by_date
          const allOccurrences: any[] = [];
          if (data?.occurrences_by_date) {
            Object.values(data.occurrences_by_date).forEach((dateOccurrences: any) => {
              allOccurrences.push(...dateOccurrences);
            });
          }

          debugLog('MONTHLY OCCURRENCES LOADED:', allOccurrences.length, allOccurrences);

          // Adapter les occurrences
          const adaptedSessions = allOccurrences.map((occ: any) => ({
            ...occ,
            schedule: occ.session_template,
            course: occ.session_template_details?.course || 0,
            specific_date: occ.actual_date,
            specific_start_time: occ.start_time,
            specific_end_time: occ.end_time,
            session_type: occ.session_template_details?.session_type || 'CM',
            expected_students: occ.session_template_details?.expected_students || 0,
            course_details: {
              code: occ.course_code,
              name: occ.course_name,
            },
            room_details: {
              code: occ.room_code,
            },
            teacher_details: {
              user_details: {
                last_name: occ.teacher_name,
              },
            },
            __is_occurrence: true,
          })) as any[];

          setSessions(adaptedSessions);
        }
      }
      // ===== ANCIEN SYSTÈME (Sessions) =====
      else {
        debugLog('Using OLD sessions system');

        if (viewMode === 'week') {
          const weekStart = scheduleService.getWeekStart(selectedDate);
          data = await scheduleService.getWeeklySessions({
            week_start: weekStart,
            class: selectedClass
          });

          const allSessions = data?.sessions_by_day
            ? Object.values(data.sessions_by_day).flat() as ScheduleSession[]
            : [];
          debugLog('WEEKLY SESSIONS LOADED:', allSessions.length, allSessions);
          setSessions(allSessions);
          setWeeklyData(data);

        } else if (viewMode === 'day') {
          const dateStr = scheduleService.formatDate(selectedDate);
          data = await scheduleService.getDailySessions({
            date: dateStr,
            class: selectedClass
          });

          const sessions = data?.sessions || [];
          debugLog('DAILY SESSIONS LOADED:', sessions.length, sessions);
          setSessions(sessions);
          setDailyData(data);

        } else {
          // Mode mois - pour l'instant, même logique que semaine
          const weekStart = scheduleService.getWeekStart(selectedDate);
          data = await scheduleService.getWeeklySessions({
            week_start: weekStart,
            class: selectedClass
          });

          const allSessions = data?.sessions_by_day
            ? Object.values(data.sessions_by_day).flat() as ScheduleSession[]
            : [];
          setSessions(allSessions);
        }
      }

      // Détecter les conflits
      if (data && (data.results?.length > 0 || data.sessions?.length > 0 || data.sessions_by_day || data.occurrences_by_day || data.occurrences_by_date || data.occurrences)) {
        await detectConflicts();
      }

    } catch (error) {
      console.error(`Erreur lors du chargement des ${systemType}:`, error);
      addToast({
        title: "Erreur",
        description: `Impossible de charger les ${systemType === 'occurrences' ? 'occurrences' : 'sessions'}`,
        variant: "destructive"
      });
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const detectConflicts = async () => {
    try {
      const response = await scheduleService.getConflicts();
      setBackendConflicts(response.results || []);
    } catch (error) {
      console.error('Erreur lors de la détection des conflits:', error);
      setBackendConflicts([]);
    }
  };

  // Gestion des sessions
  const handleSessionSave = async (formData: any) => {
    try {
      const sessionData = {
        course: formData.course,
        teacher: formData.teacher,
        room: formData.room,
        day: formData.day,
        specific_start_time: formData.startTime,
        specific_end_time: formData.endTime,
        session_type: formData.sessionType,
        expected_students: formData.expectedStudents,
        notes: formData.notes
      };

      if (editingSession) {
        await scheduleService.updateScheduleSession(editingSession.id, sessionData);
        addToast({
          title: "Succès",
          description: "Session modifiée avec succès",
          variant: "default"
        });
      } else {
        await scheduleService.createScheduleSession(sessionData);
        addToast({
          title: "Succès", 
          description: "Session créée avec succès",
          variant: "default"
        });
      }

      setShowSessionForm(false);
      setEditingSession(null);
      await loadSessions();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de sauvegarder la session",
        variant: "destructive"
      });
    }
  };

  const handleSessionEdit = (session: ScheduleSession) => {
    setEditingSession(session);
    setShowSessionForm(true);
  };

  const handleSessionDelete = async (sessionId: number) => {
    // Demander confirmation avant suppression
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) return;

    // Dans le nouveau système, on supprime directement l'occurrence
    if (FEATURE_FLAGS.USE_OCCURRENCES_SYSTEM) {
      try {
        await occurrenceService.deleteOccurrence(sessionId);

        // Mettre à jour localement en filtrant la session supprimée
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);

        addToast({
          title: "Succès",
          description: "Séance supprimée avec succès",
          variant: "default"
        });
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          title: "Erreur",
          description: error.response?.data?.message || "Impossible de supprimer la séance",
          variant: "destructive"
        });
      }
    }
    // Ancien système : suppression classique
    else {
      try {
        await scheduleService.deleteScheduleSession(sessionId);

        // Mettre à jour localement
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);

        addToast({
          title: "Succès",
          description: "Session supprimée avec succès",
          variant: "default"
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          title: "Erreur",
          description: "Impossible de supprimer la session",
          variant: "destructive"
        });
      }
    }
  };

  const handleSessionDuplicate = (session: ScheduleSession) => {
    const { id, ...duplicatedSession } = session;
    setEditingSession(duplicatedSession as ScheduleSession);
    setShowSessionForm(true);
  };

  // Fonctions de sélection pour les actions groupées
  const toggleSessionSelection = (sessionId: number) => {
    const newSelection = new Set(selectedSessionIds);
    if (newSelection.has(sessionId)) {
      newSelection.delete(sessionId);
    } else {
      newSelection.add(sessionId);
    }
    setSelectedSessionIds(newSelection);
  };

  const handleSelectAllSessions = () => {
    const allIds = new Set(filteredSessions.map(s => s.id).filter((id): id is number => id !== undefined));
    setSelectedSessionIds(allIds);
  };

  const handleDeselectAllSessions = () => {
    setSelectedSessionIds(new Set());
  };

  // Actions groupées
  const handleBulkDeleteSessions = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedSessionIds.size} séance(s) ?`)) return;

    try {
      if (FEATURE_FLAGS.USE_OCCURRENCES_SYSTEM) {
        await Promise.all(Array.from(selectedSessionIds).map(id => occurrenceService.deleteOccurrence(id)));
      } else {
        await Promise.all(Array.from(selectedSessionIds).map(id => scheduleService.deleteScheduleSession(id)));
      }

      addToast({
        title: "Succès",
        description: `${selectedSessionIds.size} séance(s) supprimée(s)`,
      });

      await loadSessions();
      setSelectedSessionIds(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Erreur lors de la suppression groupée",
        variant: "destructive",
      });
    }
  };

  // Gestion du drag & drop
  const handleSessionDrop = async (day: string, time: string, session: ScheduleSession) => {
    try {
      // Convertir le jour en date spécifique
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const currentWeekStart = FEATURE_FLAGS.USE_OCCURRENCES_SYSTEM
        ? occurrenceService.getWeekStart(selectedDate)
        : scheduleService.getWeekStart(selectedDate);
      const dayIndex = dayNames.findIndex(d => d === day.toLowerCase());

      if (dayIndex === -1) {
        throw new Error('Jour invalide');
      }

      const newDate = new Date(currentWeekStart);
      newDate.setDate(newDate.getDate() + (dayIndex === 0 ? 6 : dayIndex - 1));

      // Calculer l'heure de fin basée sur la durée originale
      const originalStart = session.specific_start_time || (session as any).time_slot_details?.start_time;
      const originalEnd = session.specific_end_time || (session as any).time_slot_details?.end_time;

      let endTime = time;
      if (originalStart && originalEnd) {
        const [startH, startM] = originalStart.split(':').map(Number);
        const [endH, endM] = originalEnd.split(':').map(Number);
        const [newStartH, newStartM] = time.split(':').map(Number);

        const originalDuration = (endH * 60 + endM) - (startH * 60 + startM);
        const newEndMinutes = (newStartH * 60 + newStartM) + originalDuration;

        const endHour = Math.floor(newEndMinutes / 60);
        const endMinute = newEndMinutes % 60;
        endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      }

      // Vérifier les chevauchements avant de faire le déplacement
      const newDateStr = newDate.toISOString().split('T')[0];
      const hasOverlap = sessions.some(otherSession => {
        if (otherSession.id === session.id) return false;

        const otherDate = otherSession.specific_date;
        if (otherDate !== newDateStr) return false;

        const otherStart = otherSession.specific_start_time;
        const otherEnd = otherSession.specific_end_time;

        if (!otherStart || !otherEnd) return false;

        const [newStartH, newStartM] = time.split(':').map(Number);
        const [newEndH, newEndM] = endTime.split(':').map(Number);
        const [otherStartH, otherStartM] = otherStart.split(':').map(Number);
        const [otherEndH, otherEndM] = otherEnd.split(':').map(Number);
        const newStartMinutes = newStartH * 60 + newStartM;
        const newEndMinutes = newEndH * 60 + newEndM;
        const otherStartMinutes = otherStartH * 60 + otherStartM;
        const otherEndMinutes = otherEndH * 60 + otherEndM;

        return (newStartMinutes < otherEndMinutes && newEndMinutes > otherStartMinutes);
      });

      if (hasOverlap) {
        addToast({
          title: "Conflit détecté",
          description: "Une autre session occupe déjà ce créneau horaire",
          variant: "destructive"
        });
        return;
      }

      // ===== NOUVEAU SYSTÈME : Modifier directement l'occurrence =====
      if (FEATURE_FLAGS.USE_OCCURRENCES_SYSTEM) {
        // Attendre la confirmation du backend AVANT de mettre à jour localement
        const updatedOccurrence = await occurrenceService.updateOccurrence(session.id, {
          actual_date: newDateStr,
          start_time: time,
          end_time: endTime,
        });

        // SEULEMENT SI SUCCÈS : mettre à jour localement avec les données du serveur
        const updatedSessions = sessions.map(s => {
          if (s.id === session.id) {
            return {
              ...s,
              actual_date: updatedOccurrence.actual_date,
              specific_date: updatedOccurrence.actual_date,
              start_time: updatedOccurrence.start_time,
              specific_start_time: updatedOccurrence.start_time,
              end_time: updatedOccurrence.end_time,
              specific_end_time: updatedOccurrence.end_time,
              is_time_modified: updatedOccurrence.is_time_modified,
            };
          }
          return s;
        });
        setSessions(updatedSessions);

        addToast({
          title: "Succès",
          description: "Séance déplacée avec succès",
          variant: "default"
        });
      }
      // ===== ANCIEN SYSTÈME : Mettre à jour les champs =====
      else {
        const updateData = {
          specific_date: newDateStr,
          specific_start_time: time,
          specific_end_time: endTime
        };

        await scheduleService.updateScheduleSession(session.id, updateData);

        // Mettre à jour localement après succès
        const updatedSessions = sessions.map(s => {
          if (s.id === session.id) {
            return {
              ...s,
              specific_date: newDateStr,
              specific_start_time: time,
              specific_end_time: endTime
            };
          }
          return s;
        });
        setSessions(updatedSessions);

        addToast({
          title: "Succès",
          description: "Session déplacée avec succès",
          variant: "default"
        });
      }

      setHasChanges(true);

      // Détecter les nouveaux conflits
      await detectConflicts();

    } catch (error: any) {
      console.error('Erreur lors du déplacement:', error);

      // Afficher les détails du conflit si disponible
      if (error.response?.data?.conflicts && error.response.data.conflicts.length > 0) {
        const conflictDetails = error.response.data.conflicts
          .map((c: any) => `${c.type}: ${c.message || c.resource}`)
          .join(', ');

        addToast({
          title: "Conflit détecté",
          description: `${error.response.data.message || 'Impossible de déplacer la séance'}. ${conflictDetails}`,
          variant: "destructive"
        });
      } else {
        addToast({
          title: "Erreur",
          description: error.response?.data?.message || "Impossible de déplacer la séance",
          variant: "destructive"
        });
      }

      // Pas besoin de recharger, l'état local n'a pas changé
    }
  };

  // Gestion du filtrage
  const applyFilters = () => {
    let filtered = [...sessions];

    // Filtre par type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(session => session.session_type === activeFilter);
    }

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.course_details?.name?.toLowerCase().includes(searchLower) ||
        session.course_details?.code?.toLowerCase().includes(searchLower) ||
        session.teacher_details?.user_details?.last_name?.toLowerCase().includes(searchLower) ||
        session.room_details?.code?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre "Mon emploi du temps" pour les enseignants
    if (showOnlyMyCourses && isTeacher() && user?.teacher_id) {
      console.log('🔍 Filtrage par enseignant - teacher_id:', user.teacher_id);
      console.log('📚 Sessions avant filtrage:', filtered.length);
      console.log('📝 Exemple de session:', filtered[0]);

      // Filtrer par l'ID de l'enseignant
      // Vérifier plusieurs champs possibles où l'ID peut être stocké
      filtered = filtered.filter(session => {
        const teacherId = session.teacher || session.teacher_details?.id;
        const matches = teacherId === user.teacher_id;

        if (!matches && filtered.indexOf(session) < 3) {
          console.log(`❌ Session exclue:`, {
            course: session.course_details?.name,
            teacher: teacherId,
            expected: user.teacher_id
          });
        }

        return matches;
      });

      console.log('✅ Sessions après filtrage:', filtered.length);
    }

    setFilteredSessions(filtered);
  };

  // Gestion de l'export et import
  const handleExport = async () => {
    try {
      if (!selectedClass) {
        addToast({
          title: "Erreur",
          description: "Veuillez sélectionner une classe",
          variant: "destructive"
        });
        return;
      }

      if (filteredSessions.length === 0) {
        addToast({
          title: "Erreur",
          description: "Aucune session à exporter",
          variant: "destructive"
        });
        return;
      }

      // Import dynamique de XLSX
      const XLSX = await import('xlsx');

      // Transformer les sessions en format tableau
      const worksheetData = filteredSessions.map(session => ({
        'Date': session.specific_date || '',
        'Heure début': session.specific_start_time || '',
        'Heure fin': session.specific_end_time || '',
        'Cours': session.course_details?.name || '',
        'Code': session.course_details?.code || '',
        'Type': session.session_type || '',
        'Enseignant': session.teacher_details?.user_details
          ? `${session.teacher_details.user_details.first_name} ${session.teacher_details.user_details.last_name}`
          : '',
        'Salle': session.room_details?.code || '',
        'Capacité salle': session.room_details?.capacity || '',
        'Étudiants': session.expected_students || 0,
        'Notes': session.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Ajuster la largeur des colonnes
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 10 }, // Heure début
        { wch: 10 }, // Heure fin
        { wch: 30 }, // Cours
        { wch: 10 }, // Code
        { wch: 8 },  // Type
        { wch: 25 }, // Enseignant
        { wch: 10 }, // Salle
        { wch: 12 }, // Capacité
        { wch: 10 }, // Étudiants
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Emploi du temps');

      // Télécharger le fichier
      const fileName = `emploi_temps_${selectedClass}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      addToast({
        title: "Succès",
        description: `Emploi du temps exporté (${filteredSessions.length} sessions)`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      addToast({
        title: "Erreur",
        description: "Impossible d'exporter l'emploi du temps",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    try {
      if (!selectedClass) {
        addToast({
          title: "Erreur",
          description: "Veuillez sélectionner une classe",
          variant: "destructive"
        });
        return;
      }

      // Créer un input file invisible
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls,.csv';

      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        // Import Excel/CSV
        if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
          try {
            const XLSX = await import('xlsx');

            const reader = new FileReader();
            reader.onload = async (event) => {
              try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Transformer les données en format session
                const importedSessions = jsonData.map((row: any) => {
                  // Trouver le cours par nom
                  const course = courses.find(c => c.name === row['Cours'] || c.code === row['Code']);

                  // Trouver l'enseignant par nom
                  const teacherName = row['Enseignant'] || '';
                  const teacher = teachers.find(t =>
                    teacherName.includes(t.user_details?.last_name || '') ||
                    teacherName.includes(t.user_details?.first_name || '')
                  );

                  // Trouver la salle par code
                  const room = rooms.find(r => r.code === row['Salle']);

                  return {
                    specific_date: row['Date'],
                    specific_start_time: row['Heure début'],
                    specific_end_time: row['Heure fin'],
                    course: course?.id,
                    session_type: row['Type'],
                    teacher: teacher?.id,
                    room: room?.id,
                    expected_students: parseInt(row['Étudiants']) || 30,
                    notes: row['Notes'] || '',
                    student_class: selectedClass
                  };
                });

                // Valider les données
                const validSessions = importedSessions.filter(s =>
                  s.specific_date && s.specific_start_time && s.specific_end_time && s.course
                );

                const invalidCount = importedSessions.length - validSessions.length;

                if (validSessions.length === 0) {
                  addToast({
                    title: "Erreur",
                    description: "Aucune session valide trouvée dans le fichier",
                    variant: "destructive"
                  });
                  return;
                }

                // Confirmer l'import
                const confirmMessage = `Importer ${validSessions.length} session(s) ?` +
                  (invalidCount > 0 ? `\n${invalidCount} session(s) invalide(s) seront ignorée(s).` : '');

                if (!confirm(confirmMessage)) return;

                // Créer les sessions
                let successCount = 0;
                let errorCount = 0;

                for (const session of validSessions) {
                  try {
                    await scheduleService.createScheduleSession(session);
                    successCount++;
                  } catch (error) {
                    console.error('Erreur import session:', error);
                    errorCount++;
                  }
                }

                addToast({
                  title: "Import terminé",
                  description: `${successCount} session(s) importée(s)` +
                    (errorCount > 0 ? `, ${errorCount} erreur(s)` : ''),
                  variant: successCount > 0 ? "default" : "destructive"
                });

                if (successCount > 0) {
                  await loadSessions();
                }
              } catch (error) {
                console.error('Erreur lors du parsing:', error);
                addToast({
                  title: "Erreur",
                  description: "Impossible de lire le fichier. Vérifiez le format.",
                  variant: "destructive"
                });
              }
            };

            reader.onerror = () => {
              addToast({
                title: "Erreur",
                description: "Impossible de lire le fichier",
                variant: "destructive"
              });
            };

            reader.readAsBinaryString(file);
          } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            addToast({
              title: "Erreur",
              description: "Impossible d'importer le fichier",
              variant: "destructive"
            });
          }
        } else {
          addToast({
            title: "Erreur",
            description: "Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv",
            variant: "destructive"
          });
        }
      };

      input.click();
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      addToast({
        title: "Erreur",
        description: "Impossible d'importer l'emploi du temps",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    try {
      if (!hasChanges) {
        addToast({
          title: "Info",
          description: "Aucune modification à sauvegarder",
          variant: "default"
        });
        return;
      }

      // Recharger les données pour synchroniser avec le backend
      // Les modifications ont déjà été sauvegardées lors des actions individuelles
      // (handleSessionSave, handleSessionDelete, handleSessionDrop, etc.)
      // Cette fonction sert principalement à confirmer que tout est synchronisé

      await loadSessions();

      setHasChanges(false);
      addToast({
        title: "Succès",
        description: "Modifications synchronisées avec le serveur",
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive"
      });
    }
  };

  const handleGenerateSchedule = () => {
    setShowAIGenerator(true);
  };

  // Effects
  useEffect(() => {
    // Attendre que l'authentification soit terminée avant de charger les données
    if (!authLoading) {
      loadStudentClasses();
      loadAuxiliaryData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (selectedClass) {
      loadSessions();
    }
  }, [selectedClass, selectedDate, viewMode]);

  useEffect(() => {
    applyFilters();
  }, [sessions, activeFilter, searchTerm, showOnlyMyCourses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="container mx-auto py-6 px-4 relative z-10">
        {/* En-tête principal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Emplois du Temps
          </h1>
          <p className="text-gray-600">
            Gérez et organisez vos emplois du temps en temps réel
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Section de filtres */}
            <FiltersSection
              sessions={sessions}
              filteredSessions={filteredSessions}
              onFilterChange={setActiveFilter}
              activeFilter={activeFilter}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            {/* Grille de planning */}
            {selectedClass ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {sessionsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Chargement des sessions...</p>
                  </div>
                ) : (
                  <>
                    {/* Actions groupées */}
                    {selectedSessionIds.size > 0 && canManageSchedules() && (
                      <div className="mb-4">
                        <BulkActions
                          selectedCount={selectedSessionIds.size}
                          totalCount={filteredSessions.length}
                          onSelectAll={handleSelectAllSessions}
                          onDeselectAll={handleDeselectAllSessions}
                          actions={[
                            CommonBulkActions.delete(handleBulkDeleteSessions, selectedSessionIds.size)
                          ]}
                        />
                      </div>
                    )}

                    {console.log('PASSING TO GRID:', { sessionsCount: filteredSessions.length, sessions: filteredSessions })}
                    <ScheduleGrid
                      sessions={filteredSessions}
                      viewMode={viewMode}
                      editMode={editMode}
                      selectedDate={selectedDate}
                      timeSlots={timeSlots}
                      onSessionEdit={handleSessionEdit}
                      onSessionDelete={handleSessionDelete}
                      onSessionDuplicate={handleSessionDuplicate}
                      onDrop={handleSessionDrop}
                      conflicts={backendConflicts}
                      onViewModeChange={setViewMode}
                      onDateChange={setSelectedDate}
                      isSelectionMode={isSelectionMode}
                      selectedSessionIds={selectedSessionIds}
                      onSessionToggleSelect={toggleSessionSelection}
                    />
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-white rounded-lg shadow-sm border"
              >
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Aucune classe sélectionnée
                </h3>
                <p className="text-gray-500">
                  Sélectionnez une classe pour afficher l'emploi du temps
                </p>
              </motion.div>
            )}
          </>
        )}

        {/* Boutons d'actions en mode édition/drag - Seulement pour les admins */}
        <AnimatePresence>
          {(editMode === 'edit' || editMode === 'drag') && canManageSchedules() && (
            <>
              {/* Bouton mode sélection - Déplaçable */}
              <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                dragConstraints={{
                  top: -window.innerHeight + 100,
                  bottom: 0,
                  left: -window.innerWidth + 100,
                  right: 0
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed bottom-70 right-6 z-[50] cursor-move"
              >
                <Button
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) {
                      setSelectedSessionIds(new Set());
                    }
                  }}
                  className={`rounded-full w-14 h-14 shadow-lg p-0 mb-4 ${
                    isSelectionMode
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  }`}
                  title={isSelectionMode ? "Quitter le mode sélection (Déplaçable)" : "Mode sélection (Déplaçable)"}
                >
                  <CheckSquare className="h-6 w-6 text-white" />
                </Button>
              </motion.div>

              {/* Bouton d'ajout de session - Déplaçable */}
              <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                dragConstraints={{
                  top: -window.innerHeight + 100,
                  bottom: 0,
                  left: -window.innerWidth + 100,
                  right: 0
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed bottom-40 right-6 z-[50] cursor-move"
              >
                <Button
                  onClick={() => {
                    setEditingSession(null);
                    setShowSessionForm(true);
                  }}
                  className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 p-0 mb-4"
                  title="Ajouter une session (Déplaçable)"
                >
                  <Plus className="h-6 w-6 text-white" />
                </Button>
              </motion.div>

              {/* Bouton de gestion des ressources - Déplaçable */}
              <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                dragConstraints={{
                  top: -window.innerHeight + 100,
                  bottom: 0,
                  left: -window.innerWidth + 100,
                  right: 0
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="fixed bottom-60 right-6 z-[50] cursor-move"
              >
                <Button
                  onClick={() => setShowManagementPanel(true)}
                  className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 p-0"
                  title="Gérer les cours, enseignants et salles (Déplaçable)"
                >
                  <Settings2 className="h-6 w-6 text-white" />
                </Button>
              </motion.div>

              {/* Indicateur de mode drag/edit - Déplaçable */}
              <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                dragConstraints={{
                  top: -window.innerHeight + 100,
                  bottom: 0,
                  left: -window.innerWidth + 200,
                  right: 0
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.2 }}
                className="fixed top-25 right-6 z-[50] cursor-move"
              >
                <div className={`px-3 py-2 rounded-lg shadow-lg text-white text-sm font-medium ${
                  editMode === 'edit'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                    : 'bg-gradient-to-r from-green-500 to-teal-600'
                }`}>
                  {editMode === 'edit' ? '✏️ Mode Édition' : '🖱️ Mode Drag'}
                </div>
              </motion.div>

              {/* Instructions de drag & drop - Déplaçable */}
              {editMode === 'drag' && (
                <motion.div
                  drag
                  dragMomentum={false}
                  dragElastic={0.1}
                  dragConstraints={{
                    top: -window.innerHeight + 150,
                    bottom: 0,
                    left: -window.innerWidth + 250,
                    right: 0
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  className="fixed top-45 right-6 z-[50] max-w-xs cursor-move"
                >
                  <div className="bg-white rounded-lg shadow-lg border p-3 text-xs">
                    <div className="font-medium text-gray-800 mb-1">💡 Instructions (Déplaçable)</div>
                    <div className="text-gray-600 space-y-1">
                      <div>• Cliquez et glissez un cours</div>
                      <div>• 🟢 Vert = Position valide</div>
                      <div>• 🔴 Rouge = Conflit détecté</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Menu flottant unifié */}
        <UnifiedFloatingMenu
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onExport={handleExport}
          onImport={handleImport}
          editMode={editMode}
          onEditModeChange={canManageSchedules() ? setEditMode : undefined}
          onSave={handleSave}
          hasChanges={hasChanges}
          studentClasses={studentClasses}
          conflicts={backendConflicts}
          sessions={filteredSessions}
          isReadOnly={isReadOnly}
          canManage={canManageSchedules()}
          addToast={addToast}
          onGenerateSchedule={handleGenerateSchedule}
          onShowOccurrenceManager={() => setShowOccurrenceManager(true)}
          currentScheduleId={currentScheduleId}
          showOnlyMyCourses={showOnlyMyCourses}
          onShowOnlyMyCoursesChange={setShowOnlyMyCourses}
          isTeacher={isTeacher()}
          user={user}
        />

        {/* Formulaire de session */}
        <SessionForm
          isOpen={showSessionForm}
          onClose={() => {
            setShowSessionForm(false);
            setEditingSession(null);
          }}
          onSave={handleSessionSave}
          editingSession={editingSession}
          courses={courses}
          teachers={teachers}
          rooms={rooms}
        />

        {/* Panneau de gestion des ressources */}
        <ManagementPanel
          isOpen={showManagementPanel}
          onClose={() => setShowManagementPanel(false)}
          onDataUpdate={loadAuxiliaryData}
          addToast={addToast}
        />

        {/* Générateur IA d'emploi du temps */}
        {showAIGenerator && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Generateur IA d'Emploi du Temps
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIGenerator(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <AIScheduleGenerator
                  selectedClass={selectedClass}
                  onScheduleGenerated={() => {
                    setShowAIGenerator(false);
                    loadSessions();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Gestionnaire d'occurrences */}
        {showOccurrenceManager && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  📋 Gestion des Séances
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOccurrenceManager(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                {currentScheduleId ? (
                  <OccurrenceManager
                    scheduleId={currentScheduleId}
                    dateFrom={scheduleService.formatDate(
                      new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                    )}
                    dateTo={scheduleService.formatDate(
                      new Date(selectedDate.getTime() + 30 * 24 * 60 * 60 * 1000)
                    )}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Veuillez sélectionner une classe pour gérer les séances</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}