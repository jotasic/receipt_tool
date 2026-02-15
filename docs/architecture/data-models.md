# Data Models

증빙 관리 앱의 핵심 데이터 모델

## Item (통합 증빙 모델)

### 모델 진화 과정

```
Receipt (영수증) + Document (문서) → Item (통합 증빙)
```

상세 내역: [migration-guide.md](../migration-guide.md) 참조

### Item 구조

```typescript
interface Item {
  id: string;

  // 분류 (2차원)
  classification: ItemClassification;  // personal_card | corporate_card | proof_document
  usagePurpose: UsagePurpose;         // meal | other (동적 확장 가능)

  // 기본 정보
  title: string;
  description?: string;
  amount?: number;                     // proof_document는 금액 없을 수 있음
  date: string;

  // 상점/발급처 정보
  storeName?: string;

  // 파일
  imagePath?: string;
  ocrText?: string;

  // 메타데이터
  createdAt: string;
  updatedAt: string;
}
```

### 2차원 분류 시스템

**ItemClassification (증빙 형태)**
- `personal_card`: 개인카드 (나중에 회사에 청구)
- `corporate_card`: 법인카드 (회사 카드로 직접 결제)
- `proof_document`: 기타 증빙 문서 (의료비 세부내역서, 진단서 등)

**UsagePurpose (사용 용도)**
- `meal`: 식비
- `other`: 기타
- *동적 확장 가능* (DB의 `usage_purposes` 테이블에서 관리)

---

## Report (경비 청구 리포트)

리포트는 여러 Item을 묶어서 경비 청구하는 단위입니다.

```typescript
interface Report {
  id: string;
  title: string;
  totalAmount: number;  // 금액이 있는 Item들의 합계
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

- Report는 여러 Item 포함 가능 (다대다 관계)
- totalAmount는 Item 중 금액이 있는 것만 합산 (proof_document는 참고 자료)

---

## Tag (태그)

```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}
```

- Item에 여러 태그 연결 가능 (다대다)
- `item_tags` 테이블로 연결

---

## UsagePurpose (사용 용도)

```typescript
interface UsagePurpose {
  id: string;
  name: string;      // 한글명 (예: 식비)
  nameEn?: string;   // 영문명 (예: meal)
  icon?: string;
  color?: string;
  isActive: boolean;
  displayOrder: number;
}
```

- 사용자 정의 가능
- 기본값: meal, other

---

## CustomField (커스텀 필드)

```typescript
interface CustomFieldDefinition {
  id: string;
  name: string;
  fieldType: 'text' | 'number' | 'date' | 'select';
  options?: string[];  // select 타입용
  isRequired: boolean;
  displayOrder: number;
}

interface CustomFieldValue {
  itemId: string;
  fieldId: string;
  value: string;
}
```

- Item에 동적 필드 추가 가능
- `item_custom_values` 테이블에 저장
