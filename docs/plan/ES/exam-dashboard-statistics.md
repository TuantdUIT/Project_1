# Plan: Dashboard thống kê bài thi — Stats / Results / Rankings

> 3 API: `GET /api/v1/dashboard/exams/{examUuid}/{stats|results|rankings}`.
> Liên quan: type tay vá schema, tripwire phát hiện BE cập nhật openapi (xem §4, §9).

## 1. Mục tiêu

Gộp 3 API dashboard vào **một popup dialog** cho giáo viên/quản lý xem kết quả & thống kê bài thi:

- **Thống kê (stats)** — điểm TB, trung vị, độ lệch chuẩn theo từng section.
- **Kết quả (results)** — bảng học sinh kèm tổng điểm + điểm thành phần (MCQ/TFQ/SAQ).
- **Xếp hạng (rankings)** — bảng xếp hạng (web ranking + ranking theo từng mã đề).

Mỗi tab hỗ trợ **xuất Excel** (`exportXlsx=true`).

## 2. Hiện trạng

| Thành phần | Trạng thái |
|---|---|
| `results` API + type tay `ResExamResult` + `useExamResultsQuery` + normalizer | ✅ đã có ([exams.ts](../../../src/features/Exam_Services/exam/api/exams.ts)) |
| `ExamResultsDialog` (chỉ bảng results) | ✅ đã có ([exam-results-dialog.tsx](../../../src/features/Exam_Services/exam/components/exam-results-dialog.tsx)) |
| `stats`, `rankings` API | ⚠️ path/params có trong openapi nhưng **response rỗng** (`Record<string, never>`) do controller trả `ResponseEntity<?>` |
| Type cho stats/rankings | ❌ chưa có → định nghĩa tay (§4) |
| Tab UI + Export Excel | ❌ chưa có |

## 3. Hợp đồng API (đã xác nhận với BE)

Mọi response **bọc `RestResponse`** `{ statusCode, message, error, data }`. Client
[api-client-es.ts](../../../src/lib/api-client-es.ts) **tự bóc 1 lớp `.data`** → hàm gọi nhận thẳng phần `data`.
Cả 3 đều trả **object** (không phải array/Page). Điểm là `number`, thời gian là chuỗi ISO-8601.

### 3.1 `/stats` → `data` = `ResExamStatDashboardDTO`
```
{ examUuid, schoolYear, examName, startTime, endTime, createdBy,
  sections: ResSectionStatDTO[] }

ResSectionStatDTO = { sectionType: 'MCQ'|'TFQ'|'SAQ',
  averageScore, meanScore, standardDeviationScore,
  questions: ResQuestionStatDTO[] }   // ⚠️ field của ResQuestionStatDTO CHƯA rõ (xem §9)
```

### 3.2 `/results` → `data.students[]`
Đã xử lý bằng `normalizeExamResults` (chọn `students ?? content ?? results ?? data`). Item = `ResExamResult`.

### 3.3 `/rankings` → list LỒNG 2 cấp
```
data = {
  webRanking:    { students: ResStudentRankingDTO[] },
  paperRankings: [ { paperCode, students: ResStudentRankingDTO[] } ]   // paperCode ở cấp NHÓM
}

ResStudentRankingDTO = { rank, studentId, fullname, userUuid, score }  // dùng `score` (KHÔNG phải totalScore)
```
- `n` (query, không bắt buộc): top N. **Người dùng nhập → theo giá trị nhập; để trống → không gửi `n` → BE mặc định 10**.

## 4. Type tay cần định nghĩa

Thêm vào [types.ts](../../../src/features/Exam_Services/exam/types.ts) (cạnh `ResExamResult`). Đặt `TODO`
để thay bằng type generated khi BE annotate schema:

