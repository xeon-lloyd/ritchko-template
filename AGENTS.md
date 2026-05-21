# AGENTS.md

## 목적
이 문서는 레포 전체의 진입점이다. 세부 규칙은 작업 영역의 `AGENTS.md`와 주제별 문서를 따른다.

## 프로젝트 성격
- 개인 웹서비스 제작용 Node.js 템플릿이다.
- 프론트는 순수 `html + scss + js`, 백엔드는 순수 `js + express` 기반이다.
- 백엔드는 REST 라우터보다 `/API` 단일 endpoint와 `operation` 레지스트리 중심 구조다.

## 작업 전 읽는 순서
1. `server.js`
2. `backend/_system_/initialize.sys.js`
3. `backend/_system_/middleware.sys.js`
4. `backend/_operations.sys.js`
5. `convention/agent.md`
6. 작업 영역의 `AGENTS.md`
7. 작업 주제별 가이드와 체크리스트
8. 필요한 `convention/*.md`

## 영역별 문서
- AI agent 작업 방식: `convention/agent.md`
- 백엔드: `backend/AGENTS.md`, `backend/CHECKLIST.md`, `backend/CONVENTION.md`
- DB: `backend/docs/DB.md`, `backend/docs/DB-CHECKLIST.md`
- 파일 업로드: `backend/docs/FILE.md`, `backend/docs/FILE-CHECKLIST.md`
- 웹훅: `backend/docs/WEBHOOK.md`, `backend/docs/WEBHOOK-CHECKLIST.md`
- 소켓: `backend/docs/SOCKET.md`, `backend/docs/SOCKET-CHECKLIST.md`
- cron/worker: `backend/docs/WORKER.md`, `backend/docs/WORKER-CHECKLIST.md`
- 뷰 템플릿: `views/AGENTS.md`
- 프론트 스크립트: `public/js/AGENTS.md`
- 스타일: `public/scss/AGENTS.md`
- 공통 컨벤션: `convention/README.md`

## 핵심 원칙
- 모든 AI agent는 `convention/agent.md`의 작업 방식을 반드시 따른다.
- 기존 구조와 네이밍을 우선한다.
- 백엔드 도메인/operation/webhook/socket/worker는 생성 스크립트를 우선 사용한다.
- 템플릿에 없는 외부 프레임워크 기준으로 구조를 재편하지 않는다.
- 실제 비밀번호, API 키, 토큰, DB 접속 정보는 커밋하지 않는다.
- `backend/core/setting.js`, `public/js/env.js`는 placeholder 성격을 유지한다.
- 서비스 핵심 도메인 데이터는 DB에 저장한다. JSON, txt, 로컬 캐시 파일을 본 저장소처럼 새로 도입하지 않는다.
- 파일 저장은 업로드 임시파일, 로그, 캐시, export 산출물처럼 파일이 본질인 경우에만 사용한다.
- DB 날짜 저장 규칙은 `backend/docs/DB.md`를 따른다.
- cron/worker 작성 규칙은 `backend/docs/WORKER.md`를 따른다.
- worker 파일은 `queueName = 'WP:<workerName>'`, `// producer`, `// consumer` 구조를 따른다. consumer가 없으면 `// consumer 없음`을 남긴다.

## 생성 명령
- 프론트 페이지: `npm run create:frontend-page -- <path> [--title "페이지 제목"]`
- 백엔드 도메인: `npm run create:backend-domain -- <name>`
- 백엔드 operation: `npm run create:backend-operation -- <domain> <OperationName>`
- 백엔드 webhook: `npm run create:backend-webhook -- <domain> <webhookNameWithoutProcess>`
- 백엔드 socket: `npm run create:backend-socket -- <domain> <SocketNameMessage|SocketNameEvent>`
- 백엔드 worker: `npm run create:backend-worker -- <domain> <workerName> [--cron "0 * * * *"] [--comment "1시간마다 실행"] [--consumer] [--no-lock] [--ttl 600]`
- Windows PowerShell 실행 정책 문제가 있으면 `npm.cmd run ...`을 사용한다.

## 검증
- 프론트엔드(SCSS) 빌드: `npm run build`
- 백엔드 구문 확인: `node --check <수정한 파일>`
- 서버 기동 확인: `npm run start:dev`
- operation 추가/수정 시 `/API-doc` 반영 여부를 확인한다.
- webhook 추가/수정 시 `/API-doc/webhooks` 반영 여부를 확인한다.
- socket 추가/수정 시 `/API-doc/sockets` 반영 여부를 확인한다.
- cron/worker 추가/수정 시 root/도메인 `registCron.js` 집계를 확인한다.
