# Discord Anti-Raid & IP Verification System

이 프로젝트는 디스코드 서버 레이드를 방지하기 위해 한국 아이피(KR IP) 전용 인증 시스템을 제공합니다.

## 시스템 구성
1. **Verification Site (Frontend)**: React + Tailwind CSS로 제작된 웹사이트. 사용자의 IP를 체크하고 VPN 여부를 확인합니다.
2. **Discord Bot**: 인증 채널에 버튼을 생성하고, 인증이 완료된 유저에게 역할을 부여합니다.

## 사용 방법

### 1. 웹사이트 배포 및 OAuth 설정
- `src/App.tsx` 파일 상단의 `CLIENT_ID` 변수에 본인의 디스코드 봇 클라이언트 ID를 입력하세요.
- 웹사이트를 Netlify, Vercel 등을 통해 배포하고 URL을 복사하세요.
- **디스코드 개발자 포털**의 `OAuth2` -> `Redirects` 설정에 배포된 사이트 주소를 추가하세요. (예: `https://your-site.vercel.app/`)
- 저장 후 `App.tsx`의 `REDIRECT_URI`가 배포된 주소와 일치하는지 확인하세요.

### 2. 디스코드 봇 설정
- `discord-bot-code.js` 파일을 로컬 환경에서 실행하세요 (`node discord-bot-code.js`).
- `TOKEN`, `VERIFY_CHANNEL_ID`, `MEMBER_ROLE_ID`, `VERIFY_URL`을 본인의 서버 정보에 맞게 수정해야 합니다.
- 서버 관리자 권한으로 `!setup` 명령어를 입력하면 인증 메시지가 생성됩니다.

### 3. 보안 로직 설명
- **국가 제한**: `ipapi.co` API를 사용하여 유저의 접속 국가가 'KR'이 아닌 경우 접속을 차단합니다.
- **VPN 차단**: 일반적인 호스팅 업체(AWS, Google Cloud, DigitalOcean 등)의 IP 대역을 감지하여 VPN 사용자를 차단합니다.
- **레이드 방지**: 인도네시아 등 해외에서 유입되는 봇들은 대다수 해당 국가 IP 또는 VPN을 사용하므로 효율적으로 차단 가능합니다.

## 기술 스택
- React
- Tailwind CSS
- Lucide React (Icons)
- Framer Motion (Animations)
- Axios (API Fetch)
- Discord.js (Bot implementation)
