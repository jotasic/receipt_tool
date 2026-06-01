# 테스트 정책 및 실행 가이드

Receipt Tool의 테스트 환경 및 실행 방법을 설명합니다.

## 개요

본 프로젝트는 **Node.js 환경 테스트**와 **네이티브 통합 테스트**를 구분하여 관리합니다.

- **유닛 테스트**: Jest로 실행 가능 (CI/CD 파이프라인)
- **네이티브 통합 테스트**: 실기기/에뮬레이터에서 수동 검증

### 왜 두 가지 테스트 방식이 필요한가?

```
React Native 네이티브 모듈 (expo-sqlite)
├─ Node.js 환경: 실행 불가 ❌
│  (네이티브 바이너리 없음)
└─ 실기기/에뮬레이터: 실행 가능 ✅
   (네이티브 런타임 포함)
```

**expo-sqlite**, **expo-camera** 등 네이티브 바이너리에 의존하는 모듈은 Node.js Jest 환경에서 로드할 수 없습니다. 따라서 이 모듈들을 사용하는 코드는 jest.config.js의 `testPathIgnorePatterns`에서 제외되어 있습니다.

---

## 테스트 분류

### 1. 유닛 테스트 (Node.js, `npx jest`)

**실행 환경**: Node.js
**명령어**: `npx jest`
**대상**: 순수 로직, 마이그레이션 검증 함수 등
**파일 위치**: 소스 파일 옆 `__tests__/` 폴더

#### 사용 가능한 함수들

```typescript
// ✅ 테스트 가능
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
}

export { calculateTotal };
```

유닛 테스트 예시:

```typescript
// services/item-service/__tests__/itemService.test.ts
import { calculateTotal } from '../itemService';

describe('calculateTotal', () => {
  it('should sum all item amounts', () => {
    const items = [
      { id: '1', amount: 1000 },
      { id: '2', amount: 2000 },
    ];
    expect(calculateTotal(items)).toBe(3000);
  });
});
```

#### 현재 통과하는 테스트

```
services/database/migrations/__tests__/unifyModels.test.ts
```

이 파일은 마이그레이션 검증 함수만 테스트하므로 Node.js에서 실행 가능합니다.

### 2. 네이티브 통합 테스트 (실기기/에뮬레이터)

**실행 환경**: Android 에뮬레이터 또는 실기기
**대상**: DB 서비스, OCR 서비스, 파일 처리 등 네이티브 모듈 사용 코드
**파일 위치**: `services/database/__tests__/`, `services/database/migrations/__tests__/migrateDocumentTypes.test.ts`

#### 제외된 테스트 파일

jest.config.js의 `testPathIgnorePatterns`:

```javascript
testPathIgnorePatterns: [
  '/node_modules/',
  'services/database/__tests__/',              // expo-sqlite 필요
  'services/database/migrations/__tests__/migrateDocumentTypes\\.test\\.ts',  // 네이티브 DB 필요
  'components/__tests__/StyledText-test\\.js', // react-test-renderer + 네이티브
]
```

#### 실행 방법

네이티브 모듈을 사용하는 코드는 실기기/에뮬레이터에서 수동으로 검증합니다:

```bash
# Development Build로 실행
npx expo start --android

# 실기기에서 앱 실행 후 수동 테스트
# - 항목 추가/수정/삭제 기능 확인
# - 데이터베이스 저장/조회 확인
# - OCR 스캔 기능 확인
```

---

## 테스트 실행 방법

### 1. 유닛 테스트 실행

```bash
# 전체 테스트 실행
npx jest

# 특정 파일 테스트
npx jest services/database/migrations/__tests__/unifyModels.test.ts

# Watch 모드 (파일 변경 시 자동 재실행)
npx jest --watch

# Coverage 리포트 생성
npx jest --coverage
```

#### 예상 결과

```
PASS  services/database/migrations/__tests__/unifyModels.test.ts
  Unified Model Migration
    migrateToUnifiedModel
      ✓ should successfully migrate receipts to items
      ✓ should successfully migrate documents to items
      ... (총 29 tests)

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
```

### 2. 타입 체크

```bash
# TypeScript 타입 검증
npx tsc --noEmit

# 결과 (에러 없음)
# [성공] 0 errors found
```

**필수**: 모든 코드 변경 후 실행해야 합니다.

### 3. 린트 검사

```bash
# ESLint 실행
npm run lint
```

### 4. 전체 코드 품질 검증 (순서대로)

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 린트
npm run lint

# 3. 유닛 테스트
npx jest

