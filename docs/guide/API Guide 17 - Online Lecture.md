# API Guide 17 - Online Lecture

## 1. Muc dich module

Module `Online Lecture` dung de quan ly bai giang online theo `Study Week` va `Grade`.

Module nay co 2 nhom API:
- API CRUD de van hanh tao, sua, xoa bai giang online.
- API de hoc sinh lay danh sach bai giang online ma minh duoc phep xem.

Theo nghiep vu trong `instruction`:
- hoc sinh chi duoc xem hoc lieu thuoc `GRADE` cua minh
- hoc sinh chi duoc xem hoc lieu trong cua so:
  - tu `student_first_enroll_date`
  - den `estimate_expire_date` muon nhat trong tat ca `PERIOD` cua hoc sinh

## 2. Danh sach API

- `GET /api/v1/online-lectures`
- `GET /api/v1/online-lectures/{id}`
- `POST /api/v1/online-lectures`
- `PUT /api/v1/online-lectures/{id}`
- `DELETE /api/v1/online-lectures/{id}`
- `GET /api/v1/online-lectures/student/{userUuid}`

`userUuid` trong API hoc sinh la `user_uuid` cua hoc sinh.

## 3. GET /api/v1/online-lectures

### Muc dich

Lay toan bo danh sach online lecture.

### Input format

Khong co request body.

### Output format

Tra ve `List<ResOnlineLectureDTO>`.

Moi phan tu co dang:

```json
{
  "lecture_uuid": "uuid",
  "study_week": {
    "week_uuid": "uuid",
    "week_number": 20,
    "week_start_date": "2026-05-17",
    "week_end_date": "2026-05-23",
    "school_year": 2026
  },
  "grade": {
    "grade_id": 3,
    "grade_name": "K12"
  },
  "lecture_name": "Bai giang Dai so 12 - Ham so",
  "lecture_overview": "Tom tat noi dung bai giang",
  "lecture_link": "https://...",
  "lecture_valid_from": "2026-05-17",
  "lecture_valid_to": "2026-08-08",
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "admin@...",
  "updated_by": "admin@..."
}
```

### Exception co the tra ve

Thong thuong khong co exception nghiep vu rieng.

### Mo ta luong

Lay danh sach online lecture tu DB -> map sang `ResOnlineLectureDTO` -> tra ket qua.

## 4. GET /api/v1/online-lectures/{id}

### Muc dich

Lay chi tiet mot online lecture theo `lecture_uuid`.

### Input format

Path variable:

```text
id: UUID
```

### Output format

Tra ve `ResOnlineLectureDTO` cung cau truc nhu tren.

### Exception co the tra ve

- `Online lecture with id {id} does not exist`

### Mo ta luong

Nhan `lecture_uuid` -> tim online lecture trong DB -> neu khong ton tai thi bao loi -> neu ton tai thi map DTO va tra ket qua.

## 5. POST /api/v1/online-lectures

### Muc dich

Tao moi online lecture.

### Input format

Request body:

```json
{
  "studyWeekId": "uuid",
  "gradeId": 3,
  "name": "Bai giang Dai so 12 - Ham so",
  "overview": "Tom tat noi dung bai giang",
  "link": "https://...",
  "validFrom": "2026-05-17",
  "validTo": "2026-08-08"
}
```

### Rule validate

- `studyWeekId` bat buoc
- `gradeId` bat buoc
- `name` bat buoc
- `link` bat buoc
- `validFrom` bat buoc
- `validTo` bat buoc
- `validTo` khong duoc nho hon `validFrom`
- `studyWeekId` phai ton tai
- `gradeId` phai ton tai

### Output format

Tra ve `ResOnlineLectureDTO`.

### Exception co the tra ve

- `studyWeekId khong duoc de trong`
- `gradeId khong duoc de trong`
- `Ten lecture khong duoc de trong`
- `Link lecture khong duoc de trong`
- `validFrom khong duoc de trong`
- `validTo khong duoc de trong`
- `Study week with id {id} does not exist`
- `Grade with id {id} does not exist`
- `validTo khong duoc nho hon validFrom`

### Mo ta luong

Nhan request tao online lecture -> validate du lieu bat buoc -> kiem tra `StudyWeek` ton tai -> kiem tra `Grade` ton tai -> kiem tra khoang ngay hop le -> luu online lecture xuong DB -> map sang `ResOnlineLectureDTO` -> tra ket qua.

