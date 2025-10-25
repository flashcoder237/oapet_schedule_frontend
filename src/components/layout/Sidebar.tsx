'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  BookOpen,
  MapPin,
  Calendar,
  Users,
  Building,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Activity,
  BarChart3,
  Brain,
  UserCog
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isTeacher, canManageSchedules } = useAuth();
  
  const navigation = [
    {
      name: 'Accueil',
      href: '/',
      icon: Home,
      description: 'Vue d\'ensemble',
      allowTeacher: true
    },
    {
      name: 'Gestion des EDs',
      href: '/gestion-emplois',
      icon: LayoutDashboard,
      description: 'Administration des emplois du temps',
      allowTeacher: false
    },
    {
      name: 'Cours',
      href: '/courses',
      icon: BookOpen,
      description: 'Gestion des cours',
      allowTeacher: true // Lecture seule pour enseignants
    },
    {
      name: 'Classes',
      href: '/gestion-classes',
      icon: GraduationCap,
      description: 'Gestion des classes et effectifs',
      allowTeacher: false
    },
    {
      name: 'Emplois du temps',
      href: '/schedule',
      icon: Calendar,
      description: 'Planning et horaires',
      allowTeacher: true
    },
    {
      name: 'Préférences Enseignants',
      href: '/teachers/preferences',
      icon: UserCog,
      description: 'Disponibilités et contraintes',
      allowTeacher: true
    },
    {
      name: 'Salles',
      href: '/rooms',
      icon: MapPin,
      description: 'Gestion des espaces',
      allowTeacher: true // Lecture seule pour enseignants
    },
    {
      name: 'Bâtiments & Types',
      href: '/buildings-roomtypes',
      icon: Building,
      description: 'Gestion des bâtiments et types de salles',
      allowTeacher: false
    },
    {
      name: 'Utilisateurs',
      href: '/users',
      icon: Users,
      description: 'Comptes et permissions',
      allowTeacher: false
    },
    {
      name: 'Départements',
      href: '/departments',
      icon: Building2,
      description: 'Structure organisationnelle',
      allowTeacher: false
    },
    {
      name: 'Intelligence Artificielle',
      href: '/ai',
      icon: Brain,
      description: 'Outils IA et analyses',
      allowTeacher: false
    },
    {
      name: 'Paramètres',
      href: '/settings',
      icon: Settings,
      description: 'Configuration système',
      allowTeacher: true
    },
  ];

  // Filtrer la navigation selon le rôle
  const filteredNavigation = navigation.filter(item => {
    if (isTeacher()) {
      return item.allowTeacher;
    }
    return true; // Admin/planificateur voient tout
  });

  const sidebarVariants: Variants = {
    expanded: { 
      width: 280,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    collapsed: { 
      width: 72,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const contentVariants: Variants = {
    expanded: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, delay: 0.1 }
    },
    collapsed: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.aside 
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      className="h-screen bg-gradient-to-b from-primary to-primary-700 text-primary-foreground shadow-2xl flex flex-col relative overflow-hidden border-r border-primary-600/20"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-radial from-white/5 to-transparent rounded-full" />
      </div>
      
      {/* Header */}
      <div className="relative z-10 p-6 border-b border-primary-600/20">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                key="logo-expanded"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight">OAPET</h1>
                  <p className="text-xs text-primary-foreground/70">Gestion des EDTs</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors border border-white/20 shadow-sm backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={collapsed ? "Développer la sidebar" : "Réduire la sidebar"}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft size={18} />
            </motion.div>
          </motion.button>
        </div>

      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 relative z-10 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {filteredNavigation.map((item, index) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(`${item.href}/`));
            
            return (
              <motion.li 
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={item.href} className="block">
                  <motion.div
                    className={cn(
                      'nav-item flex items-center relative rounded-xl transition-all duration-300 group',
                      collapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3',
                      isActive 
                        ? 'bg-white/15 text-white shadow-lg backdrop-blur-sm border border-white/20' 
                        : 'text-primary-foreground/80 hover:bg-white/10 hover:text-white hover:shadow-md'
                    )}
                    whileHover={{ 
                      scale: 1.02,
                      x: collapsed ? 0 : 4
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    
                    <motion.div
                      className="flex-shrink-0"
                      whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <item.icon size={20} />
                    </motion.div>
                    
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          variants={contentVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          className="flex-1 min-w-0"
                        >
                          <div className="font-medium text-sm leading-tight">
                            {item.name}
                          </div>
                          <div className="text-xs text-primary-foreground/60 leading-tight mt-0.5">
                            {item.description}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-border">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover rotate-45 border-l border-b border-border" />
                      </div>
                    )}
                  </motion.div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <motion.div 
        className="p-4 border-t border-primary-600/20 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mx-auto border border-white/20">
                <span className="text-xs font-mono">v1</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded-footer"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="space-y-3"
            >
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold">O</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">OAPET System</p>
                  <p className="text-xs text-primary-foreground/60">Version 1.0.0</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-primary-foreground/50">
                  © 2024 Université de Douala
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.aside>
  );
}