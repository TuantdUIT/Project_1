# Plan: Hiển thị điểm & xem lại bài sau khi nộp (Exam Attempt Result/Review)

> Tài liệu API gốc: [EXAM_ATTEMPT_MODULE_API.md](../../es-guide/EXAM_ATTEMPT_MODULE_API.md) (mục 4.6, 5.2, 7.6).

## 1. Mục tiêu

Sau khi học sinh nộp bài, frontend phải:

1. **Hiển thị điểm tổng** lấy từ response `submit` (status `SCORED`) thay vì chỉ báo "Đã nộp bài".
2. **Có màn xem lại bài** dùng `GET /api/v1/student/attempts/{attemptUuid}` (`getAttempt`),
   render theo `status`:
   - `SUBMITTED`: chỉ hiện bài làm, **không** điểm.
   - `SCORED`: hiện bài làm + **tổng điểm**.
   - `ANSWER_RELEASED`: hiện thêm **đáp án đúng** (`correctAnswerRaw`) và **điểm từng câu** (`earnedScore`).

## 2. Hiện trạng

| Thành phần | Trạng thái |
|-----------|-----------|
| `startAttempt`, `saveAnswer`, `submitAttempt` | ✅ Đã wire vào [exam-process.tsx](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx) |
| `getAttempt` / `useAttemptQuery` ([exams.ts:128-138](../../../src/features/Exam_Services/exam/api/exams.ts#L128-L138)) | ⚠️ Đã khai báo nhưng **không nơi nào gọi** (code chết) |
| Màn kết quả (`view === 'result'`, [exam-process.tsx:333-378](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx#L333-L378)) | Chỉ hiện "Đã nộp bài!" + số vi phạm; **bỏ qua** `score` trong response submit |
| Response `submit` ([exam-process.tsx:303-306](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx#L303-L306)) | `onSuccess` không đọc `data` → mất luôn `score`/`status` |
| Type `ResAttemptQuestionDTO` ([openapi_ES.ts:612-632](../../../src/types/openapi_ES.ts#L612-L632)) | **Thiếu** `correctAnswerRaw`, `correctNormalizedAnswer`, `earnedScore`, `imagePath` (các field chỉ xuất hiện khi `ANSWER_RELEASED`) |

→ Backend đã hỗ trợ đầy đủ; phần còn lại **hoàn toàn nằm ở frontend**.

## 3. Luồng tích hợp (dùng để kiểm tra lại sau khi làm xong)

Đây là luồng mục tiêu — **giữ nguyên để đối chiếu khi verify** ở §7.

```
        TRONG LÚC LÀM BÀI (view === 'room')
        ─────────────────────────────────────
   POST .../proctoring-events/batch   ← gửi định kỳ theo batch (đã có)


        BẤM "NỘP BÀI"  (handleSubmit)
        ─────────────────────────────────────
   1. POST .../attempts/{id}/answers            ← lưu TẤT CẢ đáp án (Promise.all)         [đã có]
            ↓  (await xong hết)
   2. POST .../proctoring-events/batch          ← flushNow(): đẩy nốt event giám sát       [đã có]
            ↓  (await)
   3. POST .../attempts/{id}/submit             ← nộp → backend chấm → SCORED              [đã có]
            ↓  (onSuccess: đọc data.score, data.status)
   4. GET  .../attempts/{id}                    ← lấy điểm + chi tiết để xem lại bài       [THÊM MỚI]
                                                    tự mở ANSWER_RELEASED nếu endTime đã qua
            ↓
   5. Render màn Result/Review theo `status`                                              [THÊM MỚI]
```

**Ràng buộc thứ tự (bất biến cần verify):**
- B2 (proctoring flush) **trước** B3 (submit) — để `violationCount` đếm đủ khi backend chấm (docs 5.5).
- B4 (getAttempt) **sau** B3 (submit) — `ANSWER_RELEASED` chỉ kích hoạt khi attempt đã `SUBMITTED`/`SCORED` và có gọi `GET` (docs 4.6).

## 4. Thay đổi kiểu dữ liệu

`ResAttemptQuestionDTO` sinh từ openapi **thiếu** field review. Không sửa file generated trực tiếp;
mở rộng ở tầng feature type ([types.ts](../../../src/features/Exam_Services/exam/types.ts)):

```ts
// types.ts — mở rộng các field chỉ có khi ANSWER_RELEASED (docs 3.3)
export type ResAttemptQuestion =
  components['schemas']['ResAttemptQuestionDTO'] & {
    imagePath?: string | null;
    correctAnswerRaw?: string;
    correctNormalizedAnswer?: string;
    earnedScore?: number;
  };
```

> `ResExamAttemptDTO` đã có đủ `status`, `score`, `violationCount`, `questions` → không cần sửa.

## 5. Các file ảnh hưởng

| File | Thay đổi |
|------|----------|
| [types.ts](../../../src/features/Exam_Services/exam/types.ts) | Mở rộng `ResAttemptQuestion` với 4 field review (§4) |
| [exam-process.tsx](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx) | `submit` `onSuccess` lưu `score`/`status`; sau submit gọi `getAttempt`; thêm state `resultAttempt`; bổ sung điểm + nút "Xem lại bài" vào `view === 'result'`; thêm `view === 'review'` |
| `exam-room/AttemptReviewView.tsx` *(mới)* | Component xem lại bài: render câu hỏi + bài làm; theo `status` hiển thị tổng điểm / đáp án đúng / `earnedScore` từng câu |
| [exams.ts](../../../src/features/Exam_Services/exam/api/exams.ts) | (Không bắt buộc) `useAttemptQuery` đã có; có thể dùng trực tiếp hoặc gọi `getAttempt` thủ công sau submit |

## 6. Các bước triển khai

1. **Mở rộng type** `ResAttemptQuestion` (§4).
2. **Đọc kết quả submit**: ở [handleSubmit](../../../src/app/routes/app/Exam_Services/user/exam-process.tsx#L276-L310),
   `submitAttemptMutation.mutate(..., { onSuccess: (data) => { setResultAttempt(data); setView('result'); } })`.
3. **Gọi lại getAttempt** sau khi vào màn result (lấy bản chi tiết đầy đủ + kích hoạt `ANSWER_RELEASED` nếu đề đã đóng):
   dùng `useAttemptQuery(attemptUuid)` enabled khi `view` ∈ {`result`,`review`}, hoặc gọi `getAttempt` 1 lần trong `onSuccess`.
4. **Màn Result** (`view === 'result'`): bổ sung khối **điểm** đọc từ `resultAttempt.score` khi
   `status` ∈ {`SCORED`,`ANSWER_RELEASED`}; giữ khối vi phạm; thêm nút **"Xem lại bài"** → `setView('review')`.
5. **Màn Review** (`AttemptReviewView`): tái dùng `flattenAttemptQuestions` để render; với mỗi câu,
   nếu `status === 'ANSWER_RELEASED'` thì hiện `correctAnswerRaw` + `earnedScore`; nếu không thì chỉ
   hiện đáp án học sinh (`currentRawAnswer`/`currentNormalizedAnswer`).
6. **Gating hiển thị** dựa **chỉ vào `status`** trong response, **không** tự suy từ `endTime` ở client (docs 7.6).

## 7. Checklist kiểm tra sau khi tích hợp

Đối chiếu trực tiếp với luồng §3 và bảng trạng thái docs 4.6:

- [ ] Bấm nộp: quan sát Network gọi **đúng thứ tự** `answers` → `proctoring-events/batch` → `submit` → `attempts/{id}`.
- [ ] `submit` trả `status` + `score`; màn result hiển thị **đúng điểm** đó (không còn bỏ qua `data`).
- [ ] **SUBMITTED**: có bài làm, **không** có tổng điểm, **không** có `correctAnswerRaw`/`earnedScore`.
- [ ] **SCORED**: có tổng điểm; **chưa** có đáp án đúng / `earnedScore`.
- [ ] **SCORED sau `Exam.endTime`**: gọi `getAttempt` → `status` chuyển thành **ANSWER_RELEASED**.
- [ ] **ANSWER_RELEASED**: mỗi câu có `correctAnswerRaw`, `correctNormalizedAnswer`, `earnedScore`.
- [ ] **CANCELLED sau endTime**: **không** tự chuyển `ANSWER_RELEASED`.
- [ ] Đề **không có `endTime`**: đáp án **không** được công bố (status giữ `SCORED`) → UI không hiển thị đáp án đúng.
- [ ] Một `saveAnswer` lỗi → vào `catch`, **không** submit (xác nhận hành vi hiện tại; xem §8).

## 8. Trường hợp biên / cần lưu ý

1. **Mất dữ liệu khi lưu đáp án**: hiện đáp án chỉ lưu **một lần lúc nộp** (chưa autosave như docs 7.2).
   Nếu 1 request `saveAnswer` lỗi → `Promise.all` reject → **không submit**. → Đã tách thành plan riêng:
   [attempt-autosave-resume.md](./attempt-autosave-resume.md) (autosave + khôi phục khi cúp điện/reload).
2. **`imagePath`, `mcOptions`, `tfStatements`** cần có trong response chi tiết để render lại đề ở màn review —
   xác nhận BE trả đủ khi gọi `getAttempt` ở các trạng thái sau nộp.
3. **Chuẩn hóa đáp án hiển thị**: SAQ/TFQ có dạng raw vs normalized (docs 4.5, 7.5) — màn review nên ưu tiên
   hiển thị dạng người đọc hiểu được, dùng `currentRawAnswer` cho debug.
4. **Nhiều lượt thi (`numberOfAttempt`)**: nếu cho xem lại theo từng lượt, cần màn danh sách
   (`GET /api/v1/student/attempts`) — hiện `useAttemptsQuery` đã có nhưng chưa dùng (ngoài phạm vi).

## 9. Ngoài phạm vi (Phase 2)

- ~~Autosave/debounce đáp án + retry khi mất mạng.~~ → Đã chuyển sang plan [attempt-autosave-resume.md](./attempt-autosave-resume.md).
- Màn danh sách lịch sử các lượt thi của học sinh.
- Hiển thị ảnh OMR (`rawImageUrl`/`scoredImageUrl`) ở màn review nếu nguồn nộp là OMR.
