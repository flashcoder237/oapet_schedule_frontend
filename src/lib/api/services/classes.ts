// src/lib/api/services/classes.ts
import { apiClient } from '../client';
import type { PaginatedResponse } from '@/types/api';

export interface StudentClass {
  id: number;
  code: string;
  name: string;
  level: string;
  department: number;
  department_name: string;
  curriculum: number | null;
  curriculum_name: string | null;
  student_count: number;
  max_capacity: number;
  occupancy_rate: number;
  academic_year: string;
  is_active: boolean;
  courses_count: number;
  created_at: string;
}

export interface ClassCourse {
  id: number;
  course: number;
  course_code: string;
  course_name: string;
  course_type: string;
  teacher_name: string;
  is_mandatory: boolean;
  semester: string;
  effective_student_count: number;
  order?: number;
  specific_student_count?: number;
  is_active?: boolean;
}

export interface Department {
  id: number;
  code: string;
  name: string;
}

export interface Curriculum {
  id: number;
  code: string;
  name: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  course_type: string;
  teacher_name: string;
}

export const classService = {
  // Classes
  async getClasses(params?: string | {
    level?: string;
    department?: number;
    academic_year?: string;
    is_active?: boolean;
    teacher?: number;
  }): Promise<StudentClass[]> {
    let url = '/courses/classes/';

    // Si params est une chaîne de requête, l'ajouter directement à l'URL
    if (typeof params === 'string') {
      url += params;
      const response = await apiClient.get<any>(url);
      if (response && Array.isArray(response.results)) {
        return response.results;
      }
      return Array.isArray(response) ? response : [];
    }

    // Sinon, utiliser le comportement normal avec des paramètres d'objet
    const response = await apiClient.get<any>(url, params);
    if (response && Array.isArray(response.results)) {
      return response.results;
    }
    // Fallback si la réponse est déjà un tableau
    return Array.isArray(response) ? response : [];
  },

  async getClass(id: number): Promise<StudentClass> {
    return apiClient.get<StudentClass>(`/courses/classes/${id}/`);
  },

  async createClass(data: Partial<StudentClass>): Promise<StudentClass> {
    return apiClient.post<StudentClass>('/courses/classes/', data);
  },

  async updateClass(id: number, data: Partial<StudentClass>): Promise<StudentClass> {
    return apiClient.put<StudentClass>(`/courses/classes/${id}/`, data);
  },

  async deleteClass(id: number): Promise<void> {
    return apiClient.delete(`/courses/classes/${id}/`);
  },

  async getClassStatistics(): Promise<any> {
    return apiClient.get('/courses/classes/statistics/');
  },

  // Cours d'une classe
  async getClassCourses(classId: number): Promise<ClassCourse[]> {
    return apiClient.get<ClassCourse[]>(`/courses/classes/${classId}/courses/`);
  },

  async assignCourse(classId: number, data: {
    course: number;
    is_mandatory?: boolean;
    semester?: string;
  }): Promise<ClassCourse> {
    return apiClient.post<ClassCourse>(`/courses/classes/${classId}/assign_course/`, data);
  },

  async assignCoursesBulk(classId: number, data: {
    courses: number[];
    is_mandatory?: boolean;
    semester?: string;
  }): Promise<{
    success: boolean;
    assigned: number;
    errors: string[];
    assignments: ClassCourse[];
  }> {
    return apiClient.post(`/courses/classes/${classId}/assign_courses_bulk/`, data);
  },

  async removeCourse(classId: number, courseId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/courses/classes/${classId}/remove_course/`, {
      course_id: courseId
    });
  },

  // Départements
  async getDepartments(params?: { search?: string }): Promise<Department[]> {
    const response = await apiClient.get<any>('/courses/departments/', params);
    // L'API retourne une réponse paginée {count, next, previous, results}
    if (response && Array.isArray(response.results)) {
      return response.results;
    }
    // Fallback si la réponse est déjà un tableau
    return Array.isArray(response) ? response : [];
  },

  // Cursus
  async getCurricula(params?: { search?: string }): Promise<Curriculum[]> {
    const response = await apiClient.get<any>('/courses/curricula/', params);
    // L'API retourne une réponse paginée {count, next, previous, results}
    if (response && Array.isArray(response.results)) {
      return response.results;
    }
    // Fallback si la réponse est déjà un tableau
    return Array.isArray(response) ? response : [];
  },

  // Cours disponibles
  async getAvailableCourses(params?: { search?: string }): Promise<Course[]> {
    const response = await apiClient.get<any>('/courses/courses/', params);
    // L'API retourne une réponse paginée {count, next, previous, results}
    if (response && Array.isArray(response.results)) {
      return response.results;
    }
    // Fallback si la réponse est déjà un tableau
    return Array.isArray(response) ? response : [];
  },
};
