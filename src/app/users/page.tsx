'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, User, Mail, Shield, Building, UserCheck, UserX,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PageLoading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/use-toast';
import { BulkActions, CommonBulkActions } from '@/components/ui/BulkActions';
import { ImportExportButtons } from '@/components/ui/ImportExportButtons';
import { userService } from '@/lib/api/services/users';
import UserModal from '@/components/modals/UserModal';
import type { CreateUserData, UpdateUserData } from '@/lib/api/services/users';

interface UserType {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  is_active: boolean;
  department_id?: number;
  department_name?: string;
  employee_id?: string;
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date_joined');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // États de sélection pour les actions groupées
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { addToast } = useToast();

  // Chargement des données avec pagination et filtres
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Construction des paramètres de requête
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('page_size', pageSize.toString());

        if (searchTerm) params.append('search', searchTerm);
        if (selectedRole !== 'all') params.append('role', selectedRole);
        if (selectedStatus !== 'all') params.append('is_active', selectedStatus);

        // Charger les utilisateurs avec pagination
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
        const usersResponse = await fetch(`${baseUrl}/users/users/?${params.toString()}`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('auth_token')}`,
          },
        }).then(res => res.json()).catch(() => ({ results: [], count: 0 }));

        const usersArray = (usersResponse.results || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: user.is_active,
          department_id: user.department_id,
          department_name: user.department_name,
          employee_id: user.employee_id
        }));

        setUsers(usersArray);
        setTotalUsers(usersResponse.count || 0);

        // Charger les départements (une seule fois)
        if (departments.length === 0) {
          const departmentsResponse = await fetch(`${baseUrl}/courses/departments/`, {
            headers: {
              'Authorization': `Token ${localStorage.getItem('auth_token')}`,
            },
          }).then(res => res.json()).catch(() => ({ results: [] }));

          setDepartments(departmentsResponse.results || []);
        }

      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        addToast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentPage, pageSize, searchTerm, selectedRole, selectedStatus, refreshTrigger]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = async (userData: CreateUserData | UpdateUserData) => {
    try {
      if (selectedUser) {
        const updatedUser = await userService.updateUser(selectedUser.id, userData as UpdateUserData);
        setUsers(prevUsers => prevUsers.map(user => user.id === selectedUser.id ? updatedUser : user));
      } else {
        await userService.createUser(userData as CreateUserData);
        // Recharger la première page pour voir le nouvel utilisateur
        setCurrentPage(1);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      await userService.deleteUser(userId);

      // Si c'était le dernier utilisateur de la page, retourner à la page précédente
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        // Recharger la page actuelle
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setTotalUsers(prev => prev - 1);
      }

      addToast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);

      let errorMessage = "Impossible de supprimer l'utilisateur";

      // Gérer les différents types d'erreurs
      if (error.status === 404) {
        errorMessage = "Cet utilisateur n'existe pas ou a déjà été supprimé";
      } else if (error.status === 403) {
        errorMessage = "Vous n'avez pas la permission de supprimer cet utilisateur";
      } else if (error.message) {
        errorMessage = error.message;
      }

      addToast({
        title: "Erreur",
        description: errorMessage,
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
    const allIds = new Set(users.map(u => u.id).filter((id): id is number => id !== undefined));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Actions groupées
  const handleBulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} utilisateur(s) ?`)) return;

    try {
      await Promise.all(Array.from(selectedIds).map(id => userService.deleteUser(id)));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} utilisateur(s) supprimé(s)`,
      });

      // Recharger la page actuelle
      setCurrentPage(1);
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
        userService.updateUser(id, { is_active: true })
      ));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} utilisateur(s) activé(s)`,
      });

      // Forcer le rechargement des données
      setSelectedIds(new Set());
      setRefreshTrigger(prev => prev + 1);
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
        userService.updateUser(id, { is_active: false })
      ));

      addToast({
        title: "Succès",
        description: `${selectedIds.size} utilisateur(s) désactivé(s)`,
      });

      // Forcer le rechargement des données
      setSelectedIds(new Set());
      setRefreshTrigger(prev => prev + 1);
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

  // Import d'utilisateurs
  const handleImportUsers = async (importedData: any[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const data of importedData) {
        try {
          // Valider les données de base
          if (!data.username || !data.email || !data.password) {
            errorCount++;
            console.warn('Import ignoré - champs requis manquants:', data);
            continue;
          }

          const role = data.role || 'student';

          // Validation spécifique pour les enseignants
          if (role === 'teacher' && (!data.department_id || !data.employee_id)) {
            errorCount++;
            console.warn('Import enseignant ignoré - department_id et employee_id requis:', data);
            continue;
          }

          // Construire l'objet userData avec tous les champs
          const userData: any = {
            username: data.username,
            email: data.email,
            password: data.password,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            role: role,
            is_active: data.is_active === 'true' || data.is_active === '1' || data.is_active === true,
          };

          // Ajouter les champs spécifiques aux enseignants si fournis
          if (role === 'teacher') {
            if (data.department_id) userData.department_id = parseInt(data.department_id);
            if (data.employee_id) userData.employee_id = data.employee_id;
            if (data.phone) userData.phone = data.phone;
            if (data.office) userData.office = data.office;
            if (data.max_hours_per_week) userData.max_hours_per_week = parseInt(data.max_hours_per_week);
          }

          await userService.createUser(userData);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('Erreur lors de l\'import d\'un utilisateur:', error);
        }
      }

      // Recharger la liste
      setCurrentPage(1);

      addToast({
        title: "Import terminé",
        description: `${successCount} utilisateurs importés${errorCount > 0 ? `, ${errorCount} erreurs` : ''}`,
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
  // Note: Les champs department_id et employee_id sont REQUIS pour role='teacher'
  // Les champs student_id, curriculum_id, current_level, entry_year sont pour role='student' (à créer manuellement après)
  const userTemplateFields = [
    // ID (important pour les mises à jour)
    { key: 'id', label: 'ID', example: '1' },

    // Champs de base (REQUIS pour tous)
    { key: 'username', label: 'Nom d\'utilisateur', example: 'jdupont' },
    { key: 'email', label: 'Email', example: 'jean.dupont@example.com' },
    { key: 'password', label: 'Mot de passe', example: 'Password123!' },
    { key: 'first_name', label: 'Prénom', example: 'Jean' },
    { key: 'last_name', label: 'Nom', example: 'Dupont' },
    { key: 'role', label: 'Rôle', example: 'student' },
    { key: 'is_active', label: 'Actif', example: 'true' },

    // Champs spécifiques ENSEIGNANT (requis si role='teacher')
    { key: 'department_id', label: 'ID Département (teacher)', example: '1' },
    { key: 'employee_id', label: 'Matricule (teacher)', example: 'PROF001' },
    { key: 'phone', label: 'Téléphone (teacher)', example: '0612345678' },
    { key: 'office', label: 'Bureau (teacher)', example: 'B201' },
    { key: 'max_hours_per_week', label: 'Heures max/semaine (teacher)', example: '20' },
  ];

  // Préparer les données pour l'export
  const exportData = users.map(user => ({
    id: user.id || '',
    username: user.username || '',
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role || '',
    is_active: user.is_active ? 'true' : 'false',
  }));

  const roles = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'teacher', label: 'Enseignant' },
    { value: 'student', label: 'Étudiant' },
    { value: 'staff', label: 'Personnel' },
    { value: 'department_head', label: 'Chef de Département' },
    { value: 'scheduler', label: 'Planificateur' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' }
  ];

  // Fonction pour gérer le changement de recherche avec debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Retour à la première page lors de la recherche
  };

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalUsers / pageSize);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'teacher':
      case 'professor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'student': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'staff': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'department_head': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'scheduler': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'teacher':
      case 'professor': return 'Enseignant';
      case 'student': return 'Étudiant';
      case 'staff': return 'Personnel';
      case 'department_head': return 'Chef de Département';
      case 'scheduler': return 'Planificateur';
      default: return 'Utilisateur';
    }
  };

  // Statistiques globales
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    admin_users: 0,
    professor_count: 0
  });

  // Charger les statistiques
  useEffect(() => {
    const loadStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
        const response = await fetch(`${apiUrl}/users/users/stats/`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('auth_token')}`,
          },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    };
    loadStats();
  }, []);

  if (isLoading) {
    return <PageLoading message="Chargement des utilisateurs..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs permissions
          </p>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons
            data={exportData}
            templateFields={userTemplateFields}
            filename="utilisateurs"
            onImport={handleImportUsers}
          />
          <Button onClick={handleAddUser} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel Utilisateur
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Utilisateurs</p>
                <p className="text-2xl font-bold">{stats.total_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold">{stats.active_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administrateurs</p>
                <p className="text-2xl font-bold">{stats.admin_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enseignants</p>
                <p className="text-2xl font-bold">{stats.professor_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, username..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="5">5 par page</option>
                <option value="10">10 par page</option>
                <option value="20">20 par page</option>
                <option value="50">50 par page</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions groupées */}
      {selectedIds.size > 0 && (
        <BulkActions
          selectedCount={selectedIds.size}
          totalCount={users.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          actions={bulkActions}
        />
      )}

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Liste des Utilisateurs</CardTitle>
            <div className="text-sm text-muted-foreground">
              Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, totalUsers)} sur {totalUsers} utilisateurs
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">
                    <Checkbox
                      checked={selectedIds.size === users.length && users.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleSelectAll();
                        } else {
                          handleDeselectAll();
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-4 font-semibold">Nom</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Nom d'utilisateur</th>
                  <th className="text-left p-4 font-semibold">Rôle</th>
                  <th className="text-left p-4 font-semibold">Département</th>
                  <th className="text-left p-4 font-semibold">Statut</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={user.id !== undefined && selectedIds.has(user.id)}
                          onCheckedChange={() => user.id && toggleSelection(user.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            {user.employee_id && (
                              <div className="text-xs text-muted-foreground">
                                ID: {user.employee_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">{user.username}</span>
                      </td>
                      <td className="p-4">
                        <Badge className={getRoleBadgeColor(user.role || 'student')}>
                          {getRoleLabel(user.role || 'student')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {user.department_name ? (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{user.department_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {user.is_active ? (
                          <Badge className="bg-green-500 text-white">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserX className="w-3 h-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Premier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>

                {/* Numéros de pages */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Dernier
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création/édition */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
        onSave={handleSaveUser}
        departments={departments}
      />
    </div>
  );
}