```ts
export type DashboardSectionType = 'MCQ' | 'TFQ' | 'SAQ';

// ── stats ──
export type ResQuestionStat = Record<string, unknown>; // ⚠️ TODO: BE chưa cấp field ResQuestionStatDTO
export type ResSectionStat = {
  sectionType?: DashboardSectionType;
  averageScore?: number;
  meanScore?: number;
  standardDeviationScore?: number;
  questions?: ResQuestionStat[];
};
export type ResExamStatDashboard = {
  examUuid?: string; schoolYear?: string; examName?: string;
  startTime?: string; endTime?: string; createdBy?: string;
  sections?: ResSectionStat[];
};

// ── rankings ──
export type ResStudentRanking = {
  rank?: number; studentId?: string; fullname?: string; userUuid?: string; score?: number;
};
export type ResRankingGroup = { paperCode?: string | null; students?: ResStudentRanking[] };
export type ResExamRankingDashboard = {
  webRanking?: { students?: ResStudentRanking[] };
  paperRankings?: ResRankingGroup[];
};
```

### 4.1 Tripwire phát hiện BE cập nhật schema (Cơ chế 1)
Đặt trong types.ts. Hiện response 3 endpoint là `{ '*/*': Record<string, never> }`; khi BE annotate schema,
type này đổi → assert dưới fail compile → `pnpm lint` (`tsc --noEmit`) báo để gỡ type tay:
```ts
import type { operations } from '@/types/openapi_ES';
type _AssertStatsUntyped =
  operations['getExamStats']['responses'][200]['content'] extends { '*/*': Record<string, never> } ? true : never;
const _statsTripwire: _AssertStatsUntyped = true;      // FAIL khi schema đổi
// tương tự cho getExamRanking (và getExamResults nếu muốn)
```
> Áp dụng cùng cơ chế cho phần vá tay `ResAttemptQuestion` (4 field review) để đồng bộ.

## 5. API & hooks

Thêm vào [exams.ts](../../../src/features/Exam_Services/exam/api/exams.ts):
```ts
export function getExamStats(examUuid)            // get<ResExamStatDashboard>(.../stats)
export function getExamRanking(examUuid, n?)      // get<ResExamRankingDashboard>(.../rankings, { params: n? {n}:undefined })
export function useExamStatsQuery(examUuid, enabled)
export function useExamRankingQuery(examUuid, enabled, n?)
// results: dùng lại useExamResultsQuery sẵn có
```
- **Lazy theo tab**: mỗi query `enabled` khi dialog mở **và** tab đó đang active → không gọi cả 3 cùng lúc.

## 6. Export Excel
```ts
export function exportExamDashboard(kind: 'stats'|'results'|'rankings', examUuid, n?)
// apiClientES.get<Blob>(url, { params: { exportXlsx: true, ...(n?{n}:{}) }, responseType: 'blob' })
```
- Nút **Export Excel** ở **góc phải dưới** dialog → gọi export cho **tab đang active** → tải file.
- Tải bằng `URL.createObjectURL(blob)` + thẻ `<a download>`. **Tên file đặt phía client** (vd
  `${examName}-${kind}.xlsx`) vì interceptor trả về Blob đã **mất header** → không đọc được `Content-Disposition`.
  (Nếu cần tên từ BE: thêm 1 method client trả nguyên `AxiosResponse` cho blob — ngoài phạm vi.)

## 7. UI/UX (B1)

Mở rộng `ExamResultsDialog` thành dialog có **Segmented Tabs**:
```
┌─ Kết quả kiểm tra — {examName} ───────────────────────── [X] ┐
│  [ Thống kê | Kết quả | Xếp hạng ]   ← segmented tabs        │
│ ────────────────────────────────────────────────────────── │
│  (Bảng theo tab đang chọn — loading/empty/error riêng)      │
│                                                              │
│  • Thống kê:  mỗi section 1 dòng → sectionType, TB, trung   │
│               vị, độ lệch chuẩn                              │
│  • Kết quả:   bảng học sinh (giữ nguyên bảng hiện có:        │
│               mã HS, họ tên, nguồn nộp, MCQ/TFQ/SAQ, tổng,   │
│               vi phạm)                                       │
│  • Xếp hạng:  ô nhập "Top N" (trống = mặc định 10) +         │
│               Web ranking (rank, mã HS, họ tên, điểm) +      │
│               từng nhóm paperRankings theo paperCode         │
│ ────────────────────────────────────────────────────────── │
│  {n} học sinh                          [ Export Excel ▼ ] ◄─ góc phải dưới
└──────────────────────────────────────────────────────────────┘
```
- Tab mặc định: **Kết quả** (giữ trải nghiệm hiện tại) — hoặc Thống kê (chốt khi làm).
- Tái dùng `fmtScore`, `thCls`, `tdCls`, `SUBMIT_SOURCE_LABEL` sẵn có trong dialog.
- Rankings hiển thị nhiều bảng: 1 bảng Web + N bảng theo `paperCode`.
- Tab Xếp hạng có **ô nhập "Top N"**: người dùng nhập → refetch với `n`; để trống → bỏ `n` (BE mặc định 10).
  Debounce nhẹ khi gõ để tránh gọi liên tục.

