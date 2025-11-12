'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Info, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';

interface CourseTypeConstraint {
  course_type: string;
  label: string;
  preferred_time_start: string;
  preferred_time_end: string;
  preferred_days: number[];
  min_duration_hours: number;
  max_duration_hours: number;
  max_per_day: number;
  requires_predecessor: boolean;
  predecessor_type: string | null;
  delay_after_predecessor_min: number; // jours
  delay_after_predecessor_max: number; // jours
  min_semester_week: number; // Pour TPE
}

const DAY_LABELS = [
  { value: 0, label: 'Lundi' },
  { value: 1, label: 'Mardi' },
  { value: 2, label: 'Mercredi' },
  { value: 3, label: 'Jeudi' },
  { value: 4, label: 'Vendredi' },
  { value: 5, label: 'Samedi' },
  { value: 6, label: 'Dimanche' },
];

const COURSE_TYPES = [
  { value: 'CM', label: 'Cours Magistral (CM)', icon: '📖', color: 'blue' },
  { value: 'TD', label: 'Travaux Dirigés (TD)', icon: '✏️', color: 'green' },
  { value: 'TP', label: 'Travaux Pratiques (TP)', icon: '🔬', color: 'purple' },
  { value: 'TPE', label: 'Travaux Personnels Encadrés (TPE)', icon: '💡', color: 'orange' },
];

