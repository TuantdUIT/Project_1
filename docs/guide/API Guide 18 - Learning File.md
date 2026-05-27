# API Guide 18 - Learning File

## 1. Muc dich module

Module `Learning File` dung de quan ly tai lieu hoc tap online nhu file PDF, de cuong, tai lieu tham khao, bai tap.

Module nay co 2 nhom API:
- API CRUD de van hanh tao, sua, xoa hoc lieu.
- API de hoc sinh lay danh sach hoc lieu ma minh duoc phep xem.

Theo nghiep vu trong `instruction`:
- hoc sinh chi duoc xem hoc lieu thuoc `GRADE` cua minh
- hoc sinh chi duoc xem hoc lieu trong cua so:
  - tu `student_first_enroll_date`
  - den `estimate_expire_date` muon nhat trong tat ca `PERIOD`

## 2. Danh sach API

- `GET /api/v1/learning-files`
- `GET /api/v1/learning-files/{id}`
- `POST /api/v1/learning-files`
- `PUT /api/v1/learning-files/{id}`
- `DELETE /api/v1/learning-files/{id}`
- `GET /api/v1/learning-files/student/{userUuid}`

`userUuid` trong API hoc sinh la `user_uuid` cua hoc sinh.

## 3. GET /api/v1/learning-files

### Muc dich

Lay toan bo danh sach learning file.

### Input format

Khong co request body.

### Output format

Tra ve `List<ResLearningFileDTO>`.

Moi phan tu co dang:

```json
{
  "file_uuid": "uuid",
  "file_name": "Tai lieu Ham so bac nhat",
  "grade": {
    "grade_id": 1,
    "grade_name": "K10"
  },
  "file_overview": "Tom tat tai lieu",
  "chapter": "Chuong 1",
  "file_link": "https://...",
  "file_valid_from": "2026-05-17",
  "file_valid_to": "2026-08-08",
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "admin@...",
  "updated_by": "admin@..."
}
```

### Exception co the tra ve

Thong thuong khong co exception nghiep vu rieng.

### Mo ta luong

Lay danh sach learning file tu DB -> map sang `ResLearningFileDTO` -> tra ket qua.

## 4. GET /api/v1/learning-files/{id}

### Muc dich

Lay chi tiet mot learning file theo `file_uuid`.

### Input format

Path variable:

```text
id: UUID
```

### Output format

Tra ve `ResLearningFileDTO`.

### Exception co the tra ve

- `Learning file with id {id} does not exist`

### Mo ta luong

Nhan `file_uuid` -> tim learning file trong DB -> neu khong ton tai thi bao loi -> neu ton tai thi map DTO va tra ket qua.

## 5. POST /api/v1/learning-files

### Muc dich

Tao moi learning file.

### Input format

Request body:

```json
{
  "name": "Tai lieu Ham so bac nhat",
  "gradeId": 1,
  "overview": "Tom tat tai lieu",
  "chapter": "Chuong 1",
  "link": "https://...",
  "validFrom": "2026-05-17",
  "validTo": "2026-08-08"
}
```

### Rule validate

- `name` bat buoc
- `gradeId` bat buoc
- `link` bat buoc
- `validFrom` bat buoc
- `validTo` bat buoc
- `validTo` khong duoc nho hon `validFrom`
- `gradeId` phai ton tai

### Output format

Tra ve `ResLearningFileDTO`.

### Exception co the tra ve

- `Ten file khong duoc de trong`
- `gradeId khong duoc de trong`
- `Link file khong duoc de trong`
- `validFrom khong duoc de trong`
- `validTo khong duoc de trong`
- `Grade with id {id} does not exist`
- `validTo khong duoc nho hon validFrom`

### Mo ta luong

Nhan request tao hoc lieu -> validate du lieu bat buoc -> kiem tra `Grade` ton tai -> kiem tra khoang ngay hop le -> luu learning file xuong DB -> map sang `ResLearningFileDTO` -> tra ket qua.

## 6. PUT /api/v1/learning-files/{id}

### Muc dich

Cap nhat learning file.

