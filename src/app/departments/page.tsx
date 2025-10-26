'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, Building, Users, BookOpen, User, Mail, Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PageLoading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/use-toast';
import { Pagination } from '@/components/ui/pagination';
import { BulkActions, CommonBulkActions } from '@/components/ui/BulkActions';
import { ImportExportButtons } from '@/components/ui/ImportExportButtons';
import { departmentService } from '@/lib/api/services/departments';
import { teacherService } from '@/lib/api/services/teachers';
import DepartmentModal from '@/components/modals/DepartmentModal';
import type { Department } from '@/types/api';
import type { CreateDepartmentData, UpdateDepartmentData } from '@/lib/api/services/departments';

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);

  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // États de sélection pour les actions groupées
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { addToast } = useToast();

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Charger les départements et les enseignants
        const [departmentsData, teachersArray] = await Promise.all([
          departmentService.getDepartments({}),
          teacherService.getTeachers()
        ]);

        const departmentsArray = departmentsData.results || departmentsData || [];
        setDepartments(departmentsArray);
        setTeachers(teachersArray);

      } catch (error) {
        console.error('Erreur lors du chargement des départements:', error);
        addToast({
          title: "Erreur",
          description: "Impossible de charger les départements",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [addToast]);

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowDepartmentModal(true);
  };

  const handleSaveDepartment = async (departmentData: CreateDepartmentData | UpdateDepartmentData) => {
    try {
      if (selectedDepartment) {
        await departmentService.updateDepartment(
          selectedDepartment.id!,
          departmentData as UpdateDepartmentData
        );
      } else {
        await departmentService.createDepartment(departmentData as CreateDepartmentData);
      }

      // Recharger les départements depuis le serveur
      const departmentsData = await departmentService.getDepartments({});
      const departmentsArray = departmentsData.results || departmentsData || [];
      setDepartments(departmentsArray);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) return;

    try {
      await departmentService.deleteDepartment(departmentId);

      // Recharger les départements depuis le serveur
      const departmentsData = await departmentService.getDepartments({});
      const departmentsArray = departmentsData.results || departmentsData || [];
      setDepartments(departmentsArray);

      addToast({
        title: "Succès",
        description: "Département supprimé avec succès",
      });
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer le département",
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
    const allIds = new Set(filteredDepartments.map(d => d.id).filter((id): id is number => id !== undefined));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Actions groupées
  const handleBulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} département(s) ?`)) return;

    try {
      await Promise.all(Array.from(selectedIds).map(id => departmentService.deleteDepartment(id)));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} département(s) supprimé(s)`,
      });

      const departmentsData = await departmentService.getDepartments({});
      const departmentsArray = departmentsData.results || departmentsData || [];
      setDepartments(departmentsArray);
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
        departmentService.updateDepartment(id, { is_active: true })
      ));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} département(s) activé(s)`,
      });

      const departmentsData = await departmentService.getDepartments({});
      const departmentsArray = departmentsData.results || departmentsData || [];
      setDepartments(departmentsArray);
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
        departmentService.updateDepartment(id, { is_active: false })
      ));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} département(s) désactivé(s)`,
      });

      const departmentsData = await departmentService.getDepartments({});
      const departmentsArray = departmentsData.results || departmentsData || [];
      setDepartments(departmentsArray);
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

  // Import de départements
  const handleImportDepartments = async (importedData: any[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const data of importedData) {
        try {
          // Valider les données
          if (!data.name || !data.code) {
            errorCount++;
            continue;
          }

          // Convertir head_of_department_id en entier si présent
          const departmentData: CreateDepartmentData = {
            name: data.name,
            code: data.code,
            description: data.description || '',
            head_of_department: data.head_of_department_id ? parseInt(data.head_of_department_id) : undefined,
            is_active: data.is_active === 'true' || data.is_active === '1' || data.is_active === true,
          };

          await departmentService.createDepartment(departmentData);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('Erreur lors de l\'import d\'un département:', error);
        }
      }

      // Recharger la liste
      const departmentsData = await departmentService.getDepartments({});
      const departmentsArray = departmentsData.results || departmentsData || [];
      setDepartments(departmentsArray);

      addToast({
        title: "Import terminé",
        description: `${successCount} départements importés avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      addToast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import",
        variant: "destructive"
      });
    }
  };

  // Définition des champs pour l'import/export
  const departmentTemplateFields = [
    { key: 'id', label: 'ID', example: '1' },
    { key: 'code', label: 'Code', example: 'INFO' },
    { key: 'name', label: 'Nom', example: 'Département Informatique' },
    { key: 'description', label: 'Description', example: 'Département spécialisé en informatique' },
    { key: 'head_of_department_id', label: 'ID Responsable', example: '1' },
    { key: 'is_active', label: 'Actif', example: 'true' },
  ];

  // Préparer les données pour l'export avec les bons champs
  const exportData = departments.map(dept => ({
    id: dept.id || '',
    code: dept.code || '',
    name: dept.name || '',
    description: dept.description || '',
    head_of_department_id: dept.head_of_department || '',
    is_active: dept.is_active ? 'true' : 'false',
  }));

  // Filtrage des départements
  const filteredDepartments = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

  // Réinitialiser à la page 1 si le filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Statistiques
  const totalTeachers = departments.reduce((sum, dept) => sum + (dept.teachers_count || 0), 0);
  const totalCourses = departments.reduce((sum, dept) => sum + (dept.courses_count || 0), 0);
  const activeDepartments = departments.filter(dept => dept.is_active).length;

  if (isLoading) {
    return <PageLoading message="Chargement des départements..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Départements</h1>
          <p className="text-muted-foreground">
            Gérez les départements et leurs responsables
          </p>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons
            data={exportData}
            templateFields={departmentTemplateFields}
            filename="departements"
            onImport={handleImportDepartments}
          />
          <Button onClick={handleAddDepartment} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau Département
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Départements</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Départements Actifs</p>
                <p className="text-2xl font-bold">{activeDepartments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Enseignants</p>
                <p className="text-2xl font-bold">{totalTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cours</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
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
                placeholder="Rechercher par nom, code ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions groupées */}
      {selectedIds.size > 0 && (
        <BulkActions
          selectedCount={selectedIds.size}
          totalCount={filteredDepartments.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          actions={bulkActions}
        />
      )}

      {/* Tableau des départements */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Départements ({filteredDepartments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">
                    <Checkbox
                      checked={selectedIds.size === filteredDepartments.length && filteredDepartments.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleSelectAll();
                        } else {
                          handleDeselectAll();
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-4 font-semibold">Code</th>
                  <th className="text-left p-4 font-semibold">Nom</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                  <th className="text-left p-4 font-semibold">Chef</th>
                  <th className="text-left p-4 font-semibold">Enseignants</th>
                  <th className="text-left p-4 font-semibold">Cours</th>
                  <th className="text-left p-4 font-semibold">Statut</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-muted-foreground">
                      Aucun département trouvé
                    </td>
                  </tr>
                ) : (
                  paginatedDepartments.map((department, index) => (
                    <motion.tr
                      key={department.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={department.id !== undefined && selectedIds.has(department.id)}
                          onCheckedChange={() => department.id && toggleSelection(department.id)}
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm font-semibold">
                          {department.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{department.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {department.description || 'Aucune description'}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {department.head_of_department_name || 'Non assigné'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{department.teachers_count || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{department.courses_count || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {department.is_active ? (
                          <Badge className="bg-green-500 text-white">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDepartment(department)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDepartment(department.id!)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
      {filteredDepartments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredDepartments.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="départements"
        />
      )}

      {/* Modal de création/édition */}
      <DepartmentModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        department={selectedDepartment}
        onSave={handleSaveDepartment}
        teachers={teachers}
      />
    </div>
  );
}
