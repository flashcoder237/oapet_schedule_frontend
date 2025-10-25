// src/lib/api/services/rooms.ts
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { 
  Room, 
  PaginatedResponse,
  RoomSearchParams 
} from '@/types/api';

export const roomService = {
  // Salles
  async getRooms(params?: {
    building?: string;
    room_type?: string;
    min_capacity?: number;
    max_capacity?: number;
    has_projector?: boolean;
    has_computer?: boolean;
    is_laboratory?: boolean;
    search?: string;
    page_size?: number;
  }): Promise<PaginatedResponse<Room>> {
    return apiClient.get<PaginatedResponse<Room>>(API_ENDPOINTS.ROOMS, params);
  },

  async getRoom(id: number): Promise<Room> {
    return apiClient.get<Room>(`${API_ENDPOINTS.ROOMS}${id}/`);
  },

  async createRoom(data: Partial<Room>): Promise<Room> {
    return apiClient.post<Room>(API_ENDPOINTS.ROOMS, data);
  },

  async updateRoom(id: number, data: Partial<Room>): Promise<Room> {
    return apiClient.patch<Room>(`${API_ENDPOINTS.ROOMS}${id}/`, data);
  },

  async deleteRoom(id: number): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.ROOMS}${id}/`);
  },

  // Recherche de salles disponibles
  async searchAvailableRooms(params: RoomSearchParams): Promise<Room[]> {
    return apiClient.post<Room[]>(API_ENDPOINTS.ROOM_SEARCH, params);
  },

  // Bâtiments
  async getBuildings(): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.BUILDINGS);
  },

  // Types de salles
  async getRoomTypes(): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.ROOM_TYPES);
  },

  // Disponibilités
  async getRoomAvailability(params?: {
    room?: number;
    day?: string;
  }): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.ROOM_AVAILABILITY, params);
  },

  // Réservations
  async getRoomBookings(params?: {
    room?: number;
    type?: string;
    approved_only?: boolean;
  }): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.ROOM_BOOKINGS, params);
  },

  async approveBooking(id: number): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${API_ENDPOINTS.ROOM_BOOKINGS}${id}/approve/`);
  },

  // Statistiques des salles
  async getRoomsStats(): Promise<any> {
    return apiClient.get(`${API_ENDPOINTS.ROOMS}stats/`);
  },

  async getRoomStats(): Promise<any> {
    return apiClient.get(`${API_ENDPOINTS.ROOMS}stats/`);
  },

  // Taux d'occupation d'une salle
  async getRoomOccupancy(id: number): Promise<any> {
    return apiClient.get(`${API_ENDPOINTS.ROOMS}${id}/occupancy/`);
  },

  // Équipements des salles
  async getRoomEquipment(params?: { room?: number }): Promise<any> {
    return apiClient.get(`${API_ENDPOINTS.ROOM_EQUIPMENT}`, params);
  },

  // Maintenance
  async getMaintenanceRecords(params?: {
    room?: number;
    type?: string;
    completed_only?: boolean;
  }): Promise<any> {
    return apiClient.get(`${API_ENDPOINTS.MAINTENANCE_RECORDS}`, params);
  },

  async markMaintenanceCompleted(id: number, notes?: string): Promise<any> {
    return apiClient.post(`${API_ENDPOINTS.MAINTENANCE_RECORDS}${id}/mark_completed/`, { notes });
  },
};