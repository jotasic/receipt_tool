# Screenshot

Android 에뮬레이터/기기에서 스크린샷을 캡처합니다.

## Usage

```
/screenshot [filename]
```

## Arguments

- `filename` (optional): 저장할 파일명. 기본값: `screenshot_YYYYMMDD_HHMMSS.png`

## ADB Path

```
~/Library/Android/sdk/platform-tools/adb
```

## Instructions

1. ADB를 사용하여 연결된 Android 기기/에뮬레이터에서 스크린샷을 캡처합니다.
2. 스크린샷을 프로젝트의 `/tmp/screenshots/` 폴더에 저장합니다.
3. 저장된 파일을 Read 도구로 읽어서 화면 내용을 분석합니다.

## Execution Steps

```bash
# 1. 스크린샷 폴더 생성
mkdir -p /tmp/screenshots

# 2. ADB 연결 확인
DEVICES=$(~/Library/Android/sdk/platform-tools/adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
  echo "❌ ADB 연결된 기기가 없습니다."
  echo ""
  echo "로컬 환경: USB로 기기를 연결하세요."
  echo "원격 환경: ADB over Network 설정이 필요합니다."
  echo ""
  echo "설정 가이드: docs/guides/adb-network.md"
  exit 1
fi

# 3. 스크린샷 캡처
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > /tmp/screenshots/{filename}

# 4. 파일 확인
ls -la /tmp/screenshots/{filename}
```

## After Capture

스크린샷 캡처 후:
1. Read 도구로 이미지 파일을 읽어서 내용 분석
2. 사용자에게 분석 결과 보고
3. 필요시 버그 수정 진행

## Example Output

```
스크린샷 캡처 완료: /tmp/screenshots/screenshot_20260216_091900.png

[이미지 분석]
- 화면: 리포트 생성
- 발견된 문제: 헤더가 2개 표시됨
- 원인 추정: Root Stack 설정 누락
```
