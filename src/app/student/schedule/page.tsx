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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 8 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

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
      'CM': 'bg-blue-500',
      'TD': 'bg-green-500',
      'TP': 'bg-purple-500',
      'TPE': 'bg-orange-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const formatWeekRange = () => {
    if (!weeklySchedule) return '';
    const start = new Date(weeklySchedule.week_start);
    const end = new Date(weeklySchedule.week_end);
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  const getSessionsForDayAndTime = (day: string, timeSlot: string): any[] => {
    if (!weeklySchedule?.sessions_by_day) return [];
    const daySessions = weeklySchedule.sessions_by_day[day] || [];
    const [targetHour] = timeSlot.split(':').map(Number);

    return daySessions.filter((session: any) => {
      const startTime = session.time_slot_details?.start_time;
      if (!startTime) return false;
      const [sessionHour] = startTime.split(':').map(Number);
      return sessionHour === targetHour;
    });
  };

  const getSessionDuration = (session: any): number => {
    const startTime = session.time_slot_details?.start_time;
    const endTime = session.time_slot_details?.end_time;
    if (!startTime || !endTime) return 1;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return Math.ceil(durationMinutes / 60);
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

          {/* Stats */}
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">CM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">TD</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">TP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
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
            <div className="grid grid-cols-[80px_repeat(6,1fr)] min-w-[1200px]">
              {/* Header Row - Days */}
              <div className="bg-gray-50 border-b border-r p-3 font-semibold text-xs text-gray-600">
                Horaire
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="bg-gradient-to-br from-primary/5 to-primary/10 border-b border-r p-3 text-center font-semibold text-sm text-gray-900"
                >
                  {day}
                </div>
              ))}

              {/* Time Slots Rows */}
              {TIME_SLOTS.map((timeSlot) => (
                <React.Fragment key={timeSlot}>
                  {/* Time Column */}
                  <div className="bg-gray-50 border-b border-r p-3 text-xs text-gray-600 font-medium flex items-start">
                    {timeSlot}
                  </div>

                  {/* Day Columns */}
                  {DAYS.map((day) => {
                    const sessions = getSessionsForDayAndTime(day.toLowerCase(), timeSlot);
                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className="border-b border-r p-2 min-h-[80px] bg-white hover:bg-gray-50 transition-colors relative"
                      >
                        {sessions.map((session, idx) => {
                          const duration = getSessionDuration(session);
                          return (
                            <motion.div
                              key={session.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`
                                ${getCourseTypeColor(session.course_details?.course_type)}
                                text-white rounded-lg p-2 mb-2 shadow-sm hover:shadow-md transition-all cursor-pointer
                                ${duration > 1 ? 'min-h-[160px]' : ''}
                              `}
                              style={{
                                gridRow: duration > 1 ? `span ${duration}` : undefined
                              }}
                            >
                              <div className="text-xs font-bold mb-1 flex items-center justify-between">
                                <span className="truncate">{session.course_details?.name}</span>
                                <Badge className="bg-white/20 text-white text-[10px] ml-1">
                                  {session.course_details?.course_type}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-[10px] text-white/90">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {session.time_slot_details?.start_time} - {session.time_slot_details?.end_time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 truncate">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {session.teacher_details?.first_name?.[0]}. {session.teacher_details?.last_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{session.room_details?.name}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
