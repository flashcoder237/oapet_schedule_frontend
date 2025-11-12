'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
  CalendarDays,
  CalendarRange,
  Grid3x3,
  Settings,
  Edit,
  Move,
  Save,
  AlertTriangle,
  Download,
  Upload,
  BarChart3,
  Bot,
  Shield,
  CheckCircle,
  Users,
  User,
  Activity,
  Sparkles,
  FileText,
  CalendarCheck,
  ClipboardList,
  Ban,
  TrendingUp
} from 'lucide-react';
import { scheduleService } from '@/lib/api/services/schedules';
import { Badge } from '@/components/ui/badge';
import { ScheduleSession } from '@/types/api';
import { CourseCoverage } from '@/components/scheduling/CourseCoverage';

interface StudentClass {
  id: number;
  code: string;
  name: string;
  level: string;
  department_name: string;
}

type ViewMode = 'week' | 'day' | 'month';
type EditMode = 'view' | 'edit' | 'drag';
type TabMode = 'controls' | 'stats' | 'conflicts' | 'generator' | 'generation' | 'coverage';

interface UnifiedFloatingMenuProps {
  selectedClass: string;
  onClassChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onExport: () => void;
  onImport: () => void;
  editMode: EditMode;
  onEditModeChange?: (mode: EditMode) => void;
  onSave: () => void;
  hasChanges: boolean;
  studentClasses: StudentClass[];
  conflicts: any[];
  sessions: ScheduleSession[];
  addToast: (toast: any) => void;
  onGenerateSchedule?: () => void;
  onShowOccurrenceManager?: () => void;
  currentScheduleId?: number;
  isReadOnly?: boolean;
  canManage?: boolean;
  showOnlyMyCourses?: boolean;
  onShowOnlyMyCoursesChange?: (value: boolean) => void;
  isTeacher?: boolean;
  user?: any;  // Ajouter l'utilisateur pour récupérer le teacher_id
}