## 8. Quyền truy cập (B2)

- Chỉ **TEACHER** hoặc **MANAGER** được mở dialog / gọi 3 API.
- Dialog vốn mở từ màn admin ([exam-edit.tsx](../../../src/app/routes/app/Exam_Services/admin/exam-edit.tsx)) → gating theo role ở chỗ render nút mở dialog; xác nhận lại role guard hiện có của khu admin.

## 9. Các file ảnh hưởng

| File | Thay đổi |
|---|---|
| [types.ts](../../../src/features/Exam_Services/exam/types.ts) | Thêm type tay stats/rankings (§4) + tripwire (§4.1) |
| [exams.ts](../../../src/features/Exam_Services/exam/api/exams.ts) | `getExamStats`, `getExamRanking`, hooks, `exportExamDashboard` |
| [exam-results-dialog.tsx](../../../src/features/Exam_Services/exam/components/exam-results-dialog.tsx) | Thêm segmented tabs + nút Export; chuyển bảng hiện tại vào tab "Kết quả" |
| `exam/lib/download.ts` *(mới, tùy)* | Helper tải Blob (createObjectURL + anchor) |
| `exam-room/.../` | (không đụng) |

## 10. Các bước triển khai

1. Thêm type tay + tripwire vào `types.ts`.
2. Thêm `getExamStats` / `getExamRanking` + hooks + `exportExamDashboard` vào `exams.ts`.
3. Helper tải file Blob.
4. Refactor `ExamResultsDialog`: state `activeTab`, segmented tabs, lazy query theo tab, nút Export.
5. Bảng cho tab Thống kê (section aggregates) và tab Xếp hạng (web + theo paperCode).
6. Gating role TEACHER/MANAGER ở nơi mở dialog.

## 11. Checklist nghiệm thu

- [ ] Mở dialog → 3 tab Thống kê / Kết quả / Xếp hạng; đổi tab chỉ gọi API của tab đó.
- [ ] Stats: hiện đúng `sectionType`, averageScore, meanScore, standardDeviationScore mỗi section.
- [ ] Results: bảng học sinh đủ tổng điểm + điểm thành phần (giữ nguyên hành vi cũ).
- [ ] Rankings: hiển thị Web ranking + từng nhóm theo `paperCode`; item dùng `score`, có `rank`.
- [ ] Tab Xếp hạng có ô "Top N": để trống → BE trả ~10; nhập số → trả đúng N học sinh.
- [ ] Nút Export Excel ở góc phải dưới → tải đúng file của tab đang active.
- [ ] Chỉ TEACHER/MANAGER truy cập được.
- [ ] `pnpm lint` (tsc) pass; tripwire xanh hôm nay, sẽ đỏ khi BE annotate schema.

## 12. Cần BE xác nhận / Open items

1. **`ResQuestionStatDTO`** (field của `stats.sections[].questions[]`) — hiện để `Record<string, unknown>`.
   Nếu cần hiển thị thống kê theo từng câu, BE gửi field cụ thể.
2. Tên field chính xác của wrapper rankings (`webRanking`, `paperRankings`, `paperCode`) — xác nhận đúng key.
3. `exportXlsx`: định dạng file + có `Content-Disposition` không (để cân nhắc lấy tên file từ BE).
4. Lý tưởng: BE annotate `@Schema`/đổi kiểu trả → codegen lại → bỏ toàn bộ type tay (tripwire sẽ nhắc).

## 13. Ngoài phạm vi

- Lấy tên file export từ header BE.
- Biểu đồ trực quan (chart) cho thống kê.
- Phân trang/tìm kiếm trong bảng (hiện danh sách gọn theo 1 bài thi).
