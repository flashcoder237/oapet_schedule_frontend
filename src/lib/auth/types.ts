// src/lib/auth/types.ts
export interface UserProfile {
  role: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  language: string;
  timezone: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
  profile: UserProfile | null;
  role?: string;
  teacher_id?: number;
  student_id?: number;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  role?: string;
}

export interface UserSession {
  id: number;
  session_key: string;
  ip_address: string;
  user_agent: string;
  location: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
}

export interface LoginAttempt {
  id: number;
  username: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  failure_reason: string;
  timestamp: string;
}