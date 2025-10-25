// src/lib/api/services/classRoomPreferences.ts
import { apiClient } from '../client';

export interface ClassRoomPreference {
  id: number;
  student_class: number;
  class_details: {
    id: number;
    code: string;
    name: string;
    level: string;
  };
  room: number;
  room_details: {
    id: number;
    code: string;
    name: string;
    capacity: number;
    building: string | null;
    building_code: string | null;
    has_computer: boolean;
    has_projector: boolean;
    is_laboratory: boolean;
  };
  priority: 1 | 2 | 3;
  priority_display: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassRoomPreferenceCreate {
  student_class: number;
  room: number;
  priority: 1 | 2 | 3;
  notes?: string;
  is_active?: boolean;
}

export interface AvailableRoom {
  id: number;
  code: string;
  name: string;
  building: string | null;
  building_code: string | null;
  capacity: number;
  has_computer: boolean;
  has_projector: boolean;
  is_laboratory: boolean;
}

export interface PreferencesByClass {
  class_id: number;
  total: number;
  grouped_by_priority: {
    obligatoire: ClassRoomPreference[];
    preferee: ClassRoomPreference[];
    acceptable: ClassRoomPreference[];
  };
  preferences: ClassRoomPreference[];
}

export interface BulkCreateResponse {
  created: number;
  failed: number;
  preferences: ClassRoomPreference[];
  errors: Array<{
    data: ClassRoomPreferenceCreate;
    errors: Record<string, string[]>;
  }>;
}

class ClassRoomPreferenceService {
  private readonly baseUrl = '/courses/class-room-preferences';

  async getAll(params?: {
    class_id?: number;
    room_id?: number;
    priority?: 1 | 2 | 3;
    active_only?: boolean;
  }): Promise<ClassRoomPreference[]> {
    return apiClient.get<ClassRoomPreference[]>(`${this.baseUrl}/`, params);
  }

  async getById(id: number): Promise<ClassRoomPreference> {
    return apiClient.get<ClassRoomPreference>(`${this.baseUrl}/${id}/`);
  }

  async getByClass(classId: number): Promise<PreferencesByClass> {
    return apiClient.get<PreferencesByClass>(`${this.baseUrl}/by_class/`, {
      class_id: classId
    });
  }

  async getAvailableRooms(classId: number): Promise<{ count: number; rooms: AvailableRoom[] }> {
    return apiClient.get<{ count: number; rooms: AvailableRoom[] }>(
      `${this.baseUrl}/available_rooms/`,
      { class_id: classId }
    );
  }

  async create(data: ClassRoomPreferenceCreate): Promise<ClassRoomPreference> {
    return apiClient.post<ClassRoomPreference>(`${this.baseUrl}/`, data);
  }

  async bulkCreate(preferences: ClassRoomPreferenceCreate[]): Promise<BulkCreateResponse> {
    return apiClient.post<BulkCreateResponse>(`${this.baseUrl}/bulk_create/`, {
      preferences
    });
  }

  async update(id: number, data: Partial<ClassRoomPreferenceCreate>): Promise<ClassRoomPreference> {
    return apiClient.patch<ClassRoomPreference>(`${this.baseUrl}/${id}/`, data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${id}/`);
  }
}

export const classRoomPreferenceService = new ClassRoomPreferenceService();
