'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { teacherService } from '@/lib/api/services/teachers';
import { useAuth } from '@/lib/auth/context';

interface TeacherPreference {
  id: number;
  teacher: number;
  preference_type: string;
  preference_type_display: string;
  priority: string;
  priority_display: string;
  preference_data: any;
  is_active: boolean;
  reason: string;
  created_at: string;
}

interface TeacherUnavailability {
  id: number;
  teacher: number;
  unavailability_type: string;
  unavailability_type_display: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  start_date?: string;
  end_date?: string;
  reason: string;
  is_approved: boolean;
  approved_by?: number;
  created_at: string;
}

interface TeacherProfile {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  department: {
    name: string;
  };
}

export default function TeacherPreferencesPage() {
  const [preferences, setPreferences] = useState<TeacherPreference[]>([]);
  const [unavailabilities, setUnavailabilities] = useState<TeacherUnavailability[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile | null>(null);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPreference, setShowAddPreference] = useState(false);
  const [showAddUnavailability, setShowAddUnavailability] = useState(false);

  const { user, isTeacher, canManageSchedules } = useAuth();
  const isAdmin = canManageSchedules();

  // États du formulaire de préférence
  const [prefType, setPrefType] = useState('time_slot');
  const [prefPriority, setPrefPriority] = useState('medium');
  const [prefReason, setPrefReason] = useState('');
  const [prefData, setPrefData] = useState({
    day: 'monday',
    start_time: '08:00',
    end_time: '10:00',
    max_hours: 6,
    max_consecutive_days: 3,
    room_id: ''
  });

  // États du formulaire d'indisponibilité
  const [unavailType, setUnavailType] = useState('recurring');
  const [unavailReason, setUnavailReason] = useState('');
  const [unavailData, setUnavailData] = useState({
    day_of_week: 'monday',
    start_time: '14:00',
    end_time: '18:00',
    start_date: '',
    end_date: ''
  });

  const { addToast } = useToast();

  const days = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' },
    { value: 'saturday', label: 'Samedi' },
    { value: 'sunday', label: 'Dimanche' }
  ];

  // Chargement initial : récupérer la liste des enseignants
  useEffect(() => {
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Définir selectedTeacherId quand user est chargé
  useEffect(() => {
    if (!selectedTeacherId && allTeachers.length > 0) {
      const userIsTeacher = isTeacher();
      const userTeacherId = user?.teacher_id;
      const userIsAdmin = canManageSchedules();

      console.log('🔍 Auto-sélection enseignant:');
      console.log('  - userIsTeacher:', userIsTeacher);
      console.log('  - userTeacherId:', userTeacherId);
      console.log('  - userIsAdmin:', userIsAdmin);

      if (userIsTeacher && userTeacherId) {
        console.log('✅ Sélection teacher_id:', userTeacherId);
        setSelectedTeacherId(userTeacherId);
      } else if (userIsAdmin && allTeachers.length > 0) {
        console.log('✅ Admin - Sélection premier enseignant:', allTeachers[0].id);
        setSelectedTeacherId(allTeachers[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allTeachers]);

  // Charger les préférences quand un enseignant est sélectionné
  useEffect(() => {
    if (selectedTeacherId) {
      loadPreferencesForTeacher(selectedTeacherId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeacherId]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const teacherData = await teacherService.getTeachers();
      console.log('📚 Enseignants chargés:', teacherData.length);
      setAllTeachers(teacherData);
    } catch (error) {
      console.error('Erreur chargement enseignants:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de charger les enseignants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPreferencesForTeacher = async (teacherId: number) => {
    try {
      // Trouver l'enseignant sélectionné
      const teacher = allTeachers.find(t => t.id === teacherId);
      if (teacher) {
        const teacherProfile: TeacherProfile = {
          id: teacher.id,
          user: {
            first_name: teacher.user_details?.first_name || '',
            last_name: teacher.user_details?.last_name || '',
            email: teacher.user_details?.email || ''
          },
          department: {
            name: teacher.department_name || 'Non défini'
          }
        };
        setCurrentTeacher(teacherProfile);
      }

      // Charger les préférences
      const prefs = await apiClient.get<any>(
        `/courses/teacher-preferences/?teacher=${teacherId}`
      );
      setPreferences(prefs?.results || prefs || []);

      // Charger les indisponibilités
      const unavails = await apiClient.get<any>(
        `/courses/teacher-unavailabilities/?teacher=${teacherId}`
      );
      setUnavailabilities(unavails?.results || unavails || []);
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de charger les données de l'enseignant",
        variant: "destructive"
      });
    }
  };

  const handleAddPreference = async () => {
    console.log('🔵 handleAddPreference appelée');
    console.log('  - selectedTeacherId:', selectedTeacherId);
    console.log('  - prefType:', prefType);
    console.log('  - prefPriority:', prefPriority);

    if (!selectedTeacherId) {
      console.error('❌ Pas de selectedTeacherId, arrêt');
      addToast({
        title: "Erreur",
        description: "Impossible d'identifier l'enseignant",
        variant: "destructive"
      });
      return;
    }

    try {
      let preferenceData = {};

      switch (prefType) {
        case 'time_slot':
        case 'avoid_time':
          preferenceData = {
            day: prefData.day,
            start_time: prefData.start_time,
            end_time: prefData.end_time
          };
          break;
        case 'day':
          preferenceData = { day: prefData.day };
          break;
        case 'max_hours_per_day':
          preferenceData = { max_hours: prefData.max_hours };
          break;
        case 'consecutive_days':
          preferenceData = { max_consecutive_days: prefData.max_consecutive_days };
          break;
        case 'room':
          preferenceData = { room_id: prefData.room_id };
          break;
      }

      const newPreference = await apiClient.post<TeacherPreference>('/courses/teacher-preferences/', {
        teacher: selectedTeacherId,
        preference_type: prefType,
        priority: prefPriority,
        preference_data: preferenceData,
        reason: prefReason,
        is_active: true
      });

      // Mise à jour optimiste - ajouter immédiatement à l'état local
      setPreferences(prev => [...prev, newPreference]);

      addToast({
        title: "Préférence ajoutée",
        description: "Votre préférence a été enregistrée avec succès"
      });

      setShowAddPreference(false);
      setPrefReason('');
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible d'ajouter la préférence",
        variant: "destructive"
      });
    }
  };

  const handleAddUnavailability = async () => {
    console.log('🟠 handleAddUnavailability appelée');
    console.log('  - selectedTeacherId:', selectedTeacherId);
    console.log('  - unavailType:', unavailType);
    console.log('  - unavailReason:', unavailReason);

    if (!selectedTeacherId) {
      console.error('❌ Pas de selectedTeacherId, arrêt');
      addToast({
        title: "Erreur",
        description: "Impossible d'identifier l'enseignant",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload: any = {
        teacher: selectedTeacherId,
        unavailability_type: unavailType,
        reason: unavailReason
      };

      if (unavailType === 'recurring') {
        payload.day_of_week = unavailData.day_of_week;
        payload.start_time = unavailData.start_time;
        payload.end_time = unavailData.end_time;
      } else if (unavailType === 'temporary') {
        payload.start_date = unavailData.start_date;
        payload.end_date = unavailData.end_date;
      }

      const newUnavailability = await apiClient.post<TeacherUnavailability>('/courses/teacher-unavailabilities/', payload);

      // Mise à jour optimiste - ajouter immédiatement à l'état local
      setUnavailabilities(prev => [...prev, newUnavailability]);

      addToast({
        title: "Indisponibilité déclarée",
        description: "Votre indisponibilité a été enregistrée et est en attente d'approbation"
      });

      setShowAddUnavailability(false);
      setUnavailReason('');
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible d'ajouter l'indisponibilité",
        variant: "destructive"
      });
    }
  };

  const handleDeletePreference = async (id: number) => {
    try {
      await apiClient.delete(`/courses/teacher-preferences/${id}/`);

      // Mise à jour optimiste - retirer immédiatement de l'état local
      setPreferences(prev => prev.filter(p => p.id !== id));

      addToast({
        title: "Préférence supprimée",
        description: "La préférence a été supprimée"
      });
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer la préférence",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUnavailability = async (id: number) => {
    try {
      await apiClient.delete(`/courses/teacher-unavailabilities/${id}/`);

      // Mise à jour optimiste - retirer immédiatement de l'état local
      setUnavailabilities(prev => prev.filter(u => u.id !== id));

      addToast({
        title: "Indisponibilité supprimée",
        description: "L'indisponibilité a été supprimée"
      });
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer l'indisponibilité",
        variant: "destructive"
      });
    }
  };

  const handleTogglePreference = async (id: number, isActive: boolean) => {
    try {
      await apiClient.post(`/courses/teacher-preferences/${id}/toggle_active/`);

      // Mise à jour optimiste - modifier immédiatement l'état local
      setPreferences(prev => prev.map(p =>
        p.id === id ? { ...p, is_active: !isActive } : p
      ));

      addToast({
        title: isActive ? "Préférence désactivée" : "Préférence activée",
        description: "Le statut a été modifié"
      });
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'required': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'Gestion des Préférences Enseignants' : 'Mes Préférences d\'Enseignement'}
            </h1>
            {currentTeacher && (
              <p className="text-muted-foreground mt-1">
                {currentTeacher.user.first_name} {currentTeacher.user.last_name} • {currentTeacher.department.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Sélecteur d'enseignant pour admin */}
        {isAdmin && allTeachers.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium whitespace-nowrap">
                  Sélectionner un enseignant :
                </label>
                <Select
                  value={selectedTeacherId?.toString() || ''}
                  onValueChange={(value) => setSelectedTeacherId(parseInt(value))}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Choisir un enseignant" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTeachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.user_details?.first_name} {teacher.user_details?.last_name} - {teacher.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Préférences actives</p>
                  <p className="text-2xl font-bold mt-1">
                    {preferences.filter(p => p.is_active).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Indisponibilités</p>
                  <p className="text-2xl font-bold mt-1">{unavailabilities.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente d'approbation</p>
                  <p className="text-2xl font-bold mt-1">
                    {unavailabilities.filter(u => !u.is_approved).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Préférences */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {isAdmin ? 'Préférences' : 'Mes Préférences'}
                </CardTitle>
                <Button
                  onClick={() => setShowAddPreference(true)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {preferences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune préférence définie</p>
                  <p className="text-sm mt-1">Ajoutez vos préférences pour optimiser votre emploi du temps</p>
                </div>
              ) : (
                preferences.map((pref) => (
                  <motion.div
                    key={pref.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${!pref.is_active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{pref.preference_type_display}</span>
                          <Badge className={getPriorityColor(pref.priority)}>
                            {pref.priority_display}
                          </Badge>
                          {!pref.is_active && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {pref.preference_data.day && (
                            <p>Jour: {pref.preference_data.day}</p>
                          )}
                          {pref.preference_data.start_time && (
                            <p>Horaire: {pref.preference_data.start_time} - {pref.preference_data.end_time}</p>
                          )}
                          {pref.preference_data.max_hours && (
                            <p>Max heures/jour: {pref.preference_data.max_hours}h</p>
                          )}
                          {pref.preference_data.max_consecutive_days && (
                            <p>Max jours consécutifs: {pref.preference_data.max_consecutive_days}</p>
                          )}
                          {pref.reason && (
                            <p className="italic mt-2">"{pref.reason}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePreference(pref.id, pref.is_active)}
                        >
                          {pref.is_active ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePreference(pref.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Indisponibilités */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {isAdmin ? 'Indisponibilités' : 'Mes Indisponibilités'}
                </CardTitle>
                <Button
                  onClick={() => setShowAddUnavailability(true)}
                  size="sm"
                  className="bg-gradient-to-r from-amber-600 to-red-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Déclarer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {unavailabilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune indisponibilité déclarée</p>
                  <p className="text-sm mt-1">Déclarez vos indisponibilités pour éviter les conflits</p>
                </div>
              ) : (
                unavailabilities.map((unavail) => (
                  <motion.div
                    key={unavail.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{unavail.unavailability_type_display}</span>
                          {unavail.is_approved ? (
                            <Badge className="bg-green-100 text-green-800">Approuvée</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">En attente</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {unavail.day_of_week && (
                            <p>Jour: {unavail.day_of_week}</p>
                          )}
                          {unavail.start_time && unavail.end_time && (
                            <p>Horaire: {unavail.start_time} - {unavail.end_time}</p>
                          )}
                          {unavail.start_date && unavail.end_date && (
                            <p>Période: {unavail.start_date} au {unavail.end_date}</p>
                          )}
                          {unavail.reason && (
                            <p className="italic mt-2">"{unavail.reason}"</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUnavailability(unavail.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal Ajouter Préférence */}
        {showAddPreference && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Ajouter une Préférence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type de préférence</label>
                    <Select value={prefType} onValueChange={setPrefType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time_slot">Créneau horaire préféré</SelectItem>
                        <SelectItem value="day">Jour préféré</SelectItem>
                        <SelectItem value="avoid_time">Créneaux à éviter</SelectItem>
                        <SelectItem value="max_hours_per_day">Max heures par jour</SelectItem>
                        <SelectItem value="consecutive_days">Jours consécutifs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Priorité</label>
                    <Select value={prefPriority} onValueChange={setPrefPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">Obligatoire</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="low">Faible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(prefType === 'time_slot' || prefType === 'avoid_time' || prefType === 'day') && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Jour</label>
                      <Select
                        value={prefData.day}
                        onValueChange={(v) => setPrefData({ ...prefData, day: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(prefType === 'time_slot' || prefType === 'avoid_time') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Heure début</label>
                        <Input
                          type="time"
                          value={prefData.start_time}
                          onChange={(e) => setPrefData({ ...prefData, start_time: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Heure fin</label>
                        <Input
                          type="time"
                          value={prefData.end_time}
                          onChange={(e) => setPrefData({ ...prefData, end_time: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {prefType === 'max_hours_per_day' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max heures par jour</label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={prefData.max_hours}
                        onChange={(e) => setPrefData({ ...prefData, max_hours: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  {prefType === 'consecutive_days' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max jours consécutifs</label>
                      <Input
                        type="number"
                        min="1"
                        max="7"
                        value={prefData.max_consecutive_days}
                        onChange={(e) => setPrefData({ ...prefData, max_consecutive_days: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">Raison (optionnel)</label>
                    <Input
                      placeholder="Ex: Préférence personnelle, contrainte familiale..."
                      value={prefReason}
                      onChange={(e) => setPrefReason(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddPreference(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddPreference}>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Modal Ajouter Indisponibilité */}
        {showAddUnavailability && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Déclarer une Indisponibilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type d'indisponibilité</label>
                    <Select value={unavailType} onValueChange={setUnavailType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recurring">Récurrente (chaque semaine)</SelectItem>
                        <SelectItem value="temporary">Temporaire (dates spécifiques)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {unavailType === 'recurring' && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Jour de la semaine</label>
                        <Select
                          value={unavailData.day_of_week}
                          onValueChange={(v) => setUnavailData({ ...unavailData, day_of_week: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map(d => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Heure début</label>
                          <Input
                            type="time"
                            value={unavailData.start_time}
                            onChange={(e) => setUnavailData({ ...unavailData, start_time: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Heure fin</label>
                          <Input
                            type="time"
                            value={unavailData.end_time}
                            onChange={(e) => setUnavailData({ ...unavailData, end_time: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {unavailType === 'temporary' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Date début</label>
                        <Input
                          type="date"
                          value={unavailData.start_date}
                          onChange={(e) => setUnavailData({ ...unavailData, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Date fin</label>
                        <Input
                          type="date"
                          value={unavailData.end_date}
                          onChange={(e) => setUnavailData({ ...unavailData, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">Raison</label>
                    <Input
                      placeholder="Ex: Réunion hebdomadaire, rendez-vous médical..."
                      value={unavailReason}
                      onChange={(e) => setUnavailReason(e.target.value)}
                    />
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Votre indisponibilité sera soumise à l'approbation du responsable
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddUnavailability(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddUnavailability}>
                      <Save className="w-4 h-4 mr-2" />
                      Soumettre
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
