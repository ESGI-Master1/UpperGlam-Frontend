export interface ApiSuccessResponse<TData, TMeta = Record<string, unknown>> {
  data: TData;
  meta?: TMeta;
  message?: string;
}

export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
}
