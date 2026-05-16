# P1 BE tickets

## Lessons API for curriculum detail

Ticket file: [BE-P1-001-lessons-filter.md](be-tickets/BE-P1-001-lessons-filter.md)

Frontend can render grades and lesson types from:

- `GET /api/v1/grades`
- `GET /api/v1/lesson-types`

To complete curriculum detail, BE should add a lesson list endpoint with filters:

`GET /api/v1/lessons?gradeId=&lessonTypeId=&studyWeekId=`

Expected use: `/courses/:gradeId/:lessonTypeId` renders lessons by week instead of the current metadata placeholder.

## Student grade in auth account or schedule endpoint

Ticket file: [BE-P1-002-student-schedule-context.md](be-tickets/BE-P1-002-student-schedule-context.md)

`GET /api/v1/auth/account` currently returns `{ user, role }` only. Schedule needs student grades to choose a timetable template.

Preferred options:

- Add `gradeIds` or `grades` to `/api/v1/auth/account` for student users.
- Or add `GET /api/v1/schedule/me` returning the current student's composed schedule data.

Current FE workaround: fetch `GET /api/v1/manager/student/register/{userUuid}` after login to read `grades[]`.
