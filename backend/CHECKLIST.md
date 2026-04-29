# Backend Checklist

## 작업 전
- `/API` operation 구조를 따르는 작업인지 확인한다.
- 대상 도메인의 `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`, 소켓이면 `_sockets.sys.js`를 함께 볼지 판단한다.
- DB 작업이면 `backend/docs/DB.md`, `backend/docs/DB-CHECKLIST.md`를 확인한다.
- 파일 업로드 작업이면 `backend/docs/FILE.md`, `backend/docs/FILE-CHECKLIST.md`를 확인한다.
- 소켓 작업이면 `backend/docs/SOCKET.md`, `backend/docs/SOCKET-CHECKLIST.md`를 확인한다.
- 새 도메인/operation은 스캐폴드 스크립트를 우선 사용한다.
- 공통 규칙은 `backend/CONVENTION.md`와 필요한 `convention/*.md`를 확인한다.

## 구현 중
- 입력값 검증을 가장 먼저 둔다.
- 검증 실패는 `InputValueNotValid`로 반환한다.
- 한 줄 가드 절은 인라인으로 작성한다.
- operation 로직에서 `param`은 `param.xxx`로 직접 사용한다.
- `module/`은 1파일 1export 함수만 둔다.
- enum은 배열로 선언하고 `enums.X.includes(...)`로 검증한다.
- update/delete 전에는 존재 여부와 권한 여부를 확인한다.
- raw SQL에는 사용자 입력을 문자열 결합으로 넣지 않는다.
- DB 기반 작업을 JSON, txt, 로컬 파일 저장으로 우회하지 않는다.
- fileToken을 최종 서비스 데이터처럼 DB에 저장하지 않는다.
- tempBucket 파일을 영구 파일처럼 사용하지 않는다.
- 소켓 message의 예상 가능한 실패는 `_error` 이벤트로 response class를 emit한다.
- 소켓 room join 전에는 대상 존재 여부와 권한을 확인한다.

## 구현 후
- 성공/실패 응답이 response class인지 확인한다.
- operation의 `description`, `group`, `paramSchema`, `responseSchema`가 맞는지 확인한다.
- 루트 집계 파일이 갱신됐는지 확인한다.
- `/API-doc` 반영 여부를 확인한다.
- 소켓 작업이면 `/API-doc/sockets` 반영 여부를 확인한다.
- `npm run build`를 실행한다.
