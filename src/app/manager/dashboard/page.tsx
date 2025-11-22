'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  MapPin,
  Calendar,
  Building,
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  GraduationCap,
  UserCog,
  ChevronRight,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/context';

interface DashboardStats {
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

interface SystemHealth {
  health_score: number;
  metrics: {
    department_coverage: number;
    conflict_rate: number;
    total_sessions: number;
    sessions_with_conflicts: number;
  };
  status: 'healthy' | 'warning' | 'critical';
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, healthData] = await Promise.all([
        apiClient.get<DashboardStats>('/dashboard/stats/'),
        apiClient.get<SystemHealth>('/dashboard/health/')
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    { title: 'Gestion des EDs', href: '/gestion-emplois', icon: Calendar, description: 'Emplois du temps' },
    { title: 'Cours', href: '/courses', icon: BookOpen, description: 'Gestion des cours' },
    { title: 'Utilisateurs', href: '/users', icon: Users, description: 'Gestion des comptes' },
    { title: 'Salles', href: '/rooms', icon: MapPin, description: 'Espaces disponibles' },
    { title: 'Classes', href: '/gestion-classes', icon: GraduationCap, description: 'Gestion des classes' },
    { title: 'Préférences', href: '/teachers/preferences', icon: UserCog, description: 'Disponibilités' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Tableau de Bord
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Bienvenue, {user?.first_name || user?.username}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Health + Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Health Score */}
          {health && (
            <Card className="lg:col-span-1">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    health.status === 'healthy' ? 'bg-emerald-100 text-emerald-600' :
                    health.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className='mt-3'>
                    <p className="text-sm text-muted-foreground">Santé système</p>
                    <p className="text-2xl font-semibold">{health.health_score}%</p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      health.status === 'healthy' ? 'bg-emerald-500' :
                      health.status === 'warning' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${health.health_score}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Stats */}
          {stats && (
            <>
              <Card>
                <CardContent className="mt-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Étudiants</p>
                      <p className="text-2xl font-semibold mt-1">{stats.overview.total_students.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="mt-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Enseignants</p>
                      <p className="text-2xl font-semibold mt-1">{stats.overview.total_teachers}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UserCog className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="mt-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cours actifs</p>
                      <p className="text-2xl font-semibold mt-1">{stats.overview.total_courses}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Secondary Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="mt-2 p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Salles</p>
                    <p className="text-lg font-medium">{stats.overview.total_rooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="mt-2 p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Plannings</p>
                    <p className="text-lg font-medium">{stats.overview.active_schedules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="mt-2 p-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                    <p className="text-lg font-medium">{stats.overview.weekly_events}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="mt-2 
              p-4">
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Occupation</p>
                    <p className="text-lg font-medium">{stats.overview.occupancy_rate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alerts */}
        {stats && (stats.overview.unresolved_conflicts > 0 || stats.alerts.schedules_pending_approval > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.overview.unresolved_conflicts > 0 && (
              <Link href="/schedules/conflicts">
                <Card className="border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-900">Conflits à résoudre</p>
                          <p className="text-xs text-amber-700">{stats.overview.critical_conflicts} critique(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-semibold text-amber-900">{stats.overview.unresolved_conflicts}</span>
                        <ChevronRight className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {stats.alerts.schedules_pending_approval > 0 && (
              <Link href="/gestion-emplois">
                <Card className="border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">En attente</p>
                          <p className="text-xs text-blue-700">Plannings non publiés</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-semibold text-blue-900">{stats.alerts.schedules_pending_approval}</span>
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Accès rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {quickActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                      <div className="p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/50 transition-all group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                            <action.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{action.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions by Type */}
          {stats && stats.distributions.sessions_by_type.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Sessions par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.distributions.sessions_by_type.slice(0, 4).map((item, index) => {
                    const total = stats.distributions.sessions_by_type.reduce((sum, i) => sum + i.count, 0);
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;

                    return (
                      <div key={item.session_type || index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{item.session_type || 'Autre'}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                            className="h-full bg-primary/70 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Departments */}
        {stats && stats.distributions.teachers_by_department.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Enseignants par département</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {stats.distributions.teachers_by_department.slice(0, 6).map((dept, index) => (
                  <div
                    key={dept.department__code || index}
                    className="p-3 bg-muted/50 rounded-lg text-center"
                  >
                    <p className="text-xl font-semibold text-primary">{dept.count}</p>
                    <p className="text-xs text-muted-foreground truncate" title={dept.department__name}>
                      {dept.department__code || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
