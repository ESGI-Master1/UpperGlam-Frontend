import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/app/config/env';

type AuthTokenProvider = () => string | null;

let authTokenProvider: AuthTokenProvider | null = null;

export const setAuthTokenProvider = (provider: AuthTokenProvider): void => {
  authTokenProvider = provider;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.apiBaseUrl,
      timeout: env.requestTimeoutMs,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(this.withAuthToken, (error) => Promise.reject(error));

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const requestBaseUrl = error.config?.baseURL ?? env.apiBaseUrl;
        const requestPath = error.config?.url ?? '';
        const requestMethod = error.config?.method?.toUpperCase() ?? 'UNKNOWN';

        if (error.response) {
          // Server responded with error
          console.error(
            '[API Error]',
            requestMethod,
            `${requestBaseUrl}${requestPath}`,
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          // No response received
          console.error(
            '[API Error] No response received',
            requestMethod,
            `${requestBaseUrl}${requestPath}`,
            error.message
          );
        } else {
          // Error setting up request
          console.error(
            '[API Error] Request setup failed',
            requestMethod,
            requestPath,
            error.message
          );
        }
        return Promise.reject(error);
      }
    );
  }

  private withAuthToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const token = authTokenProvider?.();
    if (!token) {
      return config;
    }

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
