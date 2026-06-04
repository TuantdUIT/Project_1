# Plan: Nhập công thức toán bằng MathLive + hiển thị bằng KaTeX (ES)

## 1. Mục tiêu

Cho phép admin nhập **công thức toán** cho nội dung câu hỏi và từng đáp án bằng
[MathLive](https://mathlive.io). Dữ liệu lưu xuống DB là **LaTeX thuần**. Khi học
sinh làm bài, công thức được render đẹp bằng [KaTeX](https://katex.org).

## 2. Quyết định đã chốt

| # | Vấn đề | Quyết định |
|---|--------|-----------|
| 1 | Định dạng nội dung | **Trộn text + `$...$`** (cập nhật theo mockup) — chữ thường + công thức bọc trong `$...$`/`$$...$$`. Editor = ô nguồn + composer MathLive chèn `$...$`; hiển thị = KaTeX tách theo `$...$`. *(Thay cho lựa chọn "LaTeX thuần" ban đầu.)* |
| 2 | DB / Backend | **Giữ nguyên** — các field `questionContent`, `optionContent`, `statementContent` vẫn là `string`, không đổi schema/DTO/API |
| 3 | Phân vai | **MathLive** = authoring, giữ & xuất nội dung dạng LaTeX. **KaTeX** = render cho học sinh thấy |
| 4 | Vị trí code | **ES-local** — module mới `src/features/Exam_Services/math/` |

> Hệ quả của (1): vì coi mỗi field là LaTeX thuần, mọi chữ thường (đề bài bằng
> tiếng Việt) phải nằm trong `\text{...}`. MathLive tự sinh `\text{}` khi gõ chữ
> thường trong vùng văn bản, nên trải nghiệm vẫn ổn. Đây là điểm cần lưu ý khi
> nhập đề dài (xem mục Rủi ro).

## 3. Thư viện

```
npm i mathlive katex
npm i -D @types/katex
```

- `mathlive` — web component `<math-field>`, có sẵn type, tự kèm CSS/fonts.
- `katex` — render LaTeX → HTML (dùng `katex.renderToString`).
- CSS cần import 1 lần (ở `src/index.css` hoặc entry): `katex/dist/katex.min.css`.
  MathLive nhúng style riêng, chỉ cần trỏ `fontsDirectory` nếu font không load.

## 4. Kiến trúc — 2 component dùng chung (ES-local)

```
src/features/Exam_Services/math/
├── MathRender.tsx   # DISPLAY: LaTeX (string) → HTML KaTeX, read-only
├── MathInput.tsx    # AUTHORING: MathLive + 2 pane (LaTeX trái | KaTeX phải)
└── index.ts         # re-export
```

Làm `MathRender` trước vì `MathInput` dùng lại nó cho pane preview.

### 4.1 `MathRender.tsx`

API:
```ts
interface MathRenderProps {
  value?: string;                 // chuỗi LaTeX thuần từ DB
  className?: string;
  displayMode?: boolean;          // true = block (căn giữa), false = inline. Mặc định false
  fallback?: string;              // hiển thị khi value rỗng (vd '—')
}
```

Hành vi:
- `katex.renderToString(value, { throwOnError: false, displayMode })` → render qua
  `dangerouslySetInnerHTML`. `throwOnError:false` để LaTeX lỗi **không crash UI**
  (KaTeX hiện chuỗi đỏ thay vì ném exception).
- `value` rỗng → render `fallback`.
- Memo hóa kết quả render theo `value` + `displayMode` để tránh render lại thừa.

### 4.2 `MathInput.tsx`

API (controlled, thay thế trực tiếp cho `<textarea>`/`<input>`):
```ts
interface MathInputProps {
  value: string;                  // LaTeX thuần
  onChange: (latex: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}
```

Layout 2 pane:
```
┌──────────────────────────────────────────────┐
│  MathLive <math-field>  (gõ công thức)         │  ← editor chính (WYSIWYG)
├───────────────────────┬────────────────────────┤
│ LaTeX thuần (TRÁI)     │  Preview KaTeX (PHẢI)   │
│ <textarea> readOnly    │  <MathRender />         │
│ = giá trị lưu DB       │  = đúng thứ HS sẽ thấy  │
└───────────────────────┴────────────────────────┘
```

Hành vi:
- Mount: tạo `<math-field>`, set `mf.value = value` (LaTeX).
- Sự kiện `input` của math-field → `onChange(mf.getValue('latex'))`.
- Đồng bộ ngược: khi prop `value` đổi từ ngoài (vd nạp dữ liệu edit) mà khác
  `mf.getValue('latex')` → set lại để tránh vòng lặp.
- Pane trái hiển thị chính `value` (LaTeX thuần) — read-only, cho admin thấy đúng
  thứ được lưu. (Tùy chọn nâng cao: cho sửa LaTeX trực tiếp ở pane trái và sync
  ngược vào math-field — để **Phase 2**, mặc định read-only.)
- Cleanup listener khi unmount.

Lưu ý React + web component: dùng `ref` + `useEffect` để gắn/gỡ listener và set
`value` qua property (không qua attribute). Khai báo type cho JSX:
`declare global { namespace JSX { interface IntrinsicElements { 'math-field': ... } } }`
(đặt trong `MathInput.tsx` hoặc file `mathlive.d.ts` ES-local).

## 5. Điểm tích hợp — INPUT (thay control nhập liệu)

### 5.1 [create-question-dialog.tsx](src/features/Exam_Services/question/components/create-question-dialog.tsx)
- `questionContent` — textarea [dòng 141-147] → `<MathInput>`
- `mcOptions[].optionContent` — input [dòng 171-176] → `<MathInput>`
- `tfStatements[].statementContent` — input [dòng 193-198] → `<MathInput>`
- State & payload **không đổi** (vẫn là string LaTeX). `canCreate` vẫn check
  `questionContent.trim().length > 0`.
- `answerKey.correctAnswerRaw` (A/B/C/D, D/S...) **giữ nguyên** input thường — không phải công thức.

### 5.2 [questions.tsx](src/app/routes/app/Exam_Services/admin/questions.tsx) — form sửa inline
- `questionContent` [dòng 391-392] → `<MathInput>`
- `mcOptions[].optionContent` [dòng 420] → `<MathInput>`
- `tfStatements[].statementContent` [dòng 442] → `<MathInput>`

## 6. Điểm tích hợp — DISPLAY (render qua KaTeX)

### 6.1 Phòng thi (học sinh) — quan trọng nhất
- [MCQCard.tsx](src/features/Exam_Services/exam/components/exam-room/MCQCard.tsx):
  `questionContent` [dòng 29] và `optionContent` [dòng 49] → `<MathRender>`
- [TFQCard.tsx](src/features/Exam_Services/exam/components/exam-room/TFQCard.tsx):
  `questionContent` [dòng 33], `questionTopic` [dòng 60], `item.questionContent` [dòng 79] → `<MathRender>`
- [SAQCard.tsx](src/features/Exam_Services/exam/components/exam-room/SAQCard.tsx):
  `questionContent` [dòng 31], `item.questionContent` [dòng 61] → `<MathRender>`

> Lưu ý layout: chữ "A. ", "1. ", số thứ tự... giữ nguyên text thường, chỉ bọc
> phần **nội dung** bằng `<MathRender>` (inline, `displayMode=false`).

### 6.2 Khu vực admin (preview danh sách)
- [questions.tsx dòng 284] — preview nội dung trong bảng (`line-clamp-2`) →
  `<MathRender>` inline. Cân nhắc: list nhiều dòng render KaTeX có thể tốn nhẹ;
  chấp nhận được với page size hiện tại.
- [exam-edit.tsx dòng 543-544] — cột "Nội dung rút gọn" (`truncate`) →
  `<MathRender>` (tùy chọn, ưu tiên thấp).

## 7. Thứ tự thực hiện

1. **Cài lib + CSS** — `mathlive`, `katex`, `@types/katex`; import `katex.min.css`.
2. **`MathRender.tsx`** + unit kiểm thử nhanh (render `\frac{1}{2}`, chuỗi rỗng, LaTeX lỗi).
3. **`MathInput.tsx`** + `index.ts` + khai báo type `math-field`.
4. **Gắn DISPLAY phòng thi** (6.1) — kiểm thử bằng câu hỏi có công thức trong DB.
5. **Gắn INPUT create dialog** (5.1) — tạo câu hỏi mới có công thức, verify chuỗi LaTeX gửi đi.
6. **Gắn INPUT edit form** (5.2).
7. **Gắn DISPLAY admin** (6.2).
8. Rà soát toàn bộ chỗ render `questionContent`/`optionContent` còn sót.

## 8. Rủi ro & xử lý

| Rủi ro | Xử lý |
|--------|-------|
| LaTeX lỗi cú pháp làm vỡ trang | `throwOnError:false` ở KaTeX → hiện đỏ, không crash |
| Đề dài bằng tiếng Việt trong field "LaTeX thuần" | MathLive bọc `\text{}`; hướng dẫn admin; cân nhắc Phase 2 cho chế độ trộn text+math nếu khó dùng |
| Web component MathLive + React (sync 2 chiều) | Dùng ref + property binding + guard tránh loop set value |
| Font/CSS không load | Import `katex.min.css` 1 lần; cấu hình `MathfieldElement.fontsDirectory` nếu cần |
| Dữ liệu cũ (text thường, không phải LaTeX) | KaTeX render text thường vẫn ra chữ; ký tự đặc biệt (`%`, `_`, `^`, `\`) có thể lệch → kiểm tra dữ liệu cũ, escape khi cần |
| SSR / hydration | Không áp dụng (Vite SPA), an toàn |

## 9. Tiêu chí hoàn thành (DoD)

- [ ] Tạo câu hỏi MCQ/TFQ/SAQ có công thức; payload gửi BE chứa **LaTeX thuần**.
- [ ] DB lưu đúng chuỗi LaTeX (không bị bọc HTML/escape thừa).
- [ ] Phòng thi render công thức đúng & đẹp ở câu hỏi và mọi đáp án (MCQ/TFQ/SAQ).
- [ ] Sửa câu hỏi: nạp lại LaTeX vào MathLive đúng, sửa & lưu round-trip ổn định.
- [ ] LaTeX lỗi không làm crash trang (cả admin lẫn phòng thi).
- [ ] `npx tsc --noEmit` sạch lỗi.

## 10. Ngoài phạm vi (Phase 2 — nếu cần)

- Sửa LaTeX trực tiếp ở pane trái (sync ngược về MathLive).
- Chế độ nội dung trộn text + math inline (`$...$`).
- Render công thức trong OMR / kết quả / export.
- Bàn phím ảo MathLive tùy biến theo môn.
