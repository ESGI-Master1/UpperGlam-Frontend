import axios from 'axios';
import {
  getFeaturedProvidersRequest,
  getProviderAvailabilityRequest,
  getProviderByIdRequest,
  getProviderReviewsRequest,
  getProviderTagsRequest,
  ProviderDto,
  ProviderReviewDto,
  ProviderReviewsQuery,
  searchProvidersRequest,
} from '@/api/providers';
import {
  Provider,
  ProviderReview,
  ProviderTag,
  ReviewRating,
  SearchProvidersInput,
} from '@/types/provider';

const SUPPORTED_PROVIDER_TAGS: ProviderTag[] = ['hair', 'makeup', 'nails', 'skincare', 'barber'];

const toIdString = (value: number | string): string => String(value);

const toApiId = (value: string): number | string => {
  const numericId = Number(value);
  return Number.isInteger(numericId) ? numericId : value;
};

const centsToEuros = (amountCents: number): number => amountCents / 100;

const toProviderTag = (value: string): ProviderTag | null => {
  return SUPPORTED_PROVIDER_TAGS.includes(value as ProviderTag) ? (value as ProviderTag) : null;
};

const mapProviderTags = (values: string[]): ProviderTag[] => {
  return values
    .map((value) => toProviderTag(value))
    .filter((value): value is ProviderTag => value !== null);
};

const toReviewRating = (value: number): ReviewRating => {
  if (value <= 1) {
    return 1;
  }
  if (value >= 5) {
    return 5;
  }
  return Math.round(value) as ReviewRating;
};

const mapProvider = (dto: ProviderDto): Provider => {
  return {
    id: toIdString(dto.id),
    name: dto.name,
    city: dto.city,
    bio: dto.bio,
    coverImageUrl: dto.coverImageUrl,
    avatarImageUrl: dto.avatarImageUrl,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    priceFrom: centsToEuros(dto.priceFromCents),
    currency: dto.currency,
    serviceModes: dto.serviceModes.filter(
      (mode): mode is 'home' | 'institute' => mode === 'home' || mode === 'institute'
    ),
    instituteAddress: dto.instituteAddress ?? undefined,
    tags: mapProviderTags(dto.tags),
    nextSlots: dto.nextSlots ?? [],
    gallery: (dto.gallery ?? []).map((item) => ({
      id: toIdString(item.id),
      imageUrl: item.imageUrl,
      title: item.title,
    })),
  };
};

const mapProviderReview = (dto: ProviderReviewDto): ProviderReview => {
  return {
    id: toIdString(dto.id),
    providerId: toIdString(dto.providerId),
    author: dto.author,
    rating: toReviewRating(dto.rating),
    comment: dto.comment,
    createdAt: dto.createdAt,
  };
};

export const getProviderTags = async (): Promise<ProviderTag[]> => {
  const tags = await getProviderTagsRequest();
  return mapProviderTags(tags);
};

export const getFeaturedProviders = async (): Promise<Provider[]> => {
  const providers = await getFeaturedProvidersRequest(4);
  return providers.map(mapProvider);
};

export const searchProviders = async (filters: SearchProvidersInput): Promise<Provider[]> => {
  const response = await searchProvidersRequest(filters);
  return response.providers.map(mapProvider);
};

export const getProviderById = async (providerId: string): Promise<Provider | null> => {
  try {
    const provider = await getProviderByIdRequest(toApiId(providerId));
    return mapProvider(provider);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getProviderReviews = async (
  providerId: string,
  query?: ProviderReviewsQuery
): Promise<ProviderReview[]> => {
  const response = await getProviderReviewsRequest(toApiId(providerId), query);
  return response.reviews.map(mapProviderReview);
};

export const getProviderAvailability = async (
  providerId: string,
  from: string,
  to: string,
  tz = 'Europe/Paris'
): Promise<string[]> => {
  return getProviderAvailabilityRequest(toApiId(providerId), { from, to, tz });
};
