# `ResponseEntity<?>` va cach frontend TypeScript nen xu ly

## 1. Vi sao backend dung `ResponseEntity<?>`

Trong `DashboardController`, method `getExamStats` co dang:

```java
public ResponseEntity<?> getExamStats(
        @PathVariable(name = "examUuid") UUID examUuid,
        @RequestParam(name = "exportXlsx", defaultValue = "false") boolean exportXlsx) {
    if (exportXlsx) {
        return buildXlsxResponse(
                dashboardService.exportExamStats(examUuid),
                "exam-stats-" + examUuid + ".xlsx");
    }

    return ResponseEntity.ok(dashboardService.getExamStats(examUuid));
}
```

Endpoint nay co the tra ve 2 kieu response khac nhau:

- Neu `exportXlsx = false`: tra ve du lieu thong ke dang JSON, vi du `ResExamStatDashboardDTO`.
- Neu `exportXlsx = true`: tra ve file Excel dang binary, trong code backend la `ResponseEntity<byte[]>`.

Vi cung mot method co the tra ve nhieu kieu body khac nhau, backend khong the khai bao cu the nhu:

```java
ResponseEntity<ResExamStatDashboardDTO>
```

Neu khai bao nhu vay thi nhanh export Excel se khong phu hop, vi no tra ve `byte[]`, khong phai `ResExamStatDashboardDTO`.

Do do backend dung:

```java
ResponseEntity<?>
```

Dau `?` la wildcard, co the hieu la: response nay co body thuoc mot kieu nao do, nhung method khong co dinh mot kieu duy nhat.

## 2. Response thuc te cua endpoint nay

Voi du an hien tai, response JSON con co the bi boc boi `FormatRestResponse`.

Neu goi:

```txt
GET /api/v1/dashboard/exams/{examUuid}/stats
```

Backend tra ve JSON co dang:

```ts
RestResponse<ResExamStatDashboardDTO>
```

Vi du:

```json
{
  "statusCode": 200,
  "message": "Get exam stats dashboard",
  "data": {
    "examUuid": "...",
    "schoolYear": "...",
    "examName": "...",
    "sections": []
  }
}
```

Nhung neu goi:

```txt
GET /api/v1/dashboard/exams/{examUuid}/stats?exportXlsx=true
```

Backend tra ve file Excel:

```ts
Blob
```

Hoac neu dung cach xu ly binary thap hon:

```ts
ArrayBuffer
```

Response Excel nay khong nen parse bang `.json()`.

## 3. Van de voi TypeScript

TypeScript la ngon ngu quy dinh type chat che hon o phia client. Neu mot endpoint co the tra ve nhieu dang body, frontend can biet ro dang nao dang duoc yeu cau.

Khong nen viet kieu mo ho nhu:

```ts
Promise<any>
```

Vi khi dung `any`, TypeScript khong con bao ve duoc minh truoc loi sai shape response.

Cung khong nen uu tien viet mot ham chung nhu:

```ts
Promise<RestResponse<ResExamStatDashboardDTO> | Blob>
```

Neu khong can thiet, vi moi noi su dung se phai tu kiem tra:

```ts
const result = await getExamStatsResponse(id, exportXlsx);

if (result instanceof Blob) {
  // xu ly file Excel
} else {
  // xu ly JSON
}
```

Cach nay dung ve mat type, nhung de lam code frontend roi hon.

## 4. Huong xu ly tot hon o frontend

Frontend nen tach thanh 2 ham API rieng, du backend dang dung chung mot endpoint.

```ts
type RestResponse<T> = {
  statusCode: number;
  message?: unknown;
  error?: string;
  data: T;
};

type ResExamStatDashboardDTO = {
  examUuid: string;
  schoolYear: string;
  examName: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  sections: ResSectionStatDTO[];
};

type ResSectionStatDTO = {
  sectionType: string;
  averageScore: number;
  meanScore: number;
  standardDeviationScore: number;
  questions: ResQuestionStatDTO[];
};

type ResQuestionStatDTO = {
  questionOrder: number;
  questionUuid: string;
  questionType: string;
  questionContent: string;
  imagePath?: string;
  correctAnswer?: string;
  answerCounts: Record<string, number>;
};
```

Ham lay thong ke JSON:

```ts
async function getExamStats(
  examUuid: string
): Promise<RestResponse<ResExamStatDashboardDTO>> {
  const res = await fetch(`/api/v1/dashboard/exams/${examUuid}/stats`);

  if (!res.ok) {
    throw new Error("Failed to fetch exam stats");
  }

  return res.json();
}
```

Ham export Excel:

```ts
async function exportExamStats(examUuid: string): Promise<Blob> {
  const res = await fetch(
    `/api/v1/dashboard/exams/${examUuid}/stats?exportXlsx=true`
  );

  if (!res.ok) {
    throw new Error("Failed to export exam stats");
  }

  return res.blob();
}
```

Neu dung Axios:

```ts
async function exportExamStats(examUuid: string): Promise<Blob> {
  const res = await axios.get(
    `/api/v1/dashboard/exams/${examUuid}/stats?exportXlsx=true`,
    {
      responseType: "blob",
    }
  );

  return res.data;
}
```

## 5. Huong thiet ke API sach hon

Ve lau dai, nen tach endpoint backend thanh 2 endpoint rieng:

```txt
GET /api/v1/dashboard/exams/{examUuid}/stats
GET /api/v1/dashboard/exams/{examUuid}/stats/export
```

Khi do backend co the khai bao type ro rang hon:

```java
public ResponseEntity<ResExamStatDashboardDTO> getExamStats(...)

public ResponseEntity<byte[]> exportExamStats(...)
```

Va frontend TypeScript cung co type on dinh:

```ts
getExamStats(): Promise<RestResponse<ResExamStatDashboardDTO>>

exportExamStats(): Promise<Blob>
```

## Ket luan

`ResponseEntity<?>` khong sai trong backend Java, vi endpoint dang tra ve nhieu dang body khac nhau.

Nhung voi frontend TypeScript, khong nen xu ly response nay bang `any`. Nen phan biet ro theo muc dich request:

- Request lay du lieu thong ke: parse JSON va type la `RestResponse<ResExamStatDashboardDTO>`.
- Request export file: parse binary va type la `Blob`.

Cach tot nhat o frontend la tach thanh 2 ham API rieng. Cach tot hon nua o backend la tach thanh 2 endpoint rieng de moi endpoint chi co mot kieu response duy nhat.
