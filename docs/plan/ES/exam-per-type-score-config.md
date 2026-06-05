# Plan: Cấu hình điểm số theo từng loại câu hỏi trong bài thi (ES)

## 1. Mục tiêu

Mở rộng mục **"Cấu hình chấm điểm"** trong form tạo/sửa bài thi
([exam-create.tsx](../../../src/app/routes/app/Exam_Services/admin/exam-create.tsx),
[exam-edit.tsx](../../../src/app/routes/app/Exam_Services/admin/exam-edit.tsx)):
ngoài cấu hình % đúng/sai (TFQ) hiện có, **thêm thiết lập điểm mỗi câu cho từng loại**:

- **Trắc nghiệm (MCQ)** — điểm/câu
- **Trả lời ngắn (SAQ)** — điểm/câu
- **Đúng/Sai (TFQ)** — điểm/câu (điểm gốc, dùng cùng % đúng/sai)

Khi đổi giá trị ở thiết lập, **mọi câu hỏi thuộc loại tương ứng trong bài thi được gán điểm đó**.

## 2. Hiện trạng

| Thành phần | Trạng thái |
|-----------|-----------|
| Mục "2. Cấu hình chấm điểm đúng/sai (TFQ)" | Có 4 ô `tfCorrect1Pct..tfCorrect4Pct` (% theo số ý đúng) |
| Điểm câu đơn | `examQuestions[].score` — hiện gửi `null` (chờ task này) |
| Điểm câu nhóm | `examQuestionGroups[].scorePerQuestion` — nhập tay trong dialog nhóm, mặc định `1.0` |
| DTO bài thi (`ReqUpdateExamDTO`/`ReqCreateExamDTO`) | Chỉ có `tfCorrectNPct?`, **chưa có** trường điểm theo loại ([openapi_ES.ts:507-510](../../../src/types/openapi_ES.ts#L507-L510)) |

→ Điểm đang ở **cấp từng câu**, chưa có khái niệm "điểm mặc định theo loại".

## 3. Đề xuất giao diện

Đổi tiêu đề mục 2 thành **"2. Cấu hình chấm điểm"**, chia 2 khối:

```
┌─ 2. Cấu hình chấm điểm ─────────────────────────────────────────┐
│  Điểm mỗi câu theo loại                                          │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│   │ Trắc nghiệm  │ │ Trả lời ngắn │ │ Đúng/Sai     │  (điểm/câu) │
│   │  [ 0.5 ]     │ │  [ 1.0 ]     │ │  [ 2.0 ]     │            │
│   └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  Tỉ lệ điểm Đúng/Sai theo số ý đúng (giữ nguyên)                 │
│   1 ý:[10%] 2 ý:[25%] 3 ý:[50%] 4 ý:[100%]                       │
│   → Điểm TFQ thực nhận = (điểm/câu Đúng/Sai) × (% theo số ý đúng)│
└──────────────────────────────────────────────────────────────────┘
```

## 4. Mô hình dữ liệu — ✅ ĐÃ CHỐT: Phương án A (FE-only)

### Phương án A — FE suy ra, KHÔNG đổi backend *(đã chọn)*
- 3 ô điểm-theo-loại là **state cục bộ** của form.
- Khi đổi → ghi giá trị vào `score`/`scorePerQuestion` của **tất cả** câu/nhóm thuộc loại đó (trong form state) → khi `PUT /exams/{uuid}` thì các điểm/câu đã mang giá trị đúng.
- **Không cần backend đổi gì** — tận dụng `examQuestions[].score` & `examQuestionGroups[].scorePerQuestion` sẵn có.
- Đánh đổi: thiết lập theo-loại **không lưu riêng** ở DB; khi mở lại bài thi phải **suy ngược** từ điểm các câu (xem §5.3).

### Phương án B — Backend lưu cấu hình theo loại *(KHÔNG làm bây giờ — để Phase 2)*
- Thêm field DTO `mcqScorePerQuestion?`, `saqScorePerQuestion?`, `tfqScorePerQuestion?` (giống `tfCorrectNPct`); backend tự gán/tính.
- Ưu: một nguồn sự thật, lưu bền vững, mở lại hiển thị đúng. Nhược: cần backend + sửa `openapi_ES.ts`.
- Ghi lại ở đây để **dễ nâng cấp A → B** về sau; code Phương án A nên cô lập logic điểm-theo-loại để khi có field BE chỉ cần đổi nguồn đọc/ghi.

## 5. Cơ chế cập nhật khi thay đổi thiết lập *(phần cần làm rõ)*

Gọi `typeScore = { MCQ, SAQ, TFQ }` là state thiết lập điểm-theo-loại.

### 5.1 Khi admin đổi điểm của một loại (vd MCQ: 0.5 → 1.0) — ✅ ghi đè TẤT CẢ câu cùng loại
1. Cập nhật `typeScore.MCQ = 1.0`.
2. **Áp ngay vào form** (đồng bộ tức thì, không chờ Lưu):
   - Mọi `examQuestions[]` có `sectionType === 'MCQ'` → `score = 1.0`.
   - Mọi `examQuestionGroups[]` thuộc loại MCQ → `scorePerQuestion = 1.0`.
3. Bảng "Nhóm câu hỏi đơn" và panel nhóm **re-render hiển thị điểm mới** → admin thấy thay đổi áp lên toàn bộ câu cùng loại.
4. Với **TFQ**: chỉ set `scorePerQuestion`/`score` = điểm gốc; điểm thực mỗi câu khi chấm = `điểm gốc × tfCorrectNPct` (do backend/cách chấm xử lý).

### 5.2 Khi thêm câu hỏi mới (sau khi đã thiết lập)
- Câu mới (đơn/nhóm) được **auto-fill** `score`/`scorePerQuestion` = `typeScore[loại]` thay vì `null`/`1.0`.
- Sửa: [add-question-dialog](../../../src/features/Exam_Services/exam/components/add-question-dialog.tsx) nhận thêm prop `typeScore` (hoặc exam-edit gán điểm sau khi `onConfirm`); 2 dialog nhóm tương tự.

### 5.3 Khi mở lại bài thi để sửa (khởi tạo `typeScore`) — suy ngược từ câu hiện có

> **Quan trọng:** với Phương án A, `typeScore` **KHÔNG được lưu ở đâu** (kể cả trên bản ghi
> phòng thi). Thứ duy nhất lưu vào DB là **điểm của từng câu** (`examQuestions[].score` /
> `examQuestionGroups[].scorePerQuestion`). Khi mở lại, config được **tái dựng (suy ngược)**
> từ điểm các câu, **không** đọc thẳng từ một trường config.

- Với mỗi loại, gom điểm các câu cùng loại rồi quyết định giá trị đổ vào ô thiết lập:

| Tình huống của 1 loại | Ô config hiển thị |
|----------------------|-------------------|
| Mọi câu cùng loại chung 1 điểm | Hiện đúng điểm đó |
| Điểm lệch nhau | Trống + nhãn **"Hỗn hợp"** (admin nhập lại → ghi đè tất cả) |
| Chưa có câu nào loại đó | Trống (placeholder) |

**Ví dụ** — mở lại bài thi có: 5 câu MCQ đều `1.0`, 3 câu SAQ đều `2.0`, 4 câu TFQ (3 câu `2.0` + 1 câu `3.0`):
→ ô **Trắc nghiệm = 1.0**, **Trả lời ngắn = 2.0**, **Đúng/Sai = trống ("Hỗn hợp")**.

**Đánh đổi của Phương án A (do không lưu config riêng):**
1. Không phân biệt được "đã set config = 1.0" với "tình cờ mọi câu đều 1.0" — cả hai đều hiện `1.0`.
2. Nếu sau này cho sửa điểm 1 câu lẻ (Phase 2), loại đó sẽ thành "Hỗn hợp" khi mở lại.
3. Muốn config tồn tại độc lập & chính xác tuyệt đối khi mở lại → cần **Phương án B** (Phase 2).

### 5.4 Khi lưu (`PUT /api/v1/exams/{examUuid}`)
- `examQuestions[].score` và `examQuestionGroups[].scorePerQuestion` đã mang giá trị theo loại (do §5.1 đã set sẵn trong form) → gửi như payload thường.
- `buildExamQuestionsPayload` / `buildExamGroupsPayload` dùng `q.score` / `g.scorePerQuestion` đã set, **bỏ fallback cứng `?? 1`/`?? null`** khi đã có thiết lập theo-loại.

### 5.5 Quan hệ ưu tiên — ✅ ĐÃ CHỐT: (a) luôn ghi đè
- Thiết lập theo-loại là **bộ gán hàng loạt, LUÔN GHI ĐÈ** mọi câu cùng loại (cũ lẫn mới).
  Không có override điểm lẻ cho từng câu ở bước này.
- (Đã loại) ~~(b) override điểm từng câu~~ → để Phase 2 nếu cần.

## 6. Các file ảnh hưởng (Phương án A)

| File | Thay đổi |
|------|----------|
| [exam-edit.tsx](../../../src/app/routes/app/Exam_Services/admin/exam-edit.tsx) | Thêm state `typeScore`; UI mục 2; hàm `applyTypeScore(type, value)` cập nhật form; init suy ngược (5.3); `buildExamQuestionsPayload/GroupsPayload` dùng điểm đã set |
| [exam-create.tsx](../../../src/app/routes/app/Exam_Services/admin/exam-create.tsx) | UI mục 2 + state `typeScore` (áp khi thêm câu ở bước sau) |
| [add-question-dialog.tsx](../../../src/features/Exam_Services/exam/components/add-question-dialog.tsx) | Nhận `typeScore`, auto-fill `score` câu mới theo loại |
| [create-group-dialog.tsx](../../../src/features/Exam_Services/exam/components/create-group-dialog.tsx) · [existing-group-dialog.tsx](../../../src/features/Exam_Services/exam/components/existing-group-dialog.tsx) | Mặc định `scorePerQuestion` theo `typeScore` |
| [question-type.ts](../../../src/features/Exam_Services/question/lib/question-type.ts) | (tùy chọn) thêm hằng thứ tự loại để render 3 ô |


## 7. Trường hợp biên / cần xác nhận

1. **Backend chấm TFQ**: điểm thực = `điểm gốc × %`? Cần BE xác nhận công thức để hiển thị đúng.
2. **`totalScore` của bài thi** có cần tự tính = Σ(điểm các câu)? Hay vẫn nhập tay (hiện tại)? → có thể thêm "tự tính tổng" (Phase 2).
3. **`ReqExamQuestionDTO.score` đã là `number | null`** (sửa ở task trước). Nếu chốt "điểm theo-loại luôn ghi đè", sau khi thiết lập sẽ không còn `null`.
4. ✅ Đã chốt: **Phương án A** (mục 4) + **(a) luôn ghi đè** (mục 5.5).

## 8. Ngoài phạm vi (Phase 2)

- Override điểm từng câu lẻ (cột nhập trong bảng câu hỏi).
- Tự tính `totalScore` từ tổng điểm các câu + cảnh báo khi lệch.
- Lưu cấu hình theo-loại ở backend (nếu ban đầu chỉ làm A).
