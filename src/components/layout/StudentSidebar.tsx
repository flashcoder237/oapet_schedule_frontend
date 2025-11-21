'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function StudentSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/student/dashboard',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble',
    },
    {
      name: 'Emploi du temps',
      href: '/student/schedule',
      icon: Calendar,
      description: 'Planning de la semaine',
    },
    {
      name: 'Mes cours',
      href: '/student/courses',
      icon: BookOpen,
      description: 'Liste des cours',
    },
    {
      name: 'Profil',
      href: '/student/profile',
      icon: User,
      description: 'Informations personnelles',
    },
  ];

  const sidebarVariants: Variants = {
    expanded: {
      width: 280,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    collapsed: {
      width: 72,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  };

  const contentVariants: Variants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, delay: 0.1 },
    },
    collapsed: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 },
    },
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
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
                <GraduationCap className="w-8 h-8" />
                <div>
                  <h1 className="text-xl font-bold">OAPET</h1>
                  <p className="text-xs text-primary-foreground/70">Espace Étudiant</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <GraduationCap className="w-6 h-6" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="relative z-10 px-4 py-3 border-b border-primary-600/20"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
              <input
                type="text"
                placeholder="Rechercher dans OAPET..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation
            .filter((item) =>
              searchQuery === '' ||
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                      : 'text-primary-foreground/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )}
                  />

                  {/* Text */}
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.div
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="flex-1 min-w-0"
                      >
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        {!isActive && (
                          <div className="text-xs text-primary-foreground/60 truncate">
                            {item.description}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}

          {/* No Results Message */}
          {searchQuery !== '' &&
            navigation.filter((item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-primary-foreground/60"
              >
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun résultat</p>
              </motion.div>
            )}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="relative z-10 p-4 border-t border-primary-600/20">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="mb-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-primary-foreground/70 truncate">Étudiant</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
            'text-primary-foreground/80 hover:bg-red-500/20 hover:text-white'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="text-sm font-medium"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-20 w-6 h-6 rounded-full bg-white text-primary shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
