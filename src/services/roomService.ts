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
  building: number | null; // null pour les salles isolées
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

class RoomService {
  // ==================== BUILDINGS ====================

  async getBuildings(): Promise<Building[]> {
    try {
      const response = await apiClient.get('/rooms/buildings/');
      // Gérer les deux formats possibles: paginated {results: []} ou array []
      if (response && Array.isArray(response)) {
        return response;
      }
      if (response && response.results && Array.isArray(response.results)) {
        return response.results;
      }
      return [];
    } catch (error) {
      console.error('Error fetching buildings:', error);
      return [];
    }
  }

  async getBuildingById(id: number): Promise<Building> {
    const response = await apiClient.get(`/rooms/buildings/${id}/`);
    return response.data;
  }

  async createBuilding(data: CreateBuildingData): Promise<Building> {
    const response = await apiClient.post('/rooms/buildings/', data);
    return response.data;
  }

  async updateBuilding(id: number, data: Partial<CreateBuildingData>): Promise<Building> {
    const response = await apiClient.patch(`/rooms/buildings/${id}/`, data);
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
      const response = await apiClient.get('/rooms/room-types/');
      // Gérer les deux formats possibles: paginated {results: []} ou array []
      if (response && Array.isArray(response)) {
        return response;
      }
      if (response && response.results && Array.isArray(response.results)) {
        return response.results;
      }
      return [];
    } catch (error) {
      console.error('Error fetching room types:', error);
      return [];
    }
  }

  async getRoomTypeById(id: number): Promise<RoomType> {
    const response = await apiClient.get(`/rooms/room-types/${id}/`);
    return response.data;
  }

  async createRoomType(data: CreateRoomTypeData): Promise<RoomType> {
    const response = await apiClient.post('/rooms/room-types/', data);
    return response.data;
  }

  async updateRoomType(id: number, data: Partial<CreateRoomTypeData>): Promise<RoomType> {
    const response = await apiClient.patch(`/rooms/room-types/${id}/`, data);
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
      const response = await apiClient.get('/rooms/rooms/', { params });
      // Gérer les deux formats possibles: paginated {results: []} ou array []
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      return [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  }

  async getRoomById(id: number): Promise<Room> {
    const response = await apiClient.get(`/rooms/rooms/${id}/`);
    return response.data;
  }

  async createRoom(data: CreateRoomData): Promise<Room> {
    const response = await apiClient.post('/rooms/rooms/', data);
    return response.data;
  }

  async updateRoom(id: number, data: Partial<CreateRoomData>): Promise<Room> {
    const response = await apiClient.patch(`/rooms/rooms/${id}/`, data);
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
