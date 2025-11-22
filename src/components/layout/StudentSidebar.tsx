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
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';

export default function StudentSidebar() {
  const [collapsed, setCollapsed] = useState(false);
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
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight">OAPET</h1>
                  <p className="text-xs text-primary-foreground/70">Espace Étudiant</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors border border-white/20 shadow-sm backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={collapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
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
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

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
                      x: collapsed ? 0 : 4,
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
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Icon size={20} />
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

      {/* Footer - User Info & Logout */}
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
              className="space-y-2"
            >
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mx-auto border border-white/20">
                <User size={18} />
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center mx-auto border border-red-400/20 transition-colors"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
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
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.user_details?.first_name || user?.first_name} {user?.user_details?.last_name || user?.last_name}
                  </p>
                  <p className="text-xs text-primary-foreground/60">Étudiant</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-primary-foreground/80 hover:text-white transition-all duration-200 border border-red-400/20"
              >
                <LogOut size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.aside>
  );
}
