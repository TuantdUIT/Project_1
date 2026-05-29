import { createBrowserRouter, Navigate } from 'react-router';
import AppLayout from '@/components/layouts/app-layout';
import { paths } from '@/config/paths';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { RoleGuard } from '@/lib/auth/role-guard';

/**
 * Ý nghĩa: Lazy-load route landing để giảm bundle ban đầu.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /.
 */
async function loadLandingRoute() {
  const module = await import('./routes/landing');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route danh sách khóa học.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /courses.
 */
async function loadCoursesRoute() {
  const module = await import('./routes/app/Management_Services/app/courses');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route chi tiết khóa học.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /courses/:id.
 */
async function loadCourseDetailRoute() {
  const module = await import('./routes/app/Management_Services/app/course-detail');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route thời khóa biểu đã được ProtectedRoute bảo vệ.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /schedule.
 */
async function loadScheduleRoute() {
  const module = await import('./routes/app/Management_Services/app/schedule');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route phòng thi đã được ProtectedRoute bảo vệ.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /exam.
 */
async function loadExamRoute() {
  const module = await import('./routes/app/Exam_Services/exam');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route admin portal đã được RoleGuard bảo vệ.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /admin-portal.
 */
async function loadAdminPortalRoute() {
  const module = await import('./routes/app/Management_Services/admin/admin-portal');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route tổng quan của admin portal.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /admin-portal/overview.
 */
async function loadAdminOverviewRoute() {
  const module = await import('./routes/app/Management_Services/admin/overview');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route quản lý đăng ký học sinh của admin portal.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /admin-portal/registrations.
 */
async function loadAdminRegistrationsRoute() {
  const module = await import('./routes/app/Management_Services/admin/registrations');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route quản lý lớp học (HS ACTIVE) của admin portal.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của route /admin-portal/classes.
 */
async function loadAdminClassesRoute() {
  const module = await import('./routes/app/Management_Services/admin/classes');
  return { Component: module.default };
}

async function loadAdminUsersRoute() {
  const module = await import('./routes/app/Management_Services/admin/users');
  return { Component: module.default };
}

async function loadAdminPeriodSettingsRoute() {
  const module = await import('./routes/app/Management_Services/admin/period-settings');
  return { Component: module.default };
}

async function loadAdminTimetableRoute() {
  const module = await import('./routes/app/Management_Services/admin/timetable');
  return { Component: module.default };
}

async function loadAdminTimetableAllRoute() {
  const module = await import('./routes/app/Management_Services/admin/timetable-all');
  return { Component: module.default };
}

async function loadAdminTimetableByGradeRoute() {
  const module = await import('./routes/app/Management_Services/admin/timetable-by-grade');
  return { Component: module.default };
}

async function loadAdminStudyWeeksRoute() {
  const module = await import('./routes/app/Management_Services/admin/study-weeks');
  return { Component: module.default };
}

async function loadAdminStudyWeekDetailRoute() {
  const module = await import('./routes/app/Management_Services/admin/study-week-detail');
  return { Component: module.default };
}

async function loadAdminStudyWeekByGradeRoute() {
  const module = await import('./routes/app/Management_Services/admin/study-week-by-grade');
  return { Component: module.default };
}

async function loadAdminStudyWeekLessonDetailRoute() {
  const module = await import('./routes/app/Management_Services/admin/study-week-lesson-detail');
  return { Component: module.default };
}

async function loadAdminCostsRoute() {
  const module = await import('./routes/app/Management_Services/admin/costs');
  return { Component: module.default };
}

async function loadAdminLearningResourcesRoute() {
  const module = await import('./routes/app/Management_Services/admin/learning-resources');
  return { Component: module.default };
}

async function loadAdminQuestionsRoute() {
  const module = await import('./routes/app/Exam_Services/admin/questions');
  return { Component: module.default };
}

async function loadAdminExamsRoute() {
  const module = await import('./routes/app/Exam_Services/admin/exams');
  return { Component: module.default };
}

/**
 * Ý nghĩa: Lazy-load route 404 cho các URL không khớp route nào.
 * Hàm sử dụng hàm này làm đầu vào: createBrowserRouter nhận hàm này trong field lazy của wildcard route *.
 */
async function loadNotFoundRoute() {
  const module = await import('./routes/not-found');
  return { Component: module.default };
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        lazy: loadLandingRoute,
      },
      {
        path: 'courses',
        lazy: loadCoursesRoute,
      },
      {
        path: 'courses/:gradeId/:lessonTypeId',
        lazy: loadCourseDetailRoute,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'schedule',
            lazy: loadScheduleRoute,
          },
          {
            path: 'exam',
            lazy: loadExamRoute,
          },
        ],
      },
      {
        path: '*',
        lazy: loadNotFoundRoute,
      },
    ],
  },
  {
    element: <RoleGuard roleName="MANAGER" />,
    children: [
      {
        path: paths.adminPortal.slice(1),
        lazy: loadAdminPortalRoute,
        children: [
          {
            index: true,
            element: <Navigate to={paths.adminPortalRegistrations} replace />,
          },
          {
            path: 'overview',
            lazy: loadAdminOverviewRoute,
          },
          {
            path: 'registrations',
            lazy: loadAdminRegistrationsRoute,
          },
          {
            path: 'classes',
            lazy: loadAdminClassesRoute,
          },
          {
            path: 'classes/:userUuid',
            lazy: loadAdminClassesRoute,
          },
          {
            path: 'users',
            lazy: loadAdminUsersRoute,
          },
          {
            path: 'period-settings',
            lazy: loadAdminPeriodSettingsRoute,
          },
          {
            path: 'timetable',
            lazy: loadAdminTimetableRoute,
            children: [
              {
                index: true,
                element: <Navigate to={paths.adminPortalTimetableAll} replace />,
              },
              {
                path: 'all',
                lazy: loadAdminTimetableAllRoute,
              },
              {
                path: 'grade/:gradeId',
                lazy: loadAdminTimetableByGradeRoute,
              },
            ],
          },
          {
            path: 'study-weeks',
            lazy: loadAdminStudyWeeksRoute,
          },
          {
            path: 'study-weeks/:weekUuid',
            lazy: loadAdminStudyWeekDetailRoute,
            children: [
              {
                index: true,
                element: <Navigate to="grade/1" replace />,
              },
              {
                path: 'grade/:gradeId',
                lazy: loadAdminStudyWeekByGradeRoute,
              },
              {
                path: 'grade/:gradeId/lessons/:lessonUuid',
                lazy: loadAdminStudyWeekLessonDetailRoute,
              },
            ],
          },
          {
            path: 'learning-resources',
            lazy: loadAdminLearningResourcesRoute,
          },
          {
            path: 'costs',
            lazy: loadAdminCostsRoute,
          },
          {
            path: 'exam/questions',
            lazy: loadAdminQuestionsRoute,
          },
          {
            path: 'exam/exams',
            lazy: loadAdminExamsRoute,
          },
        ],
      },
    ],
  },
]);
