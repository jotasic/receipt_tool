# Database Schema

SQLite 데이터베이스 스키마

## 주요 테이블

### items (통합 증빙 테이블)

```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  classification TEXT NOT NULL,  -- personal_card | corporate_card | proof_document
  usage_purpose TEXT NOT NULL,   -- meal | other | ...
  title TEXT NOT NULL,
  description TEXT,
  amount REAL,
  date TEXT NOT NULL,
  store_name TEXT,
  image_path TEXT,
  ocr_text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (classification IN ('personal_card', 'corporate_card', 'proof_document'))
);
```

### usage_purposes (사용 용도 관리)

```sql
CREATE TABLE usage_purposes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,           -- 한글명 (예: 식비)
  name_en TEXT,                 -- 영문명 (예: meal)
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);
```

### reports (경비 청구 리포트)

```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);
```

### report_items (리포트-아이템 연결)

```sql
CREATE TABLE report_items (
  report_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  PRIMARY KEY (report_id, item_id),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
```

### tags (태그)

```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### item_tags (아이템-태그 연결)

```sql
CREATE TABLE item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### custom_field_definitions (커스텀 필드 정의)

```sql
CREATE TABLE custom_field_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  field_type TEXT NOT NULL,  -- text | number | date | select
  options TEXT,              -- JSON array for select type
  is_required INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### item_custom_values (아이템 커스텀 필드 값)

```sql
CREATE TABLE item_custom_values (
  item_id TEXT NOT NULL,
  field_id TEXT NOT NULL,
  value TEXT,
  PRIMARY KEY (item_id, field_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
);
```

---

## 레거시 테이블

마이그레이션을 위해 유지 중인 테이블:

| 테이블 | 상태 | 설명 |
|-------|------|------|
| `receipts` | DEPRECATED | 구 영수증 테이블 |
| `documents` | DEPRECATED | 구 문서 테이블 |
| `categories` | DEPRECATED | 구 카테고리 테이블 |
| `report_receipts` | DEPRECATED | 구 연결 테이블 |
| `report_documents` | DEPRECATED | 구 연결 테이블 |

### Legacy → New 매핑

| Legacy | New |
|--------|-----|
| `categories` | `usage_purposes` |
| `receipts` | `items` (classification: personal_card/corporate_card) |
| `documents` | `items` (classification: proof_document) |

---

## 인덱스

```sql
-- 성능 최적화 인덱스
CREATE INDEX idx_items_classification ON items(classification);
CREATE INDEX idx_items_usage_purpose ON items(usage_purpose);
CREATE INDEX idx_items_date ON items(date);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_item_tags_tag_id ON item_tags(tag_id);
```

---

## 초기화 순서

1. 테이블 생성
2. 인덱스 생성
3. 기본 데이터 시드 (default usage_purposes)
4. 마이그레이션 실행
