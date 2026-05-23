# FE Plan — Navbar "Chi phí" (Cost Management)

> Tài liệu hướng dẫn frontend implement mục **"Chi phí"** trên navbar.
> Phạm vi: **Manager** xem / thêm / sửa / xoá Cost theo cấu trúc `ReqCreateCostDTO` và `ReqUpdateCostDTO`. Quản lý kèm `CostTag`.
>
> Nguồn tham chiếu: [API Guide 15 - Cost Tag](../guide/API%20Guide%2015%20-%20Cost%20Tag.md), [API Guide 16 - Cost](../guide/API%20Guide%2016%20-%20Cost.md).

---

## 1. Phạm vi quyền truy cập

| Role | Quyền |
|---|---|
| `MANAGER` | Full CRUD trên `Cost` và `CostTag` |
| `TEACHER` / khác | Theo discretion — tài liệu này không khuyến nghị mở cho non-manager |
| `STUDENT` | KHÔNG hiển thị mục "Chi phí" trên navbar |

> **FE thực hiện**: ẩn navbar item nếu role hiện tại không phải MANAGER. Lấy role từ JWT claim `permission` hoặc từ profile API.

---

## 2. Bố cục giao diện đề xuất

Layout dự án dùng **sidebar dọc bên trái** cho manager. Mục **"Chi phí"** là 1 item trong sidebar, nằm dưới "Tuần học". Khi click → mở trang Chi phí với 2 tab nội bộ.

```
┌──────────────┬─────────────────────────────────────────────────┐
│  Logo        │   PAGE: Chi phí                                 │
│              │   ┌───────────────────────────────────────────┐ │
│  Tổng quan   │   │ [Danh sách Chi phí] [Quản lý nhãn]        │ │
│  Đăng ký     │   └───────────────────────────────────────────┘ │
│  Lớp học     │                                                 │
│  Nhân sự     │   ┌─── Tab 1: Cost list ──────────────────────┐ │
│  Template P. │   │ Filter: paidStatus ▼  tag ▼  paidBy ▼     │ │
│  Timetable   │   │ Search: tên chi phí...        [+ Thêm]    │ │
│  Tuần học    │   │ ┌──────────────────────────────────────┐  │ │
│  Chi phí ◀   │   │ │ Tên | Người chi | Tiền | Status | …  │  │ │
│              │   │ └──────────────────────────────────────┘  │ │
│  Cài đặt     │   │ Mỗi row: [Sửa] [Xoá]                      │ │
│              │   └───────────────────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────────────┘
```

- **Sidebar item "Chi phí"** hiển thị duy nhất với role MANAGER. Có icon (gợi ý: ví / hoá đơn) đồng bộ với phong cách các icon hiện có (Tổng quan, Đăng ký, Lớp học…).
- Khi active, item được highlight kiểu **pill xanh full-width** giống item "Tuần học" hiện tại.
- 2 tab nội bộ: **"Danh sách Chi phí"** (mặc định) và **"Quản lý nhãn"**.
- Form thêm/sửa hiển thị dạng **modal** hoặc **right-drawer** (không chiếm sidebar).
- Mobile/tablet: sidebar collapse thành hamburger; trang Chi phí giữ nguyên 2 tab.

---

## 3. Các API sử dụng

Base path:
- `Cost`: `/api/v1/costs`
- `CostTag`: `/api/v1/cost-tags`
- `User` (để chọn paidByUser, confirmedByUser): dùng endpoint tồn tại trong dự án để load user list (ví dụ `GET /api/v1/users`).

### 3.1. Tab "Danh sách Chi phí"

| Hành động | Method | Endpoint |
|---|---|---|
| Load danh sách | GET | `/api/v1/costs` |
| Xem chi tiết | GET | `/api/v1/costs/{id}` |
| Thêm | POST | `/api/v1/costs` |
| Sửa | PUT | `/api/v1/costs/{id}` |
| Xoá | DELETE | `/api/v1/costs/{id}` |

### 3.2. Tab "Quản lý nhãn (Cost Tag)"

| Hành động | Method | Endpoint |
|---|---|---|
| Load danh sách | GET | `/api/v1/cost-tags` |
| Thêm tag | POST | `/api/v1/cost-tags` |
| Sửa tag | PUT | `/api/v1/cost-tags/{id}` |
| Xoá tag | DELETE | `/api/v1/cost-tags/{id}` |

---

