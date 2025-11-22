'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, BookOpen, User as UserIcon, Clock,
  Users, Calendar, Building, Download, Upload, Filter, Loader2,
  FileSpreadsheet, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoading, LoadingSpinner } from '@/components/ui/loading';
import { useToast } from '@/components/ui/use-toast';
import { Pagination } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActions, CommonBulkActions } from '@/components/ui/BulkActions';
import { courseService } from '@/lib/api/services/courses';
import { departmentService } from '@/lib/api/services/departments';
import { userService } from '@/lib/api/services/users';
import CourseModal from '@/components/modals/CourseModal';
import { Badge } from '@/components/ui/badge';
import type { Course, CourseStats, Department } from '@/types/api';
import { useAuth } from '@/lib/auth/context';
import { ImportExport } from '@/components/ui/ImportExport';

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: number | string; name: string }>>([]);
  const [levels, setLevels] = useState<string[]>(['all']);
  const [showOnlyMyCourses, setShowOnlyMyCourses] = useState(false);

  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // États de sélection pour les actions groupées
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { addToast} = useToast();
  const { canManageSchedules, isTeacher, user } = useAuth();

  // Template classique pour cours individuels (CM, TD, TP séparés)
  const courseTemplateFieldsClassic = [
    { key: 'id', label: 'ID', example: '1' },
    { key: 'code', label: 'Code', example: 'INF101_CM' },
    { key: 'name', label: 'Nom du Cours', example: 'Introduction à la Programmation (CM)' },
    { key: 'description', label: 'Description', example: 'Cours magistral d\'introduction' },
    { key: 'department_name', label: 'Département', example: 'Informatique' },
    { key: 'teacher_employee_id', label: 'ID Employé Enseignant', example: 'EMP001' },
    { key: 'teacher_email', label: 'Email Enseignant (alternatif)', example: 'prof@exemple.com' },
    { key: 'course_type', label: 'Type de Cours', example: 'CM (CM, TD, TP, TPE, CONF, EXAM)' },
    { key: 'level', label: 'Niveau', example: 'L1 (L1, L2, L3, M1, M2)' },
    { key: 'credits', label: 'Crédits', example: '6' },
    { key: 'hours_per_week', label: 'Heures par Semaine', example: '3' },
    { key: 'total_hours', label: 'Heures Totales', example: '42' },
    { key: 'max_students', label: 'Max Étudiants', example: '40' },
    { key: 'min_room_capacity', label: 'Capacité Min Salle', example: '40' },
    { key: 'requires_computer', label: 'Nécessite Ordinateur', example: 'true' },
    { key: 'requires_projector', label: 'Nécessite Projecteur', example: 'true' },
    { key: 'requires_laboratory', label: 'Nécessite Laboratoire', example: 'false' },
    { key: 'semester', label: 'Semestre', example: 'S1' },
    { key: 'academic_year', label: 'Année Académique', example: '2024-2025' },
    { key: 'is_active', label: 'Actif', example: 'true' },
  ];

  // Template pour génération automatique (crée CM, TD, TP, TPE automatiquement)
  const courseTemplateFieldsAutoGenerate = [
    { key: 'code', label: 'Code de Base', example: 'INF101' },
    { key: 'name', label: 'Nom du Cours de Base', example: 'Introduction à la Programmation' },
    { key: 'description', label: 'Description', example: 'Cours d\'introduction aux concepts de base' },
    { key: 'department_name', label: 'Département', example: 'Informatique' },
    { key: 'teacher_employee_id', label: 'ID Employé Enseignant', example: 'EMP001' },
    { key: 'teacher_email', label: 'Email Enseignant (alternatif)', example: 'prof@exemple.com' },
    { key: 'level', label: 'Niveau', example: 'L1 (L1, L2, L3, M1, M2)' },
    { key: 'credits', label: 'Crédits', example: '6' },
    { key: 'cm_percentage', label: '% CM', example: '40' },
    { key: 'td_percentage', label: '% TD', example: '30' },
    { key: 'tp_percentage', label: '% TP', example: '20' },
    { key: 'tpe_percentage', label: '% TPE', example: '10' },
    { key: 'credit_hours', label: 'Heures par Crédit', example: '15' },
    { key: 'max_students', label: 'Max Étudiants', example: '40' },
    { key: 'min_room_capacity', label: 'Capacité Min Salle', example: '40' },
    { key: 'requires_computer', label: 'Nécessite Ordinateur', example: 'true' },
    { key: 'requires_projector', label: 'Nécessite Projecteur', example: 'true' },
    { key: 'requires_laboratory', label: 'Nécessite Laboratoire', example: 'false' },
    { key: 'semester', label: 'Semestre', example: 'S1' },
    { key: 'academic_year', label: 'Année Académique', example: '2024-2025' },
    { key: 'is_active', label: 'Actif', example: 'true' },
  ];

  // Fonction pour préparer les données d'export avec noms lisibles
  const prepareExportData = () => {
    return courses.map(course => ({
      id: course.id || '',
      code: course.code || '',
      name: course.name || '',
      description: course.description || '',
      department_name: course.department_name || '',
      teacher_employee_id: '', // À remplir si disponible dans les détails teacher
      teacher_email: '', // À remplir si disponible dans les détails teacher
      course_type: course.course_type || '',
      level: course.level || '',
      credits: course.credits || '',
      hours_per_week: course.hours_per_week || '',
      total_hours: course.total_hours || '',
      max_students: course.max_students || '',
      min_room_capacity: course.min_room_capacity || '',
      requires_computer: course.requires_computer ? 'true' : 'false',
      requires_projector: course.requires_projector ? 'true' : 'false',
      requires_laboratory: course.requires_laboratory ? 'true' : 'false',
      semester: course.semester || '',
      academic_year: course.academic_year || '',
      is_active: course.is_active ? 'true' : 'false',
    }));
  };

  // Chargement des données
  const loadData = async () => {
    try {
      setIsLoading(true);

      const [coursesData, statsData, departmentsData] = await Promise.all([
        courseService.getCourses(),
        courseService.getCoursesStats(),
        courseService.getDepartments()
      ]);

      const coursesArray = coursesData.results || [];
      setCourses(coursesArray);
      setStats(statsData);

      // Extraire les départements réels
      const deptResults = departmentsData.results || departmentsData || [];
      const deptMap = new Map(deptResults.map((d: any) => [d.id, d.name]));

      // Créer une liste de départements avec nom
      const uniqueDeptIds = new Set(coursesArray.map(c => c.department).filter(Boolean));
      const deptList = [
        { id: 'all', name: 'Tous les départements' },
          ...Array.from(uniqueDeptIds).map(id => ({
            id,
            name: deptMap.get(id) || `Département ${id}`
          }))
        ];
        setDepartments(deptList);

      // Extraire les niveaux réels
      const uniqueLevels = new Set(coursesArray.map(c => c.level).filter(Boolean));
      setLevels(['all', ...Array.from(uniqueLevels).sort()]);

    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de charger les cours",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setShowCourseModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (courseData: any) => {
    try {
      if (selectedCourse) {
        await courseService.updateCourse(selectedCourse.id!, courseData);
      } else {
        await courseService.createCourse(courseData);
      }

      // Recharger toutes les données (cours, enseignants, départements)
      await loadData();

    } catch (error: any) {
      throw error; // Propager l'erreur pour que le modal la gère
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;

    try {
      await courseService.deleteCourse(courseId);

      // Recharger toutes les données depuis le serveur
      await loadData();

      addToast({
        title: "Succès",
        description: "Cours supprimé avec succès",
        variant: "default",
      });
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer le cours",
        variant: "destructive",
      });
    }
  };

  // Fonctions de sélection
  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredCourses.map(c => c.id).filter((id): id is number => id !== undefined));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Actions groupées
  const handleBulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} cours ?`)) return;

    try {
      await Promise.all(Array.from(selectedIds).map(id => courseService.deleteCourse(id)));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} cours supprimé(s)`,
      });

      const coursesData = await courseService.getCourses();
      setCourses(coursesData.results || []);
      setSelectedIds(new Set());
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Erreur lors de la suppression groupée",
        variant: "destructive",
      });
    }
  };

  const handleBulkActivate = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        courseService.updateCourse(id, { is_active: true })
      ));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} cours activé(s)`,
      });

      const coursesData = await courseService.getCourses();
      setCourses(coursesData.results || []);
      setSelectedIds(new Set());
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Erreur lors de l'activation groupée",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        courseService.updateCourse(id, { is_active: false })
      ));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} cours désactivé(s)`,
      });

      const coursesData = await courseService.getCourses();
      setCourses(coursesData.results || []);
      setSelectedIds(new Set());
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Erreur lors de la désactivation groupée",
        variant: "destructive",
      });
    }
  };

  const bulkActions = [
    CommonBulkActions.delete(handleBulkDelete, selectedIds.size),
    CommonBulkActions.activate(handleBulkActivate),
    CommonBulkActions.deactivate(handleBulkDeactivate),
  ];

  // Filtrage des cours
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm ||
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === 'all' ||
      Number(course.department) === Number(selectedDepartment) ||
      String(course.department) === String(selectedDepartment);

    const matchesLevel = selectedLevel === 'all' ||
      course.level === selectedLevel;

    // Filtre "Mes Cours" pour les enseignants
    const matchesMyCourses = !showOnlyMyCourses ||
      !isTeacher() ||
      !user?.teacher_id ||
      course.teacher === user.teacher_id;

    return matchesSearch && matchesDepartment && matchesLevel && matchesMyCourses;
  });

  // Utiliser les cours filtrés pour les stats si le filtre est actif
  const coursesForStats = showOnlyMyCourses && isTeacher() && user?.teacher_id ? filteredCourses : courses;

  // Debug stats
  useEffect(() => {
    console.log('📊 Stats Cours:');
    console.log('  - Total cours:', courses.length);
    console.log('  - Cours avec teacher:', courses.filter(c => c.teacher).length);
    console.log('  - Teachers uniques:', new Set(courses.filter(c => c.teacher).map(c => c.teacher)).size);
    console.log('  - Exemple cours:', courses.slice(0, 3).map(c => ({
      name: c.name,
      teacher: c.teacher,
      teacher_name: c.teacher_name
    })));
  }, [courses]);

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  // Réinitialiser à la page 1 si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedLevel, showOnlyMyCourses]);

  const getCourseTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'CM': 'bg-blue-500',
      'TD': 'bg-green-500',
      'TP': 'bg-purple-500',
      'CONF': 'bg-orange-500',
      'EXAM': 'bg-red-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getCourseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CM': 'Cours Magistral',
      'TD': 'Travaux Dirigés',
      'TP': 'Travaux Pratiques',
      'CONF': 'Conférence',
      'EXAM': 'Examen',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <PageLoading message="Chargement des cours..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cours</h1>
          <p className="text-muted-foreground">
            Gérez les cours et modules de formation
          </p>
        </div>
        {canManageSchedules() && (
          <div className="flex gap-2">
            {/* Import/Export avec 2 templates différents */}
            <CourseImportExport
              onImportSuccess={loadData}
              templateFieldsClassic={courseTemplateFieldsClassic}
              templateFieldsAutoGenerate={courseTemplateFieldsAutoGenerate}
              courses={courses}
            />
            <Button onClick={handleAddCourse} className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau Cours
            </Button>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {showOnlyMyCourses ? 'Mes Cours' : 'Total Cours'}
                </p>
                <p className="text-2xl font-bold">{coursesForStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cours Actifs</p>
                <p className="text-2xl font-bold">{coursesForStats.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {showOnlyMyCourses ? 'Départements' : 'Enseignants'}
                </p>
                <p className="text-2xl font-bold">
                  {showOnlyMyCourses
                    ? new Set(coursesForStats.map(c => c.department)).size
                    : new Set(coursesForStats.filter(c => c.teacher).map(c => c.teacher)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Heures</p>
                <p className="text-2xl font-bold">
                  {coursesForStats.reduce((sum, c) => sum + (c.total_hours || 0), 0)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {isTeacher() && user?.teacher_id && (
              <label className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                <input
                  type="checkbox"
                  checked={showOnlyMyCourses}
                  onChange={(e) => setShowOnlyMyCourses(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
                />
                <span className="text-sm font-medium text-blue-900 whitespace-nowrap">
                  Mes Cours
                </span>
              </label>
            )}

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'Tous les niveaux' : level}
                </option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Actions groupées */}
      {selectedIds.size > 0 && canManageSchedules() && (
        <BulkActions
          selectedCount={selectedIds.size}
          totalCount={filteredCourses.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          actions={bulkActions}
        />
      )}

      {/* Tableau des cours */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Cours ({filteredCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {canManageSchedules() && (
                    <th className="text-left p-4">
                      <Checkbox
                        checked={selectedIds.size === filteredCourses.length && filteredCourses.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSelectAll();
                          } else {
                            handleDeselectAll();
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="text-left p-4 font-semibold">Code</th>
                  <th className="text-left p-4 font-semibold">Nom</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Niveau</th>
                  <th className="text-left p-4 font-semibold">Crédits</th>
                  <th className="text-left p-4 font-semibold">Heures</th>
                  <th className="text-left p-4 font-semibold">Étudiants</th>
                  <th className="text-left p-4 font-semibold">Statut</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={canManageSchedules() ? 10 : 9} className="text-center p-8 text-muted-foreground">
                      Aucun cours trouvé
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((course, index) => (
                    <motion.tr
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      {canManageSchedules() && (
                        <td className="p-4">
                          <Checkbox
                            checked={course.id !== undefined && selectedIds.has(course.id)}
                            onCheckedChange={() => course.id && toggleSelection(course.id)}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <span className="font-mono text-sm font-semibold">
                          {course.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{course.name}</p>
                          {course.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`${getCourseTypeColor(course.course_type)} text-white`}>
                          {getCourseTypeLabel(course.course_type)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{course.level}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{course.credits}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{course.total_hours}h total</div>
                          <div className="text-muted-foreground">
                            {course.hours_per_week}h/semaine
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{course.max_students}</span>
                      </td>
                      <td className="p-4">
                        {course.is_active ? (
                          <Badge className="bg-green-500 text-white">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {canManageSchedules() ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id!)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <span className="text-sm text-muted-foreground">Lecture seule</span>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredCourses.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredCourses.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="cours"
        />
      )}

      {/* Modal de création/édition */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        course={selectedCourse}
        onSave={handleSaveCourse}
      />
    </div>
  );
}

// Composant personnalisé pour l'import/export de cours avec 2 templates
function CourseImportExport({
  onImportSuccess,
  templateFieldsClassic,
  templateFieldsAutoGenerate,
  courses
}: {
  onImportSuccess: () => void;
  templateFieldsClassic: Array<{ key: string; label: string; example: string }>;
  templateFieldsAutoGenerate: Array<{ key: string; label: string; example: string }>;
  courses: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Détecter le format du fichier
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension) {
        formData.append('format', extension === 'xlsx' ? 'excel' : extension);
      }

      const token = localStorage.getItem('auth_token');
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/courses/courses/import_data/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Token ${token}` } : {})
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      addToast({
        title: "Import réussi",
        description: data.message || `${data.created_count + data.updated_count || 0} cours importé(s)`,
      });

      onImportSuccess();
    } catch (error: any) {
      console.error('Import error:', error);
      addToast({
        title: "Erreur d'import",
        description: error.message || "Impossible d'importer les données",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = (type: 'classic' | 'autogenerate', format: string) => {
    const fields = type === 'classic' ? templateFieldsClassic : templateFieldsAutoGenerate;
    const fileName = type === 'classic' ? 'template_cours_classique' : 'template_cours_auto_generation';

    if (format === 'excel') {
      import('@/lib/utils/excelExport').then(({ generateExcelTemplate }) => {
        generateExcelTemplate(fields, fileName);
        addToast({
          title: "Template téléchargé",
          description: `Template ${type === 'classic' ? 'classique' : 'auto-génération'} téléchargé`,
        });
      });
    }
  };

  const handleExport = async (format: string) => {
    setIsExporting(true);

    try {
      const exportData = courses.map(course => ({
        id: course.id || '',
        code: course.code || '',
        name: course.name || '',
        description: course.description || '',
        department_name: course.department_name || '',
        course_type: course.course_type || '',
        level: course.level || '',
        credits: course.credits || '',
        hours_per_week: course.hours_per_week || '',
        total_hours: course.total_hours || '',
        max_students: course.max_students || '',
        min_room_capacity: course.min_room_capacity || '',
        requires_computer: course.requires_computer ? 'true' : 'false',
        requires_projector: course.requires_projector ? 'true' : 'false',
        requires_laboratory: course.requires_laboratory ? 'true' : 'false',
        semester: course.semester || '',
        academic_year: course.academic_year || '',
        is_active: course.is_active ? 'true' : 'false',
      }));

      const filename = `cours_${new Date().toISOString().split('T')[0]}`;

      if (format === 'excel') {
        const { exportToExcel } = await import('@/lib/utils/excelExport');
        exportToExcel(exportData, filename, 'Cours');
      }

      addToast({
        title: "Export réussi",
        description: `${exportData.length} cours exporté(s)`,
      });
    } catch (error) {
      console.error('Export error:', error);
      addToast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative">
        <Button
          variant="outline"
          size="default"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isImporting || isExporting}
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Import...
            </>
          ) : isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Import/Export
            </>
          )}
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 space-y-4">
              {/* Section Import */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Importer des cours</h4>
                <Button
                  onClick={handleImport}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isImporting}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir un fichier
                </Button>
              </div>

              {/* Section Export */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Exporter les cours actuels</h4>
                <Button
                  onClick={() => handleExport('excel')}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter en Excel
                </Button>
              </div>

              {/* Section Templates */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Télécharger les templates</h4>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleDownloadTemplate('classic', 'excel')}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Template Classique (CM, TD, TP séparés)
                  </Button>

                  <Button
                    onClick={() => handleDownloadTemplate('autogenerate', 'excel')}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Template Auto-Génération (CM/TD/TP/TPE auto)
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
