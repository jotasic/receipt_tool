# 개발 워크플로우 가이드

실제 기능 개발 시 따라야 할 단계별 워크플로우입니다.

## 개요

```
계획 수립 → 사용자 승인 → 순차 실행 → 검증 → 완료 보고
```

이 가이드는 **"증빙 항목에 첨부파일 기능 추가"** 시나리오를 통해 실제 개발 프로세스를 상세히 설명합니다.

---

## 1. 계획 단계

### 1.1 현재 상태 파악

**작업**: `/docs/architecture.md` 참조하여 현재 구조 파악

**확인 사항**:

```markdown
## 현재 아키텍처 분석

1. **데이터 모델 검토** (`/docs/architecture/data-models.md`)
   - Item 모델 구조 파악
   - 현재 필드: id, classification, usagePurpose, title, description, amount, date, storeName, imagePath, ocrText, createdAt, updatedAt
   - 새로 추가할 필드: attachments (배열)

2. **DB 스키마 검토** (`/docs/architecture/database.md`)
   - items 테이블 구조 파악
   - 새 마이그레이션 필요 (첨부파일 저장 방식)
   - 옵션:
     * 단순: JSON 배열로 items 테이블에 저장
     * 복잡: item_attachments 별도 테이블 생성

3. **서비스 레이어 검토** (`/docs/services/item-service.md`)
   - 현재 CRUD 함수들 파악
   - 첨부파일 추가/삭제 기능 필요

4. **UI 구조 검토** (`/docs/architecture/folder-structure.md`)
   - Item 상세 화면 위치
   - 파일 선택 UI 필요성 검토
```

### 1.2 기능 분석 및 우선순위 분류

**작업**: 전체 기능을 P0/P1/P2로 분류

**예시**:

```markdown
### 기능 분석: 첨부파일 기능 추가

#### P0 (핵심 기능 - 필수)
- [ ] Item 모델에 attachments 필드 추가
- [ ] 파일 선택 UI (DocumentPicker 또는 ImagePicker)
- [ ] 첨부파일 저장/삭제 함수 구현
- [ ] Item 상세 화면에서 첨부파일 표시

#### P1 (다음 우선)
- [ ] 첨부파일 미리보기 (이미지)
- [ ] 첨부파일 다운로드
- [ ] 다크모드 완벽 지원

#### P2 (나중에 고려)
- [ ] 첨부파일 용량 제한 (10MB)
- [ ] 파일 타입 필터링 (이미지만)
- [ ] 첨부파일 순서 변경
```

### 1.3 에이전트 선정

**작업**: 각 P0 기능을 담당할 에이전트 결정

**예시**:

```markdown
### 에이전트 배정

| 작업 | 에이전트 | 이유 |
|-----|---------|------|
| DB 스키마 설계 + 마이그레이션 | database-specialist | 스키마 변경, 데이터 보존 전략 |
| Item 서비스 함수 개발 | react-native-expo-developer | 비즈니스 로직, 파일 처리 |
| Item 상세 화면 UI 개발 | react-native-expo-developer | React Native 컴포넌트, 다크모드 |
| 통합 테스트 | code-reviewer | 타입 체크, 다크모드 검증 |
```

### 1.4 TodoWrite 작성 (진행 상황 추적)

**작업**: 구체적인 실행 계획 작성

**예시**:

```markdown
### TodoWrite: 첨부파일 기능 추가

#### Phase 1: 데이터 베이스 (database-specialist)
- [ ] 마이그레이션 파일 생성 (Attachment 모델)
- [ ] items 테이블에 attachments JSON 컬럼 추가
- [ ] 기존 데이터 보존 (기본값: 빈 배열)
- [ ] /docs/architecture/database.md 업데이트

#### Phase 2: 서비스 레이어 (react-native-expo-developer)
- [ ] types.ts에 Attachment 인터페이스 추가
- [ ] item-service.ts에 함수 추가:
  - [ ] addAttachmentToItem(itemId, file)
  - [ ] removeAttachmentFromItem(itemId, attachmentId)
  - [ ] getItemAttachments(itemId)
- [ ] 파일 저장/삭제 로직 구현
- [ ] 에러 처리 (파일 크기, 형식 검증)
- [ ] /docs/services/item-service.md 업데이트

#### Phase 3: UI 레이어 (react-native-expo-developer)
- [ ] components/item/FilePickerButton.tsx 생성
- [ ] components/item/AttachmentList.tsx 생성
- [ ] screens/item/[id].tsx에 첨부파일 섹션 추가
- [ ] 다크모드 완벽 지원 (dark: 클래스, 훅 사용)

#### Phase 4: 검증 (code-reviewer)
- [ ] TypeScript 에러 확인 (npx tsc --noEmit)
- [ ] 다크모드 테스트
- [ ] 에러 시나리오 테스트 (파일 없음, 저장 실패 등)
```

