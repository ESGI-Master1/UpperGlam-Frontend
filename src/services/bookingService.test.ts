import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelBookingRequest,
  createBookingDraftRequest,
  listMyBookingsRequest,
  updateBookingRequest,
} from '@/api/bookings';
import { cancelBooking, createBookingDraft, getMyBookings, updateBooking } from './bookingService';

vi.mock('@/api/bookings', () => ({
  cancelBookingRequest: vi.fn(),
  checkoutBookingDraftRequest: vi.fn(),
  createBookingDraftRequest: vi.fn(),
  getBookingDraftByIdRequest: vi.fn(),
  listMyBookingsRequest: vi.fn(),
  updateBookingRequest: vi.fn(),
}));

const draftDto = {
  id: 12,
  providerId: 8,
  slot: '2026-07-20T10:00:00+02:00',
  appointmentMode: 'home' as const,
  address: '10 rue de Paris',
  note: null,
  amountCents: 4590,
  currency: 'EUR',
  createdAt: '2026-07-15T10:00:00Z',
  status: 'pending_payment' as const,
  paymentStatus: 'processing' as const,
};

const bookingDto = {
  ...draftDto,
  id: 42,
  status: 'paid' as const,
  confirmationCode: 'UG-42',
  paymentMethod: 'google_pay' as const,
  transactionId: 'tr_42',
  paymentStatus: 'succeeded' as const,
};

describe('bookingService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates home addresses before calling the API', async () => {
    await expect(
      createBookingDraft({
        providerId: '8',
        slot: draftDto.slot,
        appointmentMode: 'home',
        address: '   ',
      })
    ).rejects.toThrow('Adresse requise');
    expect(createBookingDraftRequest).not.toHaveBeenCalled();
  });

  it('normalizes draft inputs and maps cents to euros', async () => {
    vi.mocked(createBookingDraftRequest).mockResolvedValue(draftDto);

    await expect(
      createBookingDraft({
        providerId: '8',
        slot: draftDto.slot,
        appointmentMode: 'home',
        address: '  10 rue de Paris  ',
        note: '  Sans parfum  ',
      })
    ).resolves.toMatchObject({ id: '12', providerId: '8', amount: 45.9 });
    expect(createBookingDraftRequest).toHaveBeenCalledWith({
      providerId: 8,
      slot: draftDto.slot,
      appointmentMode: 'home',
      address: '10 rue de Paris',
      note: 'Sans parfum',
    });
  });

  it('maps booking lists and clears institute-only fields on updates', async () => {
    vi.mocked(listMyBookingsRequest).mockResolvedValue({ bookings: [bookingDto], meta: null });
    vi.mocked(updateBookingRequest).mockResolvedValue({
      ...bookingDto,
      appointmentMode: 'institute',
      address: null,
      note: null,
    });

    await expect(getMyBookings()).resolves.toEqual([
      expect.objectContaining({ id: '42', amount: 45.9, paymentStatus: 'succeeded' }),
    ]);
    await updateBooking({
      bookingId: '42',
      slot: draftDto.slot,
      appointmentMode: 'institute',
      address: 'ignored',
      note: '   ',
    });
    expect(updateBookingRequest).toHaveBeenCalledWith(42, {
      slot: draftDto.slot,
      appointmentMode: 'institute',
      address: null,
      note: null,
    });
  });

  it('preserves external ids when mapping cancellation results', async () => {
    vi.mocked(cancelBookingRequest).mockResolvedValue({
      id: 'external-booking',
      status: 'cancelled',
      refundEligible: true,
      refundTransactionId: 'refund-1',
    });

    await expect(cancelBooking('external-booking')).resolves.toEqual({
      id: 'external-booking',
      status: 'cancelled',
      refundEligible: true,
      refundTransactionId: 'refund-1',
    });
    expect(cancelBookingRequest).toHaveBeenCalledWith('external-booking');
  });
});
