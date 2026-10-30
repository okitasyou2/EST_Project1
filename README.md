# Game Opportunity Radar 실행 방법

Node.js 18 이상이 필요합니다. 별도 패키지 설치는 필요하지 않습니다.

이 PC에는 프로젝트 안 `.tools` 폴더에 Node.js를 설치했습니다. `.env` 설정 후 `start.cmd`를 실행하면 서버가 시작됩니다. 시스템 전체의 `node` 명령어에는 추가되지 않습니다.

1. `.env.example`을 `.env`로 복사합니다.
2. `.env`의 `CORAL_API_KEY`에 CoralBricks API 키를 입력합니다. 키를 채팅이나 소스 저장소에 공유하지 마세요.
3. 프로젝트 폴더에서 `node server.js`를 실행하고 브라우저에서 `http://localhost:3000`을 엽니다.

기본 모델은 `deepseek-v4.1-flash`입니다. 계정에서 사용할 수 있는 다른 CoralBricks 모델은 `.env`의 `CORAL_MODEL`로 지정할 수 있습니다. 호출에는 CoralBricks 요금이 적용됩니다. 서버는 로컬 주소에서만 접근할 수 있습니다.

현재 AI 분석과 자동 발굴에는 웹 검색이 연결되어 있지 않습니다. 결과는 검증되지 않은 제안이며, 시장 현황 및 운영 정책은 직접 확인해야 합니다. 관심 후보는 Supabase에 저장됩니다. 이전에 브라우저에 저장한 후보는 자동으로 옮겨지지 않습니다.

Supabase JavaScript v2는 CDN으로 불러오며 `js/supabase-client.js`에서 공개 키로 클라이언트를 초기화합니다. 이메일 회원가입 및 로그인을 지원하며, 후보는 `saved_candidates` 테이블에 저장됩니다. Supabase 대시보드에서 이메일 인증을 사용하는 경우 Authentication → URL Configuration에 배포 사이트의 `login.html` 주소와 로컬 `http://localhost:3000/login.html`을 Redirect URLs로 등록하세요. 실제 메일 발송은 Supabase Auth의 이메일 설정 및 발송 제한에 따릅니다. 클라이언트의 사용자별 조회 조건만으로는 접근이 보호되지 않으므로 테이블 권한과 RLS 정책을 설정해야 합니다.

로그인 화면은 사용자 세션을 관리하지만 현재 AI API는 로그인 여부를 서버에서 확인하지 않습니다. 공개 배포에서는 누구나 AI API를 호출할 수 있습니다.

## Vercel 배포

Vercel 프로젝트 Settings → Environment Variables에서 `CORAL_API_KEY`에 CoralBricks 키를 설정하고 Production 환경에 적용한 뒤 새로 배포합니다. 로컬 `.env` 파일은 배포되지 않습니다. 필요하면 `CORAL_MODEL`도 설정할 수 있습니다. Vercel API는 `api/`의 함수로 실행됩니다.

배포 사이트에 접근할 수 있는 사람은 누구나 유료 API를 호출할 수 있으므로, 개인용이라면 Vercel 배포 보호 등으로 접근을 제한한 뒤 사용하세요.
