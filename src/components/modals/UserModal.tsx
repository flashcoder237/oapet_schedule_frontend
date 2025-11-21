'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Building, Eye, EyeOff, Save, Loader2, GraduationCap, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { classService } from '@/lib/api/services/classes';
import type { StudentClass } from '@/lib/api/services/classes';
interface User {
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
import type { CreateUserData, UpdateUserData } from '@/lib/api/services/users';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSave: (userData: CreateUserData | UpdateUserData) => Promise<void>;
  departments?: Array<{ id: number; name: string }>;
}

export default function UserModal({
  isOpen,
  onClose,
  user,
  onSave,
  departments = []
}: UserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    role: 'professor',
    department_id: '',
    employee_id: '',
    is_active: true,
    // Student-specific fields
    student_id: '',
    entry_year: new Date().getFullYear(),
    phone: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    student_class_id: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const { addToast } = useToast();
  const isEditing = !!user;

  // Load all classes when modal opens and role is student
  useEffect(() => {
    const loadClasses = async () => {
      if (isOpen && formData.role === 'student') {
        try {
          setLoadingClasses(true);
          const classesData = await classService.getClasses();
          setClasses(classesData);
        } catch (error) {
          console.error('Error loading classes:', error);
        } finally {
          setLoadingClasses(false);
        }
      } else {
        setClasses([]);
      }
    };
    loadClasses();
  }, [isOpen, formData.role]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '',
        confirmPassword: '',
        role: user.role || 'professor',
        department_id: user.department_id?.toString() || '',
        employee_id: user.employee_id || '',
        is_active: user.is_active !== false,
        // Student fields (will be empty for non-students)
        student_id: '',
        entry_year: new Date().getFullYear(),
        phone: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        student_class_id: ''
      });
    } else {
      // Reset form for new user
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirmPassword: '',
        role: 'professor',
        department_id: '',
        employee_id: '',
        is_active: true,
        student_id: '',
        entry_year: new Date().getFullYear(),
        phone: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        student_class_id: ''
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) newErrors.username = 'Le nom d\'utilisateur est requis';
    if (!formData.email) newErrors.email = 'L\'email est requis';
    if (!formData.email.includes('@')) newErrors.email = 'Email invalide';
    if (!formData.first_name) newErrors.first_name = 'Le prénom est requis';
    if (!formData.last_name) newErrors.last_name = 'Le nom est requis';

    if (!isEditing) {
      if (!formData.password) newErrors.password = 'Le mot de passe est requis';
      if (formData.password.length < 8) newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    // Student-specific validation
    if (formData.role === 'student' && !isEditing) {
      if (!formData.student_id) newErrors.student_id = 'Le matricule est requis';
      if (!formData.student_class_id) newErrors.student_class_id = 'La classe est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData: any = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        employee_id: formData.employee_id || undefined,
        is_active: formData.is_active,
        ...((!isEditing && formData.password) && { password: formData.password })
      };

      // Add student-specific fields if role is student
      if (formData.role === 'student' && !isEditing) {
        userData.student_data = {
          student_id: formData.student_id,
          entry_year: formData.entry_year,
          phone: formData.phone || '',
          address: formData.address || '',
          emergency_contact: formData.emergency_contact || '',
          emergency_phone: formData.emergency_phone || '',
          student_class_id: parseInt(formData.student_class_id)
        };
      }

      await onSave(userData);

      addToast({
        title: "Succès",
        description: `Utilisateur ${isEditing ? 'mis à jour' : 'créé'} avec succès`,
      });

      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        title: "Erreur",
        description: error.message || `Impossible de ${isEditing ? 'mettre à jour' : 'créer'} l'utilisateur`,
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
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditing ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouveau compte utilisateur'}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="nom.utilisateur"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="utilisateur@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Prénom"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nom"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="professor">Enseignant</option>
                  <option value="student">Étudiant</option>
                  <option value="staff">Personnel</option>
                  <option value="admin">Administrateur</option>
                  <option value="department_head">Chef de Département</option>
                  <option value="scheduler">Planificateur</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => handleChange('department_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Sélectionner un département</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Employé
                </label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => handleChange('employee_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="EMP001"
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Compte actif
                </label>
              </div>
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && !isEditing && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <GraduationCap className="w-5 h-5" />
                  <h3 className="font-semibold">Informations Étudiant</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matricule *
                    </label>
                    <input
                      type="text"
                      value={formData.student_id}
                      onChange={(e) => handleChange('student_id', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.student_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="2025001"
                    />
                    {errors.student_id && (
                      <p className="text-red-500 text-sm mt-1">{errors.student_id}</p>
                    )}
                  </div>

                  {/* Student Class */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classe *
                    </label>
                    <select
                      value={formData.student_class_id}
                      onChange={(e) => handleChange('student_class_id', e.target.value)}
                      disabled={loadingClasses}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.student_class_id ? 'border-red-500' : 'border-gray-300'
                      } ${loadingClasses ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">
                        {loadingClasses ? 'Chargement...' : 'Sélectionner une classe'}
                      </option>
                      {classes.map((studentClass) => (
                        <option key={studentClass.id} value={studentClass.id}>
                          {studentClass.code} - {studentClass.name}
                        </option>
                      ))}
                    </select>
                    {errors.student_class_id && (
                      <p className="text-red-500 text-sm mt-1">{errors.student_class_id}</p>
                    )}
                  </div>

                  {/* Entry Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Année d'entrée
                    </label>
                    <input
                      type="number"
                      value={formData.entry_year}
                      onChange={(e) => handleChange('entry_year', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      min="2020"
                      max="2030"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="+237 690 000 000"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Douala, Cameroun"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact d'urgence
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact}
                      onChange={(e) => handleChange('emergency_contact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Nom du contact"
                    />
                  </div>

                  {/* Emergency Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tél. d'urgence
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_phone}
                      onChange={(e) => handleChange('emergency_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="+237 690 000 000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password fields for new users */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

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
                {isEditing ? 'Mettre à jour' : 'Créer l\'utilisateur'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}