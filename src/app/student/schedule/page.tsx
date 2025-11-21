'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Download,
  Filter
} from 'lucide-react';
import { studentService } from '@/lib/api/services/students';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
];

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
      'CM': 'bg-blue-100 text-blue-700 border-blue-300',
      'TD': 'bg-green-100 text-green-700 border-green-300',
      'TP': 'bg-purple-100 text-purple-700 border-purple-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const formatWeekRange = () => {
    if (!weeklySchedule) return '';
    const start = new Date(weeklySchedule.week_start);
    const end = new Date(weeklySchedule.week_end);
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-primary" />
              Mon Emploi du Temps
            </h1>
            <p className="text-muted-foreground mt-1">{formatWeekRange()}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={previousWeek}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Semaine précédente
            </Button>
            <Button
              variant="outline"
              onClick={nextWeek}
              className="flex items-center gap-2"
            >
              Semaine suivante
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>
        </motion.div>

        {/* Statistiques de la semaine */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-r from-primary to-accent text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Sessions cette semaine</p>
                <p className="text-3xl font-bold">{weeklySchedule?.total_sessions || 0}</p>
              </div>
              <Calendar className="w-12 h-12 text-white/30" />
            </div>
          </Card>
        </motion.div>

        {/* Grille hebdomadaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {DAYS.map((day, index) => {
            const sessions = weeklySchedule?.sessions_by_day?.[day.key] || [];

            return (
              <motion.div
                key={day.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  {/* En-tête du jour */}
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-b">
                    <h3 className="font-bold text-lg">{day.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {sessions.length} {sessions.length > 1 ? 'cours' : 'cours'}
                    </p>
                  </div>

                  {/* Sessions du jour */}
                  <div className="p-4 space-y-3 min-h-[200px]">
                    {sessions.length > 0 ? (
                      sessions.map((session: any) => (
                        <div
                          key={session.id}
                          className={`border-l-4 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                            session.course_details?.course_type === 'CM' ? 'border-blue-500 bg-blue-50' :
                            session.course_details?.course_type === 'TD' ? 'border-green-500 bg-green-50' :
                            'border-purple-500 bg-purple-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm line-clamp-1">
                              {session.course_details?.name}
                            </h4>
                            <Badge className={`${getCourseTypeColor(session.course_details?.course_type)} text-xs`}>
                              {session.course_details?.course_type}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span>
                                {session.time_slot_details?.start_time} - {session.time_slot_details?.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              <span className="truncate">
                                {session.teacher_details?.first_name} {session.teacher_details?.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">
                                {session.room_details?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Calendar className="w-12 h-12 mb-2 opacity-30" />
                        <p className="text-sm">Aucun cours</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Légende */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="font-semibold text-sm">Légende :</h3>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
                  <span className="text-sm">Cours Magistral (CM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  <span className="text-sm">Travaux Dirigés (TD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-100 border-2 border-purple-500 rounded"></div>
                  <span className="text-sm">Travaux Pratiques (TP)</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
