import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/openapi_MS';

export type AuthRoleName = 'MANAGER' | 'STUDENT' | 'TEACHER' | 'ADMIN' | string;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
};

export type AuthRole = {
  roleId: number;
  roleName: AuthRoleName;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  role: AuthRole;
};

type ResLoginDTO = components['schemas']['ResLoginDTO'];
type UserGetAccount = components['schemas']['UserGetAccount'];

function normalizeUser(user: ResLoginDTO['user']): AuthUser {
  return {
    id: user?.id ?? '',
    email: user?.email ?? '',
    fullName: user?.fullName ?? user?.email ?? 'User',
  };
}

function normalizeRole(role: ResLoginDTO['role']): AuthRole {
  return {
    roleId: role?.roleId ?? 0,
    roleName: role?.roleName ?? 'STUDENT',
  };
}

function normalizeSession(response: ResLoginDTO): AuthSession {
  return {
    accessToken: response.access_token ?? '',
    user: normalizeUser(response.user),
    role: normalizeRole(response.role),
  };
}

export async function login(email: string, password: string) {
  const response = await apiClient.post<ResLoginDTO>('/api/v1/auth/login', {
    email,
    password,
  });

  return normalizeSession(response);
}

export function logout() {
  return apiClient.post<void>('/api/v1/auth/logout');
}

export async function refreshAccessToken() {
  const response = await apiClient.get<ResLoginDTO>('/api/v1/auth/refresh');

  return normalizeSession(response).accessToken;
}

export async function getAccount() {
  const response = await apiClient.get<UserGetAccount>('/api/v1/auth/account');

  return {
    user: normalizeUser(response.user),
    role: normalizeRole(response.role),
  };
}

export const authApi = {
  login,
  logout,
  refreshAccessToken,
  getAccount,
};
