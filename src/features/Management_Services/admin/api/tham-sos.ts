import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ResThamSoDTO } from '@/features/Management_Services/admin/types';

export function getThamSosBySchoolYear(schoolYear: number) {
  const params = new URLSearchParams({ schoolYear: String(schoolYear) });
  return apiClient.get<ResThamSoDTO[]>(`/api/v1/tham-sos/by-school-year?${params.toString()}`);
}

export function getThamSos() {
  return apiClient.get<ResThamSoDTO[]>('/api/v1/tham-sos');
}

export function useThamSosBySchoolYearQuery(schoolYear?: number) {
  return useQuery({
    queryKey: ['admin', 'tham-sos', 'by-school-year', schoolYear],
    queryFn: async () => {
      const bySchoolYear = await getThamSosBySchoolYear(schoolYear ?? 0);
      return bySchoolYear.length > 0 ? bySchoolYear : getThamSos();
    },
    enabled: Boolean(schoolYear),
  });
}
