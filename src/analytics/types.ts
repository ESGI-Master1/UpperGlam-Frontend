export interface BaseEventPayload {
  screen_name?: string;
  user_role?: string;
  entrypoint?: string;
  step?: number;
  status?: 'success' | 'error' | 'skipped';
  cta_name?: string;
  code?: string;
  error_code?: string;
  timestamp?: string;
  device_os?: string;
  device_os_version?: string;
  app_version?: string;
  app_build_version?: string;
  device_brand?: string;
  device_model_group?: string;
  device_model_hash?: string;
  device_model_is_pseudonymized?: true;
  analytics_context_version?: 'v1';
}

export interface ScreenViewPayload extends BaseEventPayload {
  screen_name: string;
  entrypoint?: string;
}

export interface CTAClickPayload extends BaseEventPayload {
  cta_name: string;
}

export interface FormSubmitPayload extends BaseEventPayload {
  form_name: string;
}

export interface FormErrorPayload extends BaseEventPayload {
  form_name: string;
  error_code: string;
  field_name?: string;
}

export interface StepCompletedPayload extends BaseEventPayload {
  step_name: string;
  status: 'success' | 'error' | 'skipped';
}

export type EventPayload =
  | ScreenViewPayload
  | CTAClickPayload
  | FormSubmitPayload
  | FormErrorPayload
  | StepCompletedPayload
  | BaseEventPayload;
