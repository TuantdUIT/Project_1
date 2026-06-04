Thao tác của người dùng (admin)
1. Tạo mã đề — POST /api/v1/omr/exam-papers (khối ①)

Gọi một lần cho mỗi paperCode sẽ in ra phiếu (ví dụ mã 101, 102, 103...).
Body: { examUuid, paperCode }.
Đây là bước bắt buộc làm trước, vì sau này hệ thống đối chiếu phiếu quét theo paperCode (như đã phân tích ở câu trước).
2. (Ngoài hệ thống) In đề → phát cho học sinh làm → quét phiếu thành PDF

Đây là thao tác vật lý/offline, không qua API. Kết quả là một file PDF chứa các phiếu OMR đã tô.
3. Upload phiếu quét — POST /api/v1/omr/scoring-jobs (khối ②)

Param: file (PDF) + examUuid.
Sau bước này admin không cần làm gì thêm để chấm — hệ thống nhận 202 ACCEPTED và tự xử lý nền (khối ③④⑤: gọi ScoringService, resolve học sinh, import, chấm điểm).
4. Theo dõi kết quả job — GET /api/v1/omr/scoring-jobs/{jobUuid} (khối ⑤)

Poll để xem trạng thái (PROCESSING / COMPLETED / FAILED), số trang đã chấm, số thành công/thất bại, điểm từng học sinh, ảnh đã chấm.
5. Xem báo cáo tổng hợp — GET /api/v1/dashboard/exams/{examUuid}/results (và /stats, /rankings)

Bài OMR đã chấm (score != null) hiện chung với bài web, có thể xuất Excel.
Tóm tắt thứ tự

①  POST /omr/exam-papers      (lặp lại theo từng mã đề)   ← user
    ↓
    [in đề · học sinh làm · quét PDF]                      ← offline
    ↓
③  POST /omr/scoring-jobs      (upload PDF)                ← user
    ↓
    [hệ thống tự chấm: ScoringService → resolve → import]  ← TỰ ĐỘNG
    ↓
④  GET /omr/scoring-jobs/{id}  (theo dõi)                  ← user
    ↓
⑤  GET /dashboard/.../results  (xem/xuất kết quả)          ← user