// src/lib/api/services/students.ts
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

export interface StudentProfile {
  id: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
  student_id: string;
  curriculum_name: string;
  curriculum?: number;
  current_level: string;
  entry_year: number;
  phone: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  is_active: boolean;
}

export interface CourseEnrollment {
  id: number;
  course: {
    id: number;
    name: string;
    code: string;
    credits: number;
    hours_per_week: number;
    course_type: string;
  };
  academic_year: string;
  semester: string;
  enrollment_date: string;
  is_active: boolean;
}

export interface StudentSchedule {
  date: string;
  day_of_week: string;
  sessions: Array<{
    id: number;
    course_details: {
      name: string;
      code: string;
      course_type: string;
    };
    teacher_details: {
      first_name: string;
      last_name: string;
    };
    room_details: {
      name: string;
      building_name: string;
    };
    time_slot_details: {
      start_time: string;
      end_time: string;
      day_of_week: string;
    };
    specific_date: string;
  }>;
}

export const studentService = {
  // Récupérer le profil étudiant actuel
  async getMyProfile(): Promise<StudentProfile> {
    return apiClient.get<StudentProfile>('/courses/students/me/');
  },

  // Récupérer les cours auxquels l'étudiant est inscrit
  async getMyEnrollments(): Promise<{ results: CourseEnrollment[] }> {
    return apiClient.get('/courses/enrollments/my_enrollments/');
  },

  // Récupérer l'emploi du temps de l'étudiant
  async getMySchedule(params?: {
    date?: string;
    week_start?: string;
  }): Promise<StudentSchedule> {
    return apiClient.get('/schedules/schedules/my_schedule/', params);
  },

  // Récupérer l'emploi du temps d'aujourd'hui
  async getTodaySchedule(): Promise<StudentSchedule> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMySchedule({ date: today });
  },

  // Récupérer l'emploi du temps de la semaine
  async getWeeklySchedule(weekStart?: string): Promise<{
    week_start: string;
    week_end: string;
    sessions_by_day: {
      monday: any[];
      tuesday: any[];
      wednesday: any[];
      thursday: any[];
      friday: any[];
      saturday: any[];
      sunday: any[];
    };
    total_sessions: number;
  }> {
    const week = weekStart || this.getMonday(new Date()).toISOString().split('T')[0];
    return apiClient.get('/schedules/schedules/my_weekly_schedule/', { week_start: week });
  },

  // Mettre à jour les informations personnelles
  async updateProfile(data: {
    phone?: string;
    address?: string;
    emergency_contact?: string;
    emergency_phone?: string;
  }): Promise<StudentProfile> {
    return apiClient.patch<StudentProfile>('/courses/students/update_me/', data);
  },

  // Récupérer les statistiques de l'étudiant
  async getMyStats(): Promise<{
    total_courses: number;
    total_credits: number;
    total_hours_per_week: number;
    courses_by_type: Record<string, number>;
  }> {
    return apiClient.get('/courses/students/my_stats/');
  },

  // Utilitaires
  getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  },

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },
};
