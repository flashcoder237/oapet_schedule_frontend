'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Award,
  Clock,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import { studentService, type CourseEnrollment } from '@/lib/api/services/students';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

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
      setEnrollments(data.results || []);
      setFilteredEnrollments(data.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = enrollments;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.course.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
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

  const courseTypes = [
    { value: 'all', label: 'Tous les cours' },
    { value: 'CM', label: 'Cours Magistraux' },
    { value: 'TD', label: 'Travaux Dirigés' },
    { value: 'TP', label: 'Travaux Pratiques' },
    { value: 'TPE', label: 'Travaux Personnels' },
  ];

  const totalCredits = enrollments.reduce((sum, e) => sum + (e.course.credits || 0), 0);
  const totalHours = enrollments.reduce((sum, e) => sum + (e.course.hours_per_week || 0), 0);

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
        {/* En-tête */}
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

        {/* Statistiques */}
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

        {/* Filtres et recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-white shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barre de recherche */}
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

              {/* Filtre par type */}
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

        {/* Liste des cours */}
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
              transition={{ delay: 0.6 + index * 0.05 }}
            >
              <Card className="bg-white shadow-md hover:shadow-xl transition-all cursor-pointer h-full">
                <div className="p-5 space-y-3">
                  {/* En-tête du cours */}
                  <div className="flex items-start justify-between">
                    <Badge className={getCourseTypeColor(enrollment.course.course_type)}>
                      {enrollment.course.course_type}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Nom du cours */}
                  <div>
                    <h3 className="font-bold text-lg line-clamp-2 mb-1">
                      {enrollment.course.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Code: {enrollment.course.code}
                    </p>
                  </div>

                  {/* Informations */}
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

                  {/* Semestre */}
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

        {/* Message si aucun résultat */}
        {filteredEnrollments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun cours trouvé</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