### 1.5 사용자 승인 대기 (CRITICAL)

**작업**: 계획을 사용자에게 제시하고 승인 대기

**제시 형식**:

```markdown
## 계획 요약

### 추가 기능
- Item 모델에 attachments 필드 (P0)
- 파일 선택 UI (P0)
- 첨부파일 저장/삭제 함수 (P0)
- 첨부파일 표시 (P0)
- 미리보기 (P1)

### 예상 작업량
- 에이전트: 2명 (database-specialist, react-native-expo-developer)
- 예상 커밋: 4-5개
- 변경 파일: DB 마이그레이션, services/types.ts, item-service.ts, 컴포넌트, 문서

### 품질 기준
- [ ] TypeScript 에러 0
- [ ] 다크모드 완벽 지원 (필수)
- [ ] 에러 처리 완료
- [ ] 문서 동시 업데이트

위 계획으로 진행해도 괜찮으신가요?
```

**⚠️ CRITICAL**: 사용자 승인 없이 실행 단계 진행 금지

---

## 2. 실행 단계

### 2.1 Phase 1: 데이터베이스 작업 (database-specialist)

#### 작업 내용

**1. 마이그레이션 파일 작성**

파일: `/src/db/migrations/002_add_attachments.ts`

```typescript
// 예시 마이그레이션
export async function migrate(db: SQLiteDatabase) {
  try {
    // attachments 컬럼 추가 (기존 데이터는 빈 배열)
    await db.execAsync(`
      ALTER TABLE items ADD COLUMN attachments TEXT DEFAULT '[]';
    `);
    console.log('Migration 002: attachments column added');
  } catch (error) {
    // 이미 존재하는 컬럼이면 무시
    if (!error.message.includes('duplicate column')) {
      throw error;
    }
  }
}
```

**2. 스키마 파일 업데이트**

파일: `/src/db/schema.ts`

```typescript
export const DATABASE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    classification TEXT NOT NULL,
    usagePurpose TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount REAL,
    date TEXT NOT NULL,
    storeName TEXT,
    imagePath TEXT,
    ocrText TEXT,
    attachments TEXT DEFAULT '[]',  // <- 새로 추가
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`;
```

**3. Attachment 타입 정의**

파일: `/src/db/types.ts` (또는 `/src/types/index.ts`)

```typescript
export interface Attachment {
  id: string;
  itemId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}
```

**4. DB 유틸리티 함수**

파일: `/src/db/utils.ts` (새로 생성)

```typescript
import { SQLiteDatabase } from 'expo-sqlite';
import { Attachment } from './types';

export async function saveAttachment(
  db: SQLiteDatabase,
  itemId: string,
  attachment: Omit<Attachment, 'itemId'>
): Promise<void> {
  try {
    // 1. 기존 첨부파일 목록 조회
    const result = await db.getFirstAsync<{ attachments: string }>(
      'SELECT attachments FROM items WHERE id = ?',
      [itemId]
    );

    if (!result) throw new Error('Item not found');

    // 2. JSON 파싱
    const attachments: Attachment[] = JSON.parse(result.attachments || '[]');

    // 3. 새 첨부파일 추가
    attachments.push(attachment as Attachment);

    // 4. 저장
    await db.runAsync(
      'UPDATE items SET attachments = ? WHERE id = ?',
      [JSON.stringify(attachments), itemId]
    );
  } catch (error) {
    console.error('Failed to save attachment:', error);
    throw error;
  }
}

