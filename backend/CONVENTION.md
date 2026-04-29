# Backend Convention

## 목적
`backend/`에서만 추가로 지키는 컨벤션이다. 일반 네이밍, 주석, 함수, 포매팅 원칙은 `convention/` 문서를 따른다.

## 파일과 이름
- 도메인 폴더명: `lowerCamelCase`
- operation key: `PascalCase`
- operation 로직 파일: `lowerCamelCase`
- `module/`, `worker/` 파일: `lowerCamelCase`
- response class: `PascalCase`
- enum/export 상수: 신규 코드는 `PascalCase`

예:
- operation: `CreateApiKey`, `GetStreamDetailInfo`, `VerifyPasswordResetToken`
- logic file: `createApiKey.js`, `getStreamDetailInfo.js`
- response: `CreateApiKeyOK`, `ApiKeyNotFound`
- module: `getAccountByUid.js`, `softDeleteStream.js`

## Operation
- operation key와 `paramSchema` key는 같은 이름을 쓴다.
- 생성은 `Create`, 조회는 `Get`, 수정은 `Modify` 또는 `Update`, 삭제는 `Delete`, 검증은 `Verify`, 전송은 `Send`를 우선한다.
- 목록 조회는 `Get...List`, 단건 상세는 `Get...Info` 또는 더 구체적인 이름을 쓴다.
- operation 추가 시 로직 파일만 만들지 말고 `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`를 함께 맞춘다.
- operation 설명, group, paramSchema, responseSchema를 빠뜨리지 않는다.

## Socket
- socket key와 `paramSchema` key는 같은 이름을 쓴다.
- client > server 요청은 `Message`, server > client 이벤트는 `Event` suffix를 우선한다.
- message 로직 파일은 `lowerCamelCase`로 작성한다.
- message 로직 기본 export는 `module.exports = async function(socket, data){ ... }` 형태다.
- message 로직에서 `data`는 구조분해하지 않고 `data.xxx`로 사용한다.
- message 추가 시 로직 파일만 만들지 말고 `_sockets.sys.js`, `_param.sys.js`, `_response.sys.js`를 함께 맞춘다.
- event는 직접 emit하는 계약이므로 `_sockets.sys.js`에 `type: 'event'`로 문서화한다.
- 예상 가능한 실패는 `socket.emit('_error', new response.X())` 후 return한다.
- room 이름은 `<domain>:<id>` 형태를 우선한다.
- room join 전에는 대상 존재 여부와 권한 여부를 먼저 확인한다.
- 소켓 세부 규칙은 `backend/docs/SOCKET.md`를 따른다.

## Webhook
- webhook registry key와 `paramSchema` key는 같은 이름을 쓴다.
- webhook registry key는 `/domain/action` 형태를 우선한다. 예: `/user/socialLoginProcess`, `/payment/paymentEventProcess`
- webhook 로직 파일은 `lowerCamelCase`로 작성한다.
- 외부 redirect 또는 event 처리 로직 파일은 `Process` 의미가 드러나는 이름을 우선한다.
- webhook 로직 기본 export는 `module.exports = async function(req, res){ ... }` 형태다.
- webhook 로직은 `/API` operation middleware를 거치지 않으므로 `req.query`, `req.body`, `req.headers`를 직접 사용한다.
- webhook 추가 시 로직 파일만 만들지 말고 `_webhooks.sys.js`, `_param.sys.js`, `_response.sys.js`를 함께 맞춘다.
- 현재 기본 `webhookInit.sys.js`는 registry의 `authRequire`를 처리하지 않는다.
- 웹훅 세부 규칙은 `backend/docs/WEBHOOK.md`를 따른다.

