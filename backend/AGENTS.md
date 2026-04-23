# AGENTS.md

## 대상
이 문서는 `backend/` 작업 규칙이다.

## 먼저 볼 것
1. `backend/_operations.sys.js`
2. `backend/_param.sys.js`
3. `backend/_response.sys.js`
4. `backend/CHECKLIST.md`
5. DB 작업이면 `backend/DB.md`, `backend/DB-CHECKLIST.md`
6. 작업 대상 도메인의 `*_operations.sys.js`, `*_param.sys.js`, `*_response.sys.js`
7. 새 도메인 생성 시 `npm run create:backend-domain -- <name>`
8. 새 operation 생성 시 `npm run create:backend-operation -- <domain> <OperationName>`
9. `convention/README.md`
10. `convention/naming.md`, `convention/comment.md`, `convention/function.md`, `convention/formatting.md`
11. `backend/CONVENTION.md`

## 핵심 구조
- `/API`는 `backend/_system_/middleware.sys.js`를 통해 동작한다.
- 요청 본문에 `operation`과 `param`을 담아 보내고, operation 정의가 실제 로직 파일을 가리킨다.
- operation 추가 시 로직 파일만 만들지 말고 schema와 문서 반영까지 함께 맞춘다.
- 새 도메인 스캐폴드는 `scripts/templates/backend-domain/`을 기준으로 생성한다.
- 새 operation 스캐폴드는 `scripts/templates/backend-operation/`을 기준으로 생성한다.

## 새 도메인 생성
- 새 도메인은 직접 폴더를 만들기보다 `npm run create:backend-domain -- <name>`으로 생성한다.
- Windows PowerShell에서 `npm` 실행 정책 문제가 있으면 `npm.cmd run create:backend-domain -- <name>`을 사용한다.
- 생성 시 아래가 함께 처리된다.
  - `backend/<name>/` 폴더 생성
  - `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`, `_webhooks.sys.js`, `_sockets.sys.js`, `enums.js`, `worker/registCron.js` 생성
  - `backend/_operations.sys.js`, `backend/_param.sys.js`, `backend/_response.sys.js`, `backend/_webhooks.sys.js`, `backend/_sockets.sys.js`, `backend/worker/registCron.js` 갱신
- `module/` 폴더는 생성되지만 기본 파일은 만들지 않는다.
- 생성 후 바로 아래를 확인한다.
  - `backend/<name>/_operations.sys.js`
  - `backend/<name>/_param.sys.js`
  - `backend/<name>/_response.sys.js`
  - `/API-doc`

## 새 operation 추가 시
아래 파일을 함께 점검한다.

1. `backend/<domain>/<action>.js`
2. `backend/<domain>/_operations.sys.js`
3. `backend/<domain>/_param.sys.js`
4. `backend/<domain>/_response.sys.js`
5. 필요하면 `backend/_operations.sys.js`, `backend/_param.sys.js`, `backend/_response.sys.js`

- 가능하면 직접 파일을 손으로 추가하기보다 `npm run create:backend-operation -- <domain> <OperationName>`으로 기본 스캐폴드를 만든다.
- Windows PowerShell에서 `npm` 실행 정책 문제가 있으면 `npm.cmd run create:backend-operation -- <domain> <OperationName>`을 사용한다.
- 생성 시 아래가 함께 처리된다.
  - `backend/<domain>/<operationLogic>.js` 로직 파일 생성
  - `backend/<domain>/_operations.sys.js` 등록
  - `backend/<domain>/_param.sys.js` param schema 초안 추가
  - 기본 `responseSchema.OK` 등록
- `--auth`를 주면 `authRequire: true`로 생성된다.
- `--param-null`을 주면 `paramSchema: null`로 생성되고 `_param.sys.js`는 건드리지 않는다.
- `--description "..."`을 주면 문서용 description 초깃값을 지정할 수 있다.
- 로직 파일, operation 등록 블록, param 블록 원본은 `scripts/templates/backend-operation/`에서 관리한다.

