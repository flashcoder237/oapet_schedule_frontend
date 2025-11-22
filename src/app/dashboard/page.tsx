// src/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  MapPin, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Brain,
  Search,
  Grid3x3,
  Layout,
  Settings,
  Plus,
  Filter,
  Download,
  Target,
  Star,
  Building,
  User,
  ChevronRight,
  Eye,
  Zap,
  Layers,
  Sparkles,
  Compass,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Maximize2,
  Minimize2,
  Edit,
  Share2,
  MoreVertical,
  Bell,
  Globe,
  Shield,
  Hash,
  Tag,
  Database,
  FileText,
  Navigation
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoading, CardSkeleton, LoadingSpinner } from '@/components/ui/loading';
import ScheduleCalendar from '@/components/dashboard/ScheduleCalendar';
import RecentActivities from '@/components/dashboard/RecentActivities';
import RoomOccupancyChart from '@/components/dashboard/RoomOccupancyChart';
import ScheduleConflicts from '@/components/dashboard/ScheduleConflicts';
import AdvancedStats from '@/components/dashboard/AdvancedStats';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import InteractiveCalendar from '@/components/calendar/InteractiveCalendar';
import SmartSearch from '@/components/search/SmartSearch';
import CustomizableDashboard from '@/components/dashboard/CustomizableDashboard';
import UltraStableDragDropScheduler from '@/components/scheduling/UltraStableDragDropScheduler';
import AIInsightsPanel from '@/components/dashboard/AIInsightsPanel';
import { useAuth } from '@/lib/auth/context';
import { courseService } from '@/lib/api/services/courses';
import scheduleService from '@/services/scheduleService';
import { apiClient } from '@/lib/api/client';
import type { DashboardStats } from '@/types/api';

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  category: string;
  isActive: boolean;
  size: 'small' | 'medium' | 'large';
}

interface QuickStats {
  totalStudents: number;
  totalCourses: number;
  totalTeachers: number;
  totalRooms: number;
  activeSchedules: number;
  weeklyEvents: number;
  unresolvedConflicts: number;
  criticalConflicts: number;
  occupancyRate: number;
}

