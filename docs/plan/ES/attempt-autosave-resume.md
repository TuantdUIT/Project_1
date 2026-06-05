# Plan: Autosave đáp án & Khôi phục bài thi (Autosave + Resume)

> Tài liệu API gốc: [EXAM_ATTEMPT_MODULE_API.md](../../es-guide/EXAM_ATTEMPT_MODULE_API.md) (mục 4.2, 4.3, 4.4, 7.2).
> Liên quan: [attempt-result-review.md](./attempt-result-review.md).

## 1. Mục tiêu

Học sinh đang làm bài mà **cúp điện / reload / sập tab / mất mạng** thì khi mở lại **vẫn khôi phục được**:
đáp án đã làm + thời gian còn lại + đúng bộ câu hỏi của lượt thi đó.

Gồm 2 phần:

1. **Autosave** — mỗi lần học sinh đổi đáp án, đẩy xuống backend (`POST .../answers`), có debounce + retry.
2. **Resume** — khi vào lại, phát hiện attempt đang `IN_PROGRESS`, tải lại đáp án + đồng hồ từ server.

## 2. Hiện trạng (vì sao chưa khôi phục được)

| Điểm | Hiện trạng | Hệ quả |
|---|---|---|
| Lưu đáp án | `handleAnswer` chỉ `setAnswers` vào **state React** ([exam-process.tsx:272-274](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx#L272-L274)) | Đáp án nằm trong RAM, mất khi reload |
| Gọi `saveAnswer` (API) | Chỉ chạy **1 lần** trong `handleSubmit` ([exam-process.tsx:289,294](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx#L289-L294)) | Trước lúc nộp, backend **chưa có** đáp án nào |
| `attemptUuid` | Chỉ ở state React ([exam-process.tsx:191](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx#L191)) | Reload là mất, không biết đang dở lượt nào |
| Đồng hồ | Reset full `durationMinutes * 60` khi start ([exam-process.tsx:265](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx#L265)) | Reload sẽ "hồi sinh" thời gian, sai |
| Bộ câu hỏi | Lấy từ snapshot trả lúc `startAttempt` (state) | Reload mất; phải đọc lại từ attempt (group random khác nhau mỗi lượt — docs 4.2) |

→ Backend đã sẵn sàng: docs 4.3 (mỗi lần đổi insert 1 dòng `StudentAnswer`), `getAttempt` trả
`currentRawAnswer`/`currentNormalizedAnswer` từng câu để dựng lại. Phần thiếu **nằm ở frontend**.

## 3. Phần A — Autosave trong lúc làm bài

### 3.1 Cơ chế
- `handleAnswer(globalIndex, value)`: vẫn `setAnswers`, **thêm** lên lịch gọi `saveAnswer` cho đúng câu đó.
- **Debounce per-question** ~800–1200ms (gộp các lần gõ liên tiếp, nhất là SAQ text) — tránh spam request.
- Tách hàm dùng chung `buildRawAnswer(q, value)` (đang nằm inline trong `handleSubmit`) để **autosave và submit dùng chung 1 cách mã hóa**, tránh lệch:
  - MCQ / SAQ: `rawAnswer = String(value)`.
  - TFQ group: ghép theo thứ tự `items` → `D`/`S`/`B` (**bổ sung `B` cho ý bỏ trống** theo docs 4.5/7.4; hiện submit chỉ sinh `D`/`S`).
- Trạng thái lưu per-question: `idle | saving | saved | error` để hiển thị chỉ báo nhỏ ("Đã lưu" / "Đang lưu" / "Lỗi, thử lại").

### 3.2 Chống mất mạng (docs 7.2)
- Lưu tạm `answers` vào `localStorage` (theo `attemptUuid`) ngay khi đổi → reload tức thì vẫn còn (kể cả khi request đang fail).
- Hàng đợi retry: request `saveAnswer` lỗi → giữ lại, tự retry khi `online` (lắng nghe `window 'online'`).
- Khi submit: **flush hết** các save đang chờ/đang debounce **trước** khi gọi `submit` (giữ bất biến của
  [attempt-result-review.md §3](./attempt-result-review.md): answers → proctoring → submit).

## 4. Phần B — Khôi phục (Resume)

### 4.1 Lưu mốc để tìm lại attempt
- Khi `startAttempt` thành công: ghi `localStorage['es_active_attempt']` = `{ attemptUuid, examUuid, startedAt, durationMinutes, endTime }`.
- (Phương án không cần localStorage cho mốc: khi mở 1 đề, gọi `getAttempts?examUuid=...` tìm attempt
  `status === 'IN_PROGRESS'`. Dùng làm fallback nếu localStorage trống.)

### 4.2 Luồng vào lại đề
```
Mở route / chọn đề
   ↓
Có attempt IN_PROGRESS? (localStorage hoặc getAttempts?examUuid=)
   ↓ Có
GET .../attempts/{attemptUuid}        ← LƯU Ý: nếu đã quá hạn, backend AUTO-SUBMIT tại đây (docs 4.4)
   ↓
status trả về?
   ├─ IN_PROGRESS  → khôi phục phòng thi (4.3)
   └─ SUBMITTED/SCORED (đã auto-submit) → chuyển thẳng màn kết quả, KHÔNG cho làm tiếp
```

### 4.3 Dựng lại trạng thái phòng thi từ response `getAttempt`
1. **Câu hỏi**: dùng `data.questions` (snapshot của chính attempt — đúng bộ random của lượt đó),
   chạy `flattenAttemptQuestions` như hiện tại → `attemptQuestions`/`flatQuestions`.
2. **Đáp án** (`answers`): với mỗi câu, parse `currentRawAnswer` → `AnswerValue`:
   - MCQ / SAQ: gán thẳng chuỗi.
   - TFQ group: duyệt từng ký tự theo thứ tự `tfStatements` (đã sort theo `statementOrder`):
     `D`→`true`, `S`→`false`, `B`→bỏ (không set) → dựng `GroupAnswer` keyed theo `statementUuid`.
   - → cần hàm nghịch đảo `parseRawAnswer(q, raw)` (đối xứng với `buildRawAnswer` ở §3.1).
3. **Đồng hồ** (`timeLeft`): tính lại theo server, **không** reset full:
   - `deadline = min(startedAt + durationMinutes, endTime)`; nếu `endTime` null → `startedAt + durationMinutes` (docs 4.4).
   - `timeLeft = max(0, deadline - now)`. Nếu `≤ 0` → thực ra đã hết giờ → để `getAttempt`/auto-submit xử lý.
4. `setView('room')` và tiếp tục như bình thường (autosave §3 chạy tiếp).

### 4.4 Tránh tạo lượt thi trùng
- Khi đã có attempt `IN_PROGRESS`, **không** gọi `startAttempt` lần nữa (sẽ tốn `numberOfAttempt`).
- Nút "Bắt đầu thi" ở màn detail nên đổi thành "Tiếp tục làm bài" khi phát hiện attempt dở.

## 5. Các file ảnh hưởng

| File | Thay đổi |
|------|----------|
| [exam-process.tsx](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx) | `handleAnswer` gọi autosave (debounce); lưu/đọc mốc attempt; luồng resume (4.2-4.4); tính lại `timeLeft`; nút "Tiếp tục" |
| `exam-room/answer-codec.ts` *(mới)* | `buildRawAnswer(q, value)` + `parseRawAnswer(q, raw)` dùng chung cho autosave/submit/resume |
| `exam/hooks/useAttemptAutosave.ts` *(mới)* | Hook: debounce theo câu, trạng thái save, hàng đợi retry, `flushNow`, đồng bộ localStorage |
| [exams.ts](../../../src/features/Exam_Services/exam/api/exams.ts) | (tùy) thêm `getAttempts({ examUuid })` có filter để tìm attempt IN_PROGRESS |
| [types.ts](../../../src/features/Exam_Services/exam/types.ts) | (nếu cần) dùng `currentRawAnswer`/`currentNormalizedAnswer` đã có sẵn trong `ResAttemptQuestionDTO` |

## 6. Các bước triển khai

1. Tách `answer-codec.ts`: `buildRawAnswer` (refactor từ `handleSubmit`) + `parseRawAnswer`. Bổ sung `B` cho TFQ.
2. Viết `useAttemptAutosave`: nhận `attemptUuid`; expose `scheduleSave(q, value)`, `flushNow()`, `saveState`.
3. `handleAnswer` gọi `scheduleSave`; `handleSubmit` gọi `flushNow()` trước bước proctoring/submit.
4. Lưu mốc attempt vào localStorage khi `startAttempt` thành công.
5. Khi vào route/đề: kiểm tra attempt dở → `getAttempt` → phân nhánh theo `status` (4.2).
6. Dựng lại `answers` + `timeLeft` từ response (4.3).
7. Đổi UI nút bắt đầu → "Tiếp tục làm bài"; thêm chỉ báo trạng thái autosave trong phòng thi.

## 7. Checklist kiểm tra sau khi tích hợp

- [ ] Chọn 1 đáp án → Network có `POST .../answers` (sau debounce), **không** đợi tới lúc nộp.
- [ ] Gõ SAQ liên tục → chỉ bắn 1 request sau khi ngừng gõ (debounce hoạt động).
- [ ] **Reload giữa chừng** → vào lại đề thấy "Tiếp tục làm bài"; đáp án cũ hiện đủ; đồng hồ **đúng phần còn lại** (không full lại).
- [ ] TFQ có ý bỏ trống: lưu `B`, khôi phục lại đúng (ý đó vẫn trống, không bị set nhầm).
- [ ] Tắt mạng → đổi đáp án → bật lại mạng → request tự retry thành công.
- [ ] Reload **sau khi đã quá hạn** → `getAttempt` auto-submit → vào thẳng màn kết quả, không cho làm tiếp.
- [ ] Có attempt `IN_PROGRESS` mà bấm vào đề → **không** tạo lượt mới (`numberOfAttempt` không bị trừ thêm).
- [ ] Submit: các save đang chờ được `flushNow` xong **trước** `submit` → backend chấm đủ đáp án cuối.

## 8. Trường hợp biên / cần xác nhận

1. **Lệch đồng hồ client/server**: `timeLeft` tính ở client chỉ để hiển thị; **deadline thật do backend
   enforce** (auto-submit docs 4.4) → an toàn dù client chỉnh giờ.
2. **Mã hóa TFQ `B`**: cần xác nhận backend chấm coi `B` là bỏ trống (docs 4.5) và `saveAnswer` chấp nhận
   chuỗi có `B`. Hiện FE chỉ sinh `D`/`S` — đổi sang sinh đủ `D`/`S`/`B`.
3. **Nhiều tab cùng 1 attempt**: 2 tab cùng autosave → backend insert chồng (docs 4.3 dùng đáp án cuối) →
   chấp nhận được, nhưng nên khóa mềm bằng localStorage để tránh rối UI.
4. **`currentNormalizedAnswer` vs `currentRawAnswer`**: khôi phục UI dùng `currentRawAnswer` (đúng cái học
   sinh nhập); `normalized` chỉ để debug.

## 9. Ngoài phạm vi

- Đồng bộ realtime đa thiết bị (websocket).
- Mã hóa/ký đáp án chống can thiệp localStorage.
- Hiển thị ảnh OMR khi khôi phục (luồng OMR riêng).
