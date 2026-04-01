export type ProviderTag = 'hair' | 'makeup' | 'nails' | 'skincare' | 'barber';
export type AppointmentMode = 'home' | 'institute';

export interface ProviderGalleryItem {
  id: string;
  imageUrl: string;
  title: string;
}

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface ProviderReview {
  id: string;
  providerId: string;
  author: string;
  rating: ReviewRating;
  comment: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  city: string;
  bio: string;
  coverImageUrl: string;
  avatarImageUrl: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  currency: string;
  serviceModes: AppointmentMode[];
  instituteAddress?: string;
  tags: ProviderTag[];
  nextSlots: string[];
  gallery: ProviderGalleryItem[];
}

export interface SearchProvidersInput {
  query?: string;
  tags?: ProviderTag[];
  location?: string;
  date?: string;
  serviceMode?: AppointmentMode;
  sortBy?: 'rating' | 'price' | 'reviewCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
