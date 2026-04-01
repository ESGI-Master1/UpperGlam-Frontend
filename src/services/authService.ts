import {
  forgotPasswordRequest,
  loginRequest,
  registerRequest,
  resetPasswordRequest,
} from '@/api/auth';
import {
  AuthApiResponse,
  AuthCredentials,
  AuthPayloadDTO,
  AuthResult,
  ForgotPasswordPayloadDTO,
  ResetPasswordPayloadDTO,
} from '@/types/auth';
import { DEVICE_NAME } from '@/utils/validation';

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
};

const extractString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const extractToken = (value: unknown): string | null => {
  const directToken = extractString(value);
  if (directToken) {
    return directToken;
  }

  const record = toRecord(value);
  if (!record) {
    return null;
  }

  const tokenFromTopLevel =
    extractString(record.token) ??
    extractString(record.accessToken) ??
    extractString(record.authToken);
  if (tokenFromTopLevel) {
    return tokenFromTopLevel;
  }

  return extractToken(record.data);
};

const extractUserEmail = (response: AuthApiResponse, fallbackEmail: string): string => {
  const rootUser = toRecord(response.user);
  const nestedUser = toRecord(toRecord(response.data)?.user);

  return (
    extractString(rootUser?.email) ??
    extractString(nestedUser?.email) ??
    extractString(toRecord(response.data)?.email) ??
    fallbackEmail
  );
};

const toAuthPayload = (credentials: AuthCredentials): AuthPayloadDTO => {
  return {
    ...credentials,
    deviceName: DEVICE_NAME,
  };
};

const toAuthResult = (response: AuthApiResponse, fallbackEmail: string): AuthResult => {
  const token = extractToken(response);
  if (!token) {
    throw new Error('Token manquant dans la réponse API');
  }

  return {
    token,
    userEmail: extractUserEmail(response, fallbackEmail),
  };
};

export const loginWithApi = async (credentials: AuthCredentials): Promise<AuthResult> => {
  const response = await loginRequest(toAuthPayload(credentials));
  return toAuthResult(response, credentials.email);
};

export const registerWithApi = async (credentials: AuthCredentials): Promise<AuthResult> => {
  const response = await registerRequest(toAuthPayload(credentials));
  return toAuthResult(response, credentials.email);
};

const toForgotPasswordPayload = (email: string): ForgotPasswordPayloadDTO => {
  return {
    email,
  };
};

const toResetPasswordPayload = (
  email: string,
  code: string,
  password: string,
  passwordConfirmation: string
): ResetPasswordPayloadDTO => {
  return {
    email,
    code,
    password,
    passwordConfirmation,
  };
};

export const requestPasswordResetWithApi = async (email: string): Promise<void> => {
  await forgotPasswordRequest(toForgotPasswordPayload(email));
};

export const resetPasswordWithApi = async (
  email: string,
  code: string,
  password: string,
  passwordConfirmation: string
): Promise<void> => {
  await resetPasswordRequest(toResetPasswordPayload(email, code, password, passwordConfirmation));
};
