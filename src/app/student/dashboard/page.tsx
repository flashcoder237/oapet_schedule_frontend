'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  User,
  GraduationCap,
  TrendingUp,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import { studentService, type StudentProfile, type CourseEnrollment } from '@/lib/api/services/students';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadStudentData();

    // Rafraîchir l'heure actuelle toutes les 30 secondes pour mettre à jour le cours en cours
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);

      const [profileData, enrollmentsData, todayData, weeklyData, statsData] = await Promise.all([
        studentService.getMyProfile(),
        studentService.getMyEnrollments(),
        studentService.getTodaySchedule(),
        studentService.getWeeklySchedule(),
        studentService.getMyStats(),
      ]);

      setProfile(profileData);
      setEnrollments(enrollmentsData.results || []);
      setTodaySchedule(todayData);
      setWeeklySchedule(weeklyData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données étudiant:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayIndex: number): string => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayIndex];
  };

  const getCourseTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'CM': 'bg-blue-100 text-blue-700',
      'TD': 'bg-green-100 text-green-700',
      'TP': 'bg-purple-100 text-purple-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getCurrentAndNextSessions = () => {
    if (!todaySchedule?.sessions) {
      return { currentSession: null, nextSession: null, timeRemaining: null, timeUntilNext: null };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    const sessions = todaySchedule.sessions.map((session: any) => {
      const [startHour, startMin] = session.time_slot_details?.start_time?.split(':').map(Number) || [0, 0];
      const [endHour, endMin] = session.time_slot_details?.end_time?.split(':').map(Number) || [0, 0];
      return {
        ...session,
        startTimeMinutes: startHour * 60 + startMin,
        endTimeMinutes: endHour * 60 + endMin,
      };
    });

    // Find current session (time is between start and end)
    const currentSession = sessions.find(
      (s: any) => currentTime >= s.startTimeMinutes && currentTime < s.endTimeMinutes
    );

    // Calculate time remaining for current session
    const timeRemaining = currentSession
      ? currentSession.endTimeMinutes - currentTime
      : null;

    // Find next session (starts after current time)
    const upcomingSessions = sessions.filter((s: any) => s.startTimeMinutes > currentTime);
    const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

    // Calculate time until next session
    const timeUntilNext = nextSession
      ? nextSession.startTimeMinutes - currentTime
      : null;

    return { currentSession, nextSession, timeRemaining, timeUntilNext };
  };

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec informations étudiant */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Bonjour, {profile?.user.first_name} {profile?.user.last_name}
                </h1>
                <p className="text-white/80 mt-1">
                  {profile?.curriculum.name} - Niveau {profile?.current_level}
                </p>
                <p className="text-white/70 text-sm mt-1">
                  Matricule: {profile?.student_id}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Année d'entrée</p>
              <p className="text-2xl font-bold">{profile?.entry_year}</p>
            </div>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cours inscrits</p>
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
                  <p className="text-sm text-muted-foreground">Crédits</p>
                  <p className="text-2xl font-bold mt-1">{stats?.total_credits || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
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
                  <p className="text-sm text-muted-foreground">Heures/semaine</p>
                  <p className="text-2xl font-bold mt-1">{stats?.total_hours_per_week || 0}h</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
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
                  <p className="text-sm text-muted-foreground">Sessions aujourd'hui</p>
                  <p className="text-2xl font-bold mt-1">{todaySchedule?.sessions?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Cours en cours et prochain cours */}
        {(() => {
          const { currentSession, nextSession, timeRemaining, timeUntilNext } = getCurrentAndNextSessions();

          if (!currentSession && !nextSession) {
            return null;
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Cours en cours */}
              {currentSession && (
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 shadow-lg">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                          En cours maintenant
                        </p>
                      </div>
                      {timeRemaining !== null && (
                        <Badge className="bg-green-600 text-white">
                          Reste {formatTimeRemaining(timeRemaining)}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {currentSession.course_details?.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {currentSession.time_slot_details?.start_time} - {currentSession.time_slot_details?.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {currentSession.teacher_details?.first_name} {currentSession.teacher_details?.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{currentSession.room_details?.name}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Prochain cours */}
              {nextSession && (
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 shadow-lg">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-blue-700" />
                        <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                          Prochain cours
                        </p>
                      </div>
                      {timeUntilNext !== null && (
                        <Badge className="bg-blue-600 text-white">
                          Dans {formatTimeRemaining(timeUntilNext)}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {nextSession.course_details?.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {nextSession.time_slot_details?.start_time} - {nextSession.time_slot_details?.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {nextSession.teacher_details?.first_name} {nextSession.teacher_details?.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{nextSession.room_details?.name}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emploi du temps d'aujourd'hui */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 bg-white shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Emploi du temps d'aujourd'hui
                </h2>
                <Badge variant="outline">
                  {getDayName(new Date().getDay())}
                </Badge>
              </div>

              <div className="space-y-3">
                {todaySchedule?.sessions && todaySchedule.sessions.length > 0 ? (
                  todaySchedule.sessions.map((session: any, index: number) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="border-l-4 border-primary bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {session.course_details?.name}
                            </h3>
                            <Badge className={getCourseTypeColor(session.course_details?.course_type)}>
                              {session.course_details?.course_type}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {session.time_slot_details?.start_time} - {session.time_slot_details?.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>
                                {session.teacher_details?.first_name} {session.teacher_details?.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {session.room_details?.building_name} - {session.room_details?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Aucun cours aujourd'hui</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Cours inscrits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 bg-white shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Mes cours
                </h2>
                <Badge variant="outline">{enrollments.length} cours</Badge>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {enrollments.map((enrollment, index) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="border bg-gray-50 p-4 rounded-lg hover:shadow-md transition-all hover:border-primary cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{enrollment.course.name}</h3>
                          <Badge className={getCourseTypeColor(enrollment.course.course_type)}>
                            {enrollment.course.course_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Code: {enrollment.course.code}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {enrollment.course.credits} crédits
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {enrollment.course.hours_per_week}h/sem
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
