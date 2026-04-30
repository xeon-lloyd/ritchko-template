# Backend AGENTS.md

## 목적
`backend/` 작업의 진입점이다. 상세 구현 규칙은 주제별 문서로 나뉘며, 이 파일은 어떤 문서를 언제 봐야 하는지와 backend 공통 작업 흐름만 정의한다.

## 먼저 볼 것
1. `backend/_operations.sys.js`
2. `backend/_param.sys.js`
3. `backend/_response.sys.js`
4. `backend/CHECKLIST.md`
5. `backend/CONVENTION.md`
6. DB 작업이면 `backend/docs/DB.md`, `backend/docs/DB-CHECKLIST.md`
7. 파일 업로드 작업이면 `backend/docs/FILE.md`, `backend/docs/FILE-CHECKLIST.md`
8. 웹훅 작업이면 `backend/docs/WEBHOOK.md`, `backend/docs/WEBHOOK-CHECKLIST.md`
9. 소켓 작업이면 `backend/docs/SOCKET.md`, `backend/docs/SOCKET-CHECKLIST.md`
10. cron/worker 작업이면 `backend/docs/WORKER.md`, `backend/docs/WORKER-CHECKLIST.md`
11. 작업 대상 도메인의 관련 registry와 schema 파일을 확인한다. 예: `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`, `_webhooks.sys.js`, `_sockets.sys.js`, `worker/registCron.js`

## 구조
- `/API`는 `backend/_system_/middleware.sys.js`가 처리한다.
- 요청 body는 `{ operation, param }` 형태다.
- operation 정의는 실제 로직 파일, 인증 여부, 문서용 schema를 가리킨다.
- 응답은 `*_response.sys.js`의 response class를 반환한다.
- 새 도메인/operation/webhook/socket/worker는 가능하면 스캐폴드 스크립트로 생성한다.
- 웹훅은 `backend/_system_/webhookInit.sys.js`가 `/webhook{registryKey}`로 초기화하고, `backend/_webhooks.sys.js`가 도메인별 `_webhooks.sys.js`를 모은다.
- 웹훅 로직은 `/API` operation middleware를 거치지 않고 `module.exports = async function(req, res){ ... }` 형태로 Express `req`, `res`를 직접 다룬다.
- 소켓은 `backend/_system_/socketInit.sys.js`가 `/socket`으로 초기화하고, `backend/_sockets.sys.js`가 도메인별 `_sockets.sys.js`를 모은다.
- 소켓 message 로직은 `module.exports = async function(socket, data){ ... }` 형태다.
- cron은 `server.js`가 서버 시작 후 `backend/worker/registCron.js`를 호출하고, 이 파일이 도메인별 `worker/registCron.js`를 모은다.
- worker 로직은 `/API` operation middleware와 `/API-doc` 문서화 대상이 아니다.

## 생성 명령
- 도메인: `npm run create:backend-domain -- <name>`
- operation: `npm run create:backend-operation -- <domain> <OperationName>`
- 인증 필요: `--auth`
- `paramSchema: null` 시작: `--param-null`
- 설명 지정: `--description "설명"`
- webhook: `npm run create:backend-webhook -- <domain> <webhookNameWithoutProcess> [--method post|get|put|patch|delete] [--redirect]`
- socket: `npm run create:backend-socket -- <domain> <SocketNameMessage|SocketNameEvent> [--auth]`
- worker: `npm run create:backend-worker -- <domain> <workerName> [--cron "0 * * * *"] [--comment "1시간마다 실행"] [--consumer]`
- worker producer guard 해제: `--no-lock`, guard TTL 지정: `--ttl 600`
- Windows PowerShell 실행 정책 문제가 있으면 `npm.cmd run ...`을 사용한다.

## 구현 흐름
1. 체크리스트와 관련 주제 문서를 확인한다.
2. 스캐폴드로 파일과 registry를 만든다.
3. 로직 파일, registry, `_param.sys.js`, `_response.sys.js`를 작업 유형에 맞게 함께 맞춘다.
4. 입력값 검증, 대상 존재 여부, 권한 확인, 핵심 처리, 응답 반환 순서로 작성한다.
5. `/API-doc`, `/API-doc/webhooks`, `/API-doc/sockets`, worker registry와 빌드 검증을 작업 유형에 맞게 확인한다.

## 반드시 지킬 것
- operation 로직 기본 export는 `module.exports = async function(param, req, res){ ... }` 형태다.
- operation의 `param`은 구조분해하지 않고 `param.xxx`로 사용한다.
- 입력값 검증 실패는 `new response.InputValueNotValid('{param}')`로 통일한다.
- 신규 코드에서 `FormInputRequired`를 만들거나 사용하지 않는다.
- update/delete 전에는 대상 존재 여부와 권한 여부를 먼저 확인한다.
- 서비스 핵심 데이터는 DB에 저장한다. 파일 저장소로 우회하지 않는다.
- worker는 `queueName = 'WP:<workerName>'`, `// producer`, `// consumer` 구조를 유지하고 consumer가 없으면 `// consumer 없음`을 남긴다.
- DB 세부 규칙은 `backend/docs/DB.md`, 파일 업로드 세부 규칙은 `backend/docs/FILE.md`, 웹훅 세부 규칙은 `backend/docs/WEBHOOK.md`, cron/worker 세부 규칙은 `backend/docs/WORKER.md`, 네이밍/응답/enum/가드 절은 `backend/CONVENTION.md`를 따른다.
- 소켓 세부 규칙은 `backend/docs/SOCKET.md`를 따른다.

## 검증
- operation 추가/수정 후 `/API-doc` 반영 여부 확인
- webhook 추가/수정 후 `/API-doc/webhooks` 반영 여부 확인
- socket 추가/수정 후 `/API-doc/sockets` 반영 여부 확인
- cron/worker 추가/수정 후 root/도메인 `registCron.js` 집계 확인
- 루트 집계 파일 갱신 여부 확인
- 기본 검증은 `npm run build`
