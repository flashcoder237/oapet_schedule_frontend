'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Save,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { studentService, type StudentProfile } from '@/lib/api/services/students';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    phone: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await studentService.getMyProfile();
      setProfile(data);
      setEditData({
        phone: data.phone || '',
        address: data.address || '',
        emergency_contact: data.emergency_contact || '',
        emergency_phone: data.emergency_phone || '',
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger votre profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedProfile = await studentService.updateProfile(editData);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast({
        title: 'Succès',
        description: 'Votre profil a été mis à jour',
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre profil',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditData({
        phone: profile.phone || '',
        address: profile.address || '',
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos informations personnelles
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </Button>
          )}
        </motion.div>

        {/* Carte principale du profil */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 bg-white shadow-lg">
            {/* Photo de profil et infos de base */}
            <div className="flex items-start gap-6 mb-8 pb-8 border-b">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile?.user_details.first_name?.charAt(0)}{profile?.user_details.last_name?.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile?.user_details.first_name} {profile?.user_details.last_name}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {profile?.curriculum_name}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    Niveau {profile?.current_level}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Promotion {profile?.entry_year}
                  </Badge>
                  {profile?.is_active && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Informations du compte */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Informations du compte
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nom d'utilisateur</p>
                    <p className="font-medium">{profile?.user_details.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{profile?.user_details.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Matricule</p>
                    <p className="font-medium">{profile?.student_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Filière</p>
                    <p className="font-medium">{profile?.curriculum_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations personnelles (éditables) */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Votre numéro de téléphone"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <p className="font-medium">{profile?.phone || 'Non renseigné'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Votre adresse"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <p className="font-medium">{profile?.address || 'Non renseigné'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact d'urgence
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={editData.emergency_contact}
                        onChange={(e) => setEditData({ ...editData, emergency_contact: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Nom du contact d'urgence"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <p className="font-medium">{profile?.emergency_contact || 'Non renseigné'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone d'urgence
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="tel"
                        value={editData.emergency_phone}
                        onChange={(e) => setEditData({ ...editData, emergency_phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Numéro d'urgence"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <p className="font-medium">{profile?.emergency_phone || 'Non renseigné'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons d'action en mode édition */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Carte d'information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Protection des données</p>
                <p className="text-blue-700">
                  Vos informations personnelles sont sécurisées et ne sont accessibles qu'aux
                  administrateurs autorisés. Vérifiez régulièrement vos informations de contact d'urgence.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
