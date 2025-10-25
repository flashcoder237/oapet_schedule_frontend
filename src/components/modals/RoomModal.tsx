'use client';

import React, { useState, useEffect } from 'react';
import { X, Building, MapPin, Users, Monitor, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { Room } from '@/types/api';
import { roomService, Building as BuildingType, RoomType } from '@/services/roomService';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room | null;
  onSave: (roomData: any) => Promise<void>;
}

export default function RoomModal({
  isOpen,
  onClose,
  room,
  onSave
}: RoomModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    building: '',
    floor: 'RDC',
    capacity: 30,
    room_type: '',
    has_projector: false,
    has_computer: false,
    has_audio_system: false,
    has_whiteboard: true,
    has_blackboard: false,
    has_air_conditioning: false,
    has_internet: false,
    is_laboratory: false,
    laboratory_type: '',
    is_accessible: true,
    has_emergency_exit: true,
    is_bookable: true,
    priority_level: 1,
    description: '',
    is_active: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { addToast } = useToast();
  const isEditing = !!room;

  // Charger les bâtiments et types de salles
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const [buildingsData, roomTypesData] = await Promise.all([
          roomService.getBuildings(),
          roomService.getRoomTypes(),
        ]);
        setBuildings(buildingsData);
        setRoomTypes(roomTypesData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        addToast({
          title: "Erreur",
          description: "Impossible de charger les bâtiments et types de salles",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, addToast]);

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        code: room.code || '',
        building: room.building?.toString() || '',
        floor: room.floor || 'RDC',
        capacity: Number(room.capacity) || 30,
        room_type: room.room_type?.toString() || '',
        has_projector: room.has_projector || false,
        has_computer: room.has_computer || false,
        has_audio_system: room.has_audio_system || false,
        has_whiteboard: room.has_whiteboard || false,
        has_blackboard: room.has_blackboard || false,
        has_air_conditioning: room.has_air_conditioning || false,
        has_internet: room.has_internet || false,
        is_laboratory: room.is_laboratory || false,
        laboratory_type: room.laboratory_type || '',
        is_accessible: room.is_accessible !== false,
        has_emergency_exit: room.has_emergency_exit !== false,
        is_bookable: room.is_bookable !== false,
        priority_level: room.priority_level || 1,
        description: room.description || '',
        is_active: room.is_active !== false
      });
    } else {
      // Reset form for new room
      setFormData({
        name: '',
        code: '',
        building: '',
        floor: 'RDC',
        capacity: 30,
        room_type: roomTypes.length > 0 ? roomTypes[0].id.toString() : '',
        has_projector: false,
        has_computer: false,
        has_audio_system: false,
        has_whiteboard: true,
        has_blackboard: false,
        has_air_conditioning: false,
        has_internet: false,
        is_laboratory: false,
        laboratory_type: '',
        is_accessible: true,
        has_emergency_exit: true,
        is_bookable: true,
        priority_level: 1,
        description: '',
        is_active: true
      });
    }
    setErrors({});
  }, [room, isOpen, roomTypes]);

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Le nom de la salle est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code de la salle est requis';
    if (!formData.room_type) newErrors.room_type = 'Le type de salle est requis';
    if (formData.capacity < 1) newErrors.capacity = 'La capacité doit être supérieure à 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Préparer les données pour l'API
      const dataToSave = {
        ...formData,
        building: formData.building ? parseInt(formData.building) : null,
        room_type: parseInt(formData.room_type),
      };

      await onSave(dataToSave);

      addToast({
        title: "Succès",
        description: `Salle ${isEditing ? 'mise à jour' : 'créée'} avec succès`,
      });

      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        title: "Erreur",
        description: error.message || `Impossible de ${isEditing ? 'mettre à jour' : 'créer'} la salle`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Modifier la salle' : 'Nouvelle salle'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditing ? 'Modifiez les informations de la salle' : 'Créez une nouvelle salle de cours'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Loading state */}
          {isLoadingData && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Chargement des données...</span>
            </div>
          )}

          {/* Form */}
          {!isLoadingData && (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la salle *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Salle A101"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code de la salle *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="A101"
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </div>

              {/* Building */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bâtiment
                </label>
                <select
                  value={formData.building}
                  onChange={(e) => handleChange('building', e.target.value)}
                  disabled={isLoadingData}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.building ? 'border-red-500' : 'border-gray-300'
                  } ${isLoadingData ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Salle isolée (pas de bâtiment)</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.code} - {building.name}
                    </option>
                  ))}
                </select>
                {errors.building && (
                  <p className="text-red-500 text-sm mt-1">{errors.building}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Laisser vide pour les amphithéâtres ou structures isolées
                </p>
              </div>

              {/* Floor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Étage *
                </label>
                <select
                  value={formData.floor}
                  onChange={(e) => handleChange('floor', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.floor ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="RDC">Rez-de-chaussée</option>
                  <option value="1">1er étage</option>
                  <option value="2">2ème étage</option>
                  <option value="3">3ème étage</option>
                  <option value="4">4ème étage</option>
                  <option value="5">5ème étage</option>
                </select>
                {errors.floor && (
                  <p className="text-red-500 text-sm mt-1">{errors.floor}</p>
                )}
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacité *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 30)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.capacity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.capacity && (
                  <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
                )}
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de salle *
                </label>
                <select
                  value={formData.room_type}
                  onChange={(e) => handleChange('room_type', e.target.value)}
                  disabled={isLoadingData}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.room_type ? 'border-red-500' : 'border-gray-300'
                  } ${isLoadingData ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Sélectionner un type</option>
                  {roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.room_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.room_type}</p>
                )}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Équipements</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_projector"
                    checked={formData.has_projector}
                    onChange={(e) => handleChange('has_projector', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="has_projector" className="text-sm font-medium text-gray-700">
                    Projecteur
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_computer"
                    checked={formData.has_computer}
                    onChange={(e) => handleChange('has_computer', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="has_computer" className="text-sm font-medium text-gray-700">
                    Ordinateur
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_audio_system"
                    checked={formData.has_audio_system}
                    onChange={(e) => handleChange('has_audio_system', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="has_audio_system" className="text-sm font-medium text-gray-700">
                    Système audio
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_whiteboard"
                    checked={formData.has_whiteboard}
                    onChange={(e) => handleChange('has_whiteboard', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="has_whiteboard" className="text-sm font-medium text-gray-700">
                    Tableau blanc
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_blackboard"
                    checked={formData.has_blackboard}
                    onChange={(e) => handleChange('has_blackboard', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="has_blackboard" className="text-sm font-medium text-gray-700">
                    Tableau noir
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_air_conditioning"
                    checked={formData.has_air_conditioning}
                    onChange={(e) => handleChange('has_air_conditioning', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="has_air_conditioning" className="text-sm font-medium text-gray-700">
                    Climatisation
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_internet"
                    checked={formData.has_internet}
                    onChange={(e) => handleChange('has_internet', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="has_internet" className="text-sm font-medium text-gray-700">
                    Internet
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_accessible"
                    checked={formData.is_accessible}
                    onChange={(e) => handleChange('is_accessible', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_accessible" className="text-sm font-medium text-gray-700">
                    Accessible PMR
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_emergency_exit"
                    checked={formData.has_emergency_exit}
                    onChange={(e) => handleChange('has_emergency_exit', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="has_emergency_exit" className="text-sm font-medium text-gray-700">
                    Sortie de secours
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_bookable"
                    checked={formData.is_bookable}
                    onChange={(e) => handleChange('is_bookable', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_bookable" className="text-sm font-medium text-gray-700">
                    Réservable
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_laboratory"
                    checked={formData.is_laboratory}
                    onChange={(e) => handleChange('is_laboratory', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_laboratory" className="text-sm font-medium text-gray-700">
                    Laboratoire
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Salle active
                  </label>
                </div>
              </div>
            </div>

            {/* Laboratory Type (if laboratory) */}
            {formData.is_laboratory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de laboratoire
                </label>
                <input
                  type="text"
                  value={formData.laboratory_type}
                  onChange={(e) => handleChange('laboratory_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Ex: Chimie, Physique, Informatique..."
                />
              </div>
            )}

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau de priorité
              </label>
              <select
                value={formData.priority_level}
                onChange={(e) => handleChange('priority_level', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="1">1 - Normale</option>
                <option value="2">2 - Moyenne</option>
                <option value="3">3 - Haute</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Priorité pour l'attribution automatique des salles
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Description de la salle (optionnel)"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Mettre à jour' : 'Créer la salle'}
              </Button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}