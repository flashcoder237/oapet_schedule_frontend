'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  RefreshCw,
  Download,
  Upload,
  Mail,
  Phone,
  Lock,
  Key,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Info,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth/context';
import { useSettings } from '@/hooks/useSettings';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const { user } = useAuth();
  const { addToast } = useToast();
  const {
    settings,
    isLoading,
    error,
    updateSection,
    resetSection,
    exportSettings,
    importSettings,
    getProfileSettings,
    getNotificationSettings,
    getSecuritySettings,
    getAppearanceSettings,
    getSystemSettings
  } = useSettings();

  // États locaux pour les formulaires
  const [localProfile, setLocalProfile] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    language: 'fr'
  });

  const [localNotifications, setLocalNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    scheduleChanges: true,
    deadlineReminders: true,
    systemUpdates: false,
    weeklyDigest: true
  });

  const [localAppearance, setLocalAppearance] = useState({
    theme: 'light',
    colorScheme: 'blue',
    fontSize: 'medium',
    compactMode: false,
    showAnimations: true,
    language: 'fr'
  });

  const handleSaveProfile = async () => {
    await updateSection('profile', localProfile);
  };

  const handleSaveNotifications = async () => {
    await updateSection('notifications', localNotifications);
  };

  const handleSaveAppearance = async () => {
    await updateSection('appearance', localAppearance);
  };

  const handleExportSettings = async () => {
    await exportSettings();
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importSettings(file);
      event.target.value = '';
    }
  };

  const resetToDefault = async (section: string) => {
    if (!confirm('Êtes-vous sûr de vouloir rétablir les paramètres par défaut ?')) return;
    await resetSection(section as keyof typeof settings);
  };

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              Paramètres
            </h1>
            <p className="text-muted-foreground mt-2">
              Personnalisez votre expérience et gérez vos préférences
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportSettings} disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="hidden"
                disabled={isLoading}
              />
              <Button variant="outline" disabled={isLoading} type="button">
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
            </label>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="pedagogical" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Pédagogique
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* Section Profil */}
        <TabsContent value="profile" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prénom</label>
                    <input
                      type="text"
                      value={localProfile.firstName}
                      onChange={(e) => setLocalProfile({...localProfile, firstName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom</label>
                    <input
                      type="text"
                      value={localProfile.lastName}
                      onChange={(e) => setLocalProfile({...localProfile, lastName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={localProfile.email}
                        onChange={(e) => setLocalProfile({...localProfile, email: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={localProfile.phone}
                        onChange={(e) => setLocalProfile({...localProfile, phone: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="+237 6XX XX XX XX"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Biographie</label>
                  <textarea
                    value={localProfile.bio}
                    onChange={(e) => setLocalProfile({...localProfile, bio: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Décrivez-vous brièvement..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={isLoading}>
                    {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Section Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Préférences de notification
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => resetToDefault('notifications')}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Par défaut
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications email</h4>
                      <p className="text-sm text-muted-foreground">Recevoir les notifications par email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localNotifications.emailNotifications}
                        onChange={(e) => setLocalNotifications({...localNotifications, emailNotifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications push</h4>
                      <p className="text-sm text-muted-foreground">Recevoir les notifications sur l'appareil</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localNotifications.pushNotifications}
                        onChange={(e) => setLocalNotifications({...localNotifications, pushNotifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Changements d'emploi du temps</h4>
                      <p className="text-sm text-muted-foreground">Modifications de planning</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localNotifications.scheduleChanges}
                        onChange={(e) => setLocalNotifications({...localNotifications, scheduleChanges: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={isLoading}>
                    {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Section Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sécurité et confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Authentification à deux facteurs</h4>
                        <p className="text-sm text-muted-foreground">Sécurisez votre compte avec 2FA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Désactivé
                      </Badge>
                      <Button variant="outline" size="sm">
                        Activer
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Changer le mot de passe</h4>
                          <p className="text-sm text-muted-foreground">Dernière modification il y a 30 jours</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Sécurité du compte</h4>
                      <div className="text-sm text-blue-700 mt-2 space-y-1">
                        <p>• Utilisez un mot de passe fort et unique</p>
                        <p>• Activez l'authentification à deux facteurs</p>
                        <p>• Vérifiez régulièrement votre activité de connexion</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Section Apparence */}
        <TabsContent value="appearance" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Apparence et affichage
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => resetToDefault('appearance')}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Par défaut
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">Thème</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'light', label: 'Clair', icon: Sun },
                        { value: 'dark', label: 'Sombre', icon: Moon },
                        { value: 'auto', label: 'Auto', icon: Monitor }
                      ].map(theme => {
                        const Icon = theme.icon;
                        return (
                          <label key={theme.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="theme"
                              value={theme.value}
                              checked={localAppearance.theme === theme.value}
                              onChange={(e) => setLocalAppearance({...localAppearance, theme: e.target.value})}
                              className="sr-only peer"
                            />
                            <div className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition-colors">
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">{theme.label}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Couleur principale</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'blue', color: 'bg-blue-500' },
                        { value: 'green', color: 'bg-green-500' },
                        { value: 'purple', color: 'bg-purple-500' },
                        { value: 'red', color: 'bg-red-500' },
                        { value: 'orange', color: 'bg-orange-500' },
                        { value: 'teal', color: 'bg-teal-500' }
                      ].map(color => (
                        <label key={color.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="colorScheme"
                            value={color.value}
                            checked={localAppearance.colorScheme === color.value}
                            onChange={(e) => setLocalAppearance({...localAppearance, colorScheme: e.target.value})}
                            className="sr-only peer"
                          />
                          <div className={`w-8 h-8 rounded-full ${color.color} peer-checked:ring-4 peer-checked:ring-primary/30 hover:scale-110 transition-transform`}></div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Taille de police</label>
                    <select
                      value={localAppearance.fontSize}
                      onChange={(e) => setLocalAppearance({...localAppearance, fontSize: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option value="small">Petite</option>
                      <option value="medium">Moyenne</option>
                      <option value="large">Grande</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveAppearance} disabled={isLoading}>
                    {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Section Contraintes Pédagogiques */}
        <TabsContent value="pedagogical" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Contraintes Pédagogiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Configuration des règles pédagogiques</h4>
                      <p className="text-sm text-blue-700 mt-2">
                        Configurez les contraintes de programmation pour chaque type de cours (CM, TD, TP, TPE).
                        Ces règles affectent la génération automatique des emplois du temps.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center py-6">
                  <a
                    href="/settings/pedagogical-constraints"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <BookOpen className="w-5 h-5" />
                    Ouvrir la page des contraintes pédagogiques
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Section Système */}
        <TabsContent value="system" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Informations système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Information système</h4>
                      <div className="text-sm text-blue-700 mt-2 space-y-1">
                        <p>Version de l'application: v2.1.0</p>
                        <p>Base de données: PostgreSQL 14.2</p>
                        <p>Dernière sauvegarde: Il y a 2 heures</p>
                        <div>
                          Statut: <Badge variant="default" className="ml-1">Système opérationnel</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Vider le cache</h4>
                        <p className="text-sm text-muted-foreground">Libère l'espace de stockage temporaire</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Vider
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Sauvegarde des données</h4>
                        <p className="text-sm text-muted-foreground">Exporter vos données personnelles</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}