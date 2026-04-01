import { ProviderTag } from '@/types/provider';
import { ApiSuccessResponse, PaginatedMeta } from '@/types/api';
import { apiClient } from './client';

export interface ProviderGalleryDto {
  id: number | string;
  imageUrl: string;
  title: string;
}

export interface ProviderDto {
  id: number | string;
  name: string;
  city: string;
  bio: string;
  coverImageUrl: string;
  avatarImageUrl: string;
  rating: number;
  reviewCount: number;
  priceFromCents: number;
  currency: string;
  serviceModes: string[];
  instituteAddress?: string | null;
  tags: string[];
  nextSlots: string[];
  gallery?: ProviderGalleryDto[];
}

export interface ProviderReviewDto {
  id: number | string;
  providerId: number | string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SearchProvidersApiInput {
  query?: string;
  tags?: ProviderTag[];
  location?: string;
  date?: string;
  serviceMode?: 'home' | 'institute';
  sortBy?: 'rating' | 'price' | 'reviewCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProviderReviewsQuery {
  rating?: number;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProviderAvailabilityQuery {
  from: string;
  to: string;
  tz?: string;
}

const providerPath = (providerId: number | string): string => {
  return `/providers/${String(providerId)}`;
};

export const getProviderTagsRequest = async (): Promise<ProviderTag[]> => {
  const response = await apiClient.get<ApiSuccessResponse<string[]>>('/providers/tags');
  return response.data as ProviderTag[];
};

export const getFeaturedProvidersRequest = async (limit = 4): Promise<ProviderDto[]> => {
  const response = await apiClient.get<ApiSuccessResponse<ProviderDto[]>>('/providers/featured', {
    params: { limit },
  });
  return response.data;
};

export const searchProvidersRequest = async (
  input: SearchProvidersApiInput
): Promise<{ providers: ProviderDto[]; meta: PaginatedMeta | null }> => {
  const response = await apiClient.get<ApiSuccessResponse<ProviderDto[], PaginatedMeta>>(
    '/providers',
    {
      params: {
        query: input.query,
        tags: input.tags?.length ? input.tags.join(',') : undefined,
        location: input.location,
        date: input.date,
        serviceMode: input.serviceMode,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        page: input.page,
        limit: input.limit,
      },
    }
  );

  return {
    providers: response.data,
    meta: response.meta ?? null,
  };
};

export const getProviderByIdRequest = async (providerId: number | string): Promise<ProviderDto> => {
  const response = await apiClient.get<ApiSuccessResponse<ProviderDto>>(providerPath(providerId));
  return response.data;
};

export const getProviderReviewsRequest = async (
  providerId: number | string,
  query?: ProviderReviewsQuery
): Promise<{ reviews: ProviderReviewDto[]; meta: PaginatedMeta | null }> => {
  const response = await apiClient.get<ApiSuccessResponse<ProviderReviewDto[], PaginatedMeta>>(
    `${providerPath(providerId)}/reviews`,
    {
      params: {
        rating: query?.rating,
        sortOrder: query?.sortOrder,
        page: query?.page,
        limit: query?.limit,
      },
    }
  );

  return {
    reviews: response.data,
    meta: response.meta ?? null,
  };
};

export const getProviderAvailabilityRequest = async (
  providerId: number | string,
  query: ProviderAvailabilityQuery
): Promise<string[]> => {
  const response = await apiClient.get<ApiSuccessResponse<{ slots: string[] }>>(
    `${providerPath(providerId)}/availability`,
    { params: query }
  );
  return response.data.slots ?? [];
};
