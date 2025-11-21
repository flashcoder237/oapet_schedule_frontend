// src/lib/api/services/teachers.ts
import { apiClient } from '../client';
import type { Teacher } from '@/types/api';

export interface TeacherForSelect {
  id: number;
  name: string;
  code: string;
}

export interface TeacherProfile {
  id: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  department_name: string;
  department: number;
  employee_id: string;
  courses_count: number;
  specializations?: string[];
  is_active: boolean;
}

export interface TeacherStats {
  total_courses: number;
  total_hours_this_week: number;
  total_hours_this_month: number;
  total_students: number;
  sessions_this_week: number;
}

export const teacherService = {
  /**
   * Récupère la liste des enseignants
   */
  async getTeachers(params?: { department?: number }): Promise<Teacher[]> {
    const queryParams = new URLSearchParams();
    if (params?.department) {
      queryParams.append('department', params.department.toString());
    }

    const url = `/courses/teachers/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get<any>(url);

    return response.results || response || [];
  },

  /**
   * Récupère un enseignant par son ID
   */
  async getTeacher(id: number): Promise<Teacher> {
    return apiClient.get<Teacher>(`/courses/teachers/${id}/`);
  },

  /**
   * Formate les enseignants pour les dropdowns/selects
   * Filtre automatiquement ceux qui n'ont pas d'utilisateur associé
   */
  formatTeachersForSelect(teachers: Teacher[]): TeacherForSelect[] {
    return teachers
      .filter((teacher) => {
        if (!teacher.user_details) {
          console.warn(`⚠️ Enseignant #${teacher.id} sans user_details - ignoré`);
          return false;
        }
        return true;
      })
      .map((teacher) => {
        const firstName = teacher.user_details?.first_name || '';
        const lastName = teacher.user_details?.last_name || '';
        const username = teacher.user_details?.username || '';

        let displayName = '';
        if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`;
        } else if (firstName || lastName) {
          displayName = firstName || lastName;
        } else if (username) {
          displayName = username;
        } else {
          displayName = `Enseignant #${teacher.id}`;
        }

        return {
          id: teacher.id,
          name: displayName,
          code: teacher.employee_id || `T${teacher.id}`
        };
      });
  },

  /**
   * Récupère et formate les enseignants pour les selects en une seule opération
   */
  async getTeachersForSelect(params?: { department?: number }): Promise<TeacherForSelect[]> {
    const teachers = await this.getTeachers(params);
    return this.formatTeachersForSelect(teachers);
  },

  /**
   * Récupère le profil de l'enseignant connecté
   */
  async getMyProfile(teacherId: number): Promise<TeacherProfile> {
    return apiClient.get<TeacherProfile>(`/courses/teachers/${teacherId}/`);
  },

  /**
   * Trouve l'enseignant associé à un utilisateur
   */
  async getTeacherByUserId(userId: number): Promise<TeacherProfile | null> {
    try {
      const response = await apiClient.get<any>(`/courses/teachers/?user=${userId}`);
      const teachers = response.results || response || [];
      if (teachers.length > 0) {
        return teachers[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding teacher by user ID:', error);
      return null;
    }
  },

  /**
   * Récupère l'emploi du temps de la semaine pour un enseignant
   */
  async getMyWeeklySchedule(teacherId: number, weekStart?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('teacher', teacherId.toString());
    if (weekStart) {
      params.append('week_start', weekStart);
    }
    return apiClient.get<any>(`/schedules/sessions/?${params.toString()}`);
  },

  /**
   * Récupère les sessions du jour pour un enseignant
   */
  async getTodaySchedule(teacherId: number): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    // Utiliser assigned_teacher pour filtrer par enseignant
    const url = `/schedules/sessions/?assigned_teacher=${teacherId}&specific_date=${today}`;
    console.log('getTodaySchedule URL:', url);
    const response = await apiClient.get<any>(url);
    return response.results || response || [];
  },

  /**
   * Récupère les cours assignés à un enseignant
   */
  async getMyCourses(teacherId: number): Promise<any[]> {
    // Essayer avec assigned_teacher qui est souvent le nom du champ dans Django
    const response = await apiClient.get<any>(`/courses/courses/?assigned_teacher=${teacherId}`);
    console.log('getMyCourses URL:', `/courses/courses/?assigned_teacher=${teacherId}`);
    return response.results || response || [];
  },

  /**
   * Calcule les statistiques d'un enseignant à partir de ses sessions
   */
  async getMyStats(teacherId: number): Promise<TeacherStats> {
    try {
      // Get sessions for this week
      const today = new Date();
      const monday = new Date(today);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      const weekStart = monday.toISOString().split('T')[0];

      // Utiliser assigned_teacher pour filtrer
      const sessionsUrl = `/schedules/sessions/?assigned_teacher=${teacherId}&week_start=${weekStart}`;
      console.log('getMyStats sessions URL:', sessionsUrl);
      const weeklyResponse = await apiClient.get<any>(sessionsUrl);
      const weeklySessions = weeklyResponse.results || weeklyResponse || [];

      // Calculate hours this week
      let totalHoursThisWeek = 0;
      weeklySessions.forEach((session: any) => {
        const start = session.specific_start_time || session.time_slot_details?.start_time;
        const end = session.specific_end_time || session.time_slot_details?.end_time;
        if (start && end) {
          const [startH, startM] = start.split(':').map(Number);
          const [endH, endM] = end.split(':').map(Number);
          totalHoursThisWeek += ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
        }
      });

      // Get courses count avec assigned_teacher
      const coursesUrl = `/courses/courses/?assigned_teacher=${teacherId}`;
      console.log('getMyStats courses URL:', coursesUrl);
      const coursesResponse = await apiClient.get<any>(coursesUrl);
      const courses = coursesResponse.results || coursesResponse || [];

      return {
        total_courses: courses.length,
        total_hours_this_week: Math.round(totalHoursThisWeek),
        total_hours_this_month: Math.round(totalHoursThisWeek * 4), // Estimation
        total_students: 0, // Would need enrollment data
        sessions_this_week: weeklySessions.length
      };
    } catch (error) {
      console.error('Error calculating teacher stats:', error);
      return {
        total_courses: 0,
        total_hours_this_week: 0,
        total_hours_this_month: 0,
        total_students: 0,
        sessions_this_week: 0
      };
    }
  }
};