## 6. PUT /api/v1/online-lectures/{id}

### Muc dich

Cap nhat online lecture.

### Input format

Path variable:

```text
id: UUID
```

Request body, cac truong deu la optional:

```json
{
  "studyWeekId": "uuid",
  "gradeId": 3,
  "name": "Bai giang moi",
  "overview": "Noi dung moi",
  "link": "https://...",
  "validFrom": "2026-05-20",
  "validTo": "2026-08-10"
}
```

### Rule validate

- online lecture phai ton tai
- neu co `studyWeekId` moi thi `StudyWeek` phai ton tai
- neu co `gradeId` moi thi `Grade` phai ton tai
- sau khi hop nhat du lieu cu va moi, `validTo` khong duoc nho hon `validFrom`

### Output format

Tra ve `ResOnlineLectureDTO`.

### Exception co the tra ve

- `Online lecture with id {id} does not exist`
- `Study week with id {id} does not exist`
- `Grade with id {id} does not exist`
- `validTo khong duoc nho hon validFrom`

### Mo ta luong

Nhan `lecture_uuid` va du lieu can sua -> tim online lecture hien tai -> neu co doi `StudyWeek` thi resolve lai `StudyWeek` -> neu co doi `Grade` thi resolve lai `Grade` -> hop nhat du lieu cu va moi -> validate khoang ngay -> luu cap nhat xuong DB -> map DTO va tra ket qua.

## 7. DELETE /api/v1/online-lectures/{id}

### Muc dich

Xoa online lecture.

### Input format

Path variable:

```text
id: UUID
```

### Output format

Tra ve HTTP `204 No Content`.

### Exception co the tra ve

- `Online lecture with id {id} does not exist`

### Mo ta luong

Nhan `lecture_uuid` -> kiem tra online lecture ton tai -> xoa khoi DB -> tra `204 No Content`.

## 8. GET /api/v1/online-lectures/student/{userUuid}

### Muc dich

Lay danh sach online lecture ma hoc sinh duoc phep xem.

### Input format

Path variable:

```text
userUuid: UUID
```

### Output format

Tra ve `List<ResOnlineLectureDTO>`.

Chi tra nhung bai giang thoa dong thoi 2 nhom dieu kien:
- thuoc `Grade` cua hoc sinh
- co khoang hieu luc giao voi cua so hoc lieu cua hoc sinh

### Rule nghiep vu truy cap hoc lieu

Backend xac dinh cua so hoc lieu cua hoc sinh nhu sau:
- `accessStartDate = student_first_enroll_date`
- `accessEndDate = estimate_expire_date` muon nhat trong tat ca `PERIOD`

Online lecture duoc phep hien thi neu:
- `grade_id` cua bai giang nam trong tap `Grade` cua hoc sinh
- va khoang `[lecture_valid_from, lecture_valid_to]` giao voi khoang `[accessStartDate, accessEndDate]`

Noi cach khac, bai giang se duoc hien neu:
- `lecture_valid_from <= accessEndDate`
- va `lecture_valid_to >= accessStartDate`

### Exception co the tra ve

- `Student with user_uuid {userUuid} does not exist`
- `Hoc sinh chua co first enrollment date de truy cap hoc lieu`
- `Hoc sinh chua co period de truy cap hoc lieu`

### Mo ta luong

Nhan `userUuid` cua hoc sinh -> resolve `Student` -> kiem tra hoc sinh da co `student_first_enroll_date` -> lay `estimate_expire_date` muon nhat tu tat ca `PERIOD` cua hoc sinh -> lay tap `Grade` cua hoc sinh -> truy van cac online lecture co `Grade` phu hop va khoang ngay giao voi cua so hoc lieu -> map DTO -> tra ket qua.

### Lien quan module khac

API nay lien quan truc tiep den:
- `Student`: lay `student_first_enroll_date` va danh sach `Grade`
- `Period`: lay `estimate_expire_date` muon nhat de xac dinh cuoi cua so truy cap hoc lieu

## 9. Luu y cho frontend

- Khong nen tu suy dien quyen xem hoc lieu o frontend. Frontend nen goi API `/student/{userUuid}` de backend loc dung theo nghiep vu.
- `study_week` trong `Online Lecture` la thong tin de gan bai giang voi boi canh hoc tap cua tuan, khong thay the quy tac phan quyen theo `Student` va `Period`.
