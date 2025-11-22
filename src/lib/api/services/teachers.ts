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
   * Utilise le nouvel endpoint qui retourne les SessionOccurrence (avec modifications admin)
   */
  async getTodaySchedule(teacherId: number): Promise<any[]> {
    // Utiliser le nouvel endpoint qui utilise les occurrences
    const url = `/courses/teachers/${teacherId}/today_sessions/`;
    console.log('getTodaySchedule URL:', url);
    const response = await apiClient.get<any>(url);
    return response || [];
  },

  /**
   * Récupère le prochain cours à venir pour un enseignant (dans les 7 prochains jours)
   * Utilise le nouvel endpoint qui retourne les SessionOccurrence (avec modifications admin)
   */
  async getNextUpcomingSession(teacherId: number): Promise<any | null> {
    try {
      // Utiliser le nouvel endpoint qui retourne les sessions de la semaine avec occurrences
      const url = `/courses/teachers/${teacherId}/weekly_sessions/`;
      const response = await apiClient.get<any>(url);
      const sessions = response.sessions || response || [];

      if (sessions.length === 0) {
        return null;
      }

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];

      // Trier par date et heure
      const sortedSessions = sessions.sort((a: any, b: any) => {
        const dateCompare = (a.specific_date || '').localeCompare(b.specific_date || '');
        if (dateCompare !== 0) return dateCompare;
        const aTime = a.specific_start_time || '';
        const bTime = b.specific_start_time || '';
        return aTime.localeCompare(bTime);
      });

      // Trouver le prochain cours
      for (const session of sortedSessions) {
        const sessionDate = session.specific_date;
        const startTime = session.specific_start_time;

        if (!sessionDate || !startTime) continue;

        // Si c'est aujourd'hui, vérifier que le cours n'est pas passé
        if (sessionDate === todayStr) {
          const [h, m] = startTime.split(':').map(Number);
          if (h * 60 + m > currentMinutes) {
            return { ...session, upcoming_date: sessionDate };
          }
        } else if (sessionDate > todayStr) {
          // Pour les jours futurs
          return { ...session, upcoming_date: sessionDate };
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching next upcoming session:', error);
      return null;
    }
  },

  /**
   * Récupère les cours assignés à un enseignant
   */
  async getMyCourses(teacherId: number): Promise<any[]> {
    // Utiliser teacher pour filtrer (correspond au backend)
    const url = `/courses/courses/?teacher=${teacherId}`;
    console.log('getMyCourses URL:', url);
    const response = await apiClient.get<any>(url);
    return response.results || response || [];
  },

  /**
   * Calcule les statistiques d'un enseignant à partir de ses sessions
   * Utilise le nouvel endpoint qui retourne les SessionOccurrence (avec modifications admin)
   */
  async getMyStats(teacherId: number): Promise<TeacherStats> {
    try {
      // Utiliser le nouvel endpoint qui retourne les sessions de la semaine avec occurrences
      const url = `/courses/teachers/${teacherId}/weekly_sessions/`;
      console.log('getMyStats URL:', url);
      const weeklyResponse = await apiClient.get<any>(url);
      const weeklySessions = weeklyResponse.sessions || weeklyResponse || [];

      // Calculate hours this week
      let totalHoursThisWeek = 0;
      weeklySessions.forEach((session: any) => {
        const start = session.specific_start_time;
        const end = session.specific_end_time;
        if (start && end) {
          const [startH, startM] = start.split(':').map(Number);
          const [endH, endM] = end.split(':').map(Number);
          totalHoursThisWeek += ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
        }
      });

      // Get courses count
      const coursesUrl = `/courses/courses/?teacher=${teacherId}`;
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
