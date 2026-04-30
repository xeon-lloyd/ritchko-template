# 백엔드 설명서

[돌아가기](../readme.md#api-문서백엔드)

## 구조 요약
- 백엔드는 순수 `js + express` 기반이다.
- 일반 API는 REST 라우터를 늘리지 않고 `/API` 단일 endpoint와 `operation` registry로 처리한다.
- webhook은 `/webhook{registryKey}` endpoint로 등록된다.
- socket은 socket.io `/socket` path를 사용한다.
- worker/cron은 서버 시작 후 `backend/worker/registCron.js`에서 도메인별 worker registry를 호출한다.

## 생성 명령
- 도메인: `npm run create:backend-domain -- <domain>`
- operation: `npm run create:backend-operation -- <domain> <OperationName>`
- webhook: `npm run create:backend-webhook -- <domain> <webhookNameWithoutProcess>`
- socket: `npm run create:backend-socket -- <domain> <SocketNameMessage|SocketNameEvent>`
- worker: `npm run create:backend-worker -- <domain> <workerName>`

Windows PowerShell 실행 정책 문제가 있으면 `npm.cmd run ...`을 사용한다.

## 이름 규칙
- operation key는 `PascalCase`, 로직 파일은 `lowerCamelCase`다.
- webhook registry key는 `/domain/action`이고 `Process` suffix를 붙이지 않는다.
- webhook handler 파일은 `<action>Process.js` 형태다. 예: `appleSocialLogin` -> `appleSocialLoginProcess.js`
- socket client-to-server 요청은 `Message`, server-to-client 이벤트는 `Event` suffix를 쓴다.
- worker 파일명과 export 함수명은 같은 `lowerCamelCase`를 쓴다.

## 문서 위치
- 백엔드 공통 작업: `backend/AGENTS.md`, `backend/CHECKLIST.md`, `backend/CONVENTION.md`
- DB: `backend/docs/DB.md`
- 파일 업로드: `backend/docs/FILE.md`
- webhook: `backend/docs/WEBHOOK.md`
- socket: `backend/docs/SOCKET.md`
- worker/cron: `backend/docs/WORKER.md`

## 검증
- 수정한 파일은 `node --check <파일>`로 구문을 확인한다.
- operation 추가/수정 후 `/API-doc` 반영 여부를 확인한다.
- webhook 추가/수정 후 `/API-doc/webhooks` 반영 여부를 확인한다.
- socket 추가/수정 후 `/API-doc/sockets` 반영 여부를 확인한다.
- worker 추가/수정 후 root/도메인 `registCron.js` 집계를 확인한다.