export async function deleteAttachment(
  db: SQLiteDatabase,
  itemId: string,
  attachmentId: string
): Promise<void> {
  try {
    const result = await db.getFirstAsync<{ attachments: string }>(
      'SELECT attachments FROM items WHERE id = ?',
      [itemId]
    );

    if (!result) throw new Error('Item not found');

    const attachments: Attachment[] = JSON.parse(result.attachments || '[]');
    const filtered = attachments.filter(a => a.id !== attachmentId);

    await db.runAsync(
      'UPDATE items SET attachments = ? WHERE id = ?',
      [JSON.stringify(filtered), itemId]
    );
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    throw error;
  }
}

export async function getAttachments(
  db: SQLiteDatabase,
  itemId: string
): Promise<Attachment[]> {
  try {
    const result = await db.getFirstAsync<{ attachments: string }>(
      'SELECT attachments FROM items WHERE id = ?',
      [itemId]
    );

    if (!result) return [];
    return JSON.parse(result.attachments || '[]');
  } catch (error) {
    console.error('Failed to get attachments:', error);
    return [];
  }
}
```

#### 문서 업데이트 (동시)

**파일**: `/docs/architecture/database.md`

```markdown
## 변경 사항 추가

### items 테이블 (업데이트)

| 컬럼 | 타입 | 설명 |
|-----|-----|------|
| ... | ... | ... |
| attachments | TEXT | 첨부파일 JSON 배열 (기본값: '[]') |

### Attachment 데이터 구조

```typescript
interface Attachment {
  id: string;              // UUID
  itemId: string;
  fileName: string;        // "receipt.pdf"
  filePath: string;        // "/data/attachments/..."
  fileSize: number;        // bytes
  mimeType: string;        // "application/pdf", "image/jpeg"
  uploadedAt: string;      // ISO8601
}
```

### 마이그레이션 전략

기존 items 테이블에 attachments 컬럼 추가:
- 기본값: '[]' (빈 배열)
- JSON 형식으로 저장
```

#### 커밋 메시지

```
feat(db): 첨부파일 기능을 위한 스키마 추가

- items 테이블에 attachments 컬럼 추가 (JSON)
- Attachment 데이터 타입 정의
- saveAttachment, deleteAttachment, getAttachments 유틸 함수
- 마이그레이션 파일 (002_add_attachments.ts)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### 2.2 Phase 2: 서비스 레이어 작업 (react-native-expo-developer)

#### 작업 내용

**1. 타입 확장**

파일: `/src/types/index.ts`

```typescript
import { Attachment } from '@/db/types';

// Item 모델 확장
export interface Item {
  id: string;
  classification: ItemClassification;
  usagePurpose: UsagePurpose;
  title: string;
  description?: string;
  amount?: number;
  date: string;
  storeName?: string;
  imagePath?: string;
  ocrText?: string;
  attachments?: Attachment[];  // <- 새로 추가
  createdAt: string;
  updatedAt: string;
}

// 첨부파일 타입
export type { Attachment } from '@/db/types';
```

**2. Item 서비스 함수 추가**

파일: `/src/services/item-service.ts` (기존 파일에 추가)

