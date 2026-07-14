import { PaymentMethod, PaymentStatus } from './payment';
import { AppointmentMode } from './provider';

export interface CreateBookingDraftInput {
  providerId: string;
  slot: string;
  appointmentMode: AppointmentMode;
  address?: string;
  note?: string;
}

export interface BookingDraft {
  id: string;
  providerId: string;
  slot: string;
  appointmentMode: AppointmentMode;
  address?: string;
  note?: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: 'pending_payment' | 'payment_failed' | 'expired';
  paymentStatus?: PaymentStatus | null;
}

export interface Booking {
  id: string;
  providerId: string;
  slot: string;
  appointmentMode: AppointmentMode;
  address?: string;
  note?: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: 'paid' | 'cancelled';
  confirmationCode: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
  paymentStatus?: PaymentStatus | null;
  refundTransactionId?: string | null;
  refundedAt?: string | null;
}

export interface UpdateBookingInput {
  bookingId: string;
  slot: string;
  appointmentMode: AppointmentMode;
  address?: string;
  note?: string;
}

export interface CancelBookingResult {
  id: string;
  status: 'cancelled';
  refundEligible: boolean;
  refundTransactionId: string | null;
}