# 위 3개를 한 번에 실행
npx tsc --noEmit && npm run lint && npx jest
```

---

## 새 테스트 작성 기준

### 유닛 테스트 작성 권장 사항

**다음 경우 유닛 테스트를 작성하세요:**

1. **순수 로직 함수**
   ```typescript
   // ✅ 테스트 작성 권장
   function formatAmount(amount: number): string {
     return `₩${amount.toLocaleString()}`;
   }
   ```

2. **마이그레이션 검증 함수**
   ```typescript
   // ✅ 테스트 작성 권장
   function validateUnifiedModel(items: Item[]): ValidationResult {
     // 데이터 검증 로직 (DB 쿼리 없음)
   }
   ```

3. **유틸리티 함수**
   ```typescript
   // ✅ 테스트 작성 권장
   function calculateItemsTotal(items: Item[]): number {
     return items.reduce((sum, item) => sum + (item.amount || 0), 0);
   }
   ```

### 네이티브 모듈 사용 시

**다음 경우 실기기 수동 검증을 수행하세요:**

1. **DB 서비스 함수**
   ```typescript
   // ❌ 유닛 테스트 불가
   export async function createItem(item: Item): Promise<string> {
     const db = await getDatabase();  // expo-sqlite
     // ...
   }

   // ✅ 실기기에서 수동 검증
   // npx expo start --android 후
   // 앱에서 실제로 항목 추가 → DB 저장 확인
   ```

2. **OCR 서비스**
   ```typescript
   // ❌ 유닛 테스트 불가
   export async function extractTextFromImage(uri: string): Promise<string> {
     const result = await textRecognition.recognize(uri);  // 네이티브
     // ...
   }
   ```

3. **파일 시스템 접근**
   ```typescript
   // ❌ 유닛 테스트 불가
   export async function saveFile(uri: string, path: string): Promise<void> {
     await FileSystem.copyAsync({ from: uri, to: path });
   }
   ```

### 테스트 파일 작성 템플릿

**파일 위치**: `services/{module}/__tests__/{name}.test.ts`

```typescript
/**
 * Tests for {Function Description}
 */

import { myFunction } from '../myService';

