import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/auth/auth-api';

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
  });
}

export function useAccount(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'account'],
    queryFn: authApi.getAccount,
    enabled,
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: authApi.logout,
  });
}
