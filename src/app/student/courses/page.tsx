'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Award,
  Clock,
  Search,
  ChevronRight,
  User,
  X,
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { studentService, type CourseEnrollment } from '@/lib/api/services/students';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CourseDetails {
  enrollment: CourseEnrollment;
  sessions: any[];
  totalHoursPlanned: number;
  hoursCompleted: number;
  hoursRemaining: number;
  progressPercentage: number;
  nextSession: any | null;
  teacher: any | null;
}

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<CourseDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedType, enrollments]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await studentService.getMyEnrollments();
      console.log('Enrollments data:', data.results?.[0]);
      setEnrollments(data.results || []);
      setFilteredEnrollments(data.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetails = async (enrollment: CourseEnrollment) => {
    setLoadingDetails(true);
    try {
      // Get weekly schedule to find sessions for this course
      const weeklyData = await studentService.getWeeklySchedule();

      // Flatten all sessions from all days
      const allSessions: any[] = [];
      if (weeklyData?.sessions_by_day) {
        Object.values(weeklyData.sessions_by_day).forEach((daySessions: any) => {
          if (Array.isArray(daySessions)) {
            allSessions.push(...daySessions);
          }
        });
      }

      // Filter sessions for this course
      const courseSessions = allSessions.filter(
        (s: any) => s.course_details?.id === enrollment.course.id ||
                    s.course_details?.code === enrollment.course.code
      );

      // Get teacher from first session or enrollment
      const teacher = courseSessions[0]?.teacher_details || (enrollment as any).teacher_details || null;

      // Calculate hours per week from actual sessions
      const hoursPerWeekFromSessions = courseSessions.reduce((acc: number, s: any) => {
        const start = s.time_slot_details?.start_time;
        const end = s.time_slot_details?.end_time;
        if (start && end) {
          const [startH, startM] = start.split(':').map(Number);
          const [endH, endM] = end.split(':').map(Number);
          return acc + ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
        }
        return acc;
      }, 0);

      // Use course hours_per_week or calculated from sessions
      const actualHoursPerWeek = hoursPerWeekFromSessions || enrollment.course.hours_per_week || 2;

      // Semester configuration
      const weeksInSemester = 14;
      const totalHoursPlanned = actualHoursPerWeek * weeksInSemester;

      // Calculate weeks elapsed since semester start
      // Assuming semester started in September (adjust based on academic_year)
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Determine semester start date based on semester type
      let semesterStart: Date;
      if (enrollment.semester?.toLowerCase().includes('1') || enrollment.semester?.toLowerCase().includes('automne')) {
        // First semester: September
        semesterStart = new Date(currentMonth >= 8 ? currentYear : currentYear - 1, 8, 1); // September 1st
      } else {
        // Second semester: February
        semesterStart = new Date(currentMonth >= 1 ? currentYear : currentYear - 1, 1, 1); // February 1st
      }

      // Calculate weeks elapsed
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeksElapsed = Math.max(0, Math.min(weeksInSemester, Math.floor((today.getTime() - semesterStart.getTime()) / msPerWeek)));

      // Calculate completed hours based on weeks elapsed
      const hoursCompleted = Math.round(weeksElapsed * actualHoursPerWeek);

      // Also count sessions from current week that have passed
      const todayStr = today.toISOString().split('T')[0];
      const completedThisWeek = courseSessions.filter((s: any) => {
        if (s.specific_date) {
          return s.specific_date < todayStr;
        }
        return false;
      });

      const hoursCompletedThisWeek = completedThisWeek.reduce((acc: number, s: any) => {
        const start = s.time_slot_details?.start_time;
        const end = s.time_slot_details?.end_time;
        if (start && end) {
          const [startH, startM] = start.split(':').map(Number);
          const [endH, endM] = end.split(':').map(Number);
          return acc + ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
        }
        return acc;
      }, 0);

      // Total completed = weeks elapsed * hours/week (for past weeks) + hours from this week's passed sessions
      // But we don't double count, so we use the max of calculated or actual
      const totalHoursCompleted = Math.max(hoursCompleted, hoursCompletedThisWeek);

      // Find next session
      const upcomingSessions = courseSessions.filter((s: any) => {
        if (s.specific_date) {
          return s.specific_date >= todayStr;
        }
        return true;
      }).sort((a: any, b: any) => {
        if (a.specific_date && b.specific_date) {
          return a.specific_date.localeCompare(b.specific_date);
        }
        return 0;
      });

      const hoursRemaining = Math.max(0, totalHoursPlanned - totalHoursCompleted);
      const progressPercentage = totalHoursPlanned > 0
        ? Math.min(100, Math.round((totalHoursCompleted / totalHoursPlanned) * 100))
        : 0;

      setSelectedCourse({
        enrollment,
        sessions: courseSessions,
        totalHoursPlanned,
        hoursCompleted: totalHoursCompleted,
        hoursRemaining,
        progressPercentage,
        nextSession: upcomingSessions[0] || null,
        teacher
      });
    } catch (error) {
      console.error('Error loading course details:', error);
      // Set basic details even if API fails
      setSelectedCourse({
        enrollment,
        sessions: [],
        totalHoursPlanned: (enrollment.course.hours_per_week || 2) * 14,
        hoursCompleted: 0,
        hoursRemaining: (enrollment.course.hours_per_week || 2) * 14,
        progressPercentage: 0,
        nextSession: null,
        teacher: null
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterCourses = () => {
    let filtered = enrollments;

    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.course.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((e) => e.course.course_type === selectedType);
    }

    setFilteredEnrollments(filtered);
  };

  const getCourseTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'CM': 'bg-blue-100 text-blue-700',
      'TD': 'bg-green-100 text-green-700',
      'TP': 'bg-purple-100 text-purple-700',
      'TPE': 'bg-orange-100 text-orange-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getCourseTypeBorderColor = (type: string): string => {
    const colors: Record<string, string> = {
      'CM': 'border-l-4 border-l-blue-500',
      'TD': 'border-l-4 border-l-green-500',
      'TP': 'border-l-4 border-l-purple-500',
      'TPE': 'border-l-4 border-l-orange-500',
    };
    return colors[type] || 'border-l-4 border-l-gray-500';
  };

  const courseTypes = [
    { value: 'all', label: 'Tous' },
    { value: 'CM', label: 'CM' },
    { value: 'TD', label: 'TD' },
    { value: 'TP', label: 'TP' },
    { value: 'TPE', label: 'TPE' },
  ];

  const totalCredits = enrollments.reduce((sum, e) => sum + (e.course.credits || 0), 0);
  const totalHours = enrollments.reduce((sum, e) => sum + (e.course.hours_per_week || 0), 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Mes Cours
          </h1>
          <p className="text-muted-foreground mt-1">
            {enrollments.length} cours au total
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total cours</p>
                  <p className="text-2xl font-bold mt-1">{enrollments.length}</p>
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
            <Card className="p-4 bg-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total crédits</p>
                  <p className="text-2xl font-bold mt-1">{totalCredits}</p>
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
            <Card className="p-4 bg-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Heures/semaine</p>
                  <p className="text-2xl font-bold mt-1">{totalHours}h</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-white shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {courseTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        selectedType === type.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Course List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredEnrollments.map((enrollment, index) => (
            <motion.div
              key={enrollment.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.03 }}
              onClick={() => loadCourseDetails(enrollment)}
            >
              <Card className={`bg-white shadow-md hover:shadow-xl transition-all cursor-pointer h-full ${getCourseTypeBorderColor(enrollment.course.course_type)}`}>
                <div className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <Badge className={getCourseTypeColor(enrollment.course.course_type)}>
                      {enrollment.course.course_type}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Course Name */}
                  <div>
                    <h3 className="font-bold text-lg line-clamp-2 mb-1">
                      {enrollment.course.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Code: {enrollment.course.code}
                    </p>
                  </div>

                  {/* Teacher */}
                  {(enrollment as any).teacher_details && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>
                        {(enrollment as any).teacher_details?.user_details?.first_name} {(enrollment as any).teacher_details?.user_details?.last_name}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{enrollment.course.credits} crédits</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{enrollment.course.hours_per_week}h/sem</span>
                    </div>
                  </div>

                  {/* Semester */}
                  <div className="pt-2">
                    <span className="text-xs text-gray-500">
                      {enrollment.academic_year} - {enrollment.semester}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* No results */}
        {filteredEnrollments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun cours trouve</p>
          </motion.div>
        )}
      </div>

      {/* Course Details Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {loadingDetails ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Chargement des details...</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className={`p-6 ${getCourseTypeColor(selectedCourse.enrollment.course.course_type)} bg-opacity-30`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className={getCourseTypeColor(selectedCourse.enrollment.course.course_type)}>
                          {selectedCourse.enrollment.course.course_type}
                        </Badge>
                        <h2 className="text-2xl font-bold mt-2">
                          {selectedCourse.enrollment.course.name}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Code: {selectedCourse.enrollment.course.code}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCourse(null)}
                        className="rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                    {/* Teacher Info */}
                    {selectedCourse.teacher && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Enseignant</p>
                          <p className="font-semibold text-lg">
                            {selectedCourse.teacher.user_details?.first_name} {selectedCourse.teacher.user_details?.last_name}
                          </p>
                          {selectedCourse.teacher.department_name && (
                            <p className="text-sm text-gray-500">
                              {selectedCourse.teacher.department_name}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          Progression du cours
                        </h3>
                        <span className="text-2xl font-bold text-primary">
                          {selectedCourse.progressPercentage}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedCourse.progressPercentage}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                        />
                      </div>

                      {/* Hours Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-green-700">
                            {selectedCourse.hoursCompleted}h
                          </p>
                          <p className="text-xs text-green-600">Effectuees</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-orange-700">
                            {selectedCourse.hoursRemaining}h
                          </p>
                          <p className="text-xs text-orange-600">Restantes</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-blue-700">
                            {selectedCourse.totalHoursPlanned}h
                          </p>
                          <p className="text-xs text-blue-600">Total prevu</p>
                        </div>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Award className="w-4 h-4" />
                          Credits
                        </div>
                        <p className="text-xl font-bold">{selectedCourse.enrollment.course.credits}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="w-4 h-4" />
                          Heures/semaine
                        </div>
                        <p className="text-xl font-bold">{selectedCourse.enrollment.course.hours_per_week}h</p>
                      </div>
                    </div>

                    {/* Next Session */}
                    {selectedCourse.nextSession && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          Prochaine seance
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>
                              {selectedCourse.nextSession.specific_date
                                ? formatDate(selectedCourse.nextSession.specific_date)
                                : selectedCourse.nextSession.time_slot_details?.day_display}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>
                              {selectedCourse.nextSession.time_slot_details?.start_time?.slice(0, 5)} - {selectedCourse.nextSession.time_slot_details?.end_time?.slice(0, 5)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span>{selectedCourse.nextSession.room_details?.name}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sessions Count */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        {selectedCourse.sessions.length} seance(s) programmee(s) cette semaine
                      </span>
                    </div>

                    {/* Semester Info */}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        {selectedCourse.enrollment.academic_year} - {selectedCourse.enrollment.semester}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