export default function PedagogicalConstraintsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [constraints, setConstraints] = useState<Record<string, CourseTypeConstraint>>({
    CM: {
      course_type: 'CM',
      label: 'Cours Magistral',
      preferred_time_start: '08:00',
      preferred_time_end: '12:00',
      preferred_days: [0, 1, 2],
      min_duration_hours: 1.5,
      max_duration_hours: 3.0,
      max_per_day: 2,
      requires_predecessor: false,
      predecessor_type: null,
      delay_after_predecessor_min: 0,
      delay_after_predecessor_max: 0,
      min_semester_week: 1,
    },
    TD: {
      course_type: 'TD',
      label: 'Travaux Dirigés',
      preferred_time_start: '13:00',
      preferred_time_end: '18:00',
      preferred_days: [],
      min_duration_hours: 1.5,
      max_duration_hours: 2.0,
      max_per_day: 3,
      requires_predecessor: true,
      predecessor_type: 'CM',
      delay_after_predecessor_min: 2,
      delay_after_predecessor_max: 3,
      min_semester_week: 1,
    },
    TP: {
      course_type: 'TP',
      label: 'Travaux Pratiques',
      preferred_time_start: '08:00',
      preferred_time_end: '17:00',
      preferred_days: [3, 4],
      min_duration_hours: 2.0,
      max_duration_hours: 4.0,
      max_per_day: 1,
      requires_predecessor: true,
      predecessor_type: 'TD',
      delay_after_predecessor_min: 0,
      delay_after_predecessor_max: 7,
      min_semester_week: 1,
    },
    TPE: {
      course_type: 'TPE',
      label: 'Travaux Personnels Encadrés',
      preferred_time_start: '14:00',
      preferred_time_end: '18:00',
      preferred_days: [3, 4],
      min_duration_hours: 1.5,
      max_duration_hours: 2.0,
      max_per_day: 2,
      requires_predecessor: false,
      predecessor_type: null,
      delay_after_predecessor_min: 0,
      delay_after_predecessor_max: 0,
      min_semester_week: 6,
    },
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConstraints();
  }, []);

  const loadConstraints = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<CourseTypeConstraint[]>('/schedules/schedules/pedagogical-constraints/');

      if (response && Array.isArray(response) && response.length > 0) {
        // Convert array to object keyed by course_type
        const constraintsObject: Record<string, CourseTypeConstraint> = {};

        response.forEach(constraint => {
          const label = COURSE_TYPES.find(ct => ct.value === constraint.course_type)?.label || constraint.course_type;
          constraintsObject[constraint.course_type] = {
            ...constraint,
            label,
          };
        });

        setConstraints(constraintsObject);
      }
    } catch (error: any) {
      console.log('Using default constraints:', error.message);
      // Keep default constraints if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert constraints object to array for API
      const constraintsArray = Object.values(constraints).map(c => {
        const { label, ...rest } = c; // Remove label field
        return rest;
      });

      await apiClient.post('/schedules/schedules/pedagogical-constraints/', constraintsArray);

      addToast({
        title: 'Succès',
        description: 'Les contraintes pédagogiques ont été sauvegardées',
        variant: 'default',
      });
    } catch (error: any) {
      addToast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder les contraintes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConstraint = (courseType: string, field: string, value: any) => {
    setConstraints(prev => ({
      ...prev,
      [courseType]: {
        ...prev[courseType],
        [field]: value,
      },
    }));
  };

  const toggleDay = (courseType: string, day: number) => {
    const current = constraints[courseType].preferred_days;
    const newDays = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();

    updateConstraint(courseType, 'preferred_days', newDays);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contraintes Pédagogiques</h1>
          <p className="text-gray-600 mt-2">
            Configurez les règles de programmation pour chaque type de cours
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Info sur les semestres */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Calendrier Semestriel</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li><strong>Semestre 1 (S1):</strong> Fin septembre → Fin février (mois 9-2)</li>
                <li><strong>Semestre 2 (S2):</strong> Début mars → Août (mois 3-8)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contraintes par type */}
      <div className="grid grid-cols-1 gap-6">
        {COURSE_TYPES.map(courseType => {
          const constraint = constraints[courseType.value];
          if (!constraint) return null;

          return (
            <Card key={courseType.value} className="border-2">
              <CardHeader className={`bg-${courseType.color}-50 border-b-2 border-${courseType.color}-200`}>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">{courseType.icon}</span>
                  <div>
                    <div className="text-xl font-bold">{courseType.label}</div>
                    <div className="text-sm font-normal text-gray-600 mt-1">
                      {courseType.value === 'CM' && 'Fondements théoriques - 40% du volume'}
                      {courseType.value === 'TD' && 'Applications et exercices - 30% du volume'}
                      {courseType.value === 'TP' && 'Manipulations pratiques - 20% du volume'}
                      {courseType.value === 'TPE' && 'Travail autonome - 10% du volume'}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Horaires préférés */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Plages horaires préférées
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Début</label>
                      <Input
                        type="time"
                        value={constraint.preferred_time_start}
                        onChange={(e) => updateConstraint(courseType.value, 'preferred_time_start', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fin</label>
                      <Input
                        type="time"
                        value={constraint.preferred_time_end}
                        onChange={(e) => updateConstraint(courseType.value, 'preferred_time_end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Jours préférés */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Jours préférés
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_LABELS.map(day => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(courseType.value, day.value)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          constraint.preferred_days.includes(day.value)
                            ? `bg-${courseType.color}-500 text-white border-${courseType.color}-600`
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  {constraint.preferred_days.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">Aucune préférence (tous les jours OK)</p>
                  )}
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Durée des séances (heures)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="8"
                        value={constraint.min_duration_hours}
                        onChange={(e) => updateConstraint(courseType.value, 'min_duration_hours', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="8"
                        value={constraint.max_duration_hours}
                        onChange={(e) => updateConstraint(courseType.value, 'max_duration_hours', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Max par jour */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Maximum par jour (pour un même groupe)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={constraint.max_per_day}
                    onChange={(e) => updateConstraint(courseType.value, 'max_per_day', parseInt(e.target.value))}
                  />
                </div>

                {/* Prérequis */}
                {constraint.requires_predecessor && (
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Cours prérequis
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Type de cours prérequis</label>
                        <Input
                          type="text"
                          value={constraint.predecessor_type || ''}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Ce cours doit être programmé après le {constraint.predecessor_type} de la même matière
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Délai minimum (jours après {constraint.predecessor_type})
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            value={constraint.delay_after_predecessor_min}
                            onChange={(e) => updateConstraint(courseType.value, 'delay_after_predecessor_min', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Délai maximum (jours après {constraint.predecessor_type})
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            value={constraint.delay_after_predecessor_max}
                            onChange={(e) => updateConstraint(courseType.value, 'delay_after_predecessor_max', parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      {courseType.value === 'TD' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-xs text-green-800">
                            <strong>Optimal:</strong> {constraint.delay_after_predecessor_min}-{constraint.delay_after_predecessor_max} jours après le CM.<br />
                            Le même jour est acceptable si le TD est l'après-midi et le CM le matin.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TPE - Semaine minimum */}
                {courseType.value === 'TPE' && (
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Programmation dans le semestre</h4>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Semaine minimum dans le semestre (1-16)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="16"
                        value={constraint.min_semester_week}
                        onChange={(e) => updateConstraint(courseType.value, 'min_semester_week', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Le TPE sera programmé à partir de la semaine {constraint.min_semester_week} du semestre
                        (milieu/fin de semestre recommandé: semaine 6+)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Résumé des règles */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Règles Appliquées</h3>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>✓ Ordre pédagogique: CM → TD → TP → TPE</li>
                <li>✓ TD programmés {constraints.TD.delay_after_predecessor_min}-{constraints.TD.delay_after_predecessor_max} jours après CM</li>
                <li>✓ TP privilégiés Jeudi/Vendredi avec créneaux longs (2-4h)</li>
                <li>✓ TPE à partir de la semaine {constraints.TPE.min_semester_week} du semestre</li>
                <li>✓ Maximum {constraints.TD.max_per_day} TD, {constraints.TP.max_per_day} TP par jour</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton sauvegarder en bas */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les contraintes'}
        </Button>
      </div>
    </div>
  );
}