## 구현 규칙
- 파일을 만들거나 수정하기 직전에 `backend/CHECKLIST.md`의 금지 규칙을 다시 확인한다.
- DB 조회/갱신을 건드리면 `backend/DB.md`, `backend/DB-CHECKLIST.md`를 같이 확인한다.
- 공통 네이밍, 주석, 함수 설계, 포매팅은 `convention/README.md`와 관련 `convention/*.md`를 기본값으로 삼고, backend 전용 예외와 추가 강제사항은 `backend/CONVENTION.md`를 따른다.
- 기본 export 형태는 `module.exports = async function(param, req, res){ ... }`를 따른다.
- operation 로직 파일과 backend `module/` 파일은 스캐폴드의 기본 import 줄을 기본값으로 유지한다.
- 기본 import 대상은 `response`, `setting`, `util`, `valider`, `enums`이며, 현재 파일에서 쓰지 않더라도 임의로 제거하지 않는다.
- 추가 import 배치, enum 작성 방식, 단계 주석, `module/` 분리 규칙, 가드 절 스타일, `paramSchema` 표기 같은 세부 스타일 규칙은 `backend/CONVENTION.md`를 기준으로 맞춘다.
- operation 로직 파일의 `param`은 구조분해하지 않고 `param.xxx` 형태로 직접 사용한다.
- 입력값이 어느 객체에서 왔는지 코드 전반에서 바로 보이도록 `const { sprintId } = param` 같은 패턴은 지양한다.
- 입력값 검증을 먼저 수행한다.
- 실패 시 가능한 한 빠르게 response 객체를 반환한다.
- DB 변경 전에는 대상 존재 여부와 권한 여부를 먼저 확인한다.
- 테이블에 `isDeleted`, `deletedAt`가 있으면 hard delete보다 soft delete를 우선 검토한다.
- raw SQL이 정말 필요하지 않으면 `util.mysql.select/count/sum/insert/update/delete`를 먼저 사용한다.
- 서비스의 핵심 도메인 데이터는 기본적으로 DB에 저장한다. `backend/core/setting.js`가 placeholder여도 JSON 파일, txt 파일, 메모리 객체를 영속 저장소처럼 새로 도입해 대체하지 않는다.
- DB 연결 정보나 테이블 정의가 비어 있어 즉시 구현이 막히면 파일 저장으로 우회하지 말고, 필요한 스키마나 전제를 먼저 정리하거나 사용자에게 확인한다.
- 문자열 컬럼 저장 시 길이가 명확하면 `substring()` 등으로 길이를 맞춘다.
- 성공/실패 응답은 `*_response.sys.js`에 정의된 응답 클래스를 사용한다.
- operation 추가 후 `description`, `group`, `paramSchema`, `responseSchema`를 빠뜨리지 않는다.
- 인증이 필요한 operation은 `authRequire: true`를 사용하며, 이 경우 `param.loginUser` 사용 가능 여부를 함께 확인한다.

## 주의할 점
- 구조를 읽지 않고 임의 REST endpoint를 대량 추가하지 않는다.
- 기존 response 체계를 무시하고 임의 JSON 객체를 직접 반환하지 않는다.
- 공통 패턴이 이미 있으면 `scripts/templates/backend-domain/`, `scripts/templates/backend-operation/`, 기존 도메인 구현을 우선 따른다.
- 일반적인 Node.js 유틸 습관으로 `module/` 파일에 여러 함수를 객체로 묶지 않는다.
- 일반적인 JS 습관대로 한 줄 가드를 블록 `if`로 쓰지 않는다.
- DB 기반 템플릿이라는 전제를 무시하고, 서비스 본 데이터를 `backend/<domain>/data/*.json` 같은 파일에 저장하는 구조를 새로 만들지 않는다.

## 검증
- operation 추가/수정 후 `/API-doc` 문서 반영 여부 확인
- 루트 집계 파일 갱신 누락 여부 확인
