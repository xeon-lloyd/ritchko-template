# 백엔드 가이드

[README](../readme.md) · [시작하기](./run-main.md) · [프론트엔드](./front-main.md) · **백엔드** · [배포](./deploy-main.md)

백엔드는 JavaScript와 Express 기반입니다. 일반 API는 `POST /API`로 받고, 요청의 `operation` 값으로 레지스트리에 등록된 로직을 실행합니다.

## 요청과 응답 흐름

```text
클라이언트 → POST /API → operation 조회·인증 → 로직 실행 → response class → JSON 응답
```

요청 body는 다음 형태입니다. `GetGreeting`은 아래에서 직접 추가할 예시입니다.

```json
{
    "operation": "GetGreeting",
    "param": {}
}
```

`Content-Type`은 `application/json`입니다. 인증이 필요한 operation에는 `auth` 헤더로 access token을 전달합니다.

| 파일 | 역할 |
| --- | --- |
| `backend/_operations.sys.js` | 도메인별 operation 레지스트리 집계 |
| `backend/<domain>/_operations.sys.js` | 로직 경로, 인증 여부, 설명과 문서 schema |
| `backend/<domain>/_param.sys.js` | 문서용 입력 schema |
| `backend/<domain>/_response.sys.js` | 응답 class와 문서용 응답 정의 |
| `backend/<domain>/<logic>.js` | 입력 검증과 실제 처리 |
| `backend/core/` | 설정, 검증, DB·Redis 등 공통 유틸 |

미들웨어는 operation 조회와 인증 후 로직을 호출합니다. 인증 결과는 `param.loginUser`로 전달하며 클라이언트가 보낸 같은 이름의 값은 제거합니다. 입력 schema는 문서용이므로 실제 입력 검증은 로직에 작성해야 합니다.

<a id="create-operation"></a>

## 첫 operation 만들기

DB 없이 인사 메시지를 반환하는 예시입니다. 프로젝트 루트에서 실행합니다.

```bash
npm run create:backend-domain -- demo
npm run create:backend-operation -- demo GetGreeting --param-null --description "인사 메시지 반환"
```

생성된 `backend/demo/getGreeting.js`를 다음 내용으로 교체합니다.

```js
const response = require('./_response.sys.js');

module.exports = async function(param, req, res){
    return new response.OK({ message: 'Hello, Ritchko!' });
}
```

`backend/demo/_operations.sys.js`의 `GetGreeting.responseSchema`에도 반환하는 class를 추가합니다.

```js
responseSchema: [
    responseSchema.OK,
]
```

`responseSchema.OK`는 공통 성공 응답 형식을 보여줍니다. 구체적인 `data` 구조까지 문서화하려면 도메인 응답 class를 정의하고 등록하세요. 생성기의 빈 로직은 완성된 API가 아니므로 반환값을 반드시 구현해야 합니다.

개발 서버의 `/API-doc`에서 `GetGreeting` 항목을 확인하고 요청 도구를 사용할 수 있습니다. 프론트 호출 방식은 다음과 같습니다.

```js
const result = await API.request('GetGreeting', {});
```

예상 JSON 응답입니다.

```json
{
    "response": 200,
    "message": "success",
    "target": null,
    "data": { "message": "Hello, Ritchko!" },
    "label": "OK"
}
```

응답은 `response`, `message`, `target`, `data`와 미들웨어가 추가하는 `label`을 포함합니다. 일반 operation은 응답 본문의 `response`로 결과를 표현하므로 HTTP 상태만으로 성공 여부를 판단하지 않습니다.

## 인증과 이름 규칙

- operation key는 `PascalCase`, 로직 파일은 `lowerCamelCase`를 사용합니다.
- 생성 시 `--auth`는 인증 필수, `--auth-optional`은 선택적 인증입니다. 두 옵션은 함께 쓰지 않습니다.
- 선택적 인증은 토큰이 없으면 익명으로 처리하고, 전달한 토큰이 잘못됐으면 `Unauthorized`를 반환합니다.
- 로직은 `module.exports = async function(param, req, res){ ... }` 형태로 작성하고 response class를 반환합니다.
- 입력값 검증 실패는 `new response.InputValueNotValid('필드명')`으로 반환합니다.

<a id="api-docs"></a>

## API 문서

`isProduction: false`인 개발 환경에서 제공합니다. 레지스트리와 schema를 읽어 구성하므로 로직 변경 시 문서 정의도 함께 맞춥니다.

| 경로 | 내용 |
| --- | --- |
| `/API-doc` | operation 목록, 입력·응답 명세와 요청 도구 |
| `/API-doc/webhooks` | webhook 명세 |
| `/API-doc/sockets` | socket 명세 |
| `/API-doc/fileUpload` | 파일 업로드 사용법 |

요청 도구는 실제 서버로 요청합니다. 실행할 operation과 입력값을 확인한 뒤 사용하세요.

<a id="extensions"></a>

## 다른 기능 추가하기

일반 operation 외 기능도 생성 스크립트로 시작합니다. 아래 명령은 각각의 예시입니다.

```bash
npm run create:backend-webhook -- demo receiveNotice
npm run create:backend-socket -- demo GetNoticeMessage
npm run create:backend-worker -- demo refreshSummary --cron "0 * * * *" --comment "1시간마다 실행"
```

PowerShell 실행 정책 문제가 있으면 `npm` 대신 `npm.cmd`를 사용합니다.

| 기능 | 처리 방식 | 상세 가이드 |
| --- | --- | --- |
| webhook | `/webhook{registryKey}`에서 Express `req`, `res` 직접 처리 | [WEBHOOK](../backend/docs/WEBHOOK.md) |
| socket | Socket.IO `/socket` path. 요청은 `Message`, 서버 이벤트는 `Event` suffix | [SOCKET](../backend/docs/SOCKET.md) |
| worker·cron | `backend/worker/registCron.js`에서 도메인별 등록 집계. operation 문서 대상에 포함하지 않음 | [WORKER](../backend/docs/WORKER.md) |
| DB | MySQL alias와 `util.mysql` 기반 처리 | [DB](../backend/docs/DB.md) |
| 파일 업로드 | 업로드 초기화와 S3 업로드 처리 | [FILE](../backend/docs/FILE.md) |
| 공통 유틸 | SMTP·Discord·Redis 등 | [OPERATIONS](../backend/docs/OPERATIONS.md) |
| 이메일 템플릿 | 메일 HTML 작성과 사용 | [이메일 템플릿](../backend/emailTemplate/README.md) |

구현 전에는 [작업 규칙](../backend/AGENTS.md), [체크리스트](../backend/CHECKLIST.md), [컨벤션](../backend/CONVENTION.md)을 함께 확인하세요. worker의 세부 생성 옵션과 producer·consumer 규칙은 전용 가이드를 따릅니다.
