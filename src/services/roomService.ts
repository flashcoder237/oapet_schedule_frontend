import apiClient from '../lib/api/client';

// Types
export interface Building {
  id: number;
  name: string;
  code: string;
  address?: string;
  total_floors?: number;
  description?: string;
  has_elevator?: boolean;
  has_parking?: boolean;
  is_active: boolean;
  rooms_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoomType {
  id: number;
  name: string;
  description?: string;
  default_capacity?: number;
  requires_special_equipment?: boolean;
  rooms_count?: number;
}

export interface Room {
  id: number;
  code: string;
  name: string;
  building: number;
  building_name?: string;
  building_code?: string;
  room_type: number;
  room_type_name?: string;
  floor: string;
  capacity: number;
  area?: number;
  description?: string;
  has_projector: boolean;
  has_computer: boolean;
  has_whiteboard: boolean;
  has_blackboard: boolean;
  has_air_conditioning: boolean;
  has_internet: boolean;
  has_audio_system: boolean;
  is_laboratory: boolean;
  laboratory_type?: string;
  is_accessible: boolean;
  has_emergency_exit: boolean;
  is_bookable: boolean;
  priority_level: number;
  maintenance_notes?: string;
  is_active: boolean;
  equipment_summary?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateBuildingData {
  name: string;
  code: string;
  address?: string;
  total_floors?: number;
  description?: string;
  has_elevator?: boolean;
  has_parking?: boolean;
  is_active?: boolean;
}

export interface CreateRoomTypeData {
  name: string;
  description?: string;
  default_capacity?: number;
  requires_special_equipment?: boolean;
}

export interface CreateRoomData {
  code: string;
  name: string;
  building: number | null;
  room_type: number;
  floor: string;
  capacity: number;
  area?: number;
  description?: string;
  has_projector?: boolean;
  has_computer?: boolean;
  has_whiteboard?: boolean;
  has_blackboard?: boolean;
  has_air_conditioning?: boolean;
  has_internet?: boolean;
  has_audio_system?: boolean;
  is_laboratory?: boolean;
  laboratory_type?: string;
  is_accessible?: boolean;
  has_emergency_exit?: boolean;
  is_bookable?: boolean;
  priority_level?: number;
  maintenance_notes?: string;
  is_active?: boolean;
}

// Type helper pour les réponses paginées
interface PaginatedResponse<T> {
  results: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// Type helper pour les réponses avec data
interface ApiResponse<T> {
  data: T;
}

class RoomService {
  // ==================== BUILDINGS ====================

  async getBuildings(): Promise<Building[]> {
    try {
      const response = await apiClient.get('/rooms/buildings/') as unknown;
      
      if (Array.isArray(response)) {
        return response as Building[];
      }
      
      if (response && typeof response === 'object' && 'results' in response) {
        const paginatedResponse = response as PaginatedResponse<Building>;
        return paginatedResponse.results || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching buildings:', error);
      return [];
    }
  }

  async getBuildingById(id: number): Promise<Building> {
    const response = await apiClient.get(`/rooms/buildings/${id}/`) as ApiResponse<Building>;
    return response.data;
  }

  async createBuilding(data: CreateBuildingData): Promise<Building> {
    const response = await apiClient.post('/rooms/buildings/', data) as ApiResponse<Building>;
    return response.data;
  }

  async updateBuilding(id: number, data: Partial<CreateBuildingData>): Promise<Building> {
    const response = await apiClient.patch(`/rooms/buildings/${id}/`, data) as ApiResponse<Building>;
    return response.data;
  }

  async deleteBuilding(id: number): Promise<void> {
    await apiClient.delete(`/rooms/buildings/${id}/`);
  }

  async bulkDeleteBuildings(ids: number[]): Promise<void> {
    await Promise.all(ids.map(id => this.deleteBuilding(id)));
  }

  // ==================== ROOM TYPES ====================

  async getRoomTypes(): Promise<RoomType[]> {
    try {
      const response = await apiClient.get('/rooms/room-types/') as unknown;
      
      if (Array.isArray(response)) {
        return response as RoomType[];
      }
      
      if (response && typeof response === 'object' && 'results' in response) {
        const paginatedResponse = response as PaginatedResponse<RoomType>;
        return paginatedResponse.results || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching room types:', error);
      return [];
    }
  }

  async getRoomTypeById(id: number): Promise<RoomType> {
    const response = await apiClient.get(`/rooms/room-types/${id}/`) as ApiResponse<RoomType>;
    return response.data;
  }

  async createRoomType(data: CreateRoomTypeData): Promise<RoomType> {
    const response = await apiClient.post('/rooms/room-types/', data) as ApiResponse<RoomType>;
    return response.data;
  }

  async updateRoomType(id: number, data: Partial<CreateRoomTypeData>): Promise<RoomType> {
    const response = await apiClient.patch(`/rooms/room-types/${id}/`, data) as ApiResponse<RoomType>;
    return response.data;
  }

  async deleteRoomType(id: number): Promise<void> {
    await apiClient.delete(`/rooms/room-types/${id}/`);
  }

  async bulkDeleteRoomTypes(ids: number[]): Promise<void> {
    await Promise.all(ids.map(id => this.deleteRoomType(id)));
  }

  // ==================== ROOMS ====================

  async getRooms(params?: {
    building?: number;
    room_type?: number;
    min_capacity?: number;
    search?: string;
    page_size?: number;
  }): Promise<Room[]> {
    try {
      const response = await apiClient.get('/rooms/rooms/', { params }) as unknown;
      
      if (response && typeof response === 'object' && 'data' in response) {
        const apiResponse = response as ApiResponse<unknown>;
        
        if (Array.isArray(apiResponse.data)) {
          return apiResponse.data as Room[];
        }
        
        if (apiResponse.data && typeof apiResponse.data === 'object' && 'results' in apiResponse.data) {
          const paginatedResponse = apiResponse.data as PaginatedResponse<Room>;
          return paginatedResponse.results || [];
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  }

  async getRoomById(id: number): Promise<Room> {
    const response = await apiClient.get(`/rooms/rooms/${id}/`) as ApiResponse<Room>;
    return response.data;
  }

  async createRoom(data: CreateRoomData): Promise<Room> {
    const response = await apiClient.post('/rooms/rooms/', data) as ApiResponse<Room>;
    return response.data;
  }

  async updateRoom(id: number, data: Partial<CreateRoomData>): Promise<Room> {
    const response = await apiClient.patch(`/rooms/rooms/${id}/`, data) as ApiResponse<Room>;
    return response.data;
  }

  async deleteRoom(id: number): Promise<void> {
    await apiClient.delete(`/rooms/rooms/${id}/`);
  }

  async bulkDeleteRooms(ids: number[]): Promise<void> {
    await Promise.all(ids.map(id => this.deleteRoom(id)));
  }

  async bulkUpdateRooms(ids: number[], data: Partial<CreateRoomData>): Promise<void> {
    await Promise.all(ids.map(id => this.updateRoom(id, data)));
  }
}

export const roomService = new RoomService();
export default roomService;