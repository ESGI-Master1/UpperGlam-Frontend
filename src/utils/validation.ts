export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 255;
export const DEVICE_NAME = 'mobile' as const;

export const AUTH_VALIDATION_MESSAGES = {
  emailRequired: 'Email requis',
  emailInvalid: 'Email invalide',
  passwordRequired: 'Mot de passe requis',
  passwordMinLength: `Mot de passe: minimum ${PASSWORD_MIN_LENGTH} caractères`,
  passwordMaxLength: `Mot de passe: maximum ${PASSWORD_MAX_LENGTH} caractères`,
  confirmPasswordRequired: 'Confirmation requise',
  passwordMismatch: 'Les mots de passe ne correspondent pas',
  resetTokenRequired: 'Code de réinitialisation requis',
  addressRequired: 'Adresse requise',
  slotRequired: 'Créneau requis',
} as const;
