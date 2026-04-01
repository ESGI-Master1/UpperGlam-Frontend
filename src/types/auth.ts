export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthPayloadDTO extends AuthCredentials {
  deviceName: 'mobile';
}

export interface AuthResult {
  token: string;
  userEmail: string;
}

export interface ForgotPasswordPayloadDTO {
  email: string;
}

export interface ResetPasswordPayloadDTO {
  email: string;
  code: string;
  password: string;
  passwordConfirmation: string;
}

export type AuthApiResponse = Record<string, unknown>;
