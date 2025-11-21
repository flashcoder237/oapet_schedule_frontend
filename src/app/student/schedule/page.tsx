'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  User,
  MapPin
} from 'lucide-react';
import { studentService } from '@/lib/api/services/students';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Mapping French day names to English API keys
const DAY_MAPPING: Record<string, string> = {
  'lundi': 'monday',
  'mardi': 'tuesday',
  'mercredi': 'wednesday',
  'jeudi': 'thursday',
  'vendredi': 'friday',
  'samedi': 'saturday',
};

// Grid configuration
const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const PIXELS_PER_MINUTE = 1.2; // 1.2 pixels per minute for better visibility

export default function StudentSchedulePage() {
  const [weeklySchedule, setWeeklySchedule] = useState<any>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklySchedule();
  }, [currentWeek]);

  const loadWeeklySchedule = async () => {
    try {
      setLoading(true);
      const monday = getMonday(currentWeek);
      const weekStart = monday.toISOString().split('T')[0];
      const data = await studentService.getWeeklySchedule(weekStart);
      setWeeklySchedule(data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'emploi du temps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const previousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const getCourseTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'CM': 'bg-blue-100 border-l-4 border-blue-500 text-blue-900',
      'TD': 'bg-green-100 border-l-4 border-green-500 text-green-900',
      'TP': 'bg-purple-100 border-l-4 border-purple-500 text-purple-900',
      'TPE': 'bg-orange-100 border-l-4 border-orange-500 text-orange-900',
    };
    return colors[type] || 'bg-gray-100 border-l-4 border-gray-500 text-gray-900';
  };

  const formatWeekRange = () => {
    if (!weeklySchedule) return '';
    const start = new Date(weeklySchedule.week_start);
    const end = new Date(weeklySchedule.week_end);
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  // Get all sessions for a specific day
  const getSessionsForDay = (frenchDay: string): any[] => {
    if (!weeklySchedule?.sessions_by_day) {
      return [];
    }

    const englishDay = DAY_MAPPING[frenchDay.toLowerCase()];
    if (!englishDay) {
      return [];
    }

    return weeklySchedule.sessions_by_day[englishDay] ||
           weeklySchedule.sessions_by_day[englishDay.charAt(0).toUpperCase() + englishDay.slice(1)] ||
           [];
  };

  // Calculate top position based on start time
  const getSessionTopPosition = (session: any): number => {
    const startTime = session.time_slot_details?.start_time;
    if (!startTime) return 0;

    const [hour, min] = startTime.split(':').map(Number);
    const sessionStartMinutes = hour * 60 + min;
    const gridStartMinutes = START_HOUR * 60;
    return (sessionStartMinutes - gridStartMinutes) * PIXELS_PER_MINUTE;
  };

  // Calculate height based on duration
  const getSessionHeight = (session: any): number => {
    const startTime = session.time_slot_details?.start_time;
    const endTime = session.time_slot_details?.end_time;
    if (!startTime || !endTime) return 60 * PIXELS_PER_MINUTE; // Default 1 hour

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return Math.max(durationMinutes * PIXELS_PER_MINUTE, 40); // Minimum 40px
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'emploi du temps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-7 h-7 text-primary" />
                Emploi du Temps
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{formatWeekRange()}</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={previousWeek}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextWeek}
                className="flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded-r"></div>
              <span className="text-sm text-gray-600">CM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded-r"></div>
              <span className="text-sm text-gray-600">TD</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border-l-4 border-purple-500 rounded-r"></div>
              <span className="text-sm text-gray-600">TP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border-l-4 border-orange-500 rounded-r"></div>
              <span className="text-sm text-gray-600">TPE</span>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="text-sm">
                {weeklySchedule?.total_sessions || 0} sessions cette semaine
              </Badge>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
            <div className="grid grid-cols-7 gap-0" style={{ minWidth: '1000px' }}>
              {/* Header Row - Time + Days */}
              <div className="p-2 text-center text-xs font-medium text-gray-600 bg-gray-50 border-b border-r">
                Heure
              </div>
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center text-sm font-semibold text-gray-900 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-r">
                  {day}
                </div>
              ))}

              {/* Time column + Day columns with absolute positioning */}
              <div className="relative bg-gray-50 border-r" style={{ height: `${TOTAL_MINUTES * PIXELS_PER_MINUTE}px` }}>
                {/* Hour markers */}
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => {
                  const hour = START_HOUR + i;
                  return (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 text-xs px-2 py-1 text-gray-600 font-medium border-t border-gray-200"
                      style={{ top: `${i * 60 * PIXELS_PER_MINUTE}px` }}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  );
                })}
              </div>

              {/* Day columns */}
              {DAYS.map((day) => {
                const sessions = getSessionsForDay(day);

                return (
                  <div
                    key={day}
                    className="relative border-r border-gray-200"
                    style={{ height: `${TOTAL_MINUTES * PIXELS_PER_MINUTE}px` }}
                  >
                    {/* Hour grid lines */}
                    {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ top: `${i * 60 * PIXELS_PER_MINUTE}px` }}
                      />
                    ))}

                    {/* Half-hour grid lines */}
                    {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                      <div
                        key={`half-${i}`}
                        className="absolute left-0 right-0 border-t border-gray-50"
                        style={{ top: `${(i * 60 + 30) * PIXELS_PER_MINUTE}px` }}
                      />
                    ))}

                    {/* Sessions */}
                    {sessions.map((session, idx) => {
                      const topPosition = getSessionTopPosition(session);
                      const height = getSessionHeight(session);

                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`
                            absolute left-1 right-1 z-10
                            ${getCourseTypeColor(session.course_details?.course_type || session.session_type)}
                            rounded-r shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden
                          `}
                          style={{
                            top: `${topPosition}px`,
                            height: `${height}px`,
                          }}
                        >
                          <div className="p-2 h-full flex flex-col">
                            <div className="text-xs font-bold mb-1 flex items-center justify-between">
                              <span className="truncate">{session.course_details?.name}</span>
                              <Badge variant="outline" className="text-[9px] ml-1 border-current flex-shrink-0">
                                {session.course_details?.course_type || session.session_type}
                              </Badge>
                            </div>
                            <div className="space-y-0.5 text-[10px] opacity-80 flex-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span>
                                  {session.time_slot_details?.start_time?.slice(0, 5)} - {session.time_slot_details?.end_time?.slice(0, 5)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 truncate">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {session.teacher_details?.user_details?.first_name?.[0]}. {session.teacher_details?.user_details?.last_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{session.room_details?.name}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