describe('myFunction', () => {
  describe('성공 케이스', () => {
    it('should return expected result', () => {
      const input = { /* ... */ };
      const expected = { /* ... */ };
      expect(myFunction(input)).toEqual(expected);
    });
  });

  describe('에러 케이스', () => {
    it('should throw error on invalid input', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });

  describe('엣지 케이스', () => {
    it('should handle empty array', () => {
      expect(myFunction([])).toEqual([]);
    });
  });
});
```

---

## Jest 설정 상세

### jest.config.js

```javascript
module.exports = {
  // JavaScript/TypeScript 파일을 babel-jest로 변환
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },

  // Expo 및 React Native 모듈을 변환 (네이티브 바이너리 제외)
  transformIgnorePatterns: [
    'node_modules/(?!(expo-sqlite|expo-modules-core|@expo|react-native|@react-native)/)',
  ],

  // Node.js 환경에서 실행 (브라우저 시뮬레이션 없음)
  testEnvironment: 'node',

  // 경로 매핑 (import '@/...' 해석)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // 네이티브 모듈 필요한 테스트 제외
  testPathIgnorePatterns: [
    '/node_modules/',
    'services/database/__tests__/',
    'services/database/migrations/__tests__/migrateDocumentTypes\\.test\\.ts',
    'components/__tests__/StyledText-test\\.js',
  ],
};
```

### 각 설정의 의미

| 설정 | 목적 |
|-----|------|
| `transform` | TypeScript → JavaScript 변환 |
| `transformIgnorePatterns` | Expo 모듈도 변환하도록 허용 |
| `testEnvironment: 'node'` | Node.js에서 실행 (DOM 없음) |
| `moduleNameMapper` | `@/` 경로를 `rootDir/` 경로로 변환 |
| `testPathIgnorePatterns` | 네이티브 모듈이 필요한 테스트 제외 |

---

## 알려진 제한사항

### 1. 네이티브 모듈 제한

다음 모듈들은 Node.js에서 로드 불가능하므로, 사용하는 코드는 제외 목록에 있어야 합니다:

- **expo-sqlite**: SQLite 데이터베이스
- **expo-camera**: 카메라 접근
- **@react-native-ml-kit/text-recognition**: ML Kit OCR
- **react-native-image-crop-picker**: 이미지 선택 및 편집

### 2. npm audit 경고

```
npm audit를 실행하면 minimatch 패키지 관련 경고가 표시될 수 있습니다.
→ 이는 Expo의 dev 의존성 내부 issue
→ 프로덕션에 영향 없음 (devDependencies)
→ 무시해도 안전
```

### 3. Expo Go와 Development Build의 차이

| 기능 | Expo Go | Development Build |
|-----|---------|------------------|
| 유닛 테스트 | ❌ | ❌ |
| 네이티브 통합 테스트 | ❌ | ✅ |
| UI 개발 | ✅ | ✅ |
| OCR 기능 | ❌ | ✅ |

---

## 실제 테스트 예시

### 예시 1: 유닛 테스트 (실행 가능)

```bash
npx jest services/database/migrations/__tests__/unifyModels.test.ts
```

결과:
```
PASS  services/database/migrations/__tests__/unifyModels.test.ts (0.5s)
  Unified Model Migration
    migrateToUnifiedModel
      ✓ should successfully migrate receipts to items (5ms)
      ✓ should successfully migrate documents to items (3ms)
      ...
    Classification Mapping
      ✓ should map personal receipts to personal_card (2ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
Time:        1.234s
```

### 예시 2: 네이티브 통합 테스트 (수동 검증)

DB 서비스 함수를 테스트하려면:

```bash
# 1. Development Build 시작
npx expo start --android

# 2. 앱 실행 후 다음을 수동으로 검증
# - 항목 추가 → DB에 저장됨
# - 항목 조회 → 저장된 항목 표시됨
# - 항목 수정 → 변경사항 반영됨
# - 항목 삭제 → DB에서 제거됨
# - 필터링 → 조건에 맞는 항목만 표시됨

# 3. 콘솔 로그 확인
# - DB 쿼리 성공 메시지
# - 에러 없음
```

### 예시 3: 타입 체크 + 린트 + 테스트

```bash
# 전체 코드 품질 검증
npx tsc --noEmit && npm run lint && npx jest

# 결과 예시
# ✓ TypeScript: 0 errors
# ✓ ESLint: 0 errors
# ✓ Tests: 29 passed

# 모든 검증 통과!
```

---

## 개발 워크플로우

### 1. 새 기능 개발 시

```bash
# 1. 유닛 테스트 작성 (네이티브 모듈 사용 X)
# 2. 기능 구현
npx jest --watch

# 3. 타입 체크
npx tsc --noEmit

# 4. 린트
npm run lint

# 5. 커밋 전 최종 검증
npx tsc --noEmit && npm run lint && npx jest

# 6. 네이티브 모듈 사용 부분은 앱에서 수동 테스트
npx expo start --android
```

### 2. 버그 수정 시

```bash
# 1. 테스트 케이스 추가 (재현 가능하면)
# 2. 버그 수정
# 3. 전체 테스트 통과 확인
npx jest

# 4. 타입 체크 및 린트
npx tsc --noEmit && npm run lint
```

### 3. 리팩토링 시

```bash
# 1. 테스트 보존 확인
npx jest

# 2. 타입 안정성 확인
npx tsc --noEmit

# 3. 린트 규칙 준수
npm run lint

# ✅ 모두 통과하면 안전한 리팩토링
```

---

## 자주 묻는 질문 (FAQ)

**Q: 왜 package.json에 test 스크립트가 없나요?**

A: Jest는 `npx jest` 명령으로 직접 실행 가능합니다. package.json에 추가하려면:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```
그런 후 `npm test` 사용 가능.

---

**Q: 네이티브 모듈을 사용하는 코드도 자동화 테스트할 수 있나요?**

A: 예, 하지만 추가 설정이 필요합니다:
- **현재**: 수동 검증 (Expo로 실행 후 앱에서 확인)
- **향후**: `better-sqlite3` 도입 시 Node.js에서 DB 테스트 자동화 가능

---

**Q: CI/CD 파이프라인에서는 어떻게 테스트하나요?**

A: 다음 순서로 실행:
```bash
1. npx tsc --noEmit    # 타입 체크
2. npm run lint        # 린트
3. npx jest            # 유닛 테스트

# 모두 통과하면 배포 진행
```

제외된 테스트 파일들은 스킵되므로 문제없음.

---

**Q: jest.config.js의 testPathIgnorePatterns는 언제 추가하나요?**

A: 다음 경우 추가:
- 새 테스트 파일이 네이티브 모듈을 import할 때
- Jest 실행 시 "Cannot find module 'expo-sqlite'" 에러가 발생할 때
- 수동 검증으로만 가능한 기능일 때

---

## 참고 문서

| 문서 | 내용 |
|-----|------|
| [Getting Started](/docs/guides/getting-started.md) | 개발 환경 설정 |
| [Development Workflow](/docs/guides/development-workflow.md) | 개발 워크플로우 |
| [Database Guide](/docs/guides/database.md) | DB 사용 방법 |

---

## 정리

| 항목 | 유닛 테스트 | 네이티브 테스트 |
|-----|-----------|----------------|
| **실행 방법** | `npx jest` | `npx expo start --android` |
| **환경** | Node.js | 실기기/에뮬레이터 |
| **테스트 대상** | 순수 로직, 유틸 함수 | DB, OCR, 파일 시스템 |
| **CI/CD** | ✅ 자동화 | ❌ 수동 검증 |
| **예시 파일** | unifyModels.test.ts | - |

