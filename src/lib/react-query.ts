import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

export const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const status = (error as { status?: number; response?: { status?: number } }).response?.status
        ?? (error as { status?: number }).status;

      if (status && status >= 400 && status < 500) {
        return false;
      }

      return failureCount < 2;
    },
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
