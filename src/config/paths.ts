export const paths = {
  home: '/',
  courses: '/courses',
  courseDetail: (gradeId: string | number, lessonTypeId: string) => `/courses/${gradeId}/${lessonTypeId}`,
  schedule: '/schedule',
  exam: '/exam',
  adminPortal: '/admin-portal',
  adminPortalOverview: '/admin-portal/overview',
  adminPortalRegistrations: '/admin-portal/registrations',
  adminPortalClasses: '/admin-portal/classes',
  adminPortalUsers: '/admin-portal/users',
  login: '/',
} as const;
