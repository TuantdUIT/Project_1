# BE-P1-001: Add lessons list API with curriculum filters

## Problem

Frontend can render real grades and lesson types, but curriculum detail still has to show a placeholder because there is no lesson list endpoint for a selected grade and lesson type.

## Requested API

`GET /api/v1/lessons?gradeId=&lessonTypeId=&studyWeekId=`

## Acceptance Criteria

- Supports filtering by `gradeId`.
- Supports filtering by `lessonTypeId`.
- Supports optional filtering by `studyWeekId`.
- Returns enough metadata for the course detail page to render lessons by week.
- Keeps response shape consistent with current API wrapper behavior.

## Frontend Impact

- Replace the current curriculum detail placeholder with real lesson data.
- Add `useLessonsQuery` only after this endpoint is available.
