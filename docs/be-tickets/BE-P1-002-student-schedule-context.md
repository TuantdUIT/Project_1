# BE-P1-002: Expose student grade context for schedule

## Problem

`GET /api/v1/auth/account` currently returns user and role data, but not the student's grade context. The schedule page needs grade information to select a timetable template. The current frontend workaround calls `GET /api/v1/manager/student/register/{userUuid}`, which can fail for a normal student account if that manager endpoint is role-protected.

## Preferred Solutions

- Add `gradeIds` or `grades` to `GET /api/v1/auth/account` for student users.
- Or add `GET /api/v1/schedule/me` returning the current student's composed schedule data.

## Acceptance Criteria

- Student login can open `/schedule` without calling manager-only APIs.
- Frontend can determine the student's active grade or receive an already-composed schedule.
- MANAGER-only endpoints are not required for normal student runtime.

## Frontend Impact

- Remove the current `useStudentByUuidQuery(user?.id)` workaround from the schedule route.
- Compose schedule directly from account grade context or consume `/schedule/me`.
