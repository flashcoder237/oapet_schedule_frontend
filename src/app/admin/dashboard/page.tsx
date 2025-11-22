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
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  Target,
  Zap,
  ChevronRight,
  RefreshCw,
  GraduationCap,
  UserCog
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

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const quickActions = [
    { title: 'Gestion des EDs', href: '/gestion-emplois', icon: Calendar, color: 'bg-blue-500' },
    { title: 'Cours', href: '/courses', icon: BookOpen, color: 'bg-green-500' },
    { title: 'Utilisateurs', href: '/users', icon: Users, color: 'bg-purple-500' },
    { title: 'Salles', href: '/rooms', icon: MapPin, color: 'bg-orange-500' },
    { title: 'Classes', href: '/gestion-classes', icon: GraduationCap, color: 'bg-pink-500' },
    { title: 'Préférences', href: '/teachers/preferences', icon: UserCog, color: 'bg-indigo-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Tableau de Bord Administrateur
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue, {user?.first_name || user?.username} - Vue d'ensemble du système
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Health Score Card */}
      {health && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className={`${getHealthBg(health.status)} border-none`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full ${getHealthBg(health.status)} flex items-center justify-center`}>
                    {health.status === 'healthy' ? (
                      <CheckCircle className={`w-10 h-10 ${getHealthColor(health.status)}`} />
                    ) : health.status === 'warning' ? (
                      <AlertTriangle className={`w-10 h-10 ${getHealthColor(health.status)}`} />
                    ) : (
                      <XCircle className={`w-10 h-10 ${getHealthColor(health.status)}`} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Score de santé : {health.health_score}%
                    </h2>
                    <p className="text-gray-600">
                      {health.status === 'healthy' && 'Le système fonctionne normalement'}
                      {health.status === 'warning' && 'Quelques points d\'attention à vérifier'}
                      {health.status === 'critical' && 'Des actions urgentes sont nécessaires'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <p className="text-gray-500">Couverture depts</p>
                    <p className="text-xl font-bold">{health.metrics.department_coverage}%</p>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <p className="text-gray-500">Taux conflits</p>
                    <p className="text-xl font-bold">{health.metrics.conflict_rate}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Étudiants</p>
                    <p className="text-2xl font-bold">{stats.overview.total_students.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Cours</p>
                    <p className="text-2xl font-bold">{stats.overview.total_courses}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Enseignants</p>
                    <p className="text-2xl font-bold">{stats.overview.total_teachers}</p>
                  </div>
                  <UserCog className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Salles</p>
                    <p className="text-2xl font-bold">{stats.overview.total_rooms}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Plannings</p>
                    <p className="text-2xl font-bold">{stats.overview.active_schedules}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Sessions</p>
                    <p className="text-2xl font-bold">{stats.overview.weekly_events}</p>
                  </div>
                  <Activity className="w-8 h-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Alerts Row */}
      {stats && (stats.overview.unresolved_conflicts > 0 || stats.alerts.schedules_pending_approval > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats.overview.unresolved_conflicts > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link href="/schedules/conflicts">
                <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-none cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm">Conflits à résoudre</p>
                        <p className="text-2xl font-bold">{stats.overview.unresolved_conflicts}</p>
                        {stats.overview.critical_conflicts > 0 && (
                          <Badge variant="destructive" className="mt-1 bg-red-600">
                            {stats.overview.critical_conflicts} critique(s)
                          </Badge>
                        )}
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-200" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}

          {stats.alerts.schedules_pending_approval > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link href="/gestion-emplois">
                <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-none cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-cyan-100 text-sm">En attente de publication</p>
                        <p className="text-2xl font-bold">{stats.alerts.schedules_pending_approval}</p>
                      </div>
                      <Clock className="w-8 h-8 text-cyan-200" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm">Taux d'occupation salles</p>
                    <p className="text-2xl font-bold">{stats.overview.occupancy_rate}%</p>
                  </div>
                  <Target className="w-8 h-8 text-teal-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Quick Actions & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Accès Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={action.href} href={action.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 rounded-lg border border-border hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {action.title}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sessions by Type */}
        {stats && stats.distributions.sessions_by_type.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Sessions par Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.distributions.sessions_by_type.map((item, index) => {
                    const total = stats.distributions.sessions_by_type.reduce((sum, i) => sum + i.count, 0);
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];

                    return (
                      <div key={item.session_type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.session_type || 'Non défini'}</span>
                          <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                            className={`h-full ${colors[index % colors.length]} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Teachers by Department */}
      {stats && stats.distributions.teachers_by_department.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-500" />
                Enseignants par Département
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {stats.distributions.teachers_by_department.slice(0, 6).map((dept, index) => (
                  <motion.div
                    key={dept.department__code || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg text-center"
                  >
                    <p className="text-2xl font-bold text-primary">{dept.count}</p>
                    <p className="text-xs text-muted-foreground truncate" title={dept.department__name}>
                      {dept.department__code || dept.department__name?.slice(0, 10)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
