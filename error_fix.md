# Nhật ký sửa lỗi — Tính năng "Kết quả kiểm tra"

Tổng hợp các lỗi & mâu thuẫn đã gặp khi làm tính năng nút "Kết quả kiểm tra"
(gọi `GET /api/v1/dashboard/exams/{examUuid}/results` trong trang chỉnh sửa phòng thi).

---

## Lỗi 1: `schoolYear` does not exist (TS2353 / TS2339)

- **Lỗi:** `Property 'schoolYear' does not exist on type 'ReqCreateExamDTO' / 'ReqUpdateExamDTO' / 'ResExamDTO'` — 5 lỗi ở `exam-edit.tsx` và `exam-create.tsx`.
- **Bối cảnh:** Khi đang thêm nút "Kết quả kiểm tra", tôi chạy `tsc` thì phát hiện một loạt lỗi TypeScript liên quan đến `schoolYear` (không phải do tính năng mới, mà có sẵn).
- **Nguyên nhân gốc:** Giao diện có ô "NĂM HỌC" đọc/ghi vào `form.schoolYear`, nhưng file `openapi_ES.ts` (sinh tự động từ spec backend) chưa có field này. Backend đã thêm `schoolYear` vào API tạo bài thi rồi, nhưng spec phía FE chưa được cập nhật theo → type không khớp.
- **Cách fix:** Chạy `pnpm codegen:es` để **regenerate** `openapi_ES.ts` từ OpenAPI doc của backend (`http://localhost:8080/v3/api-docs` — đã có sẵn `schoolYear`). File sinh lại tự thêm `schoolYear` vào đúng tất cả DTO liên quan, type-check sạch.
  > ⚠️ Lần đầu tôi đã **sửa tay** thêm field vào file này — đó là **sai/vi phạm** ngay chính quy tắc bên dưới (file có header ghi rõ "Do not make direct changes"). Đó chỉ là bản vá tạm và đã được thay bằng cách regenerate đúng quy trình.
- **Bài học:** `openapi_ES.ts` là file **tự sinh** (header ghi rõ "auto-generated... Do not make direct changes") — tuyệt đối không sửa tay. Khi backend thêm field, đúng quy trình là chạy lại `pnpm codegen:es`. Trước khi sửa file type, phải kiểm tra xem nó có phải file tự sinh không; nếu có thì sửa ở **nguồn** (backend spec) rồi regenerate, đừng đụng vào file sinh ra.

---

## Lỗi 2: `results.map is not a function`

- **Lỗi:** `TypeError: results.map is not a function` → crash màn hình "Unexpected Application Error!".
- **Bối cảnh:** Lần đầu bấm nút "Kết quả kiểm tra" để mở dialog thì app crash.
- **Nguyên nhân gốc:** Tôi giả định API trả về một **mảng** và gọi `.map` luôn. Thực tế API trả về **object bọc ngoài** (`{ data: { ..., students: [...] } }`); sau khi `apiClientES` đã bóc lớp `data`, cái còn lại vẫn là object chứ không phải mảng → gọi `.map` trên object nên lỗi.
- **Cách fix:** Đổi kiểu trả về của `getExamResults` thành `unknown`, thêm hàm `normalizeExamResults` trong `select` để bóc mảng ra từ nhiều dạng (`students` / `content` / `results` / `data` / `items`); nếu không khớp dạng nào thì trả `[]` thay vì để crash.
- **Bài học:** Đừng đoán shape của response. Xem JSON thật trước khi map, và luôn viết code **phòng thủ** với dữ liệu lấy từ API (kiểm tra `Array.isArray`, fallback mảng rỗng).

---

## Lỗi 3: API không được gọi — tab Network trống

- **Lỗi:** Bấm "Kết quả kiểm tra" nhưng tab Network **không có request** `GET .../results` nào.
- **Bối cảnh:** Sau khi fix crash, mở lại dialog thì luôn hiện "Chưa có học sinh nào nộp bài" mà Network không thấy lượt gọi nào → tưởng code không chạy.
- **Nguyên nhân gốc:** React Query cấu hình **global** `staleTime: 5 phút`, `gcTime: 10 phút` (`react-query.ts`). Lần gọi đầu tiên đã cache kết quả; mở lại dialog trong vòng 5 phút thì dùng luôn cache, **không refetch** nên Network trống. Dữ liệu cache cũ lại bị normalize ra `[]` → bảng rỗng.
- **Cách fix:** Ghi đè riêng cho query này: `staleTime: 0`, `gcTime: 0`, `refetchOnMount: 'always'` → mỗi lần mở dialog đều gọi API mới.
- **Bài học:** Luôn để ý cấu hình **global** của React Query. Với dữ liệu cần luôn mới (kết quả, dashboard) phải override `staleTime`. "Không thấy request" thường là do **cache**, không phải code không chạy → kiểm tra cache trước khi nghi ngờ logic.

---

## Lỗi 4: Dialog không hiển thị dữ liệu dù API trả về 200

- **Lỗi:** Bảng trống ("Chưa có học sinh nào nộp bài") dù API trả về `200` kèm danh sách 5 học sinh.
- **Bối cảnh:** API đã gọi thành công, response có dữ liệu, nhưng popup vẫn không hiển thị gì.
- **Nguyên nhân gốc:** Tên field tôi tự đoán **không khớp** response thật:
  - Mảng học sinh nằm trong `data.students` (tôi đoán `content`).
  - Tên là `fullname` (tôi đoán `studentName`).
  - Điểm từng phần gom trong object `sectionScores: { MCQ, TFQ, SAQ }` (tôi đoán `mcqScore` / `tfqScore` / `saqScore`).
  Vì vậy normalizer chưa bóc `students` và bảng đọc sai field → ra rỗng.
- **Cách fix:** Cập nhật type `ResExamResult` khớp response thật; normalizer bóc thêm `obj.students`; bảng map đúng field; `key` của row dùng `userUuid + index` (vì cùng một `studentId` có nhiều lượt nộp); thêm cột "Nguồn nộp" (`WEB` → Trực tuyến, `OMR_IMPORT` → Quét phiếu) để phân biệt các dòng trùng học sinh.
- **Bài học:** Lấy **JSON response thật** rồi mới định nghĩa type và map UI — đừng làm ngược lại. Lưu ý dữ liệu có thể có nhiều dòng cùng một định danh (`studentId`) → cần `key` duy nhất và cột phân biệt để bảng không gây hiểu nhầm.
