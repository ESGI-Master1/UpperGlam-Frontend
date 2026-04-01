import axios from 'axios';

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
};

const readString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const responseData = toRecord(error.response?.data);
    const nestedError = toRecord(responseData?.error);
    const messageFromApi =
      readString(nestedError?.message) ??
      readString(responseData?.message) ??
      readString(nestedError?.code) ??
      readString(responseData?.error) ??
      readString(responseData?.detail);
    return messageFromApi ?? fallback;
  }

  if (error instanceof Error) {
    return readString(error.message) ?? fallback;
  }

  return fallback;
};
