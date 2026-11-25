import { SafeUser } from '../types/survey';
import { apiClient } from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<{ success: boolean; data: LoginResponse }>(
      '/auth/login',
      { email, password }
    );
    return res.data.data;
  },

  async me(): Promise<SafeUser> {
    const res = await apiClient.get<{ success: boolean; data: { user: SafeUser } }>('/auth/me');
    return res.data.data.user;
  },

  async logout(refreshToken?: string | null): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken: refreshToken ?? undefined });
  },
};
