import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { classRoomPreferenceService, type ClassRoomPreference, type AvailableRoom } from '@/lib/api/services/classRoomPreferences';

interface ClassRoomPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  className: string;
  onSave?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Obligatoire', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 2, label: 'Préférée', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 3, label: 'Acceptable', color: 'bg-green-100 text-green-800 border-green-300' },
] as const;

export default function ClassRoomPreferencesModal({
  isOpen,
  onClose,
  classId,
  className,
  onSave,
}: ClassRoomPreferencesModalProps) {
  const [preferences, setPreferences] = useState<ClassRoomPreference[]>([]);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire d'ajout
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<1 | 2 | 3>(2);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
      loadAvailableRooms();
    }
  }, [isOpen, classId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await classRoomPreferenceService.getByClass(classId);
      setPreferences(data.preferences);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des préférences');
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRooms = async () => {
    try {
      const data = await classRoomPreferenceService.getAvailableRooms(classId);
      setAvailableRooms(data.rooms);
    } catch (err: any) {
      console.error('Error loading available rooms:', err);
    }
  };

  const handleAdd = async () => {
    if (!selectedRoom) {
      setError('Veuillez sélectionner une salle');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await classRoomPreferenceService.create({
        student_class: classId,
        room: selectedRoom,
        priority: selectedPriority,
        notes: notes.trim() || undefined,
      });

      // Réinitialiser le formulaire
      setSelectedRoom(null);
      setSelectedPriority(2);
      setNotes('');

      // Recharger les données
      await loadPreferences();
      await loadAvailableRooms();

      if (onSave) onSave();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout de la préférence');
      console.error('Error adding preference:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette préférence ?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await classRoomPreferenceService.delete(id);

      // Recharger les données
      await loadPreferences();
      await loadAvailableRooms();

      if (onSave) onSave();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la préférence');
      console.error('Error deleting preference:', err);
    } finally {
      setSaving(false);
    }
  };

  const getPriorityStyle = (priority: 1 | 2 | 3) => {
    return PRIORITY_OPTIONS.find(opt => opt.value === priority)?.color || '';
  };

  const groupedPreferences = {
    obligatoire: preferences.filter(p => p.priority === 1),
    preferee: preferences.filter(p => p.priority === 2),
    acceptable: preferences.filter(p => p.priority === 3),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Préférences de salle</h2>
            <p className="text-sm text-gray-600 mt-1">{className}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulaire d'ajout */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Ajouter une préférence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salle
                </label>
                <select
                  value={selectedRoom || ''}
                  onChange={(e) => setSelectedRoom(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving}
                >
                  <option value="">Sélectionner une salle</option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.code} - {room.name} (Cap: {room.capacity})
                      {room.building && ` - ${room.building}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving}
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Raisons de cette préférence..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  disabled={saving}
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={!selectedRoom || saving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>

          {/* Liste des préférences */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Obligatoires */}
              {groupedPreferences.obligatoire.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    Salles Obligatoires ({groupedPreferences.obligatoire.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedPreferences.obligatoire.map(pref => (
                      <PreferenceCard
                        key={pref.id}
                        preference={pref}
                        onDelete={handleDelete}
                        disabled={saving}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Préférées */}
              {groupedPreferences.preferee.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Salles Préférées ({groupedPreferences.preferee.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedPreferences.preferee.map(pref => (
                      <PreferenceCard
                        key={pref.id}
                        preference={pref}
                        onDelete={handleDelete}
                        disabled={saving}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Acceptables */}
              {groupedPreferences.acceptable.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Salles Acceptables ({groupedPreferences.acceptable.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedPreferences.acceptable.map(pref => (
                      <PreferenceCard
                        key={pref.id}
                        preference={pref}
                        onDelete={handleDelete}
                        disabled={saving}
                      />
                    ))}
                  </div>
                </div>
              )}

              {preferences.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucune préférence de salle définie
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

interface PreferenceCardProps {
  preference: ClassRoomPreference;
  onDelete: (id: number) => void;
  disabled: boolean;
}

function PreferenceCard({ preference, onDelete, disabled }: PreferenceCardProps) {
  const getPriorityColor = (priority: 1 | 2 | 3) => {
    switch (priority) {
      case 1: return 'border-red-300 bg-red-50';
      case 2: return 'border-blue-300 bg-blue-50';
      case 3: return 'border-green-300 bg-green-50';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getPriorityColor(preference.priority)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900">
              {preference.room_details.code} - {preference.room_details.name}
            </h4>
            <span className="text-sm text-gray-600">
              Capacité: {preference.room_details.capacity}
            </span>
          </div>

          {preference.room_details.building && (
            <p className="text-sm text-gray-600 mt-1">
              Bâtiment: {preference.room_details.building} ({preference.room_details.building_code})
            </p>
          )}

          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            {preference.room_details.has_computer && <span>💻 Ordinateurs</span>}
            {preference.room_details.has_projector && <span>📽️ Projecteur</span>}
            {preference.room_details.is_laboratory && <span>🔬 Laboratoire</span>}
          </div>

          {preference.notes && (
            <p className="text-sm text-gray-700 mt-2 italic">
              {preference.notes}
            </p>
          )}
        </div>

        <button
          onClick={() => onDelete(preference.id)}
          disabled={disabled}
          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
