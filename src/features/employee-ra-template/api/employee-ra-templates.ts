import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { EmployeeRATemplate } from '@/features/employee-ra-template/types';

const EMPLOYEE_RA_TEMPLATES_BASE = '/api/v1/employee-ra-templates';

export const employeeRATemplateByTimetableTemplateKey = (ttUuid?: string) =>
  ['employee-ra-template', 'by-tt', ttUuid] as const;

export function getEmployeeRATemplateByTimetableTemplateId(ttUuid: string) {
  return apiClient.get<EmployeeRATemplate>(
    `${EMPLOYEE_RA_TEMPLATES_BASE}/timetable-template/${ttUuid}`,
  );
}

export function useEmployeeRATemplateByTimetableTemplate(ttUuid?: string) {
  return useQuery({
    queryKey: employeeRATemplateByTimetableTemplateKey(ttUuid),
    queryFn: () => getEmployeeRATemplateByTimetableTemplateId(ttUuid ?? ''),
    enabled: Boolean(ttUuid),
    retry: false,
  });
}