### Input format

Path variable:

```text
id: UUID
```

Request body, cac truong deu la optional:

```json
{
  "name": "Tai lieu moi",
  "gradeId": 1,
  "overview": "Noi dung moi",
  "chapter": "Chuong 2",
  "link": "https://...",
  "validFrom": "2026-05-20",
  "validTo": "2026-08-10"
}
```

### Rule validate

- learning file phai ton tai
- neu co `gradeId` moi thi `Grade` phai ton tai
- sau khi hop nhat du lieu cu va moi, `validTo` khong duoc nho hon `validFrom`

### Output format

Tra ve `ResLearningFileDTO`.

### Exception co the tra ve

- `Learning file with id {id} does not exist`
- `Grade with id {id} does not exist`
- `validTo khong duoc nho hon validFrom`

### Mo ta luong

Nhan `file_uuid` va du lieu can sua -> tim learning file hien tai -> neu co doi `Grade` thi resolve lai `Grade` -> hop nhat du lieu cu va moi -> validate khoang ngay -> luu cap nhat xuong DB -> map DTO va tra ket qua.

## 7. DELETE /api/v1/learning-files/{id}

### Muc dich

Xoa learning file.

### Input format

Path variable:

```text
id: UUID
```

### Output format

Tra ve HTTP `204 No Content`.

### Exception co the tra ve

- `Learning file with id {id} does not exist`

### Mo ta luong

Nhan `file_uuid` -> kiem tra learning file ton tai -> xoa khoi DB -> tra `204 No Content`.

## 8. GET /api/v1/learning-files/student/{userUuid}

### Muc dich

Lay danh sach learning file ma hoc sinh duoc phep xem.

### Input format

Path variable:

```text
userUuid: UUID
```

### Output format

Tra ve `List<ResLearningFileDTO>`.

Chi tra nhung hoc lieu thoa dong thoi 2 nhom dieu kien:
- thuoc `Grade` cua hoc sinh
- co khoang hieu luc giao voi cua so hoc lieu cua hoc sinh

### Rule nghiep vu truy cap hoc lieu

Backend xac dinh cua so hoc lieu cua hoc sinh nhu sau:
- `accessStartDate = student_first_enroll_date`
- `accessEndDate = estimate_expire_date` muon nhat trong tat ca `PERIOD`

Learning file duoc phep hien thi neu:
- `grade_id` cua tai lieu nam trong tap `Grade` cua hoc sinh
- va khoang `[file_valid_from, file_valid_to]` giao voi khoang `[accessStartDate, accessEndDate]`

Noi cach khac, tai lieu se duoc hien neu:
- `file_valid_from <= accessEndDate`
- va `file_valid_to >= accessStartDate`

### Exception co the tra ve

- `Student with user_uuid {userUuid} does not exist`
- `Hoc sinh chua co first enrollment date de truy cap hoc lieu`
- `Hoc sinh chua co period de truy cap hoc lieu`

### Mo ta luong

Nhan `userUuid` cua hoc sinh -> resolve `Student` -> kiem tra hoc sinh da co `student_first_enroll_date` -> lay `estimate_expire_date` muon nhat tu tat ca `PERIOD` cua hoc sinh -> lay tap `Grade` cua hoc sinh -> truy van cac learning file co `Grade` phu hop va khoang ngay giao voi cua so hoc lieu -> map DTO -> tra ket qua.

### Lien quan module khac

API nay lien quan truc tiep den:
- `Student`: lay `student_first_enroll_date` va danh sach `Grade`
- `Period`: lay `estimate_expire_date` muon nhat de xac dinh cuoi cua so truy cap hoc lieu

## 9. Luu y cho frontend

- Khong nen tu suy dien hoc sinh duoc xem tai lieu nao chi dua vao `Grade`. Can goi API `/student/{userUuid}` de backend loc them theo cua so ngay hoc.
- `chapter` hien tai la thong tin mo ta tu do, frontend co the dung de nhom noi dung, nhung backend chua ap dat quy tac nghiep vu rieng cho truong nay.
