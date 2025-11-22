// src/lib/auth/context.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, AuthContextType, AuthCredentials, User, RegisterData } from './types';
import { authService } from '../api/services/auth';
import { apiClient } from '../api/client';

// État initial - même état côté serveur et client
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false, // Commencer par false pour éviter l'hydratation
  error: null,
};

// Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; user?: User } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user || null,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier le token au démarrage (côté client seulement)
  useEffect(() => {
    const initializeAuth = async () => {
      // Démarrer le chargement côté client
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
        try {
          // Vérifier la validité du token et récupérer l'utilisateur
          const user = await authService.getCurrentUser();
          dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
        } catch (error) {
          // Token invalide, nettoyer
          localStorage.removeItem('auth_token');
          apiClient.clearToken();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Seulement côté client
    if (typeof window !== 'undefined') {
      initializeAuth();
    }
  }, []);

  const login = async (credentials: AuthCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      
      // Role-based redirection after successful login
      const user = response.user;
      if (user?.profile?.role === 'student') {
        window.location.href = '/student/dashboard';
      } else {
        window.location.href = '/'; // Default redirect for other roles
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.register(userData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur d\'inscription';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      // Redirect to homepage after logout
      // We need to get router instance here.
      // This is a bit tricky in a context file that is not a component.
      // A better way is to handle this in the component that calls logout.
      // But for the sake of centralization, we can do it here.
      // This will require the component to be wrapped in a router.
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    try {
      if (!state.token) return;
      
      const user = await authService.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  // Fonctions de vérification des rôles
  const isAdmin = () => {
    return state.user?.is_staff || state.user?.is_superuser || state.user?.profile?.role === 'admin';
  };

  const isTeacher = () => {
    if (state.user?.is_staff || state.user?.is_superuser) return false;
    return state.user?.profile?.role === 'professor' || state.user?.profile?.role === 'teacher';
  };

  const isStudent = () => {
    return state.user?.profile?.role === 'student';
  };
  
  const isDepartmentHead = () => {
    return state.user?.profile?.role === 'department_head';
  };

  const isScheduler = () => {
    return state.user?.profile?.role === 'scheduler';
  };

  const hasRole = (roles: string[]) => {
    if (!state.user) return false;
    const userRole = state.user.profile?.role || '';
    return roles.includes(userRole) || state.user.is_staff || state.user.is_superuser;
  };

  const canManageUsers = () => {
    return isAdmin() || isDepartmentHead() || isScheduler();
  };

  const canManageSchedules = () => {
    return isAdmin() || isDepartmentHead() || isScheduler();
  };

  const canManageCourses = () => {
    return isAdmin() || isDepartmentHead();
  };

  const canManageRooms = () => {
    return isAdmin();
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    refreshUser,
    isAdmin,
    isTeacher,
    isStudent,
    isDepartmentHead,
    isScheduler,
    hasRole,
    canManageUsers,
    canManageSchedules,
    canManageCourses,
    canManageRooms,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}