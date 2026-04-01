import {
  BookingDto,
  BookingDraftDto,
  cancelBookingRequest,
  checkoutBookingDraftRequest,
  createBookingDraftRequest,
  getBookingDraftByIdRequest,
  listMyBookingsRequest,
  updateBookingRequest,
} from '@/api/bookings';
import {
  Booking,
  BookingDraft,
  CreateBookingDraftInput,
  UpdateBookingInput,
} from '@/types/booking';
import { PaymentMethod } from '@/types/payment';

interface CheckoutBookingDraftInput {
  method: PaymentMethod;
  platformPayToken: string;
}

const centsToEuros = (amountCents: number): number => amountCents / 100;

const toApiId = (value: string): number | string => {
  const numericId = Number(value);
  return Number.isInteger(numericId) ? numericId : value;
};

const mapBookingDraft = (dto: BookingDraftDto): BookingDraft => {
  return {
    id: String(dto.id),
    providerId: String(dto.providerId),
    slot: dto.slot,
    appointmentMode: dto.appointmentMode,
    address: dto.address ?? undefined,
    note: dto.note ?? undefined,
    amount: centsToEuros(dto.amountCents),
    currency: dto.currency,
    createdAt: dto.createdAt,
    status: dto.status,
  };
};

const mapBooking = (dto: BookingDto): Booking => {
  return {
    id: String(dto.id),
    providerId: String(dto.providerId),
    slot: dto.slot,
    appointmentMode: dto.appointmentMode,
    address: dto.address ?? undefined,
    note: dto.note ?? undefined,
    amount: centsToEuros(dto.amountCents),
    currency: dto.currency,
    createdAt: dto.createdAt,
    status: dto.status,
    confirmationCode: dto.confirmationCode,
    paymentMethod: dto.paymentMethod,
    transactionId: dto.transactionId,
  };
};

export const createBookingDraft = async (input: CreateBookingDraftInput): Promise<BookingDraft> => {
  if (input.appointmentMode === 'home' && !input.address?.trim()) {
    throw new Error('Adresse requise pour un rendez-vous à domicile');
  }

  const draft = await createBookingDraftRequest({
    providerId: toApiId(input.providerId),
    slot: input.slot,
    appointmentMode: input.appointmentMode,
    address: input.address?.trim(),
    note: input.note?.trim(),
  });

  return mapBookingDraft(draft);
};

export const getBookingDraftById = async (draftId: string): Promise<BookingDraft> => {
  const draft = await getBookingDraftByIdRequest(toApiId(draftId));
  return mapBookingDraft(draft);
};

export const checkoutBookingDraft = async (
  draftId: string,
  input: CheckoutBookingDraftInput
): Promise<Booking> => {
  const booking = await checkoutBookingDraftRequest(toApiId(draftId), input);
  return mapBooking(booking);
};

export const getMyBookings = async (): Promise<Booking[]> => {
  const response = await listMyBookingsRequest();
  return response.bookings.map(mapBooking);
};

export const updateBooking = async (input: UpdateBookingInput): Promise<Booking> => {
  if (input.appointmentMode === 'home' && !input.address?.trim()) {
    throw new Error('Adresse requise pour un rendez-vous à domicile');
  }

  const updatedBooking = await updateBookingRequest(toApiId(input.bookingId), {
    slot: input.slot,
    appointmentMode: input.appointmentMode,
    address: input.appointmentMode === 'home' ? input.address?.trim() : null,
    note: input.note?.trim() || null,
  });

  return mapBooking(updatedBooking);
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
  await cancelBookingRequest(toApiId(bookingId));
};
