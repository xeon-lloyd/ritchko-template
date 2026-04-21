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
- 기본 export 형태는 `module.exports = async function(param, req, res){ ... }`를 따른다.
- operation 로직 파일과 backend `module/` 파일은 스캐폴드의 기본 import 줄을 기본값으로 유지한다.
- 기본 import 대상은 `response`, `setting`, `util`, `valider`, `enums`이며, 현재 파일에서 쓰지 않더라도 임의로 제거하지 않는다.
- 추가 import가 필요하면 기본 import 블록 아래를 한 줄 비운 뒤 추가하며, 배치 예시는 `backend/CONVENTION.md`를 따른다.
- 도메인 `enums.js`는 enum마다 개별 `const` 배열을 선언하고, export는 `module.exports = { ...require('../enums.js'), EnumName }` 형태를 유지한다.
- `enums.js` 안에 enum이 아닌 설정 객체, 메타 맵, 계산용 옵션 객체를 넣지 않는다. 그런 값은 로직 파일이나 별도 module로 분리한다.
- enum 입력값 검증은 `if(!enums.Horizon.includes(param.horizon)) return ...`처럼 해당 배열에 직접 `includes()`를 호출하는 방식만 사용한다.
- `if(!Object.values(enums.Horizon).includes(param.horizon))`처럼 객체형 enum 습관을 끌고 오는 검증 방식은 금지한다.
- operation 로직 파일에는 흐름이 보이도록 최소 단계 주석을 유지한다.
- 특히 입력값 검증, 대상 존재 여부 확인, 권한 확인, 핵심 비즈니스 처리, 응답 반환 직전 단계에는 `// 입력값 검증`, `// 존재 여부 확인`처럼 짧은 한국어 주석을 우선 붙인다.
- 사람이 처음 읽을 때 전체 처리 흐름이 operation 로직 파일 한 곳에서 바로 보여야 하며, 검증/조회/가공/응답의 큰 흐름을 `module/` 뒤로 과하게 숨기지 않는다.
- `module/`은 1파일 1export 메서드를 기본으로 하며, 파일명과 export 함수명이 같게 맞춘다.
- `module/`에서 `module.exports = { a, b, c }` 형태 객체 export는 금지한다. 여러 재사용 동작이 필요하면 파일을 분리한다.
- `module/` 파일도 계산 단계나 데이터 가공 단계가 두 묶음 이상이면 각 처리 블록 앞에 짧은 단계 주석을 붙인다.
- operation 로직 파일의 `param`은 구조분해하지 않고 `param.xxx` 형태로 직접 사용한다.
- 입력값이 어느 객체에서 왔는지 코드 전반에서 바로 보이도록 `const { sprintId } = param` 같은 패턴은 지양한다.
- 입력값 검증을 먼저 수행한다.
- 실패 시 가능한 한 빠르게 response 객체를 반환한다.
- 한 줄짜리 가드 절(`if (...) return ...`)은 예외 없이 중괄호를 열지 않고 인라인으로 작성한다.
- `if (...) { return ... }` 형태의 블록 가드는 backend 코드에서 금지한다.
- 입력값 검증, 존재 여부 확인, 권한 확인에서 한 줄 반환으로 끝나는 가드는 모두 인라인으로 유지한다.
- 여러 재사용 동작을 엮는 흐름은 기본적으로 operation 로직 파일에서 조합한다.
- `module/`에서 다른 `module/`을 직접 호출하는 구조는 가급적 피하고, 정말 불가피한 경우가 아니면 helper나 내부 지역 함수 수준에서만 정리한다.
- `module/`은 보통 저장소 접근, 외부 연동, 명확한 단일 재사용 처리에 한정하고, operation 한 번에서만 쓰는 가공 로직은 우선 operation 내부에 둔다.
- DB 변경 전에는 대상 존재 여부와 권한 여부를 먼저 확인한다.
- 테이블에 `isDeleted`, `deletedAt`가 있으면 hard delete보다 soft delete를 우선 검토한다.
- raw SQL이 정말 필요하지 않으면 `util.mysql.select/count/sum/insert/update/delete`를 먼저 사용한다.
- 문자열 컬럼 저장 시 길이가 명확하면 `substring()` 등으로 길이를 맞춘다.
- 성공/실패 응답은 `*_response.sys.js`에 정의된 응답 클래스를 사용한다.
- operation 추가 후 `description`, `group`, `paramSchema`, `responseSchema`를 빠뜨리지 않는다.
- `paramSchema` 설명 문자열에서 optional 파라미터는 `보드 작성자 별칭(string?)`처럼 타입 뒤에 `?`를 붙여 표기한다.
- `보드 작성자 별칭(string, optional)`처럼 영어 `optional` 문구를 덧붙이는 표기는 금지한다.
- 인증이 필요한 operation은 `authRequire: true`를 사용하며, 이 경우 `param.loginUser` 사용 가능 여부를 함께 확인한다.
- 네이밍과 주석 세부 규칙은 `backend/CONVENTION.md`를 따른다.

## 주의할 점
- 구조를 읽지 않고 임의 REST endpoint를 대량 추가하지 않는다.
- 기존 response 체계를 무시하고 임의 JSON 객체를 직접 반환하지 않는다.
- 공통 패턴이 이미 있으면 `scripts/templates/backend-domain/`, `scripts/templates/backend-operation/`, 기존 도메인 구현을 우선 따른다.
- 일반적인 Node.js 유틸 습관으로 `module/` 파일에 여러 함수를 객체로 묶지 않는다.
- 일반적인 JS 습관대로 한 줄 가드를 블록 `if`로 쓰지 않는다.

## 검증
- operation 추가/수정 후 `/API-doc` 문서 반영 여부 확인
- 루트 집계 파일 갱신 누락 여부 확인