interface DashboardApiResponse {
  overview: {
    total_students: number;
    total_courses: number;
    total_teachers: number;
    total_rooms: number;
    active_schedules: number;
    weekly_events: number;
    unresolved_conflicts: number;
    critical_conflicts: number;
    occupancy_rate: number;
  };
  distributions: {
    courses_by_level: Array<{ level: string; count: number }>;
    teachers_by_department: Array<{ department__name: string; department__code: string; count: number }>;
    sessions_by_type: Array<{ session_type: string; count: number }>;
  };
  alerts: {
    conflicts_needing_attention: number;
    rooms_over_capacity: number;
    schedules_pending_approval: number;
  };
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalTeachers: 0,
    totalRooms: 0,
    activeSchedules: 0,
    weeklyEvents: 0,
    unresolvedConflicts: 0,
    criticalConflicts: 0,
    occupancyRate: 0
  });
  const [alerts, setAlerts] = useState<DashboardApiResponse['alerts'] | null>(null);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const { user } = useAuth();

  const dashboardModules: DashboardModule[] = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      description: 'Tableau de bord principal avec widgets personnalisables',
      icon: <Layout className="w-5 h-5" />,
      component: CustomizableDashboard,
      category: 'Principal',
      isActive: true,
      size: 'large'
    },
    {
      id: 'calendar',
      title: 'Calendrier Interactif',
      description: 'Calendrier avancé avec gestion d\'événements',
      icon: <Calendar className="w-5 h-5" />,
      component: InteractiveCalendar,
      category: 'Planning',
      isActive: true,
      size: 'large'
    },
    {
      id: 'search',
      title: 'Recherche Intelligente',
      description: 'Système de recherche avancé avec suggestions',
      icon: <Search className="w-5 h-5" />,
      component: SmartSearch,
      category: 'Outils',
      isActive: true,
      size: 'medium'
    },
    {
      id: 'scheduler',
      title: 'Planificateur Drag & Drop',
      description: 'Interface de planification avec glisser-déposer',
      icon: <Grid3x3 className="w-5 h-5" />,
      component: UltraStableDragDropScheduler,
      category: 'Planning',
      isActive: true,
      size: 'large'
    }
  ];

  const quickActions = [
    {
      id: 'add-course',
      title: 'Nouveau Cours',
      description: 'Créer un nouveau cours',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-blue-500',
      action: () => window.location.href = '/courses'
    },
    {
      id: 'add-schedule',
      title: 'Planning',
      description: 'Gérer les emplois du temps',
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-green-500',
      action: () => window.location.href = '/gestion-emplois'
    },
    {
      id: 'add-teacher',
      title: 'Enseignant',
      description: 'Ajouter un enseignant',
      icon: <User className="w-5 h-5" />,
      color: 'bg-purple-500',
      action: () => window.location.href = '/teachers/preferences'
    },
    {
      id: 'add-room',
      title: 'Salle',
      description: 'Enregistrer une salle',
      icon: <Building className="w-5 h-5" />,
      color: 'bg-orange-500',
      action: () => window.location.href = '/rooms'
    }
  ];

  // Les activités récentes viendront de l'API
  const recentActivities: any[] = [];

  // Chargement des données du tableau de bord
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Charger les statistiques depuis l'API dashboard
        const dashboardData = await apiClient.get<DashboardApiResponse>('/dashboard/stats/');

        // Mettre à jour les quickStats avec les données réelles
        setQuickStats({
          totalStudents: dashboardData.overview.total_students,
          totalCourses: dashboardData.overview.total_courses,
          totalTeachers: dashboardData.overview.total_teachers,
          totalRooms: dashboardData.overview.total_rooms,
          activeSchedules: dashboardData.overview.active_schedules,
          weeklyEvents: dashboardData.overview.weekly_events,
          unresolvedConflicts: dashboardData.overview.unresolved_conflicts,
          criticalConflicts: dashboardData.overview.critical_conflicts,
          occupancyRate: dashboardData.overview.occupancy_rate
        });

        // Stocker les alertes
        setAlerts(dashboardData.alerts);

        // Charger aussi les stats de cours pour les autres composants
        const courseStats = await courseService.getCoursesStats();
        setStats(courseStats);

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulation d'une requête de rafraîchissement
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period);
    setIsLoading(true);
    // Simulation du chargement des nouvelles données
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleWeekChange = async (weekStart: Date, weekEnd: Date) => {
    setLoadingSchedule(true);
    try {
      // Format de la date pour l'API (YYYY-MM-DD)
      const weekStartStr = weekStart.toISOString().split('T')[0];

      console.log('Chargement des sessions pour la semaine du', weekStartStr);

      // Charger les sessions de la semaine depuis l'API
      const data = await scheduleService.getWeeklySessions({
        week_start: weekStartStr
      });

      console.log('Sessions reçues:', data);

      // Transformer les données de l'API en format ScheduleItem
      const items = (data.sessions || []).map((session: any) => {
        const sessionDate = new Date(session.specific_date || session.date);

        console.log('📅 Session transformée:', {
          title: session.course?.name || session.course_name,
          originalDate: session.specific_date || session.date,
          parsedDate: sessionDate.toLocaleDateString('fr-FR'),
          dayOfWeek: sessionDate.toLocaleDateString('fr-FR', { weekday: 'long' }),
          startTime: session.specific_start_time || session.time_slot?.start_time
        });

        return {
          id: session.id?.toString() || Math.random().toString(),
          title: session.course?.name || session.course_name || 'Sans titre',
          description: session.course?.description || '',
          type: 'course' as const,
          startTime: session.specific_start_time || session.time_slot?.start_time || '08:00',
          endTime: session.specific_end_time || session.time_slot?.end_time || '10:00',
          date: sessionDate,
          professor: session.teacher?.name || session.teacher_name,
          room: session.room?.name || session.room_name,
          color: '#3B82F6',
          priority: 'medium' as const,
          status: 'confirmed' as const
        };
      });

      console.log('✅ Items transformés:', items);
      setScheduleItems(items);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      setScheduleItems([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const getModuleSizeClass = (size: DashboardModule['size']) => {
    switch (size) {
      case 'small': return 'col-span-12 lg:col-span-6';
      case 'medium': return 'col-span-12 lg:col-span-8';
      case 'large': return 'col-span-12';
      default: return 'col-span-12';
    }
  };

  const getViewModeClasses = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-md mx-auto';
      case 'tablet': return 'max-w-4xl mx-auto';
      case 'desktop': return 'w-full';
      default: return 'w-full';
    }
  };

  const renderActiveModule = () => {
    const module = dashboardModules.find(m => m.id === activeModule);
    if (!module) return null;

    const ModuleComponent = module.component;
    
    return (
      <motion.div
        key={activeModule}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-card' : ''}`}
      >
        {activeModule === 'overview' && (
          <div className="space-y-6">
            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Étudiants</p>
                    <p className="text-2xl font-bold">{quickStats.totalStudents.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Cours</p>
                    <p className="text-2xl font-bold">{quickStats.totalCourses}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-green-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Enseignants</p>
                    <p className="text-2xl font-bold">{quickStats.totalTeachers}</p>
                  </div>
                  <User className="w-8 h-8 text-purple-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Salles</p>
                    <p className="text-2xl font-bold">{quickStats.totalRooms}</p>
                  </div>
                  <Building className="w-8 h-8 text-orange-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Plannings</p>
                    <p className="text-2xl font-bold">{quickStats.activeSchedules}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-red-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Événements</p>
                    <p className="text-2xl font-bold">{quickStats.weeklyEvents}</p>
                  </div>
                  <Activity className="w-8 h-8 text-indigo-200" />
                </div>
              </motion.div>
            </div>

            {/* Alertes et conflits */}
            {(quickStats.unresolvedConflicts > 0 || (alerts && alerts.schedules_pending_approval > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickStats.unresolvedConflicts > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-xl cursor-pointer"
                    onClick={() => window.location.href = '/schedules/conflicts'}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm">Conflits à résoudre</p>
                        <p className="text-2xl font-bold">{quickStats.unresolvedConflicts}</p>
                        {quickStats.criticalConflicts > 0 && (
                          <p className="text-yellow-200 text-xs mt-1">
                            dont {quickStats.criticalConflicts} critique(s)
                          </p>
                        )}
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-200" />
                    </div>
                  </motion.div>
                )}

                {alerts && alerts.schedules_pending_approval > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-4 rounded-xl cursor-pointer"
                    onClick={() => window.location.href = '/gestion-emplois'}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-cyan-100 text-sm">En attente de publication</p>
                        <p className="text-2xl font-bold">{alerts.schedules_pending_approval}</p>
                      </div>
                      <Clock className="w-8 h-8 text-cyan-200" />
                    </div>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-teal-100 text-sm">Taux d'occupation</p>
                      <p className="text-2xl font-bold">{quickStats.occupancyRate}%</p>
                    </div>
                    <Target className="w-8 h-8 text-teal-200" />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Panel AI Insights */}
            <AIInsightsPanel className="mb-6" />

            {/* Actions rapides et activités récentes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Actions rapides */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Actions Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {quickActions.map(action => (
                      <motion.div
                        key={action.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-lg border border-border cursor-pointer hover:shadow-md transition-all"
                        onClick={action.action}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${action.color} text-white`}>
                            {action.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{action.title}</h4>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Activités récentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activités Récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span> {activity.action}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Widget dashboard personnalisable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Tableau de Bord Personnalisable
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-96">
                  <ModuleComponent />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeModule === 'calendar' && <ModuleComponent />}
        {activeModule === 'search' && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Recherche Intelligente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ModuleComponent />
            </CardContent>
          </Card>
        )}
        {activeModule === 'scheduler' && (
          <ModuleComponent
            items={scheduleItems}
            onWeekChange={handleWeekChange}
          />
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <PageLoading 
        message="Chargement du tableau de bord..." 
        variant="detailed"
      />
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={`min-h-screen bg-muted ${getViewModeClasses()}`}>
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">
                Tableau de Bord Avancé
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Interface moderne avec composants interactifs</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sélecteur de vue */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                  className="rounded-none"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tablet')}
                  className="rounded-none"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                  className="rounded-none"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>

              {/* Plein écran */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>

              {/* Sélecteur de module */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModuleSelector(!showModuleSelector)}
              >
                <Layers className="w-4 h-4 mr-1" />
                Modules
              </Button>

              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation modules */}
          <div className="flex items-center gap-2 mt-4">
            {dashboardModules.map(module => (
              <Button
                key={module.id}
                variant={activeModule === module.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveModule(module.id)}
                className="flex items-center gap-2"
              >
                {module.icon}
                {module.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Sélecteur de modules étendu */}
        {showModuleSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-muted"
          >
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardModules.map(module => (
                  <motion.div
                    key={module.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      activeModule === module.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border bg-card hover:border-border'
                    }`}
                    onClick={() => {
                      setActiveModule(module.id);
                      setShowModuleSelector(false);
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        activeModule === module.id ? 'bg-blue-500 text-white' : 'bg-muted'
                      }`}>
                        {module.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{module.title}</h4>
                        <p className="text-xs text-muted-foreground">{module.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {renderActiveModule()}
      </div>
    </div>
  );
}