import { ProviderTag } from '@/types/provider';
import { ApiSuccessResponse } from '@/types/api';
import { apiClient } from './client';

export interface UserPreferencesDto {
  reminderEnabled: boolean;
  offersEnabled: boolean;
  analyticsEnabled: boolean;
}

export interface UserProfileDto {
  id: number | string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  preferences?: UserPreferencesDto;
}

export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ShortcutSearchDto {
  query?: string;
  tags?: ProviderTag[];
  location?: string;
  date?: string;
  updatedAt: string;
}

export interface UserShortcutsDto {
  recentProviderIds: Array<number | string>;
  lastSearch: ShortcutSearchDto | null;
}

export interface SaveUserShortcutsPayload {
  recentProviderIds: Array<number | string>;
  lastSearch: ShortcutSearchDto | null;
}

export const getMeRequest = async (): Promise<UserProfileDto> => {
  const response = await apiClient.get<ApiSuccessResponse<UserProfileDto>>('/users/me');
  return response.data;
};

export const updateMeRequest = async (
  payload: UpdateUserProfilePayload
): Promise<UserProfileDto> => {
  const response = await apiClient.patch<ApiSuccessResponse<UserProfileDto>>('/users/me', payload);
  return response.data;
};

export const updateMyPreferencesRequest = async (
  payload: UserPreferencesDto
): Promise<UserPreferencesDto> => {
  const response = await apiClient.patch<ApiSuccessResponse<UserPreferencesDto>>(
    '/users/me/preferences',
    payload
  );
  return response.data;
};

export const getMyShortcutsRequest = async (): Promise<UserShortcutsDto> => {
  const response = await apiClient.get<ApiSuccessResponse<UserShortcutsDto>>('/users/me/shortcuts');
  return response.data;
};

export const saveMyShortcutsRequest = async (
  payload: SaveUserShortcutsPayload
): Promise<UserShortcutsDto> => {
  const response = await apiClient.put<ApiSuccessResponse<UserShortcutsDto>>(
    '/users/me/shortcuts',
    payload
  );
  return response.data;
};
