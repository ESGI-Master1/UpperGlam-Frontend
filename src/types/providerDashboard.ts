import { AppointmentMode } from './provider';

export interface ProviderProfile {
  id: string;
  displayName: string;
  city: string;
  bio?: string | null;
  instituteAddress?: string | null;
  serviceModes: AppointmentMode[];
  homeServiceZones: string[];
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
  providerStatus: ProviderBookingStatus;
}

export type ProviderBookingStatus = 'pending' | 'accepted' | 'rejected' | 'slot_proposed';

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
  providerStatus: ProviderBookingStatus;
  providerResponseNote?: string | null;
  providerProposedSlotStartAt?: string | null;
  providerProposedSlotEndAt?: string | null;
  providerRespondedAt?: string | null;
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

export interface ProviderAvailabilityRule {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  appointmentMode?: AppointmentMode | null;
  isActive: boolean;
}

export interface ProviderAvailabilityClosure {
  id: string;
  startsAt: string;
  endsAt: string;
  reason?: string | null;
}

export interface ProviderAvailabilitySchedule {
  slots: ProviderAvailabilitySlot[];
  rules: ProviderAvailabilityRule[];
  closures: ProviderAvailabilityClosure[];
}

export interface ProviderService {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
  isActive: boolean;
}

export interface ProviderGalleryItem {
  id: string;
  mediaId: string;
  imageUrl?: string | null;
  title?: string | null;
  position: number;
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
  payouts?: {
    status: string;
    paidOutCents: number;
    pendingCents: number;
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

export interface ProviderCustomer {
  customerUserId: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  bookingCount: number;
  lastBookingAt?: string | null;
  totalAmountCents: number;
  note?: string | null;
  noteUpdatedAt?: string | null;
}

export interface UpdateProviderProfileInput {
  displayName?: string;
  city?: string;
  bio?: string | null;
  instituteAddress?: string | null;
  serviceModes?: AppointmentMode[];
  homeServiceZones?: string[];
  priceFromCents?: number | null;
}
