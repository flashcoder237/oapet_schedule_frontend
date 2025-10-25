'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, Building2, Tag, MapPin, Home
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PageLoading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/use-toast';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddBuildingModal } from '@/components/rooms/AddBuildingModal';
import { AddRoomTypeModal } from '@/components/rooms/AddRoomTypeModal';
import { BulkActions, CommonBulkActions } from '@/components/ui/BulkActions';
import { roomService, Building, RoomType } from '@/services/roomService';
import { useAuth } from '@/hooks/useAuth';
import ProtectedPage from '@/components/auth/ProtectedPage';
import apiClient from '@/lib/api/client';

function BuildingsRoomTypesContent() {
  // États pour les bâtiments
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [searchTermBuildings, setSearchTermBuildings] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [isEditingBuilding, setIsEditingBuilding] = useState(false);

  // États pour les types de salles
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [searchTermRoomTypes, setSearchTermRoomTypes] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [isEditingRoomType, setIsEditingRoomType] = useState(false);

  // États globaux
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('buildings');

  // États de sélection pour les actions groupées
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<Set<number>>(new Set());
  const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<Set<number>>(new Set());

  const { addToast } = useToast();
  const { canManageSchedules } = useAuth();

  // Chargement des données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setIsLoading(true);
      }
      // Invalider le cache pour forcer le rechargement
      apiClient.invalidateCache('/rooms/buildings');
      apiClient.invalidateCache('/rooms/room-types');

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
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      if (!skipLoading) {
        setIsLoading(false);
      }
    }
  };

  // ==================== SÉLECTION ====================

  // Sélection des bâtiments
  const toggleBuildingSelection = (id: number) => {
    const newSelection = new Set(selectedBuildingIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedBuildingIds(newSelection);
  };

  const handleSelectAllBuildings = () => {
    const allIds = new Set(filteredBuildings.map(b => b.id));
    setSelectedBuildingIds(allIds);
  };

  const handleDeselectAllBuildings = () => {
    setSelectedBuildingIds(new Set());
  };

  // Sélection des types de salles
  const toggleRoomTypeSelection = (id: number) => {
    const newSelection = new Set(selectedRoomTypeIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRoomTypeIds(newSelection);
  };

  const handleSelectAllRoomTypes = () => {
    const allIds = new Set(filteredRoomTypes.map(rt => rt.id));
    setSelectedRoomTypeIds(allIds);
  };

  const handleDeselectAllRoomTypes = () => {
    setSelectedRoomTypeIds(new Set());
  };

  // ==================== GESTION DES BÂTIMENTS ====================

  const handleAddBuilding = () => {
    setSelectedBuilding(null);
    setIsEditingBuilding(false);
    setShowBuildingModal(true);
  };

  const handleEditBuilding = (building: Building) => {
    setSelectedBuilding(building);
    setIsEditingBuilding(true);
    setShowBuildingModal(true);
  };

  const handleSaveBuilding = async (data: any) => {
    try {
      if (isEditingBuilding && selectedBuilding) {
        await roomService.updateBuilding(selectedBuilding.id, data);
        addToast({
          title: "Succès",
          description: "Bâtiment modifié avec succès",
        });
      } else {
        await roomService.createBuilding(data);
        addToast({
          title: "Succès",
          description: "Bâtiment créé avec succès",
        });
      }
      await loadData(true);
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  };

  const handleDeleteBuilding = async (buildingId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bâtiment ?')) return;

    try {
      await roomService.deleteBuilding(buildingId);
      addToast({
        title: "Succès",
        description: "Bâtiment supprimé avec succès",
      });
      await loadData(true);
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer le bâtiment (des salles y sont peut-être associées)",
        variant: "destructive",
      });
    }
  };

  // Actions groupées pour les bâtiments
  const handleBulkDeleteBuildings = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedBuildingIds.size} bâtiment(s) ?`)) return;

    try {
      await roomService.bulkDeleteBuildings(Array.from(selectedBuildingIds));
      addToast({
        title: "Succès",
        description: `${selectedBuildingIds.size} bâtiment(s) supprimé(s)`,
      });
      setSelectedBuildingIds(new Set());
      await loadData(true);
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Erreur lors de la suppression groupée",
        variant: "destructive",
      });
    }
  };

  const handleBulkActivateBuildings = async () => {
    try {
      await Promise.all(
        Array.from(selectedBuildingIds).map(id =>
          roomService.updateBuilding(id, { is_active: true })
        )
      );
      addToast({
        title: "Succès",
        description: `${selectedBuildingIds.size} bâtiment(s) activé(s)`,
      });
      setSelectedBuildingIds(new Set());
      await loadData(true);
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Erreur lors de l'activation groupée",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeactivateBuildings = async () => {
    try {
      await Promise.all(
        Array.from(selectedBuildingIds).map(id =>
          roomService.updateBuilding(id, { is_active: false })
        )
      );
      addToast({
        title: "Succès",
        description: `${selectedBuildingIds.size} bâtiment(s) désactivé(s)`,
      });
      setSelectedBuildingIds(new Set());
      await loadData(true);
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Erreur lors de la désactivation groupée",
        variant: "destructive",
      });
    }
  };

  const bulkActionsBuildings = [
    CommonBulkActions.delete(handleBulkDeleteBuildings, selectedBuildingIds.size),
    CommonBulkActions.activate(handleBulkActivateBuildings),
    CommonBulkActions.deactivate(handleBulkDeactivateBuildings),
  ];

  // ==================== GESTION DES TYPES DE SALLES ====================

  const handleAddRoomType = () => {
    setSelectedRoomType(null);
    setIsEditingRoomType(false);
    setShowRoomTypeModal(true);
  };

  const handleEditRoomType = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setIsEditingRoomType(true);
    setShowRoomTypeModal(true);
  };

  const handleSaveRoomType = async (data: any) => {
    try {
      if (isEditingRoomType && selectedRoomType) {
        await roomService.updateRoomType(selectedRoomType.id, data);
        addToast({
          title: "Succès",
          description: "Type de salle modifié avec succès",
        });
      } else {
        await roomService.createRoomType(data);
        addToast({
          title: "Succès",
          description: "Type de salle créé avec succès",
        });
      }
      await loadData(true);
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  };

  const handleDeleteRoomType = async (roomTypeId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type de salle ?')) return;

    try {
      await roomService.deleteRoomType(roomTypeId);
      addToast({
        title: "Succès",
        description: "Type de salle supprimé avec succès",
      });
      await loadData(true);
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer le type (des salles l'utilisent peut-être)",
        variant: "destructive",
      });
    }
  };

  // Actions groupées pour les types de salles
  const handleBulkDeleteRoomTypes = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRoomTypeIds.size} type(s) de salle ?`)) return;

    try {
      await roomService.bulkDeleteRoomTypes(Array.from(selectedRoomTypeIds));
      addToast({
        title: "Succès",
        description: `${selectedRoomTypeIds.size} type(s) de salle supprimé(s)`,
      });
      setSelectedRoomTypeIds(new Set());
      await loadData(true);
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Erreur lors de la suppression groupée",
        variant: "destructive",
      });
    }
  };

  const bulkActionsRoomTypes = [
    CommonBulkActions.delete(handleBulkDeleteRoomTypes, selectedRoomTypeIds.size),
  ];

  // ==================== FILTRAGE ET PAGINATION ====================

  const filteredBuildings = buildings.filter(building =>
    !searchTermBuildings ||
    building.name?.toLowerCase().includes(searchTermBuildings.toLowerCase()) ||
    building.code?.toLowerCase().includes(searchTermBuildings.toLowerCase())
  );

  const filteredRoomTypes = roomTypes.filter(roomType =>
    !searchTermRoomTypes ||
    roomType.name?.toLowerCase().includes(searchTermRoomTypes.toLowerCase())
  );

  // Pagination pour les bâtiments
  const totalPagesBuildings = Math.ceil(filteredBuildings.length / pageSize);
  const startIndexBuildings = (currentPage - 1) * pageSize;
  const endIndexBuildings = startIndexBuildings + pageSize;
  const paginatedBuildings = filteredBuildings.slice(startIndexBuildings, endIndexBuildings);

  // Pagination pour les types de salles
  const totalPagesRoomTypes = Math.ceil(filteredRoomTypes.length / pageSize);
  const startIndexRoomTypes = (currentPage - 1) * pageSize;
  const endIndexRoomTypes = startIndexRoomTypes + pageSize;
  const paginatedRoomTypes = filteredRoomTypes.slice(startIndexRoomTypes, endIndexRoomTypes);

  // Réinitialiser la page lors du changement d'onglet
  useEffect(() => {
    setCurrentPage(1);
    // Réinitialiser les sélections lors du changement d'onglet ou de filtre
    setSelectedBuildingIds(new Set());
    setSelectedRoomTypeIds(new Set());
  }, [activeTab, searchTermBuildings, searchTermRoomTypes]);

  if (isLoading) {
    return <PageLoading message="Chargement..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bâtiments & Types de Salles</h1>
          <p className="text-muted-foreground">
            Gérez les bâtiments et les types de salles du système
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bâtiments</p>
                <p className="text-2xl font-bold">{buildings.length}</p>
                <p className="text-xs text-muted-foreground">
                  {buildings.filter(b => b.is_active).length} actifs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Types de Salles</p>
                <p className="text-2xl font-bold">{roomTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buildings" className="gap-2">
            <Building2 className="w-4 h-4" />
            Bâtiments
          </TabsTrigger>
          <TabsTrigger value="roomtypes" className="gap-2">
            <Tag className="w-4 h-4" />
            Types de Salles
          </TabsTrigger>
        </TabsList>

        {/* ==================== ONGLET BÂTIMENTS ==================== */}
        <TabsContent value="buildings" className="space-y-4">
          {/* Barre de recherche et actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou code..."
                    value={searchTermBuildings}
                    onChange={(e) => setSearchTermBuildings(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {canManageSchedules() && (
                  <Button onClick={handleAddBuilding} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nouveau Bâtiment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions groupées pour les bâtiments */}
          {selectedBuildingIds.size > 0 && canManageSchedules() && (
            <BulkActions
              selectedCount={selectedBuildingIds.size}
              totalCount={filteredBuildings.length}
              onSelectAll={handleSelectAllBuildings}
              onDeselectAll={handleDeselectAllBuildings}
              actions={bulkActionsBuildings}
            />
          )}

          {/* Tableau des bâtiments */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Bâtiments ({filteredBuildings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {canManageSchedules() && (
                        <th className="text-left p-4">
                          <Checkbox
                            checked={selectedBuildingIds.size === filteredBuildings.length && filteredBuildings.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleSelectAllBuildings();
                              } else {
                                handleDeselectAllBuildings();
                              }
                            }}
                          />
                        </th>
                      )}
                      <th className="text-left p-4 font-semibold">Code</th>
                      <th className="text-left p-4 font-semibold">Nom</th>
                      <th className="text-left p-4 font-semibold">Adresse</th>
                      <th className="text-left p-4 font-semibold">Étages</th>
                      <th className="text-left p-4 font-semibold">Salles</th>
                      <th className="text-left p-4 font-semibold">Statut</th>
                      {canManageSchedules() && (
                        <th className="text-right p-4 font-semibold">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBuildings.length === 0 ? (
                      <tr>
                        <td colSpan={canManageSchedules() ? 8 : 7} className="text-center p-8 text-muted-foreground">
                          Aucun bâtiment trouvé
                        </td>
                      </tr>
                    ) : (
                      paginatedBuildings.map((building, index) => (
                        <motion.tr
                          key={building.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          {canManageSchedules() && (
                            <td className="p-4">
                              <Checkbox
                                checked={selectedBuildingIds.has(building.id)}
                                onCheckedChange={() => toggleBuildingSelection(building.id)}
                              />
                            </td>
                          )}
                          <td className="p-4">
                            <span className="font-mono text-sm font-semibold">
                              {building.code}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{building.name}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {building.address || '-'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{building.total_floors || 1}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {building.rooms_count || 0} salles
                            </Badge>
                          </td>
                          <td className="p-4">
                            {building.is_active ? (
                              <Badge className="bg-green-500 text-white">Actif</Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </td>
                          {canManageSchedules() && (
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBuilding(building)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBuilding(building.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {filteredBuildings.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPagesBuildings}
              pageSize={pageSize}
              totalItems={filteredBuildings.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="bâtiments"
            />
          )}
        </TabsContent>

        {/* ==================== ONGLET TYPES DE SALLES ==================== */}
        <TabsContent value="roomtypes" className="space-y-4">
          {/* Barre de recherche et actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom..."
                    value={searchTermRoomTypes}
                    onChange={(e) => setSearchTermRoomTypes(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {canManageSchedules() && (
                  <Button onClick={handleAddRoomType} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nouveau Type
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions groupées pour les types de salles */}
          {selectedRoomTypeIds.size > 0 && canManageSchedules() && (
            <BulkActions
              selectedCount={selectedRoomTypeIds.size}
              totalCount={filteredRoomTypes.length}
              onSelectAll={handleSelectAllRoomTypes}
              onDeselectAll={handleDeselectAllRoomTypes}
              actions={bulkActionsRoomTypes}
            />
          )}

          {/* Tableau des types de salles */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Types de Salles ({filteredRoomTypes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {canManageSchedules() && (
                        <th className="text-left p-4">
                          <Checkbox
                            checked={selectedRoomTypeIds.size === filteredRoomTypes.length && filteredRoomTypes.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleSelectAllRoomTypes();
                              } else {
                                handleDeselectAllRoomTypes();
                              }
                            }}
                          />
                        </th>
                      )}
                      <th className="text-left p-4 font-semibold">Nom</th>
                      <th className="text-left p-4 font-semibold">Description</th>
                      <th className="text-left p-4 font-semibold">Capacité par défaut</th>
                      <th className="text-left p-4 font-semibold">Salles</th>
                      <th className="text-left p-4 font-semibold">Équipement spécial</th>
                      {canManageSchedules() && (
                        <th className="text-right p-4 font-semibold">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRoomTypes.length === 0 ? (
                      <tr>
                        <td colSpan={canManageSchedules() ? 7 : 6} className="text-center p-8 text-muted-foreground">
                          Aucun type de salle trouvé
                        </td>
                      </tr>
                    ) : (
                      paginatedRoomTypes.map((roomType, index) => (
                        <motion.tr
                          key={roomType.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          {canManageSchedules() && (
                            <td className="p-4">
                              <Checkbox
                                checked={selectedRoomTypeIds.has(roomType.id)}
                                onCheckedChange={() => toggleRoomTypeSelection(roomType.id)}
                              />
                            </td>
                          )}
                          <td className="p-4">
                            <div className="font-medium">{roomType.name}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-muted-foreground max-w-md truncate">
                              {roomType.description || '-'}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {roomType.default_capacity || 30} places
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {roomType.rooms_count || 0} salles
                            </Badge>
                          </td>
                          <td className="p-4">
                            {roomType.requires_special_equipment ? (
                              <Badge className="bg-orange-500 text-white">Requis</Badge>
                            ) : (
                              <Badge variant="secondary">Non</Badge>
                            )}
                          </td>
                          {canManageSchedules() && (
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRoomType(roomType)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRoomType(roomType.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {filteredRoomTypes.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPagesRoomTypes}
              pageSize={pageSize}
              totalItems={filteredRoomTypes.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="types"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddBuildingModal
        open={showBuildingModal}
        onOpenChange={setShowBuildingModal}
        onSubmit={handleSaveBuilding}
        initialData={isEditingBuilding ? selectedBuilding : undefined}
        isEditing={isEditingBuilding}
      />

      <AddRoomTypeModal
        open={showRoomTypeModal}
        onOpenChange={setShowRoomTypeModal}
        onSubmit={handleSaveRoomType}
        initialData={isEditingRoomType ? selectedRoomType : undefined}
        isEditing={isEditingRoomType}
      />
    </div>
  );
}

export default function BuildingsRoomTypesPage() {
  return (
    <ProtectedPage requireAdmin>
      <BuildingsRoomTypesContent />
    </ProtectedPage>
  );
}
