import { ApiSuccessResponse, PaginatedMeta } from '@/types/api';
import {
  ProviderAvailabilityClosure,
  ProviderAvailabilityRule,
  ProviderAvailabilitySchedule,
  ProviderAvailabilitySlot,
  ProviderBooking,
  ProviderDashboard,
  ProviderProfile,
  ProviderRevenue,
  ProviderService,
  UpdateProviderProfileInput,
} from '@/types/providerDashboard';
import { apiClient } from './client';

export interface CreateProviderAvailabilityPayload {
  slotStartAt: string;
  slotEndAt: string;
}

export interface CreateProviderAvailabilityRulePayload {
  weekday: number;
  startTime: string;
  endTime: string;
  appointmentMode?: 'home' | 'institute' | null;
  isActive?: boolean;
}

export interface CreateProviderAvailabilityClosurePayload {
  startsAt: string;
  endsAt: string;
  reason?: string | null;
}

export interface UpsertProviderServicePayload {
  name: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
  isActive?: boolean;
}

export interface ProviderBookingActionResult {
  id: number | string;
  providerStatus: ProviderBooking['providerStatus'];
  providerProposedSlotStartAt?: string | null;
  providerProposedSlotEndAt?: string | null;
}

export const getProviderDashboardRequest = async (): Promise<ProviderDashboard> => {
  const response =
    await apiClient.get<ApiSuccessResponse<ProviderDashboard>>('/providers/me/dashboard');
  return response.data;
};

export const listProviderBookingsRequest = async (query?: {
  status?: 'paid' | 'cancelled';
  page?: number;
  limit?: number;
}): Promise<{ bookings: ProviderBooking[]; meta: PaginatedMeta | null }> => {
  const response = await apiClient.get<ApiSuccessResponse<ProviderBooking[], PaginatedMeta>>(
    '/providers/me/bookings',
    { params: query }
  );
  return {
    bookings: response.data,
    meta: response.meta ?? null,
  };
};

export const acceptProviderBookingRequest = async (
  bookingId: string
): Promise<ProviderBookingActionResult> => {
  const response = await apiClient.post<ApiSuccessResponse<ProviderBookingActionResult>>(
    `/providers/me/bookings/${bookingId}/accept`
  );
  return response.data;
};

export const rejectProviderBookingRequest = async (
  bookingId: string,
  reason: string
): Promise<ProviderBookingActionResult> => {
  const response = await apiClient.post<ApiSuccessResponse<ProviderBookingActionResult>>(
    `/providers/me/bookings/${bookingId}/reject`,
    { reason }
  );
  return response.data;
};

export const proposeProviderBookingSlotRequest = async (
  bookingId: string,
  payload: {
    note?: string;
    slotEndAt: string;
    slotStartAt: string;
  }
): Promise<ProviderBookingActionResult> => {
  const response = await apiClient.post<ApiSuccessResponse<ProviderBookingActionResult>>(
    `/providers/me/bookings/${bookingId}/propose-slot`,
    payload
  );
  return response.data;
};

export const listProviderAvailabilityRequest = async (query?: {
  from?: string;
  to?: string;
}): Promise<ProviderAvailabilitySchedule> => {
  const response = await apiClient.get<
    ApiSuccessResponse<ProviderAvailabilitySchedule | ProviderAvailabilitySlot[]>
  >(
    '/providers/me/availability',
    { params: query }
  );
  if (Array.isArray(response.data)) {
    return { slots: response.data, rules: [], closures: [] };
  }
  return response.data;
};

export const createProviderAvailabilityRequest = async (
  payload: CreateProviderAvailabilityPayload
): Promise<ProviderAvailabilitySlot> => {
  const response = await apiClient.post<ApiSuccessResponse<ProviderAvailabilitySlot>>(
    '/providers/me/availability',
    payload
  );
  return response.data;
};

export const deleteProviderAvailabilityRequest = async (slotId: string): Promise<void> => {
  await apiClient.delete<ApiSuccessResponse<{ deleted: boolean }>>(
    `/providers/me/availability/${slotId}`
  );
};

export const createProviderAvailabilityRuleRequest = async (
  payload: CreateProviderAvailabilityRulePayload
): Promise<ProviderAvailabilityRule> => {
  const response = await apiClient.post<ApiSuccessResponse<ProviderAvailabilityRule>>(
    '/providers/me/availability/rules',
    payload
  );
  return response.data;
};

export const deleteProviderAvailabilityRuleRequest = async (ruleId: string): Promise<void> => {
  await apiClient.delete<ApiSuccessResponse<{ deleted: boolean }>>(
    `/providers/me/availability/rules/${ruleId}`
  );
};

export const createProviderAvailabilityClosureRequest = async (
  payload: CreateProviderAvailabilityClosurePayload
): Promise<ProviderAvailabilityClosure> => {
  const response = await apiClient.post<ApiSuccessResponse<ProviderAvailabilityClosure>>(
    '/providers/me/availability/closures',
    payload
  );
  return response.data;
};

export const deleteProviderAvailabilityClosureRequest = async (
  closureId: string
): Promise<void> => {
  await apiClient.delete<ApiSuccessResponse<{ deleted: boolean }>>(
    `/providers/me/availability/closures/${closureId}`
  );
};

export const getProviderProfileRequest = async (): Promise<ProviderProfile> => {
  const response =
    await apiClient.get<ApiSuccessResponse<ProviderProfile>>('/providers/me/profile');
  return response.data;
};

export const updateProviderProfileRequest = async (
  payload: UpdateProviderProfileInput
): Promise<ProviderProfile> => {
  const response = await apiClient.patch<ApiSuccessResponse<ProviderProfile>>(
    '/providers/me/profile',
    payload
  );
  return response.data;
};

export const listProviderServicesRequest = async (): Promise<ProviderService[]> => {
  const response =
    await apiClient.get<ApiSuccessResponse<ProviderService[]>>('/providers/me/services');
  return response.data;
};

export const createProviderServiceRequest = async (
  payload: UpsertProviderServicePayload
): Promise<ProviderService> => {
  const response = await apiClient.post<ApiSuccessResponse<ProviderService>>(
    '/providers/me/services',
    payload
  );
  return response.data;
};

export const updateProviderServiceRequest = async (
  serviceId: string,
  payload: UpsertProviderServicePayload
): Promise<ProviderService> => {
  const response = await apiClient.put<ApiSuccessResponse<ProviderService>>(
    `/providers/me/services/${serviceId}`,
    payload
  );
  return response.data;
};

export const deleteProviderServiceRequest = async (serviceId: string): Promise<void> => {
  await apiClient.delete<ApiSuccessResponse<{ deleted: boolean }>>(
    `/providers/me/services/${serviceId}`
  );
};

export const getProviderRevenueRequest = async (): Promise<ProviderRevenue> => {
  const response =
    await apiClient.get<ApiSuccessResponse<ProviderRevenue>>('/providers/me/revenue');
  return response.data;
};
