import { ApiSuccessResponse, PaginatedMeta } from '@/types/api';
import { PaymentMethod } from '@/types/payment';
import { AppointmentMode } from '@/types/provider';
import { apiClient } from './client';

export interface BookingDraftDto {
  id: number | string;
  providerId: number | string;
  slot: string;
  appointmentMode: AppointmentMode;
  address?: string | null;
  note?: string | null;
  amountCents: number;
  currency: string;
  createdAt: string;
  status: 'pending_payment' | 'payment_failed' | 'expired';
}

export interface BookingDto {
  id: number | string;
  providerId: number | string;
  slot: string;
  appointmentMode: AppointmentMode;
  address?: string | null;
  note?: string | null;
  amountCents: number;
  currency: string;
  createdAt: string;
  status: 'paid' | 'cancelled';
  confirmationCode: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
}

export interface CreateBookingDraftPayload {
  providerId: number | string;
  slot: string;
  appointmentMode: AppointmentMode;
  address?: string;
  note?: string;
}

export interface CheckoutDraftPayload {
  method: PaymentMethod;
  platformPayToken: string;
}

export interface UpdateBookingPayload {
  slot: string;
  appointmentMode: AppointmentMode;
  address?: string | null;
  note?: string | null;
}

export interface ListMyBookingsQuery {
  status?: 'paid' | 'cancelled';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

const bookingPath = (bookingId: number | string): string => {
  return `/bookings/${String(bookingId)}`;
};

const draftPath = (draftId: number | string): string => {
  return `/bookings/drafts/${String(draftId)}`;
};

export const createBookingDraftRequest = async (
  payload: CreateBookingDraftPayload
): Promise<BookingDraftDto> => {
  const response = await apiClient.post<ApiSuccessResponse<BookingDraftDto>>(
    '/bookings/drafts',
    payload
  );
  return response.data;
};

export const getBookingDraftByIdRequest = async (
  draftId: number | string
): Promise<BookingDraftDto> => {
  const response = await apiClient.get<ApiSuccessResponse<BookingDraftDto>>(draftPath(draftId));
  return response.data;
};

export const checkoutBookingDraftRequest = async (
  draftId: number | string,
  payload: CheckoutDraftPayload
): Promise<BookingDto> => {
  const response = await apiClient.post<ApiSuccessResponse<BookingDto>>(
    `${draftPath(draftId)}/checkout`,
    payload
  );
  return response.data;
};

export const listMyBookingsRequest = async (
  query?: ListMyBookingsQuery
): Promise<{ bookings: BookingDto[]; meta: PaginatedMeta | null }> => {
  const response = await apiClient.get<ApiSuccessResponse<BookingDto[], PaginatedMeta>>(
    '/bookings/me',
    { params: query }
  );
  return {
    bookings: response.data,
    meta: response.meta ?? null,
  };
};

export const updateBookingRequest = async (
  bookingId: number | string,
  payload: UpdateBookingPayload
): Promise<BookingDto> => {
  const response = await apiClient.patch<ApiSuccessResponse<BookingDto>>(
    bookingPath(bookingId),
    payload
  );
  return response.data;
};

export const cancelBookingRequest = async (
  bookingId: number | string
): Promise<{ id: number | string; status: 'cancelled' }> => {
  const response = await apiClient.post<ApiSuccessResponse<{ id: number | string; status: 'cancelled' }>>(
    `${bookingPath(bookingId)}/cancel`
  );
  return response.data;
};
