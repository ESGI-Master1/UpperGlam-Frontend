import {
  AuthApiResponse,
  AuthPayloadDTO,
  ForgotPasswordPayloadDTO,
  ResetPasswordPayloadDTO,
} from '@/types/auth';
import { apiClient } from './client';

export const loginRequest = async (payload: AuthPayloadDTO): Promise<AuthApiResponse> => {
  return apiClient.post<AuthApiResponse>('/auth/login', payload);
};

export const registerRequest = async (payload: AuthPayloadDTO): Promise<AuthApiResponse> => {
  return apiClient.post<AuthApiResponse>('/auth/register', payload);
};

export const forgotPasswordRequest = async (
  payload: ForgotPasswordPayloadDTO
): Promise<AuthApiResponse> => {
  return apiClient.post<AuthApiResponse>('/auth/forgot-password', payload);
};

export const resetPasswordRequest = async (
  payload: ResetPasswordPayloadDTO
): Promise<AuthApiResponse> => {
  return apiClient.post<AuthApiResponse>('/auth/reset-password-with-code', payload);
};