```typescript
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getDatabase } from '@/db/database';
import { saveAttachment, deleteAttachment, getAttachments } from '@/db/utils';
import { Attachment } from '@/types';
import { v4 as uuid } from 'uuid';

/**
 * 첨부파일을 Item에 추가합니다.
 * @param itemId - Item ID
 * @param pickedFile - DocumentPicker 결과
 * @returns 추가된 Attachment
 */
export async function addAttachmentToItem(
  itemId: string,
  pickedFile: DocumentPicker.DocumentPickerAsset
): Promise<Attachment> {
  try {
    const db = await getDatabase();

    // 파일 검증
    if (!pickedFile.uri || !pickedFile.name) {
      throw new Error('Invalid file selection');
    }

    // 파일 크기 검증 (10MB 제한)
    const fileInfo = await FileSystem.getInfoAsync(pickedFile.uri);
    if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    // 앱 캐시 디렉토리로 파일 복사
    const fileName = `${uuid()}_${pickedFile.name}`;
    const targetPath = `${FileSystem.cacheDirectory}attachments/${fileName}`;

    // 디렉토리 생성
    const dirPath = `${FileSystem.cacheDirectory}attachments`;
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }

    // 파일 복사
    await FileSystem.copyAsync({
      from: pickedFile.uri,
      to: targetPath,
    });

    // Attachment 객체 생성
    const attachment: Attachment = {
      id: uuid(),
      itemId,
      fileName: pickedFile.name,
      filePath: targetPath,
      fileSize: fileInfo.size || 0,
      mimeType: pickedFile.mimeType || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    };

    // DB에 저장
    await saveAttachment(db, itemId, attachment);

    return attachment;
  } catch (error) {
    console.error('Failed to add attachment:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to add attachment'
    );
  }
}

/**
 * Item에서 첨부파일을 제거합니다.
 * @param itemId - Item ID
 * @param attachmentId - Attachment ID
 */
export async function removeAttachmentFromItem(
  itemId: string,
  attachmentId: string
): Promise<void> {
  try {
    const db = await getDatabase();

    // 파일 경로 조회
    const attachments = await getAttachments(db, itemId);
    const attachment = attachments.find(a => a.id === attachmentId);

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // 파일 삭제
    try {
      await FileSystem.deleteAsync(attachment.filePath, { idempotent: true });
    } catch (e) {
      console.warn('Failed to delete file:', e);
    }

    // DB에서 삭제
    await deleteAttachment(db, itemId, attachmentId);
  } catch (error) {
    console.error('Failed to remove attachment:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to remove attachment'
    );
  }
}

/**
 * Item의 첨부파일 목록을 조회합니다.
 * @param itemId - Item ID
 * @returns Attachment 배열
 */
export async function getItemAttachments(itemId: string): Promise<Attachment[]> {
  try {
    const db = await getDatabase();
    return await getAttachments(db, itemId);
  } catch (error) {
    console.error('Failed to get attachments:', error);
    return [];
  }
}

/**
 * 파일 선택 다이얼로그를 열고 선택된 파일을 반환합니다.
 */
export async function pickFile(): Promise<DocumentPicker.DocumentPickerAsset | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: false,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Failed to pick file:', error);
    throw new Error('Failed to open file picker');
  }
}
```

**3. Zustand 스토어 확장 (옵션)**

파일: `/src/stores/useItemStore.ts` (기존 파일에 추가)

```typescript
interface ItemStore {
  // ... 기존 상태

  // 첨부파일 관련
  attachments: Record<string, Attachment[]>;  // itemId -> attachments
  loadingAttachments: Record<string, boolean>;
  error: string | null;

  // 액션
  loadAttachments: (itemId: string) => Promise<void>;
  addAttachment: (itemId: string, file: DocumentPicker.DocumentPickerAsset) => Promise<void>;
  removeAttachment: (itemId: string, attachmentId: string) => Promise<void>;
}

export const useItemStore = create<ItemStore>((set) => ({
  // ... 기존 상태

  attachments: {},
  loadingAttachments: {},
  error: null,

  loadAttachments: async (itemId: string) => {
    set((state) => ({
      loadingAttachments: { ...state.loadingAttachments, [itemId]: true },
    }));
    try {
      const attachments = await getItemAttachments(itemId);
      set((state) => ({
        attachments: { ...state.attachments, [itemId]: attachments },
        error: null,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set((state) => ({
        loadingAttachments: { ...state.loadingAttachments, [itemId]: false },
      }));
    }
  },

  addAttachment: async (itemId: string, file: DocumentPicker.DocumentPickerAsset) => {
    set((state) => ({
      loadingAttachments: { ...state.loadingAttachments, [itemId]: true },
    }));
    try {
      await addAttachmentToItem(itemId, file);
      // 첨부파일 목록 다시 로드
      const attachments = await getItemAttachments(itemId);
      set((state) => ({
        attachments: { ...state.attachments, [itemId]: attachments },
        error: null,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set((state) => ({
        loadingAttachments: { ...state.loadingAttachments, [itemId]: false },
      }));
    }
  },

  removeAttachment: async (itemId: string, attachmentId: string) => {
    try {
      await removeAttachmentFromItem(itemId, attachmentId);
      const attachments = await getItemAttachments(itemId);
      set((state) => ({
        attachments: { ...state.attachments, [itemId]: attachments },
        error: null,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));
```

#### 문서 업데이트 (동시)

