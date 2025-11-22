'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/context';
import { teacherService, type TeacherProfile, type TeacherStats } from '@/lib/api/services/teachers';

export default function TeacherDashboardPage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [upcomingSession, setUpcomingSession] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  const { user, isTeacher } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not a teacher
    if (user && !isTeacher()) {
      router.push('/');
      return;
    }

    if (user) {
      findAndLoadTeacherData();
    }
  }, [user]);

  const findAndLoadTeacherData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Si teacher_id est déjà connu, l'utiliser directement
      let currentTeacherId = user.teacher_id;

      // Sinon, chercher l'enseignant par l'ID utilisateur
      if (!currentTeacherId) {
        console.log('Recherche enseignant pour user ID:', user.id);
        const teacherData = await teacherService.getTeacherByUserId(user.id);
        if (teacherData) {
          currentTeacherId = teacherData.id;
          console.log('Enseignant trouvé:', currentTeacherId);
        }
      }

      if (!currentTeacherId) {
        console.error('Impossible de trouver l\'ID enseignant');
        setLoading(false);
        return;
      }

      setTeacherId(currentTeacherId);

      const [profileData, statsData, todayData, coursesData, upcomingData] = await Promise.all([
        teacherService.getMyProfile(currentTeacherId),
        teacherService.getMyStats(currentTeacherId),
        teacherService.getTodaySchedule(currentTeacherId),
        teacherService.getMyCourses(currentTeacherId),
        teacherService.getNextUpcomingSession(currentTeacherId)
      ]);

      console.log('Teacher ID:', currentTeacherId);
      console.log('Teacher profile:', profileData);
      console.log('Teacher stats:', statsData);
      console.log('Today sessions:', todayData);
      console.log('Upcoming session:', upcomingData);
      console.log('Courses:', coursesData);

      setProfile(profileData);
      setStats(statsData);
      setTodaySessions(todayData);
      setUpcomingSession(upcomingData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Erreur chargement donnees enseignant:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCourseTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'CM': 'bg-blue-100 text-blue-700 border-blue-300',
      'TD': 'bg-green-100 text-green-700 border-green-300',
      'TP': 'bg-purple-100 text-purple-700 border-purple-300',
      'TPE': 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getCurrentSession = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return todaySessions.find((session: any) => {
      const startTime = session.specific_start_time || session.time_slot_details?.start_time;
      const endTime = session.specific_end_time || session.time_slot_details?.end_time;
      if (!startTime || !endTime) return false;

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const sessionStart = startH * 60 + startM;
      const sessionEnd = endH * 60 + endM;

      return currentTime >= sessionStart && currentTime <= sessionEnd;
    });
  };

  const getNextSession = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const upcoming = todaySessions
      .filter((session: any) => {
        const startTime = session.specific_start_time || session.time_slot_details?.start_time;
        if (!startTime) return false;
        const [startH, startM] = startTime.split(':').map(Number);
        return startH * 60 + startM > currentTime;
      })
      .sort((a: any, b: any) => {
        const aStart = a.specific_start_time || a.time_slot_details?.start_time;
        const bStart = b.specific_start_time || b.time_slot_details?.start_time;
        return aStart.localeCompare(bStart);
      });

    return upcoming[0] || null;
  };

  const currentSession = getCurrentSession();
  const nextSession = getNextSession();

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Bonjour, {profile?.user_details?.first_name} {profile?.user_details?.last_name}
                </h1>
                <p className="text-white/90 mt-1 font-medium">
                  {profile?.department_name}
                </p>
                <p className="text-white/70 text-sm mt-0.5">
                  Matricule: {profile?.employee_id}
                </p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-white/80 text-sm">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cours assignes</p>
                  <p className="text-2xl font-bold mt-1">{stats?.total_courses || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Heures/semaine</p>
                  <p className="text-2xl font-bold mt-1">{stats?.total_hours_this_week || 0}h</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sessions/semaine</p>
                  <p className="text-2xl font-bold mt-1">{stats?.sessions_this_week || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                  <p className="text-2xl font-bold mt-1">{todaySessions.length}</p>
                  <p className="text-xs text-muted-foreground">sessions</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Current & Next Session */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Session */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 bg-white shadow-md h-full">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-green-500" />
                Cours en cours
              </h2>
              {currentSession ? (
                <div className={`p-4 rounded-lg border-l-4 ${getCourseTypeColor(currentSession.session_type || currentSession.course_details?.course_type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">
                      {currentSession.course_details?.name}
                    </h3>
                    <Badge className={getCourseTypeColor(currentSession.session_type || currentSession.course_details?.course_type)}>
                      {currentSession.session_type || currentSession.course_details?.course_type}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {(currentSession.specific_start_time || currentSession.time_slot_details?.start_time)?.slice(0, 5)} - {(currentSession.specific_end_time || currentSession.time_slot_details?.end_time)?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{currentSession.room_details?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{currentSession.class_group_details?.name || 'Tous les etudiants'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                  <p>Aucun cours en ce moment</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Next Session */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 bg-white shadow-md h-full">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Prochain cours
              </h2>
              {nextSession ? (
                <div className={`p-4 rounded-lg border-l-4 ${getCourseTypeColor(nextSession.session_type || nextSession.course_details?.course_type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">
                      {nextSession.course_details?.name}
                    </h3>
                    <Badge className={getCourseTypeColor(nextSession.session_type || nextSession.course_details?.course_type)}>
                      {nextSession.session_type || nextSession.course_details?.course_type}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {(nextSession.specific_start_time || nextSession.time_slot_details?.start_time)?.slice(0, 5)} - {(nextSession.specific_end_time || nextSession.time_slot_details?.end_time)?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{nextSession.room_details?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{nextSession.class_group_details?.name || 'Tous les etudiants'}</span>
                    </div>
                  </div>
                </div>
              ) : upcomingSession ? (
                <div className={`p-4 rounded-lg border-l-4 ${getCourseTypeColor(upcomingSession.session_type || upcomingSession.course_details?.course_type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">
                      {upcomingSession.course_details?.name}
                    </h3>
                    <Badge className={getCourseTypeColor(upcomingSession.session_type || upcomingSession.course_details?.course_type)}>
                      {upcomingSession.session_type || upcomingSession.course_details?.course_type}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium text-primary">
                        {upcomingSession.upcoming_date ? new Date(upcomingSession.upcoming_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {(upcomingSession.specific_start_time || upcomingSession.time_slot_details?.start_time)?.slice(0, 5)} - {(upcomingSession.specific_end_time || upcomingSession.time_slot_details?.end_time)?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{upcomingSession.room_details?.name}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-300" />
                  <p>Aucun cours prevu prochainement</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6 bg-white shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Emploi du temps d'aujourd'hui
              </h2>
              <Link href="/schedule">
                <Button variant="outline" size="sm">
                  Voir la semaine
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {todaySessions.length > 0 ? (
              <div className="space-y-3">
                {todaySessions
                  .sort((a, b) => {
                    const aTime = a.specific_start_time || a.time_slot_details?.start_time || '';
                    const bTime = b.specific_start_time || b.time_slot_details?.start_time || '';
                    return aTime.localeCompare(bTime);
                  })
                  .map((session: any, index: number) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className={`p-4 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors ${getCourseTypeColor(session.session_type || session.course_details?.course_type)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getCourseTypeColor(session.session_type || session.course_details?.course_type)}>
                              {session.session_type || session.course_details?.course_type}
                            </Badge>
                            <h3 className="font-semibold">{session.course_details?.name}</h3>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {(session.specific_start_time || session.time_slot_details?.start_time)?.slice(0, 5)} - {(session.specific_end_time || session.time_slot_details?.end_time)?.slice(0, 5)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{session.room_details?.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{session.class_group_details?.name || 'Tous'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>Aucun cours prevu aujourd'hui</p>
                {(() => {
                  const day = new Date().getDay();
                  if (day === 0 || day === 6) {
                    return <p className="text-sm mt-1">Bon week-end !</p>;
                  }
                  return <p className="text-sm mt-1">Profitez de votre journee !</p>;
                })()}
                {upcomingSession && (
                  <p className="text-sm mt-3 text-primary font-medium">
                    Prochain cours: {upcomingSession.upcoming_date ? new Date(upcomingSession.upcoming_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                  </p>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6 bg-white shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Acces rapides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/schedule">
                <div className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                  <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold">Emploi du temps</h3>
                  <p className="text-sm text-muted-foreground">Voir le planning complet</p>
                </div>
              </Link>
              <Link href="/teachers/preferences">
                <div className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                  <Settings className="w-8 h-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold">Mes preferences</h3>
                  <p className="text-sm text-muted-foreground">Gerer disponibilites</p>
                </div>
              </Link>
              <Link href="/courses">
                <div className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                  <BookOpen className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-semibold">Mes cours</h3>
                  <p className="text-sm text-muted-foreground">Voir les cours assignes</p>
                </div>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
