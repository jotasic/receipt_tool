# ADB over Network 설정 가이드

원격 개발 환경에서 Android 기기에 무선으로 연결하여 스크린샷 등 ADB 명령어를 사용하기 위한 설정 가이드입니다.

## 전제 조건

- 원격 서버와 Android 기기가 **같은 Wi-Fi 네트워크**에 연결되어 있어야 함
- Android 기기에서 **개발자 옵션**이 활성화되어 있어야 함

---

## 설정 방법

### 1. Android 기기 설정

#### Android 11 이상

1. **설정** → **개발자 옵션** → **무선 디버깅** 활성화
2. **무선 디버깅** 메뉴 진입
3. 기기의 **IP 주소**와 **포트** 확인 (예: `192.168.0.100:5555`)

#### Android 10 이하

1. USB로 기기를 로컬 PC에 연결 (일회성)
2. 로컬 PC에서 실행:
   ```bash
   adb tcpip 5555
   ```
3. USB 연결 해제
4. 기기 IP 주소 확인:
   - **설정** → **Wi-Fi** → 현재 네트워크 → **상세정보**
   - 예: `192.168.0.100`

---

### 2. 원격 서버에서 ADB 연결

기기 IP 주소와 포트를 확인한 후:

```bash
# ADB 연결
~/Library/Android/sdk/platform-tools/adb connect <IP주소>:5555

# 예시
~/Library/Android/sdk/platform-tools/adb connect 192.168.0.100:5555
```

**연결 확인:**
```bash
~/Library/Android/sdk/platform-tools/adb devices
```

**출력 예시:**
```
List of devices attached
192.168.0.100:5555    device
```

---

### 3. 스크린샷 기능 사용

연결 후 기존 스크린샷 스킬 사용 가능:

```
/screenshot
```

또는 직접 명령어:
```bash
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > /tmp/screenshots/screenshot_$(date +%Y%m%d_%H%M%S).png
```

---

## 문제 해결

### 연결이 안 될 때

1. **같은 Wi-Fi 네트워크 확인**
   ```bash
   # 원격 서버 IP 확인
   ifconfig | grep inet

   # Android 기기 IP 확인 (설정 → Wi-Fi)
   ```

2. **방화벽 확인**
   - 기기와 서버 간 5555 포트가 열려있는지 확인

3. **ADB 서버 재시작**
   ```bash
   ~/Library/Android/sdk/platform-tools/adb kill-server
   ~/Library/Android/sdk/platform-tools/adb start-server
   ```

### 연결이 끊어질 때

무선 디버깅은 네트워크 변경 시 자동으로 끊어집니다. 재연결 필요:

```bash
~/Library/Android/sdk/platform-tools/adb connect <IP주소>:5555
```

### 기기가 슬립 모드일 때

무선 디버깅이 비활성화될 수 있습니다. 기기 화면을 켜고 재연결하세요.

---

## 자동화 (선택사항)

매번 연결 명령어를 입력하기 번거롭다면 쉘 스크립트 생성:

**파일:** `~/.adb-connect.sh`
```bash
#!/bin/bash
ADB_PATH=~/Library/Android/sdk/platform-tools/adb
DEVICE_IP="192.168.0.100"  # 기기 IP로 변경
DEVICE_PORT="5555"

echo "Connecting to Android device..."
$ADB_PATH connect $DEVICE_IP:$DEVICE_PORT

echo "Checking connection..."
$ADB_PATH devices
```

**사용:**
```bash
chmod +x ~/.adb-connect.sh
~/.adb-connect.sh
```

---

## 참고

- 로컬 개발: USB ADB 사용 (기존 방식)
- 원격 개발: ADB over Network 사용 (본 가이드)

두 환경 모두에서 동일한 `/screenshot` 스킬 사용 가능.
