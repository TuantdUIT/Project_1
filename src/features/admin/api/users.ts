import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildPageQuery, type PaginatedResult } from '@/utils/pagination';
import type {
  ReqCreateUserDTO,
  ResUserDTO,
  UserUpdatePayload,
} from '@/features/admin/types';

export type UsersQueryParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
};

export function getUsers({ page = 1, size = 10, sort = 'createdAt,desc' }: UsersQueryParams = {}) {
  const params = buildPageQuery({ page, size, sort });

  return apiClient.get<PaginatedResult<ResUserDTO>>(`/api/v1/users?${params.toString()}`);
}

export function getUserByUuid(userUuid: string) {
  return apiClient.get<ResUserDTO | null>(`/api/v1/users/${userUuid}`);
}

export function createUser(body: ReqCreateUserDTO) {
  return apiClient.post<ResUserDTO>('/api/v1/users', body);
}

export function updateUser(userUuid: string, body: UserUpdatePayload) {
  return apiClient.put<ResUserDTO>(`/api/v1/users/${userUuid}`, body);
}

export function deleteUser(userUuid: string) {
  return apiClient.delete<void>(`/api/v1/users/${userUuid}`);
}

export function useUsersQuery(params: UsersQueryParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => getUsers(params),
  });
}

export function useUserDetailQuery(userUuid?: string) {
  return useQuery({
    queryKey: ['admin', 'users', userUuid],
    queryFn: () => getUserByUuid(userUuid ?? ''),
    enabled: Boolean(userUuid),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userUuid, body }: { userUuid: string; body: UserUpdatePayload }) =>
      updateUser(userUuid, body),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['admin', 'users', variables.userUuid], data);
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users'],
        predicate: (query) => typeof query.queryKey[2] === 'object' && query.queryKey[2] !== null,
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_data, userUuid) => {
      queryClient.removeQueries({ queryKey: ['admin', 'users', userUuid] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users'],
        predicate: (query) => typeof query.queryKey[2] === 'object' && query.queryKey[2] !== null,
      });
    },
  });
}