**파일**: `/docs/services/item-service.md`

새로운 섹션 추가:

```markdown
## 첨부파일 관리

### 함수

#### `addAttachmentToItem(itemId, pickedFile): Promise<Attachment>`

Item에 첨부파일을 추가합니다.

**파라미터:**
- `itemId`: Item ID
- `pickedFile`: DocumentPicker 결과 (expo-document-picker)

**반환값:**
- 추가된 Attachment 객체

**에러:**
- "File size exceeds 10MB limit" - 파일 크기 초과
- "Invalid file selection" - 잘못된 파일 선택

**예시:**
```typescript
const file = await pickFile();
if (file) {
  const attachment = await addAttachmentToItem(itemId, file);
  console.log('Added:', attachment.fileName);
}
```

#### `removeAttachmentFromItem(itemId, attachmentId): Promise<void>`

Item에서 첨부파일을 제거합니다.

**파라미터:**
- `itemId`: Item ID
- `attachmentId`: Attachment ID

**에러:**
- "Attachment not found" - 첨부파일 없음

**예시:**
```typescript
await removeAttachmentFromItem(itemId, attachmentId);
```

#### `getItemAttachments(itemId): Promise<Attachment[]>`

Item의 첨부파일 목록을 조회합니다.

**반환값:**
- Attachment 배열

**예시:**
```typescript
const attachments = await getItemAttachments(itemId);
console.log(`Found ${attachments.length} attachments`);
```

#### `pickFile(): Promise<DocumentPickerAsset | null>`

파일 선택 다이얼로그를 열고 선택된 파일을 반환합니다.

**반환값:**
- DocumentPickerAsset 또는 null (취소한 경우)

**예시:**
```typescript
const file = await pickFile();
if (file) {
  console.log(file.name, file.size);
}
```
```

#### 커밋 메시지

```
feat(services): 첨부파일 관리 함수 구현

- addAttachmentToItem: 첨부파일 추가 (10MB 제한)
- removeAttachmentFromItem: 첨부파일 삭제
- getItemAttachments: 첨부파일 조회
- pickFile: 파일 선택 다이얼로그
- Zustand 스토어 확장 (useItemStore)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### 2.3 Phase 3: UI 레이어 작업 (react-native-expo-developer)

#### 작업 내용

**1. FilePickerButton 컴포넌트**

파일: `/src/components/item/FilePickerButton.tsx`

```typescript
import React, { useState } from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { addAttachmentToItem, pickFile } from '@/services/item-service';

interface FilePickerButtonProps {
  itemId: string;
  onAttachmentAdded?: () => void;
}