export function UnifiedFloatingMenu({
  selectedClass,
  onClassChange,
  viewMode,
  onViewModeChange,
  selectedDate,
  onDateChange,
  onExport,
  onImport,
  editMode,
  onEditModeChange,
  onSave,
  hasChanges,
  studentClasses = [],
  conflicts = [],
  sessions = [],
  addToast,
  onGenerateSchedule,
  onShowOccurrenceManager,
  currentScheduleId,
  isReadOnly = false,
  canManage = true,
  showOnlyMyCourses = false,
  onShowOnlyMyCoursesChange,
  isTeacher = false,
  user
}: UnifiedFloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabMode>('controls');
  const [isHovered, setIsHovered] = useState(false);

  const stats = {
    total: sessions.length,
    CM: sessions.filter((s: ScheduleSession) => s.session_type === 'CM').length,
    TD: sessions.filter((s: ScheduleSession) => s.session_type === 'TD').length,
    TP: sessions.filter((s: ScheduleSession) => s.session_type === 'TP').length,
    EXAM: sessions.filter((s: ScheduleSession) => s.session_type === 'EXAM').length,
    totalStudents: sessions.reduce((sum: number, s: ScheduleSession) => sum + s.expected_students, 0),
    conflicts: conflicts.length
  };

  // Bouton fermé
  const closedButton = (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        top: -window.innerHeight + 200,
        bottom: 0,
        left: -window.innerWidth + 200,
        right: 0
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-28 right-6 z-50 cursor-move"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Button
        onClick={() => setIsOpen(true)}
        className="rounded-full w-16 h-16 shadow-xl bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 p-0 transition-all duration-300 border-2 border-white/20"
      >
        <motion.div
          animate={{
            rotate: isHovered ? 360 : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <Settings className="h-7 w-7 text-white" />
        </motion.div>
      </Button>

      {conflicts.length > 0 && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
          {conflicts.length}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap pointer-events-none"
      >
        Parametres emploi du temps
        <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
      </motion.div>
    </motion.div>
  );

  // Menu ouvert
  const openMenu = (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        top: -window.innerHeight + 200,
        bottom: 0,
        left: -window.innerWidth + 200,
        right: 0
      }}
      initial={{ opacity: 0, scale: 0.8, x: 100, y: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 100, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-28 right-6 z-50 w-[450px] cursor-move"
    >
      <Card className="shadow-2xl border-2 border-blue-200/50 backdrop-blur-sm bg-white/95 max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-3 pt-3">
          <div className="flex items-center justify-between mb-3">
            <motion.div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Menu Schedule
              </CardTitle>
            </motion.div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-red-100"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-6 gap-1 bg-white/50 rounded-lg p-1">
            <Button
              variant={activeTab === 'controls' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('controls')}
              className="text-xs h-8"
            >
              <Settings className="w-3 h-3 mr-1" />
              Vue
            </Button>
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('stats')}
              className="text-xs h-8"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Stats
            </Button>
            <Button
              variant={activeTab === 'coverage' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('coverage')}
              className="text-xs h-8"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Couv
            </Button>
            {canManage && (
              <Button
                variant={activeTab === 'generation' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('generation')}
                className="text-xs h-8"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Gen
              </Button>
            )}
            <Button
              variant={activeTab === 'conflicts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('conflicts')}
              className="text-xs h-8 relative"
            >
              <Shield className="w-3 h-3 mr-1" />
              IA
              {conflicts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                  {conflicts.length}
                </span>
              )}
            </Button>
            {canManage && (
              <Button
                variant={activeTab === 'generator' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('generator')}
                className="text-xs h-8"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Auto
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* CONTROLS TAB */}
          {activeTab === 'controls' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  Classe
                </label>
                <Select value={selectedClass} onValueChange={onClassChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentClasses && studentClasses.length > 0 ? (
                      studentClasses.map((c: StudentClass) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({c.level})</span>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        Aucune classe disponible
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  Date
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      if (viewMode === 'week') {
                        newDate.setDate(newDate.getDate() - 7);
                      } else if (viewMode === 'day') {
                        newDate.setDate(newDate.getDate() - 1);
                      } else {
                        newDate.setMonth(newDate.getMonth() - 1);
                      }
                      onDateChange(newDate);
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Input
                    type="date"
                    value={scheduleService.formatDate(selectedDate)}
                    onChange={(e) => onDateChange(new Date(e.target.value))}
                    className="flex-1"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      if (viewMode === 'week') {
                        newDate.setDate(newDate.getDate() + 7);
                      } else if (viewMode === 'day') {
                        newDate.setDate(newDate.getDate() + 1);
                      } else {
                        newDate.setMonth(newDate.getMonth() + 1);
                      }
                      onDateChange(newDate);
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-500" />
                  Vue
                </label>
                <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs"
                    onClick={() => onViewModeChange('day')}
                  >
                    <CalendarDays className="w-3 h-3 mr-1" />
                    Jour
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs"
                    onClick={() => onViewModeChange('week')}
                  >
                    <CalendarRange className="w-3 h-3 mr-1" />
                    Semaine
                  </Button>
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs"
                    onClick={() => onViewModeChange('month')}
                  >
                    <Grid3x3 className="w-3 h-3 mr-1" />
                    Mois
                  </Button>
                </div>
              </div>

              {canManage && onEditModeChange && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-orange-500" />
                    Mode
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={editMode === 'view' ? 'default' : 'ghost'}
                      size="sm"
                      className="text-xs"
                      onClick={() => onEditModeChange('view')}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Vue
                    </Button>
                    <Button
                      variant={editMode === 'edit' ? 'default' : 'ghost'}
                      size="sm"
                      className="text-xs"
                      onClick={() => onEditModeChange('edit')}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant={editMode === 'drag' ? 'default' : 'ghost'}
                      size="sm"
                      className="text-xs"
                      onClick={() => onEditModeChange('drag')}
                    >
                      <Move className="w-3 h-3 mr-1" />
                      Drag
                    </Button>
                  </div>
                </div>
              )}

              {isReadOnly && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Mode Lecture Seule</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Vous pouvez consulter l'emploi du temps mais pas le modifier
                  </p>
                </div>
              )}

              {/* Toggle "Mon emploi du temps" pour les enseignants */}
              {isTeacher && onShowOnlyMyCoursesChange && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-700" />
                      <span className="text-sm font-medium text-purple-700">Mon emploi du temps</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOnlyMyCourses}
                        onChange={(e) => onShowOnlyMyCoursesChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    {showOnlyMyCourses
                      ? "Affichage de vos cours uniquement"
                      : "Cliquez pour afficher uniquement vos cours"}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {editMode !== 'view' && hasChanges && (
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
                    onClick={onSave}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Sauvegarder
                  </Button>
                )}

                <Button variant="outline" onClick={onExport} size="sm">
                  <Download className="w-4 h-4" />
                </Button>

                <Button variant="outline" onClick={onImport} size="sm">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-blue-800">Sessions</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{stats.CM}</div>
                  <div className="text-xs text-green-800">CM</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{stats.TD}</div>
                  <div className="text-xs text-purple-800">TD</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{stats.TP}</div>
                  <div className="text-xs text-orange-800">TP</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{stats.EXAM}</div>
                  <div className="text-xs text-red-800">Examens</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">{stats.conflicts}</div>
                  <div className="text-xs text-yellow-800">Conflits</div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Total etudiants</span>
                  </div>
                  <span className="font-bold text-gray-900">{stats.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Taux occupation</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {sessions.length > 0 ? Math.round((stats.totalStudents / sessions.length) * 100) / 100 : 0}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* CONFLICTS TAB */}
          {activeTab === 'conflicts' && (
            <>
              {conflicts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-green-700">Aucun conflit detecte!</p>
                  <p className="text-xs text-gray-500 mt-1">L'emploi du temps est optimal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive" className="text-sm">
                      {conflicts.length} conflit(s) detecte(s)
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {conflicts.map((conflict: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-800">{conflict.description || 'Conflit detecte'}</p>
                            {conflict.details && (
                              <p className="text-xs text-red-600 mt-1">{conflict.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* GENERATION TAB - Seulement pour admins/planificateurs */}
          {canManage && activeTab === 'generation' && (
            <>
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <Calendar className="h-10 w-10 text-indigo-500 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    Gestion de Génération
                  </h3>
                  <p className="text-xs text-gray-600">
                    Gérez les emplois du temps
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={onShowOccurrenceManager}
                    className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700"
                    size="sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Gestion des Séances
                  </Button>
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <p className="text-xs text-gray-600 font-medium">
                    Fonctionnalités:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5 text-teal-500" />
                      <span>Gestion des occurrences</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Edit className="h-3.5 w-3.5 text-green-500" />
                      <span>Modification de séances</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="h-3.5 w-3.5 text-red-500" />
                      <span>Annulation de séances</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* COVERAGE TAB */}
          {activeTab === 'coverage' && (
            <>
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <TrendingUp className="h-10 w-10 text-blue-500 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    Couverture des Cours
                  </h3>
                  <p className="text-xs text-gray-600">
                    Vérifiez si tous les cours ont assez d'heures planifiées
                  </p>
                </div>

                {currentScheduleId ? (
                  <CourseCoverage
                    scheduleId={currentScheduleId}
                    className="border-0 shadow-none"
                    teacherId={isTeacher && user?.teacher_id ? user.teacher_id : undefined}
                  />
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {selectedClass ? "Chargement du schedule..." : "Sélectionnez une classe pour voir la couverture des cours"}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <p className="text-xs text-gray-600 font-medium">
                    Indicateurs:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span>Complet: 100%+ des heures requises</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                      <span>Partiel: Moins de 100% couvert</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="h-3.5 w-3.5 text-red-500" />
                      <span>Non couvert: 0% planifié</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* GENERATOR TAB - Seulement pour admins/planificateurs */}
          {canManage && activeTab === 'generator' && (
            <>
              <div className="text-center py-4">
                <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Generateur IA
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Generer automatiquement un emploi du temps optimise
                </p>

                <Button
                  onClick={onGenerateSchedule}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generer emploi du temps
                </Button>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>Note:</strong> Le generateur IA prend en compte:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>- Disponibilite des salles</li>
                  <li>- Disponibilite des enseignants</li>
                  <li>- Contraintes horaires</li>
                  <li>- Optimisation des conflits</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Return the appropriate UI based on isOpen state
  return isOpen ? openMenu : closedButton;
}