## Worker
- root cron registry는 `backend/worker/registCron.js`를 사용한다.
- 도메인 cron registry는 `backend/<domain>/worker/registCron.js`를 사용한다.
- `registCron.js` 파일명은 기존 템플릿 이름을 유지한다.
- worker 로직 파일은 `lowerCamelCase`로 작성한다.
- worker 로직 기본 export는 `module.exports = async function workerName(){ ... }` 형태를 우선한다.
- cron 등록 파일에는 schedule 등록과 에러 처리만 두고 긴 비즈니스 로직은 별도 worker 파일 또는 `module/` 함수로 분리한다.
- cron expression은 실행 주기를 설명하는 주석과 함께 둔다.
- 단일 실행이 필요한 worker는 프로세스 가드, 분산 lock, DB unique key 등으로 중복 실행을 방지한다.
- worker는 `/API` operation middleware를 거치지 않고 `/API-doc` 문서화 대상도 아니다.
- queue worker는 producer와 consumer를 분리하고 payload에는 필요한 최소 식별자만 담는다.
- worker 세부 규칙은 `backend/docs/WORKER.md`를 따른다.

## Response
- 성공 응답은 `...OK` suffix를 쓴다.
- 실패 응답은 상태를 바로 드러내는 이름을 쓴다. 예: `UserNotFound`, `EmailAlreadyInUse`
- 입력값 검증 실패는 `InputValueNotValid`로 통일한다.
- 신규 backend 코드에서 `FormInputRequired`를 만들거나 사용하지 않는다.
- webhook 응답은 이름에 `Process`, socket 응답은 `Event` 또는 `Message`를 포함한다.

## Param Schema
- 기본 형식은 `설명(type)`이다.
- optional은 타입 뒤에 `?`를 붙인다. 예: `이름(string?)`
- enum은 `설명(enum:a|b|c)`, optional enum은 `설명(enum:a|b|c?)`로 쓴다.
- `string, optional` 같은 문구는 쓰지 않는다.

## Enum
- 도메인 `enums.js`는 root enum을 먼저 spread한다.
- enum 값은 배열로 선언한다.
- enum 검증은 배열에 직접 `includes()`를 호출한다.
- 객체형 enum과 `Object.values(enums.X)` 전제 코드는 신규 작성하지 않는다.

예:
```js
const CardType = [
    'main',
    'backup',
]

module.exports = {
    ...require('../enums.js'),
    CardType,
}
```

## Operation 로직
- 기본 export는 `module.exports = async function(param, req, res){ ... }` 형태다.
- `param`은 구조분해하지 않고 `param.xxx`로 사용한다.
- 처리 순서는 입력값 검증, 대상 존재 여부 확인, 권한 확인, 핵심 처리, 응답 반환을 기본으로 한다.
- 실패는 가능한 한 빠르게 response class로 반환한다.
- 한 줄 반환 가드 절은 인라인으로 작성한다.

예:
```js
if(!valider.isValidString(param.streamId)) return new response.InputValueNotValid('streamId');
if(!enums.CardType.includes(param.cardType)) return new response.InputValueNotValid('cardType');
```

## Import
- operation 로직과 `module/` 파일은 스캐폴드의 기본 import 블록을 유지한다.
- 기본 순서는 `response`, `setting`, `util`, `valider`, `enums`다.
- 추가 import는 기본 import 블록 아래에 한 줄 띄워 배치한다.

## Module
- `module/`은 1파일 1export 함수만 허용한다.
- 파일명과 export 함수명은 같은 `lowerCamelCase`로 맞춘다.
- 여러 재사용 함수가 필요하면 파일을 나누고 operation에서 조합한다.
- operation 한 곳에서만 쓰는 짧은 조회/검증은 operation 파일 안에 둔다.

## DB
- DB 세부 규칙은 `backend/docs/DB.md`를 따른다.
- update/delete 전에는 대상 존재 여부와 권한 여부를 먼저 확인한다.
- `createdAt`, `updatedAt`은 DB 기본값으로 처리한다.
- insert/update에 업무 날짜값을 저장해야 하면 `new Date()`를 그대로 사용한다.
- `toSQLDatetime()`은 날짜/시간 범위 검색 조건의 `params`에만 사용한다.

## 주석
- 일반 주석 정책은 `convention/comment.md`를 따른다.
- backend operation은 흐름 파악을 위해 짧은 단계 주석을 둘 수 있다.
- 자주 쓰는 단계 주석: `// 입력값 검증`, `// 대상 존재 여부 확인`, `// 권한 확인`, `// 핵심 비즈니스 처리`
- 코드 한 줄을 그대로 번역한 주석은 쓰지 않는다.