export function FilePickerButton({
  itemId,
  onAttachmentAdded,
}: FilePickerButtonProps) {
  const [loading, setLoading] = useState(false);
  const iconColor = useThemeColor('#3B82F6', '#60A5FA');
  const textColor = useThemeColor('#1F2937', '#F3F4F6');

  const handlePressFilePickerButton = async () => {
    try {
      setLoading(true);

      // 파일 선택
      const file = await pickFile();
      if (!file) return;

      // 첨부파일 추가
      await addAttachmentToItem(itemId, file);

      Alert.alert('성공', `${file.name}을 추가했습니다.`);
      onAttachmentAdded?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 추가 실패';
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePressFilePickerButton}
      disabled={loading}
      className="flex-row items-center justify-center px-4 py-3 rounded-lg bg-blue-100 dark:bg-blue-900"
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          <Ionicons name="document-attach" size={20} color={iconColor} />
          <Text
            className="ml-2 font-semibold text-blue-900 dark:text-blue-100"
            style={{ color: textColor }}
          >
            파일 추가
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
```

**2. AttachmentList 컴포넌트**

파일: `/src/components/item/AttachmentList.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { useThemedStyles } from '@/design-system/hooks/useThemedStyles';
import {
  getItemAttachments,
  removeAttachmentFromItem,
} from '@/services/item-service';
import { Attachment } from '@/types';

interface AttachmentListProps {
  itemId: string;
}

export function AttachmentList({ itemId }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const borderColor = useThemeColor('#E5E7EB', '#374151');
  const deleteIconColor = useThemeColor('#EF4444', '#FCA5A5');
  const textColor = useThemeColor('#1F2937', '#F3F4F6');

  const styles = useThemedStyles((colors) => ({
    container: { borderTopColor: colors.border },
    attachmentItem: { borderBottomColor: colors.border },
    fileName: { color: colors.text },
    fileSize: { color: colors.textSecondary },
  }));

  useEffect(() => {
    loadAttachments();
  }, [itemId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await getItemAttachments(itemId);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = (attachmentId: string, fileName: string) => {
    Alert.alert(
      '파일 삭제',
      `${fileName}을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingIds((prev) => new Set(prev).add(attachmentId));
              await removeAttachmentFromItem(itemId, attachmentId);
              setAttachments((prev) =>
                prev.filter((a) => a.id !== attachmentId)
              );
            } catch (error) {
              Alert.alert('오류', '파일 삭제에 실패했습니다.');
            } finally {
              setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(attachmentId);
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <View className="justify-center items-center py-8">
        <ActivityIndicator size="large" color={useThemeColor('#3B82F6', '#60A5FA')} />
      </View>
    );
  }

  if (attachments.length === 0) {
    return (
      <View className="py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Text className="text-center text-gray-500 dark:text-gray-400">
          첨부파일 없음
        </Text>
      </View>
    );
  }

  return (
    <View
      className="border-t border-gray-200 dark:border-gray-700"
      style={styles.container}
    >
      <Text className="mt-4 mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        첨부파일 ({attachments.length})
      </Text>

      <ScrollView className="space-y-2">
        {attachments.map((attachment) => (
          <View
            key={attachment.id}
            className="flex-row items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            style={styles.attachmentItem}
          >
            <View className="flex-1">
              <Text
                className="font-medium text-gray-900 dark:text-gray-100"
                style={styles.fileName}
                numberOfLines={1}
              >
                {attachment.fileName}
              </Text>
              <Text
                className="text-sm text-gray-500 dark:text-gray-400"
                style={styles.fileSize}
              >
                {formatFileSize(attachment.fileSize)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                handleDeleteAttachment(attachment.id, attachment.fileName)
              }
              disabled={deletingIds.has(attachment.id)}
              className="ml-3 p-2"
            >
              {deletingIds.has(attachment.id) ? (
                <ActivityIndicator size="small" color={deleteIconColor} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={deleteIconColor}
                />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
```

**3. Item 상세 화면 통합**

파일: `/src/app/item/_layout.tsx` (레이아웃 정의)

```typescript
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';
import { FloatingActionBar } from '@/components/common';
import { usePathname } from 'expo-router';

export default function ItemLayout() {
  const pathname = usePathname();

  const getHeaderTitle = () => {
    if (pathname.includes('[id]')) {
      return '증빙 상세';
    }
    return '';
  };

  const getFloatingActions = () => {
    if (pathname.includes('[id]')) {
      return [
        { icon: 'create-outline', onPress: handleEdit, variant: 'default' },
        { icon: 'trash-outline', onPress: handleDelete, variant: 'danger' },
      ];
    }
    return undefined;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Header title={getHeaderTitle()} showBack={true} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="[id]" />
      </Stack>

      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
```

파일: `/src/app/item/[id].tsx` (콘텐츠만)

```typescript
import { ScrollView, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FilePickerButton } from '@/components/item/FilePickerButton';
import { AttachmentList } from '@/components/item/AttachmentList';
import { ItemDetail } from '@/components/item/ItemDetail';
import { useState } from 'react';

export default function ItemDetailScreen() {
  const route = useRoute();
  const { id: itemId } = route.params as { id: string };
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAttachmentAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <ScrollView className="flex-1 px-4 py-4">
      <ItemDetail itemId={itemId} />

      {/* 첨부파일 섹션 */}
      <View className="mt-6 mb-4">
        <FilePickerButton
          itemId={itemId}
          onAttachmentAdded={handleAttachmentAdded}
        />
      </View>

      <View className="mb-6">
        <AttachmentList key={refreshKey} itemId={itemId} />
      </View>
    </ScrollView>
  );
}
```

#### 커밋 메시지

```
feat(ui): 첨부파일 선택 및 표시 UI 추가

- FilePickerButton 컴포넌트 (문서 선택, 10MB 검증)
- AttachmentList 컴포넌트 (목록 표시, 삭제 기능)
- Item 상세 화면에 첨부파일 섹션 추가
- 다크모드 완벽 지원 (dark: 클래스, useThemeColor 훅)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 3. 검증 단계

### 3.1 TypeScript 검증

```bash
# 에러 확인
npx tsc --noEmit

# 결과: 0 errors found
```

### 3.2 다크모드 검증 (CRITICAL)

**체크리스트**:

```markdown
## 다크모드 검증 (필수)

### 1. 코드 리뷰
- [ ] FilePickerButton: 모든 색상이 `dark:` 또는 `useThemeColor` 사용
- [ ] AttachmentList: 모든 색상이 `dark:` 또는 훅 사용
- [ ] 하드코딩 색상 없음 (grep 검색 확인)

### 2. 시각적 테스트
1. 라이트 모드에서 실행
   - [ ] 파일 추가 버튼 가독성 확인
   - [ ] 첨부파일 목록 항목 가독성 확인
   - [ ] 삭제 아이콘 색상 확인

2. 다크 모드로 토글
   - [ ] 모든 텍스트 가독성 확인
   - [ ] 배경색 대비 확인
   - [ ] 아이콘 색상 확인

### 3. 에러 시나리오
- [ ] 파일 추가 실패 시 Alert 표시 (다크모드)
- [ ] 파일 삭제 시 확인 Alert (다크모드)

### 4. 로딩 상태
- [ ] ActivityIndicator 색상 (다크모드)
- [ ] 로딩 중 버튼 비활성화
```

### 3.3 기능 검증

```markdown
## 기능 검증 체크리스트

### 파일 추가
- [ ] DocumentPicker 열기 가능
- [ ] 파일 선택 후 추가됨
- [ ] 10MB 초과 파일 거부 메시지 표시
- [ ] 첨부파일 목록 자동 갱신

### 파일 삭제
- [ ] 파일 삭제 확인 Alert 표시
- [ ] 삭제 후 목록에서 제거
- [ ] 실제 파일 시스템에서도 삭제

### 상태 관리
- [ ] 화면 전환 후 돌아와도 첨부파일 목록 유지
- [ ] 새로고침 시 DB에서 다시 로드
- [ ] Zustand 스토어 상태 일관성 확인

### 에러 처리
- [ ] 파일 접근 실패 시 에러 메시지
- [ ] DB 저장 실패 시 사용자 알림
- [ ] 네트워크 오류 처리 (향후 클라우드 저장 시)
```

---

## 4. 완료 보고

### 4.1 보고 형식

```markdown
## 완료 보고: 첨부파일 기능 추가

### 작업 결과

#### 커밋 목록 (3개)

1. **feat(db): 첨부파일 기능을 위한 스키마 추가**
   - items 테이블에 attachments 컬럼 추가
   - Attachment 데이터 타입 정의
   - 유틸 함수 (saveAttachment, deleteAttachment 등)

2. **feat(services): 첨부파일 관리 함수 구현**
   - addAttachmentToItem, removeAttachmentFromItem 등
   - Zustand 스토어 확장
   - 파일 시스템 연동

3. **feat(ui): 첨부파일 선택 및 표시 UI 추가**
   - FilePickerButton, AttachmentList 컴포넌트
   - Item 상세 화면 통합
   - 다크모드 완벽 지원

#### 변경 파일

```
src/
├── db/
│   ├── migrations/002_add_attachments.ts (신규)
│   ├── schema.ts (수정)
│   ├── types.ts (수정)
│   └── utils.ts (신규)
├── services/
│   ├── item-service.ts (수정)
│   └── types.ts (수정)
├── components/
│   └── item/
│       ├── FilePickerButton.tsx (신규)
│       └── AttachmentList.tsx (신규)
├── stores/
│   └── useItemStore.ts (수정)
└── app/
    └── item/[id].tsx (수정)

docs/
├── architecture/
│   └── database.md (수정)
└── services/
    └── item-service.md (수정)
```

#### 품질 기준

- [x] TypeScript 에러 0 (`npx tsc --noEmit` 통과)
- [x] 다크모드 완벽 지원 (모든 색상 dark: 클래스 또는 훅 사용)
- [x] 한국어 UI 메시지
- [x] 에러 처리 완료 (Alert, try-catch)
- [x] 로딩 상태 표시 (ActivityIndicator)
- [x] Android에서 정상 동작

#### 테스트 방법

1. **파일 추가 테스트**
   ```bash
   npx expo start --android
   # 증빙 상세 화면 → "파일 추가" 버튼
   # DocumentPicker에서 파일 선택 → 목록 표시 확인
   ```

2. **다크모드 테스트**
   ```bash
   # Android 설정 → 디스플레이 → 테마 → 다크 토글
   # UI 가독성 확인
   ```

3. **파일 삭제 테스트**
   ```bash
   # AttachmentList에서 휴지통 아이콘 클릭
   # 확인 Alert → 삭제 확인
   ```

4. **에러 시나리오**
   ```bash
   # 10MB 이상 파일 선택 → "파일 크기 초과" 메시지 표시
   ```

### 4.2 주의사항

- **파일 경로**: 앱 캐시 디렉토리 사용 (앱 삭제 시 자동 정리)
- **DB 마이그레이션**: 기존 데이터 보존 (attachments = '[]')
- **다크모드**: 모든 색상이 dark: 클래스 또는 훅으로 정의됨
- **에러 처리**: 파일 접근 실패 시 사용자 친화적 메시지 표시
```

### 4.2 추가 정보

**FAQ**:

Q: 파일은 어디에 저장되나요?
A: 앱의 캐시 디렉토리 (`FileSystem.cacheDirectory/attachments/`) - 앱 삭제 시 자동 정리

Q: 여러 파일을 한 번에 선택할 수 있나요?
A: 현재는 한 번에 1개씩 추가 (P2에서 다중 선택 추가 가능)

Q: iOS에서도 동작하나요?
A: 예, expo-document-picker가 iOS를 지원함

Q: 파일 크기 제한을 변경하려면?
A: `addAttachmentToItem` 함수의 10MB 체크 수정 후 각 에이전트에 재요청

---

## 자주 묻는 질문 (FAQ)

### 워크플로우 관련

**Q: 계획 단계에서 반드시 사용자 승인을 받아야 하나요?**

A: 예, CLAUDE.md의 CRITICAL 규칙입니다. "진행해줘", "시작해" 등도 예외 없음. 항상 계획 제시 → 승인 대기 → 실행 순서.

**Q: 계획 없이 즉시 처리 가능한 경우는?**

A: 정보 조회, 기존 코드 설명, 개발 관련 질문 등 **코드 변경이 없는 작업**만 가능.

**Q: 에이전트가 각 단계를 분담할 때 순서가 중요한가?**

A: 예. DB → 서비스 → UI 순서 필수. UI는 서비스가 완료되어야 구현 가능.

### 문서화 관련

**Q: 기능 추가 커밋에 문서 변경을 포함해야 하나요?**

A: 예, 별도 커밋 금지. 예: `feat(db): ...` 커밋에 `architecture/database.md` 변경 포함.

**Q: 아직 P1, P2 기능은 문서에 작성하면 안 되나요?**

A: 맞음. "미구현/계획 내용은 문서 제외" 원칙 (CLAUDE.md). 구현 완료 후에만 문서화.

### 품질 관련

**Q: 다크모드가 정말 필수인가요?**

A: 네, CRITICAL 요구사항. 모든 색상이 dark: 클래스 또는 훅 사용 필수. 하드코딩 색상은 절대 금지.

**Q: TypeScript 에러가 있어도 진행할 수 있나요?**

A: 아니오. `npx tsc --noEmit` 통과 필수 (완료 보고 시점).

---

## 참고 문서

| 문서 | 링크 |
|-----|------|
| 프로젝트 규칙 | [/CLAUDE.md](/CLAUDE.md) |
| 아키텍처 | [/docs/architecture.md](/docs/architecture.md) |
| 서비스 | [/docs/services.md](/docs/services.md) |
| 데이터베이스 | [/docs/guides/database.md](/docs/guides/database.md) |
| 디자인 시스템 | [/docs/guides/design-system.md](/docs/guides/design-system.md) |
| 레이아웃 정책 | [/docs/guides/layout-policy.md](/docs/guides/layout-policy.md) |