## 4. Form fields theo Request DTO

### 4.1. Form Thêm Cost — `ReqCreateCostDTO`

```json
POST /api/v1/costs
{
  "name": "Mua tài liệu",
  "paidByUserUuid": "019ff000-...",
  "amount": 500000,
  "paidStatus": "SAVED",
  "debt": 500000,
  "confirmedByUserUuid": "019ff222-...",
  "costTagId": 1
}
```

| Field UI | Type input | Bắt buộc | Validate FE | Ghi chú |
|---|---|---|---|---|
| Tên chi phí | text | ✅ | non-blank | maps `name` |
| Người chi (paidByUser) | dropdown chọn 1 User | ✅ | non-null | maps `paidByUserUuid`, load từ `/api/v1/users` |
| Số tiền | number (BigDecimal) | ✅ | > 0 | maps `amount` |
| Trạng thái thanh toán | dropdown enum | ✅ | ∈ {`SAVED`,`APPROVED`,`REJECTED`} | maps `paidStatus`, tham khảo `CostPaidStatus.java` |
| Nợ còn lại | number | ✅ | ≥ 0, ≤ amount (FE tự enforce) | maps `debt` |
| Người xác nhận | dropdown User | ❌ | optional | maps `confirmedByUserUuid` |
| Nhãn (Tag) | dropdown CostTag | ❌ | optional | maps `costTagId`, load từ `/api/v1/cost-tags` |

> **Backend lưu ý**:
> - `debt` KHÔNG được auto-tính từ `amount`. FE quyết định và gửi explicit.
> - `paidStatus` không trigger workflow nào ở BE — chỉ lưu giá trị enum.

### 4.2. Form Sửa Cost — `ReqUpdateCostDTO`

```json
PUT /api/v1/costs/{id}
{
  "name": "Mua tài liệu cập nhật",
  "paidByUserUuid": "019ff000-...",
  "amount": 400000,
  "paidStatus": "APPROVED",
  "debt": 0,
  "confirmedByUserUuid": "019ff222-...",
  "costTagId": 1
}
```

- **Tất cả field đều optional**. FE chỉ gửi field bị thay đổi (partial update style) hoặc gửi toàn bộ — backend xử lý được cả 2 cách.
- UI form sửa **pre-fill** từ response `GET /costs/{id}` trước khi render.

### 4.3. Form Tag — `ReqCreateCostTagDTO` / `ReqUpdateCostTagDTO`

```json
POST /api/v1/cost-tags
{ "name": "Vận hành" }
```
```json
PUT /api/v1/cost-tags/{id}
{ "name": "Vận hành nội bộ" }
```

- `name`: bắt buộc khi tạo, optional khi sửa.
- Backend check **trùng tên** trước khi save → FE phải xử lý 400 `"Cost tag with name '...' already exists"`.

---

## 5. Response shape

