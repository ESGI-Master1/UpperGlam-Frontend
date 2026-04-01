import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ANALYTICS_EVENTS, trackEvent } from '@/analytics';
import {
  cancelBooking as cancelBookingRequest,
  checkoutBookingDraft,
  createBookingDraft,
  getBookingDraftById,
  getMyBookings,
  updateBooking as updateBookingRequest,
} from '@/services/bookingService';
import { pushRecentInstituteId } from '@/services/localShortcutsService';
import { getProviderById } from '@/services/providerService';
import { Booking, BookingDraft, CreateBookingDraftInput, UpdateBookingInput } from '@/types/booking';
import { PaymentMethod } from '@/types/payment';
import { useAuth } from '../auth/AuthContext';

interface BookingContextValue {
  drafts: BookingDraft[];
  bookings: Booking[];
  providerNameById: Record<string, string>;
  isSubmitting: boolean;
  isLoadingBookings: boolean;
  createDraft: (input: CreateBookingDraftInput) => Promise<BookingDraft>;
  getDraftById: (draftId: string) => BookingDraft | undefined;
  getBookingById: (bookingId: string) => Booking | undefined;
  markDraftAsFailed: (draftId: string) => void;
  finalizeDraft: (
    draftId: string,
    paymentMethod: PaymentMethod,
    platformPayToken: string
  ) => Promise<Booking>;
  updateBooking: (input: UpdateBookingInput) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

interface BookingProviderProps {
  children: React.ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [drafts, setDrafts] = useState<BookingDraft[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providerNameById, setProviderNameById] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const resolveProviderNames = useCallback(async (providerIds: string[]): Promise<void> => {
    const uniqueIds = Array.from(new Set(providerIds));
    if (uniqueIds.length === 0) {
      return;
    }

    const providers = await Promise.all(uniqueIds.map((providerId) => getProviderById(providerId)));
    setProviderNameById((current) => {
      const next = { ...current };
      uniqueIds.forEach((providerId, index) => {
        const provider = providers[index];
        if (provider?.name) {
          next[providerId] = provider.name;
        } else if (!next[providerId]) {
          next[providerId] = 'Prestataire';
        }
      });
      return next;
    });
  }, []);

  const refreshBookings = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoadingBookings(true);
    try {
      const currentBookings = await getMyBookings();
      setBookings(currentBookings);
      await resolveProviderNames(currentBookings.map((booking) => booking.providerId));
    } catch {
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [isAuthenticated, resolveProviderNames]);

  useEffect(() => {
    if (!isAuthenticated) {
      setDrafts([]);
      setBookings([]);
      setProviderNameById({});
      return;
    }

    void refreshBookings();
  }, [isAuthenticated, refreshBookings]);

  const createDraft = useCallback(async (input: CreateBookingDraftInput): Promise<BookingDraft> => {
    setIsSubmitting(true);
    try {
      const draft = await createBookingDraft(input);
      setDrafts((current) => [draft, ...current]);
      await resolveProviderNames([draft.providerId]);
      trackEvent(ANALYTICS_EVENTS.BOOKING_DRAFT_CREATED, {
        screen_name: 'Booking',
        step: 1,
        status: 'success',
      });
      return draft;
    } finally {
      setIsSubmitting(false);
    }
  }, [resolveProviderNames]);

  const getDraftById = useCallback(
    (draftId: string): BookingDraft | undefined => {
      return drafts.find((draft) => draft.id === draftId);
    },
    [drafts]
  );

  const markDraftAsFailed = useCallback((draftId: string): void => {
    setDrafts((current) => {
      return current.map((draft) => {
        if (draft.id !== draftId) {
          return draft;
        }
        return { ...draft, status: 'payment_failed' };
      });
    });
  }, []);

  const getBookingById = useCallback(
    (bookingId: string): Booking | undefined => {
      return bookings.find((booking) => booking.id === bookingId);
    },
    [bookings]
  );

  const finalizeDraft = useCallback(
    async (
      draftId: string,
      paymentMethod: PaymentMethod,
      platformPayToken: string
    ): Promise<Booking> => {
      setIsSubmitting(true);
      try {
        const draft = drafts.find((item) => item.id === draftId) ?? (await getBookingDraftById(draftId));
        const booking = await checkoutBookingDraft(draft.id, {
          method: paymentMethod,
          platformPayToken,
        });

        setBookings((current) => [booking, ...current.filter((item) => item.id !== booking.id)]);
        setDrafts((current) => current.filter((item) => item.id !== draft.id));
        await resolveProviderNames([booking.providerId]);

        if (booking.appointmentMode === 'institute') {
          await pushRecentInstituteId(booking.providerId);
        }

        trackEvent(ANALYTICS_EVENTS.BOOKING_STEP_COMPLETED, {
          screen_name: 'Payment',
          step: 2,
          status: 'success',
        });
        return booking;
      } finally {
        setIsSubmitting(false);
      }
    },
    [drafts, resolveProviderNames]
  );

  const updateBooking = useCallback(async (input: UpdateBookingInput): Promise<Booking> => {
    setIsSubmitting(true);
    try {
      const updatedBooking = await updateBookingRequest(input);
      setBookings((current) => {
        return current.map((booking) => {
          if (booking.id !== input.bookingId) {
            return booking;
          }
          return updatedBooking;
        });
      });

      await resolveProviderNames([updatedBooking.providerId]);
      if (updatedBooking.appointmentMode === 'institute') {
        await pushRecentInstituteId(updatedBooking.providerId);
      }

      trackEvent(ANALYTICS_EVENTS.BOOKING_UPDATED, {
        screen_name: 'ManageBooking',
        status: 'success',
      });

      return updatedBooking;
    } finally {
      setIsSubmitting(false);
    }
  }, [resolveProviderNames]);

  const cancelBooking = useCallback(async (bookingId: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      await cancelBookingRequest(bookingId);
      setBookings((current) => current.filter((booking) => booking.id !== bookingId));
      trackEvent(ANALYTICS_EVENTS.BOOKING_CANCELLED, {
        screen_name: 'ManageBooking',
        status: 'success',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const contextValue = useMemo<BookingContextValue>(() => {
    return {
      drafts,
      bookings,
      providerNameById,
      isSubmitting,
      isLoadingBookings,
      createDraft,
      getDraftById,
      getBookingById,
      markDraftAsFailed,
      finalizeDraft,
      updateBooking,
      cancelBooking,
      refreshBookings,
    };
  }, [
    drafts,
    bookings,
    providerNameById,
    isSubmitting,
    isLoadingBookings,
    createDraft,
    getDraftById,
    getBookingById,
    markDraftAsFailed,
    finalizeDraft,
    updateBooking,
    cancelBooking,
    refreshBookings,
  ]);

  return <BookingContext.Provider value={contextValue}>{children}</BookingContext.Provider>;
};

export const useBookings = (): BookingContextValue => {
  const context = React.useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within BookingProvider');
  }
  return context;
};
