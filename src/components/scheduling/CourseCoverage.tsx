'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';

interface CourseCoverageData {
  courses: CourseInfo[];
  total_courses: number;
  fully_covered: number;
  partially_covered: number;
  not_covered: number;
  summary: {
    total_required_hours: number;
    total_scheduled_hours: number;
    overall_coverage: number;
  };
}

interface CourseInfo {
  course_code: string;
  course_name: string;
  required_hours: number;
  scheduled_hours: number;
  coverage_percentage: number;
  status: 'fully_covered' | 'partially_covered' | 'not_covered';
  missing_hours: number;
  sessions_count: number;
}

interface CourseCoverageProps {
  scheduleId?: number;
  className?: string;
  teacherId?: number;  // Nouveau paramètre optionnel pour filtrer par enseignant
}

export function CourseCoverage({ scheduleId, className = '', teacherId }: CourseCoverageProps) {
  const [coverage, setCoverage] = useState<CourseCoverageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'fully_covered' | 'partially_covered' | 'not_covered'>('all');
  const { addToast } = useToast();

  useEffect(() => {
    if (scheduleId) {
      fetchCoverage();
    }
  }, [scheduleId, teacherId]);

  const fetchCoverage = async () => {
    if (!scheduleId) return;

    setLoading(true);
    try {
      // Construire l'URL avec le paramètre teacher_id si fourni
      let url = `/schedules/schedules/${scheduleId}/course_coverage/`;
      if (teacherId) {
        url += `?teacher_id=${teacherId}`;
      }

      const data = await apiClient.get<CourseCoverageData>(url);
      setCoverage(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la couverture:', error);
      addToast({
        title: 'Erreur',
        description: 'Impossible de charger la couverture des cours',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: CourseInfo['status']) => {
    switch (status) {
      case 'fully_covered':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Complet</Badge>;
      case 'partially_covered':
        return <Badge className="bg-orange-500 hover:bg-orange-600"><AlertTriangle className="w-3 h-3 mr-1" />Partiel</Badge>;
      case 'not_covered':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Non couvert</Badge>;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredCourses = coverage?.courses.filter(course => {
    if (filter === 'all') return true;
    return course.status === filter;
  }) || [];

  if (!scheduleId) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Sélectionnez une classe pour voir la couverture des cours</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement de la couverture...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!coverage) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle>Couverture des Heures de Cours</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCoverage}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Résumé global */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Complets</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {coverage.fully_covered}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {coverage.total_courses > 0 ? Math.round((coverage.fully_covered / coverage.total_courses) * 100) : 0}% du total
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Partiels</span>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {coverage.partially_covered}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {coverage.total_courses > 0 ? Math.round((coverage.partially_covered / coverage.total_courses) * 100) : 0}% du total
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Non couverts</span>
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {coverage.not_covered}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              {coverage.total_courses > 0 ? Math.round((coverage.not_covered / coverage.total_courses) * 100) : 0}% du total
            </div>
          </div>
        </div>

        {/* Couverture globale */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Couverture Globale</span>
            <span className="text-2xl font-bold text-primary">
              {coverage.summary.overall_coverage.toFixed(1)}%
            </span>
          </div>
          <Progress value={coverage.summary.overall_coverage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{coverage.summary.total_scheduled_hours}h planifiées</span>
            <span>{coverage.summary.total_required_hours}h requises</span>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tous ({coverage.courses.length})
          </Button>
          <Button
            variant={filter === 'fully_covered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('fully_covered')}
            className={filter === 'fully_covered' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Complets ({coverage.fully_covered})
          </Button>
          <Button
            variant={filter === 'partially_covered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('partially_covered')}
            className={filter === 'partially_covered' ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            Partiels ({coverage.partially_covered})
          </Button>
          <Button
            variant={filter === 'not_covered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('not_covered')}
            className={filter === 'not_covered' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Non couverts ({coverage.not_covered})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun cours dans cette catégorie</p>
          </div>
        ) : (
          filteredCourses.map((course, index) => (
            <motion.div
              key={course.course_code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{course.course_code}</span>
                    {getStatusBadge(course.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{course.course_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {course.coverage_percentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {course.sessions_count} sessions
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Progress
                  value={course.coverage_percentage}
                  className="h-2"
                />
                <div className="flex justify-between items-center text-xs">
                  <div className="flex gap-4">
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {course.scheduled_hours}h planifiées
                    </span>
                    <span className="text-muted-foreground">
                      / {course.required_hours}h requises
                    </span>
                  </div>
                  {course.missing_hours > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      ⚠ Manque: {course.missing_hours}h
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
