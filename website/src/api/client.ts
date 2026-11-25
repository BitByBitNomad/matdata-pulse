import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const STORAGE_KEYS = {
  accessToken: 'mp_access_token',
  refreshToken: 'mp_refresh_token',
  user: 'mp_user',
} as const;

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.accessToken),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.refreshToken),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
  },
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clear();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BASE_URL}/auth/refresh`, { refreshToken })
            .then((res) => {
              const { accessToken, refreshToken: nextRefresh } = res.data.data;
              tokenStorage.setTokens(accessToken, nextRefresh);
              return accessToken as string;
            })
            .catch(() => {
              tokenStorage.clear();
              return null;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const nextAccess = await refreshPromise;
        if (nextAccess) {
          originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
          return apiClient(originalRequest);
        }
      } catch {
        tokenStorage.clear();
      }
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const apiMsg = (err.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (apiMsg) return apiMsg;
    if (err.code === 'ECONNABORTED') return 'Request timed out. Check backend connectivity.';
    if (!err.response) return 'Unable to reach Matdata Pulse API server.';
  }
  return err instanceof Error ? err.message : fallback;
}
