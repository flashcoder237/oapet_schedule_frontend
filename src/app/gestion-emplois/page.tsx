'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActions, CommonBulkActions } from '@/components/ui/BulkActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  MoreHorizontal,
  Printer,
  Sparkles,
} from 'lucide-react';
import { scheduleService } from '@/lib/api/services/schedules';
import { Schedule, AcademicPeriod } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import { ScheduleEditModal } from './components/ScheduleEditModal';
import { ScheduleStatsPanel } from './components/ScheduleStatsPanel';
import { AdminMenu } from './components/AdminMenu';
import { PrintScheduleModal } from './components/PrintScheduleModal';
import GenerationBlockagesModal from '@/components/modals/GenerationBlockagesModal';

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showBlockagesModal, setShowBlockagesModal] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // États de sélection pour les actions groupées
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = schedules;

    if (searchQuery) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          schedule.curriculum_details?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          schedule.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((schedule) =>
        statusFilter === 'published' ? schedule.is_published : !schedule.is_published
      );
    }

    if (periodFilter !== 'all') {
      filtered = filtered.filter(
        (schedule) => schedule.academic_period.toString() === periodFilter
      );
    }

    setFilteredSchedules(filtered);
  }, [searchQuery, statusFilter, periodFilter, schedules]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesResponse, periodsResponse] = await Promise.all([
        scheduleService.getSchedules(),
        scheduleService.getAcademicPeriods(),
      ]);

      setSchedules(schedulesResponse.results || []);
      setAcademicPeriods(periodsResponse.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      addToast({
        title: 'Erreur',
        description: 'Impossible de charger les emplois du temps',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (schedule: Schedule) => {
    try {
      if (schedule.is_published) {
        await scheduleService.unpublishSchedule(schedule.id);
        addToast({
          title: 'Succès',
          description: `${schedule.name} dépublié avec succès`,
          variant: 'default',
        });
      } else {
        await scheduleService.publishSchedule(schedule.id);
        addToast({
          title: 'Succès',
          description: `${schedule.name} publié avec succès`,
          variant: 'default',
        });
      }
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la publication:', error);
      addToast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer l'emploi du temps "${schedule.name}" ?\n\nCette action est irréversible et supprimera toutes les sessions associées.`
      )
    ) {
      return;
    }

    try {
      await scheduleService.deleteSchedule(schedule.id);

      // Mettre à jour immédiatement l'état local pour un retour visuel instantané
      setSchedules(prevSchedules => prevSchedules.filter(s => s.id !== schedule.id));

      addToast({
        title: 'Succès',
        description: `${schedule.name} supprimé avec succès`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      addToast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer l\'emploi du temps',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowEditModal(true);
  };

  const handleView = (schedule: Schedule) => {
    window.location.href = `/schedule?id=${schedule.id}`;
  };

  const handleSaveEdit = async (data: Partial<Schedule>) => {
    if (!editingSchedule) return;

    try {
      await scheduleService.updateSchedule(editingSchedule.id, data);
      addToast({
        title: 'Succès',
        description: 'Emploi du temps mis à jour avec succès',
        variant: 'default',
      });
      setShowEditModal(false);
      setEditingSchedule(null);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      addToast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de mettre à jour l\'emploi du temps',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateAdvanced = async (schedule: Schedule) => {
    setIsGenerating(true);
    try {
      const result = await scheduleService.generateAdvanced(schedule.id, {
        preview_mode: false,
        force_regenerate: true
      });

      setGenerationResult(result);

      if (result.success) {
        addToast({
          title: 'Génération Réussie',
          description: `${result.occurrences_created || 0} sessions créées`,
          variant: 'default',
        });

        if (result.blockages && result.blockages.length > 0) {
          setShowBlockagesModal(true);
        }

        loadData();
      } else {
        setShowBlockagesModal(true);
        addToast({
          title: 'Génération Incomplète',
          description: result.message || 'Certains cours n\'ont pas pu être programmés',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);
      addToast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de générer l\'emploi du temps',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
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
    const allIds = new Set(filteredSchedules.map(s => s.id));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Actions groupées
  const handleBulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} emploi(s) du temps ?\n\nCette action est irréversible et supprimera toutes les sessions associées.`)) return;

    try {
      await Promise.all(Array.from(selectedIds).map(id => scheduleService.deleteSchedule(id)));

      addToast({
        title: 'Succès',
        description: `${selectedIds.size} emploi(s) du temps supprimé(s)`,
      });

      await loadData();
      setSelectedIds(new Set());
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression groupée',
        variant: 'destructive',
      });
    }
  };

  const handleBulkPublish = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => scheduleService.publishSchedule(id)));

      addToast({
        title: 'Succès',
        description: `${selectedIds.size} emploi(s) du temps publié(s)`,
      });

      await loadData();
      setSelectedIds(new Set());
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Erreur lors de la publication groupée',
        variant: 'destructive',
      });
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => scheduleService.unpublishSchedule(id)));

      addToast({
        title: 'Succès',
        description: `${selectedIds.size} emploi(s) du temps dépublié(s)`,
      });

      await loadData();
      setSelectedIds(new Set());
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Erreur lors de la dépublication groupée',
        variant: 'destructive',
      });
    }
  };

  const bulkActions = [
    CommonBulkActions.delete(handleBulkDelete, selectedIds.size),
    {
      id: 'publish',
      label: 'Publier',
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: handleBulkPublish,
      variant: 'default' as const,
    },
    {
      id: 'unpublish',
      label: 'Dépublier',
      icon: <XCircle className="w-4 h-4" />,
      onClick: handleBulkUnpublish,
      variant: 'outline' as const,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Chargement des emplois du temps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu de navigation */}
      <AdminMenu />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* En-tête avec titre et action */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              Emplois du Temps
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Gérez et organisez tous les emplois du temps de l'établissement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="border-2 hover:bg-blue-50"
              onClick={() => setShowPrintModal(true)}
            >
              <Printer className="h-5 w-5 mr-2" />
              Imprimer
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                setEditingSchedule(null);
                setShowEditModal(true);
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouveau
            </Button>
          </div>
        </motion.div>

        {/* Panneau de statistiques */}
        <AnimatePresence>
          {showStats && (
            <ScheduleStatsPanel schedules={schedules} onClose={() => setShowStats(false)} />
          )}
        </AnimatePresence>

        {/* Barre de recherche et filtres améliorés */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              {/* Barre de recherche principale */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Rechercher par nom, filière ou description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="lg:w-auto h-12 border-gray-200 hover:bg-gray-50"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filtres
                  {(statusFilter !== 'all' || periodFilter !== 'all') && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {(statusFilter !== 'all' ? 1 : 0) + (periodFilter !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </div>

              {/* Filtres avancés */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Statut
                          </label>
                          <Select
                            value={statusFilter}
                            onValueChange={(value: any) => setStatusFilter(value)}
                          >
                            <SelectTrigger className="h-11 border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous les statuts</SelectItem>
                              <SelectItem value="published">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Publiés
                                </div>
                              </SelectItem>
                              <SelectItem value="draft">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-gray-600" />
                                  Brouillons
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Période académique
                          </label>
                          <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger className="h-11 border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Toutes les périodes</SelectItem>
                              {academicPeriods.map((period) => (
                                <SelectItem key={period.id} value={period.id.toString()}>
                                  {period.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(statusFilter !== 'all' || periodFilter !== 'all') && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setStatusFilter('all');
                              setPeriodFilter('all');
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Réinitialiser les filtres
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Résultats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            <span className="font-semibold text-gray-900">{filteredSchedules.length}</span>{' '}
            emploi{filteredSchedules.length > 1 ? 's' : ''} du temps trouvé
            {filteredSchedules.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions groupées */}
        {selectedIds.size > 0 && (
          <BulkActions
            selectedCount={selectedIds.size}
            totalCount={filteredSchedules.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            actions={bulkActions}
          />
        )}

        {/* Liste des emplois du temps - Design amélioré */}
        <div className="space-y-4">
          {filteredSchedules.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-sm border-0">
                <CardContent className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                    <Calendar className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Aucun emploi du temps trouvé
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery || statusFilter !== 'all' || periodFilter !== 'all'
                      ? 'Essayez de modifier vos critères de recherche'
                      : 'Commencez par créer votre premier emploi du temps'}
                  </p>
                  {(searchQuery || statusFilter !== 'all' || periodFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setPeriodFilter('all');
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredSchedules.map((schedule, index) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Checkbox de sélection */}
                      <div className="flex items-start p-4">
                        <Checkbox
                          checked={selectedIds.has(schedule.id)}
                          onCheckedChange={() => toggleSelection(schedule.id)}
                        />
                      </div>

                      {/* Barre latérale colorée */}
                      <div
                        className={`w-2 ${
                          schedule.is_published
                            ? 'bg-gradient-to-b from-green-400 to-green-600'
                            : 'bg-gradient-to-b from-gray-300 to-gray-500'
                        }`}
                      />

                      {/* Contenu principal */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Titre et badges */}
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-900 truncate">
                                {schedule.name}
                              </h3>
                              <Badge
                                className={`${
                                  schedule.is_published
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                } font-medium`}
                              >
                                {schedule.is_published ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Publié
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Brouillon
                                  </>
                                )}
                              </Badge>
                              {schedule.conflicts_count && schedule.conflicts_count > 0 && (
                                <Badge className="bg-red-100 text-red-800 border-red-300 font-medium animate-pulse">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {schedule.conflicts_count} conflit
                                  {schedule.conflicts_count > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>

                            {/* Grille d'informations */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Filière
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {schedule.curriculum_details?.name || 'Non spécifiée'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Période
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {schedule.academic_period_details?.name || 'Non spécifiée'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Sessions
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {schedule.sessions_count || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Version
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  v{schedule.version}
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            {schedule.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {schedule.description}
                              </p>
                            )}

                            {/* Métadonnées */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                Par {schedule.created_by_name || 'Inconnu'}
                              </span>
                              <span>•</span>
                              <span>
                                Modifié le{' '}
                                {new Date(schedule.updated_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              {schedule.published_at && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Publié le{' '}
                                    {new Date(schedule.published_at).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(schedule)}
                              className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
                              title="Voir l'emploi du temps"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(schedule)}
                              className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateAdvanced(schedule)}
                              disabled={isGenerating}
                              className="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all"
                              title="Génération Avancée"
                            >
                              <Sparkles className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublish(schedule)}
                              className={
                                schedule.is_published
                                  ? 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300'
                                  : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                              }
                              title={schedule.is_published ? 'Dépublier' : 'Publier'}
                            >
                              {schedule.is_published ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(schedule)}
                              className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modal d'édition */}
      <ScheduleEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveEdit}
        schedule={editingSchedule}
        academicPeriods={academicPeriods}
      />

      {/* Modal d'impression */}
      <PrintScheduleModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        schedules={schedules}
        academicPeriods={academicPeriods}
      />

      {/* Modal des blocages de génération */}
      {generationResult && (
        <GenerationBlockagesModal
          isOpen={showBlockagesModal}
          onClose={() => setShowBlockagesModal(false)}
          blockages={generationResult.blockages || []}
          generalSuggestions={generationResult.suggestions || []}
          stats={generationResult.stats}
        />
      )}
    </div>
  );
}
