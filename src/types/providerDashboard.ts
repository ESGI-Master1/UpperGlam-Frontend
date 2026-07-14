import { AppointmentMode } from './provider';

export interface ProviderProfile {
  id: string;
  displayName: string;
  city: string;
  bio?: string | null;
  instituteAddress?: string | null;
  serviceModes: AppointmentMode[];
  priceFromCents?: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
}

export interface ProviderDashboardStats {
  totalBookings: number;
  paidBookings: number;
  cancelledBookings: number;
  upcomingBookings: number;
  monthRevenueCents: number;
  openSlots: number;
  rating: number;
  reviewCount: number;
}

export interface ProviderDashboardBooking {
  id: string;
  slot: string;
  appointmentMode: AppointmentMode;
  amountCents: number;
  currency: string;
  status: 'paid' | 'cancelled';
}

export interface ProviderDashboard {
  provider: ProviderProfile;
  stats: ProviderDashboardStats;
  nextBookings: ProviderDashboardBooking[];
}

export interface ProviderBooking {
  id: string;
  slotStartAt: string;
  slotEndAt: string;
  appointmentMode: AppointmentMode;
  address?: string | null;
  note?: string | null;
  amountCents: number;
  currency: string;
  status: 'paid' | 'cancelled';
  confirmationCode: string;
  customer: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
}

export interface ProviderAvailabilitySlot {
  id: string;
  slotStartAt: string;
  slotEndAt: string;
  isBooked: boolean;
  bookingId?: string | null;
}

export interface ProviderRevenue {
  currency: string;
  month: {
    amountCents: number;
    bookingCount: number;
  };
  year: {
    amountCents: number;
    bookingCount: number;
  };
  transactions: Array<{
    bookingId: string;
    slot: string;
    amountCents: number;
    currency: string;
    status: 'paid' | 'cancelled';
  }>;
}

export interface UpdateProviderProfileInput {
  displayName?: string;
  city?: string;
  bio?: string | null;
  instituteAddress?: string | null;
  serviceModes?: AppointmentMode[];
  priceFromCents?: number | null;
}

