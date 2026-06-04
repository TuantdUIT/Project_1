# Exam Violation Tracking — Kế hoạch triển khai

## Tổng quan

Hệ thống phát hiện và xử lý các hành vi vi phạm trong quá trình làm bài thi trực tuyến.
Mục tiêu: detect realtime ở frontend, log và phản hồi phù hợp, đồng bộ với backend khi có API.

---

## Các loại vi phạm cần xử lý

| Type | Sự kiện browser | Mô tả |
|---|---|---|
| `TAB_SWITCH` | `document.visibilitychange` | Học sinh chuyển sang tab khác |
| `FULLSCREEN_EXIT` | `document.fullscreenchange` | Thoát chế độ toàn màn hình |
| `WINDOW_BLUR` | `window.blur` | Focus chuyển sang app khác |
| `COPY_PASTE` | `copy` / `paste` / `cut` / `keydown` | Sao chép hoặc dán nội dung |
| `NETWORK_LOST` | `window.offline` + heartbeat | Mất kết nối mạng |

---

## Tổ chức file

```
src/features/Exam_Services/exam/violations/
├── types.ts                     ← ViolationType enum, ViolationEvent, ViolationConfig
├── detectors/
│   ├── tab-switch.ts            ← visibilitychange listener
│   ├── fullscreen.ts            ← fullscreenchange listener
│   ├── window-blur.ts           ← blur/focus listener
│   ├── copy-paste.ts            ← copy/paste/cut/keydown listener
│   └── network.ts               ← offline/online event + heartbeat ping
├── use-violation-tracker.ts     ← hook trung tâm, kết nối tất cả detectors
└── api.ts                       ← gửi violations lên backend (khi có API)
```

**Khuôn mẫu mỗi detector:**
```
Input:  onViolation(type: ViolationType) → void
Output: cleanup() → void
```
Detector độc lập, không biết về nhau → dễ test, dễ bật/tắt từng loại.

---

## Tích hợp vào component

```
exam-process.tsx
  └── useViolationTracker(attemptUuid, config)
        ↓
      ExamRoomView  ←  nhận { violationCount, isWarning }
        └── hiển thị warning banner / modal
```

Hook đặt ở `exam-process.tsx` vì đây là nơi giữ `attemptUuid`.

---

## Chính sách xử lý (đề xuất)

| Số lần vi phạm | Hành động |
|---|---|
| Lần 1 | Toast cảnh báo nhẹ |
| Lần 2 | Modal cảnh báo rõ ràng, yêu cầu xác nhận |
| Lần 3+ | Auto-submit bài thi, ghi nhận `isAutoSubmitted: true` |

Ngưỡng nên được cấu hình, không hardcode.

---

## Lưu ý kỹ thuật

### WINDOW_BLUR
- Mở DevTools cũng trigger `blur` → cần debounce hoặc minimum threshold (~500ms) trước khi tính là vi phạm.
- Kết hợp với `visibilityState` để phân biệt chuyển tab vs. chuyển app.

### FULLSCREEN_EXIT
- Khi vào phòng thi: gọi `requestFullscreen()` bắt buộc.
- Nếu user từ chối fullscreen → không cho vào phòng thi, hoặc ghi nhận ngay.
- Khi thoát: hiện modal + nút "Vào lại fullscreen", đếm ngược N giây.

### COPY_PASTE
- Bắt cả 3 tầng: DOM event (`copy/paste/cut`) + keyboard (`Ctrl+C/V/X`) + chuột phải (`contextmenu`).
- CSS `user-select: none` trên vùng câu hỏi để chặn bôi đen.
- Lưu ý: `paste` vào SAQ textarea có thể là hành vi hợp lệ → cân nhắc chỉ log, không chặn.

### NETWORK_LOST
- `navigator.onLine` không đủ tin cậy một mình — kết hợp với heartbeat.
- Heartbeat: ping server mỗi 30s, timeout 5s không nhận pong → coi là mất mạng.
- **Bắt buộc:** lưu đáp án vào `localStorage` mỗi lần thay đổi để khôi phục khi có lại mạng.
- Khi mất mạng: hiện countdown, hết giờ → auto-submit với dữ liệu đã lưu.

---

## Trạng thái backend

> **Hiện tại backend chưa có API cho violations.**

Các endpoint hiện có:
- `POST /student/exams/{uuid}/attempts` — bắt đầu thi
- `POST /student/attempts/{uuid}/answers` — lưu đáp án
- `POST /student/attempts/{uuid}/submit` — nộp bài
- `GET  /student/attempts/{uuid}` — lấy thông tin attempt

### Yêu cầu backend bổ sung (cần trao đổi)

**Option A — Endpoint riêng:**
```
POST /api/v1/student/attempts/{attemptUuid}/violations
Body: { type: ViolationType, occurredAt: string }
```

**Option B — Gắn vào submit payload:**
```
POST /api/v1/student/attempts/{attemptUuid}/submit
Body: { violations: [{ type, occurredAt, count }] }
```

**Option C — Config per exam (ưu tiên cao):**
```
GET /api/v1/exams/{examUuid}
→ proctoringConfig: {
    enabledViolations: ViolationType[],
    maxWarnings: number,
    autoSubmitOnExceed: boolean
  }
```

### Quan trọng: ViolationType KHÔNG nên fetch từ backend
- Các type map trực tiếp sang browser API → phải hardcode ở frontend.
- Điều backend nên cung cấp: **cấu hình** (bật/tắt, ngưỡng), không phải tên type.

---

## TODO

- [ ] Trao đổi với backend về việc bổ sung `proctoringConfig` vào `ResExamDTO`
- [ ] Xác nhận option gửi violations (endpoint riêng hay gắn vào submit)
- [ ] Implement `violations/types.ts`
- [ ] Implement từng detector trong `violations/detectors/`
- [ ] Implement `use-violation-tracker.ts`
- [ ] Tích hợp hook vào `exam-process.tsx`
- [ ] Implement UI cảnh báo trong `ExamRoomView`
- [ ] Implement lưu đáp án vào `localStorage` (phục vụ network recovery)
- [ ] Implement auto-submit khi vượt ngưỡng
