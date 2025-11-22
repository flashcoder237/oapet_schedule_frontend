'use client';

import { Bell, Settings, User, Menu, Search, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationCenter } from '@/components/ui/notifications';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import SmartSearch from '@/components/search/SmartSearch';

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getRoleLabel = (role?: string) => {
    if (!role) return 'Membre';
    const roleMap: Record<string, string> = {
      'admin': 'Administrateur',
      'teacher': 'Enseignant',
      'professor': 'Enseignant',
      'student': 'Étudiant',
      'staff': 'Personnel',
      'department_head': 'Chef de Département',
      'scheduler': 'Planificateur'
    };
    return roleMap[role] || role;
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'Accueil';
    if (pathname === '/dashboard') return 'Tableau de bord';
    if (pathname.startsWith('/courses')) return 'Gestion des cours';
    if (pathname.startsWith('/rooms')) return 'Gestion des salles';
    if (pathname.startsWith('/schedule')) return 'Emplois du temps';
    if (pathname.startsWith('/users')) return 'Utilisateurs';
    if (pathname.startsWith('/departments')) return 'Départements';
    if (pathname.startsWith('/ai')) return 'Intelligence Artificielle';
    if (pathname.startsWith('/settings')) return 'Paramètres';
    return 'Système de gestion des emplois du temps';
  };

  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Accueil';
    return segments.map(segment => 
      segment.charAt(0).toUpperCase() + segment.slice(1)
    ).join(' > ');
  };

  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: -10,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    }
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-50 backdrop-blur-lg",
        "bg-card/80 border-b border-border",
        "px-6 py-4"
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <motion.button 
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
          >
            <Menu size={18} className="text-muted-foreground" />
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-1"
          >
            <h1 className="text-xl font-semibold text-foreground leading-none">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-muted-foreground leading-none">
              {getBreadcrumb()}
            </p>
          </motion.div>
        </div>

        {/* Center - Smart Search */}
        <motion.div
          className="hidden md:block min-w-80 max-w-lg flex-1 mx-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <SmartSearch
            placeholder="Rechercher dans OAPET..."
            showFilters={true}
            showSuggestions={true}
            showHistory={true}
          />
        </motion.div>
        
        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <ThemeSwitcher />
          </motion.div>
          
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <NotificationCenter />
          </motion.div>
          
          {/* User Menu */}
          <div className="relative">
            <motion.button 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-full",
                "hover:bg-muted transition-colors",
                "border border-transparent hover:border-border"
              )}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Menu utilisateur"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center ring-2 ring-background shadow-sm">
                <User size={16} className="text-primary-foreground" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-none">
                  {user?.full_name || user?.username || 'Utilisateur'}
                </p>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">
                  {getRoleLabel(user?.role || user?.profile?.role)}
                </p>
              </div>
              <motion.div
                animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={14} className="text-muted-foreground" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div 
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "absolute right-0 mt-2 w-56",
                    "bg-card border border-border rounded-xl shadow-xl",
                    "backdrop-blur-lg z-40"
                  )}
                >
                  {/* User info header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
                        <User size={18} className="text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm leading-none">
                          {user?.full_name || user?.username || 'Utilisateur'}
                        </p>
                        <p className="text-xs text-muted-foreground leading-none mt-1">
                          {user?.email || 'email@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <Link href="/profile" onClick={() => setIsUserMenuOpen(false)}>
                      <motion.div 
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <User size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Mon profil</span>
                      </motion.div>
                    </Link>
                    <Link href="/settings" onClick={() => setIsUserMenuOpen(false)}>
                      <motion.div 
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <Settings size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Paramètres</span>
                      </motion.div>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-border">
                    <motion.button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors rounded-b-xl"
                      whileHover={{ x: 2 }}
                    >
                      <LogOut size={16} />
                      <span className="text-sm font-medium">Déconnexion</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}