'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActions, CommonBulkActions } from '@/components/ui/BulkActions';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';

interface AcademicPeriod {
  id: number;
  name: string;
  academic_year: string;
  semester: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export default function AcademicPeriodsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    academic_year: '',
    semester: 'S1',
    start_date: '',
    end_date: '',
    is_current: false
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ results: AcademicPeriod[] }>('/academic_periods/');
      setPeriods(response.results || []);
    } catch (error) {
      console.error('Error loading periods:', error);
      addToast({
        title: 'Erreur',
        description: 'Impossible de charger les périodes académiques',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPeriod) {
        await apiClient.patch(`/academic_periods/${editingPeriod.id}/`, formData);
        addToast({
          title: 'Succès',
          description: 'Période académique modifiée avec succès'
        });
      } else {
        await apiClient.post('/academic_periods/', formData);
        addToast({
          title: 'Succès',
          description: 'Période académique créée avec succès'
        });
      }

      loadPeriods();
      resetForm();
    } catch (error: any) {
      addToast({
        title: 'Erreur',
        description: error.response?.data?.detail || 'Une erreur est survenue',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (period: AcademicPeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      academic_year: period.academic_year,
      semester: period.semester,
      start_date: period.start_date,
      end_date: period.end_date,
      is_current: period.is_current
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette période ?')) return;

    try {
      await apiClient.delete(`/academic_periods/${id}/`);
      addToast({
        title: 'Succès',
        description: 'Période académique supprimée'
      });
      loadPeriods();
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Impossible de supprimer cette période',
        variant: 'destructive'
      });
    }
  };

  const setCurrentPeriod = async (id: number) => {
    try {
      await apiClient.post(`/academic_periods/${id}/set_current/`);
      addToast({
        title: 'Succès',
        description: 'Période académique définie comme actuelle'
      });
      loadPeriods();
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Impossible de définir la période comme actuelle',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      academic_year: '',
      semester: 'S1',
      start_date: '',
      end_date: '',
      is_current: false
    });
    setEditingPeriod(null);
    setShowForm(false);
  };

  // Actions groupées
  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === periods.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(periods.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selectedIds.size} période(s) ?`)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          apiClient.delete(`/academic_periods/${id}/`)
        )
      );
      addToast({
        title: 'Succès',
        description: `${selectedIds.size} période(s) supprimée(s)`
      });
      setSelectedIds(new Set());
      loadPeriods();
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression',
        variant: 'destructive'
      });
    }
  };

  const bulkActions = [
    CommonBulkActions.delete(handleBulkDelete, selectedIds.size),
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Bouton Retour */}
      <Button
        variant="ghost"
        onClick={() => router.push('/settings')}
        className="mb-6 hover:bg-primary/10"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux paramètres
      </Button>

      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-blue-600" />
              Périodes Académiques
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les semestres, années et dates des périodes académiques
            </p>
          </div>

          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Période
            </Button>
          )}
        </div>
      </motion.div>

      {/* Formulaire */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingPeriod ? 'Modifier' : 'Nouvelle'} Période Académique</span>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom de la période</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Semestre 1 2024-2025"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Année académique</label>
                    <Input
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      placeholder="Ex: 2024-2025"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Semestre</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="S1">Semestre 1</option>
                      <option value="S2">Semestre 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date de début
                    </label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date de fin
                    </label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_current"
                      checked={formData.is_current}
                      onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_current" className="text-sm font-medium">
                      Définir comme période actuelle
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingPeriod ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions groupées */}
      {selectedIds.size > 0 && (
        <BulkActions
          selectedCount={selectedIds.size}
          actions={bulkActions}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Liste des périodes */}
      <div className="space-y-4">
        {periods.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune période académique configurée</p>
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer la première période
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {periods.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <Checkbox
                  checked={selectedIds.size === periods.length && periods.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium text-gray-700">
                  {selectedIds.size === periods.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </span>
              </div>
            )}
            {periods.map((period, index) => (
              <motion.div
                key={period.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={period.is_current ? 'border-2 border-blue-500' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedIds.has(period.id)}
                        onCheckedChange={() => toggleSelection(period.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{period.name}</h3>
                          {period.is_current && (
                            <Badge className="bg-blue-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actuelle
                            </Badge>
                          )}
                          <Badge variant="outline">{period.semester}</Badge>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(period.start_date).toLocaleDateString('fr-FR')}</span>
                            <span>→</span>
                            <span>{new Date(period.end_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4" />
                            <span>{period.academic_year}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!period.is_current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPeriod(period.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activer
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(period)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(period.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </>
        )}
      </div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">À propos des périodes académiques</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Une seule période peut être active à la fois</li>
                  <li>La période actuelle est utilisée pour la génération des emplois du temps</li>
                  <li>Les dates définissent la plage de planification des cours</li>
                  <li>Le format de l'année académique est libre (ex: 2024-2025, 2024, etc.)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