### 5.1. `ResCostDTO`
```json
{
  "cost_uuid": "019ff111-...",
  "cost_name": "Mua tai lieu",
  "paid_by_user": {
    "user_uuid": "019ff000-...",
    "user_fullname": "Nguyen Van A",
    "user_email": "manager@example.com",
    "role_name": "MANAGER"
  },
  "amount": 500000,
  "cost_paid_status": "SAVED",
  "debt": 500000,
  "confirmed_by_user": { /* same shape, hoặc null */ },
  "cost_tag": { "id": 1, "name": "Van hanh" },
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

### 5.2. `ResCostTagDTO`
```json
{
  "id": 1,
  "name": "Van hanh",
  "createdAt": "2026-05-16T10:00:00Z",
  "updatedAt": "2026-05-16T10:00:00Z",
  "createdBy": "system",
  "updatedBy": "system"
}
```

> Naming convention không đồng nhất giữa 2 DTO: `Cost` dùng snake_case, `CostTag` dùng camelCase. FE phải tôn trọng đúng key của BE — không tự convert.

---

## 6. Luồng UX chi tiết

### 6.1. Load trang Chi phí
```js
async function openCostPage() {
  const [costs, tags, users] = await Promise.all([
    fetch("/api/v1/costs").then(r => r.json()),
    fetch("/api/v1/cost-tags").then(r => r.json()),
    fetch("/api/v1/users").then(r => r.json())  // tuỳ endpoint user thực tế
  ]);
  renderTable(costs.data);
  cacheLookup({ tags: tags.data, users: users.data });
}
```

### 6.2. Thêm Cost
```js
async function createCost(form) {
  const res = await fetch("/api/v1/costs", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      name: form.name,
      paidByUserUuid: form.paidByUserUuid,
      amount: form.amount,
      paidStatus: form.paidStatus,         // SAVED | APPROVED | REJECTED
      debt: form.debt,
      confirmedByUserUuid: form.confirmedByUserUuid || undefined,
      costTagId: form.costTagId || undefined
    })
  });
  if (!res.ok) return showError(await res.json());
  closeModal(); reload();
}
```

### 6.3. Sửa Cost
- Trước khi mở modal: `GET /costs/{id}` để có dữ liệu mới nhất.
- Submit: PUT với toàn bộ form (đơn giản hơn) hoặc chỉ field đổi.

### 6.4. Xoá Cost
- Confirm dialog → `DELETE /costs/{id}` → expect `204 No Content` → reload table.

### 6.5. Quản lý Tag (tab 2)
- Tương tự CRUD bình thường.
- Khi xoá tag, BE chưa chặn nếu tag đang được Cost dùng — **FE nên check trước**: xem `costs` nào đang dùng tag này, cảnh báo "Tag này đang được N khoản chi sử dụng, vẫn xoá?".

---

## 7. Edge cases & error handling

| Tình huống | Backend response | FE xử lý |
|---|---|---|
| Tạo cost thiếu `name` | 400 `"Ten cost khong duoc de trong"` | Highlight field name |
| `paidByUserUuid` không tồn tại | 400/404 `"User with user_uuid ... does not exist"` | Toast lỗi, refresh dropdown |
| `costTagId` không tồn tại | 400/404 `"Cost tag with id ... does not exist"` | Refresh tag list, báo user chọn lại |
| Trùng tên tag khi tạo | 400 `"Cost tag with name '...' already exists"` | Báo "Tên đã tồn tại" |
| Xoá tag đang được dùng | Có thể FK error 500 tuỳ DB | Cảnh báo trước khi xoá (mục 6.5) |
| Không có quyền | 401/403 | Redirect login hoặc ẩn UI |

---

## 8. Validation FE trước khi gửi

- `name`: trim, không rỗng.
- `amount`: parse `BigDecimal` (số dương). Nên dùng input type `number` step `0.01`.
- `debt`: ≥ 0. Khuyến nghị FE enforce `debt ≤ amount` (BE không kiểm).
- `paidStatus`: chỉ cho chọn 1 trong 3 giá trị enum.
- UUID fields: nếu user chưa chọn dropdown → KHÔNG gửi field (để optional thực sự).

---

## 9. Checklist trước khi merge

- [ ] Navbar item "Chi phí" chỉ hiển thị với role MANAGER
- [ ] Form thêm/sửa pre-fill đúng key BE (snake_case ở Cost, camelCase ở Tag)
- [ ] Dropdown `paidByUser` / `confirmedByUser` hiển thị `fullName (email - role)` cho dễ chọn
- [ ] Dropdown `paidStatus` đúng 3 giá trị: SAVED, APPROVED, REJECTED
- [ ] Xác nhận xoá có confirm dialog
- [ ] Quản lý tag: cảnh báo khi xoá tag đang được dùng
- [ ] Xử lý 400 hiển thị message gốc từ BE
- [ ] Reload bảng sau mỗi action thành công
- [ ] FE enforce `debt ≤ amount`, `amount > 0`

---

## 10. Tóm tắt endpoint

### Cost (`/api/v1/costs`)
| Method | Path | Mục đích |
|---|---|---|
| GET | `/api/v1/costs` | Lấy danh sách cost |
| GET | `/api/v1/costs/{id}` | Lấy chi tiết |
| POST | `/api/v1/costs` | Tạo |
| PUT | `/api/v1/costs/{id}` | Cập nhật |
| DELETE | `/api/v1/costs/{id}` | Xoá |

### Cost Tag (`/api/v1/cost-tags`)
| Method | Path | Mục đích |
|---|---|---|
| GET | `/api/v1/cost-tags` | Lấy danh sách tag |
| GET | `/api/v1/cost-tags/{id}` | Lấy chi tiết tag |
| POST | `/api/v1/cost-tags` | Tạo tag |
| PUT | `/api/v1/cost-tags/{id}` | Cập nhật tag |
| DELETE | `/api/v1/cost-tags/{id}` | Xoá tag |
