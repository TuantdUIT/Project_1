# P1 smoke verification

Verification date: 2026-05-13

## 0a. Response wrapper

`GET /api/v1/grades` returns `FormatRestResponse`.

Observed shape:

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach grades",
  "data": []
}
```

## 0b. Pagination index

`GET /api/v1/manager/students?page=0&size=5` and `page=1&size=5` without `studentStatus` returned `400 Bad Request` on the current backend.

Using the same endpoint with required filter `studentStatus=WAITING`:

| Query | Observed meta |
| --- | --- |
| `page=0&size=5&studentStatus=WAITING` | `meta.page=1`, `resultCount=1` |
| `page=1&size=5&studentStatus=WAITING` | `meta.page=1`, `resultCount=1` |
| `page=2&size=5&studentStatus=WAITING` | `meta.page=2`, `resultCount=0` |

Conclusion: backend pagination is 1-indexed; `page=0` is normalized to page 1.

## Runtime auth checks

- MANAGER runtime could not be verified because the documented `manager@example.com / 123456` credential returned `401 Unauthorized` on this backend instance.
- Student runtime was verified with a throwaway registered student account. Login succeeded, `/auth/account` returned role `STUDENT`, and `GET /api/v1/manager/student/register/{userUuid}` returned `200`. The `/schedule` workaround did not reproduce a `403` on the current backend.

## Follow-up BE tickets

- [BE-P1-001: Add lessons list API with curriculum filters](be-tickets/BE-P1-001-lessons-filter.md)
- [BE-P1-002: Expose student grade context for schedule](be-tickets/BE-P1-002-student-schedule-context.md)
