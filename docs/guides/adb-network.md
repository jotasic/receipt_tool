# ADB over Network 설정 가이드

원격 개발 환경에서 Android 기기에 무선으로 연결하여 스크린샷 등 ADB 명령어를 사용하기 위한 설정 가이드입니다.

## 전제 조건

- 원격 서버와 Android 기기가 **같은 Wi-Fi 네트워크**에 연결되어 있어야 함
- Android 기기에서 **개발자 옵션**이 활성화되어 있어야 함

---

## 설정 방법

### 1. Android 기기 설정

#### Android 11 이상 (무선 디버깅)

**1단계: 무선 디버깅 활성화**
1. **설정** → **개발자 옵션** → **무선 디버깅** 활성화
2. **무선 디버깅** 메뉴 진입

**2단계: 페어링 (처음 연결 시만)**
1. **페어링 코드로 기기 페어링** 탭 클릭
2. 화면에 표시된 정보 확인:
   - 페어링 코드: `123456` (6자리 숫자)
   - IP 주소 및 포트: `<DEVICE_IP>:37847`
   - 페어링 코드는 약 1분 후 만료됨

**3단계: 연결용 포트 확인**
페어링 완료 후 무선 디버깅 메인 화면에서:
- **IP 주소 및 포트**: `<DEVICE_IP>:5555` (연결용 포트, 페어링 포트와 다름)

#### Android 10 이하

1. USB로 기기를 로컬 PC에 연결 (일회성)
2. 로컬 PC에서 실행:
   ```bash
   adb tcpip 5555
   ```
3. USB 연결 해제
4. 기기 IP 주소 확인:
   - **설정** → **Wi-Fi** → 현재 네트워크 → **상세정보**
   - 예: `<DEVICE_IP>`

---

### 2. 원격 서버에서 ADB 페어링 및 연결

#### Android 11 이상 (처음 연결 시)

**1단계: 페어링**

Android 기기에서 "페어링 코드로 기기 페어링" 화면의 정보를 확인한 후:

```bash
# 페어링 (페어링 포트 사용)
~/Library/Android/sdk/platform-tools/adb pair <IP주소>:<페어링포트>

# 예시
~/Library/Android/sdk/platform-tools/adb pair <DEVICE_IP>:37847
```

페어링 코드 입력 요청 시 기기 화면에 표시된 6자리 숫자 입력:
```
Enter pairing code: 123456
```

**성공 메시지:**
```
Successfully paired to <DEVICE_IP>:37847
```

**2단계: 연결**

페어링 성공 후, Android 기기의 무선 디버깅 메인 화면에서 **연결용 포트** 확인 후:

```bash
# 연결 (연결 포트 사용, 보통 5555)
~/Library/Android/sdk/platform-tools/adb connect <IP주소>:<연결포트>

# 예시
~/Library/Android/sdk/platform-tools/adb connect <DEVICE_IP>:5555
```

**성공 메시지:**
```
connected to <DEVICE_IP>:5555
```

#### Android 10 이하

페어링 불필요, 바로 연결:

```bash
~/Library/Android/sdk/platform-tools/adb connect <DEVICE_IP>:5555
```

#### 연결 확인

```bash
~/Library/Android/sdk/platform-tools/adb devices
```

**출력 예시:**
```
List of devices attached
<DEVICE_IP>:5555    device
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

## 빠른 연결 체크리스트

### 처음 연결하는 경우 (Android 11+)

- [ ] Android 기기: **설정** → **개발자 옵션** → **무선 디버깅** 활성화
- [ ] Android 기기: **페어링 코드로 기기 페어링** 탭 클릭
- [ ] 페어링 코드 및 페어링 포트 확인 (예: `<DEVICE_IP>:37847`, 코드: `123456`)
- [ ] 서버: `adb pair <DEVICE_IP>:37847` 실행 후 코드 입력
- [ ] Android 기기: 무선 디버깅 메인 화면에서 연결 포트 확인 (예: `5555`)
- [ ] 서버: `adb connect <DEVICE_IP>:5555` 실행
- [ ] 서버: `adb devices` 로 연결 확인

### 이미 페어링한 경우

- [ ] Android 기기: **무선 디버깅** 활성화 확인
- [ ] 서버: `adb connect <DEVICE_IP>:5555` 실행
- [ ] 서버: `adb devices` 로 연결 확인

---

## 문제 해결

### "Connection refused" 오류

**원인:** 포트 번호가 잘못되었거나 무선 디버깅이 비활성화됨

**해결:**
1. Android 기기에서 무선 디버깅이 활성화되어 있는지 확인
2. 무선 디버깅 화면에 표시된 정확한 포트 번호 사용
3. 페어링 포트와 연결 포트가 다름에 주의

### "failed to authenticate" 오류

**원인:** 페어링이 안 됨

**해결:**
```bash
# 1. 페어링 다시 시도
~/Library/Android/sdk/platform-tools/adb pair <IP>:<페어링포트>

# 2. 페어링 코드 정확히 입력 (1분 내)

# 3. 연결
~/Library/Android/sdk/platform-tools/adb connect <IP>:5555
```

### 같은 Wi-Fi 네트워크 확인

```bash
# 원격 서버 IP 확인
ifconfig | grep inet

# Android 기기 IP 확인 (설정 → Wi-Fi)
# 동일한 네트워크 대역인지 확인 (예: 192.168.50.x)
```

### 방화벽 확인

기기와 서버 간 포트가 열려있는지 확인:
- 페어링 포트 (예: 37847)
- 연결 포트 (보통 5555)

### ADB 서버 재시작

```bash
~/Library/Android/sdk/platform-tools/adb kill-server
~/Library/Android/sdk/platform-tools/adb start-server
```

### 연결이 끊어질 때

무선 디버깅은 네트워크 변경 시 자동으로 끊어집니다. 재연결:

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
DEVICE_IP="<DEVICE_IP>"  # 기기 IP로 변경
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
