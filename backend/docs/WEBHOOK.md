# Backend Webhook Guide

## 목적
이 문서는 backend에서 webhook 또는 redirect callback endpoint를 작성할 때 따르는 구조 가이드다. 작업 직전 확인용 요약은 `backend/docs/WEBHOOK-CHECKLIST.md`를 본다.

## 기본 구조
- webhook은 `server.js`의 Express app을 `backend/_system_/initialize.sys.js`가 `backend/_system_/webhookInit.sys.js`로 넘겨 초기화한다.
- webhook registry는 `backend/_webhooks.sys.js`가 도메인별 `backend/<domain>/_webhooks.sys.js`를 모아 만든다.
- `webhookInit.sys.js`는 registry key를 기준으로 `/webhook{key}` 경로를 등록한다.
- 예를 들어 key가 `/user/appleSocialLogin`이면 실제 endpoint는 `/webhook/user/appleSocialLogin`이다.
- 생성 스크립트는 webhook 이름에 `Process` suffix를 받지 않고, 로직 파일명에만 자동으로 붙인다.
- 예를 들어 `appleSocialLogin`을 입력하면 registry key는 `/user/appleSocialLogin`, 로직 파일은 `appleSocialLoginProcess.js`가 된다.
- webhook 로직은 `/API` operation middleware를 거치지 않는다.
- webhook 로직은 `module.exports = async function(req, res){ ... }` 형태로 Express `req`, `res`를 직접 사용한다.
- `/API-doc/webhooks`는 `_webhooks.sys.js`, `_param.sys.js`, `_response.sys.js`를 기준으로 문서를 생성한다.

## 생성 명령
- 기본 생성: `npm run create:backend-webhook -- <domain> <webhookNameWithoutProcess>`
- 단일 경로 인자: `npm run create:backend-webhook -- <domain>/<webhookNameWithoutProcess>`
- 예: `npm run create:backend-webhook -- user appleSocialLogin`
- method 지정: `--method get|post|put|patch|delete`
- redirect callback이면 `--redirect`를 사용한다.
- 문서용 param/response placeholder를 만들지 않으려면 `--param-null`, `--response-null`을 사용한다.
- 설명 지정은 `--description "설명"`을 사용한다.

## 언제 webhook으로 만들지
- 외부 서비스가 서버로 직접 호출하는 callback endpoint
- OAuth, 소셜 로그인, 결제 인증처럼 외부 페이지에서 돌아오는 redirect callback
- 결제, 구독, 배송, 알림처럼 외부 서비스가 보내는 event callback

다음은 webhook으로 만들지 않는다.
- 앱 또는 웹 프론트가 일반 업무 처리를 위해 호출하는 기능
- 로그인 사용자 권한을 전제로 하는 내부 API
- `/API` 문서와 operation response contract가 필요한 기능

이 경우에는 `/API` operation으로 구현한다.

## Request 데이터
- GET 요청의 입력값은 `req.query`에서 읽는다.
- POST JSON 요청의 입력값은 `req.body`에서 읽는다.
- 현재 기본 초기화는 `express.json()`을 등록한 뒤 webhook을 초기화한다.
- form POST 등 다른 body parser가 필요한 webhook을 추가하면 `backend/_system_/initialize.sys.js`에서 parser 설정을 먼저 일관되게 맞춘다.
- webhook은 `/API` operation의 `{ operation, param }` 형식을 사용하지 않는다.

## Registry 작성
도메인별 `backend/<domain>/_webhooks.sys.js`는 `paramSchema`, `responseSchema`를 import하고 webhook 항목을 export한다.

```js
const paramSchema = require('./_param.sys.js')
const responseSchema = require('./_response.sys.js')

module.exports = {
    '/user/appleSocialLogin': {
        logic: '/user/appleSocialLoginProcess.js',
        method: 'post',

        //documentation
        description: '소셜 로그인 리다이렉트 처리',
        group: 'user',
        paramSchema: paramSchema['/user/appleSocialLogin'],
        responseSchema: [
            responseSchema.AppleSocialLoginProcessOK,
        ]
    },
}
```

작성 규칙:
- registry key는 `/domain/action` 형태를 우선하며, `Process` suffix를 붙이지 않는다.
- handler 파일명은 `<action>Process.js` 형태를 우선한다.
- registry key는 전체 webhook registry에서 유일해야 한다.
- `logic`은 `backend` 기준 절대 경로처럼 `/domain/file.js`로 쓴다.
- `method`는 실제 호출되는 HTTP method와 맞춘다.
- `description`, `group`, `paramSchema`, `responseSchema`를 빠뜨리지 않는다.
- 도메인 `_webhooks.sys.js`를 추가하거나 수정하면 root `backend/_webhooks.sys.js` 집계도 확인한다.
- webhook param은 도메인 `_param.sys.js`에 registry key와 같은 key로 추가한다.
- webhook 응답 문서용 response는 도메인 `_response.sys.js`에 class로 추가한다.

## Handler 로직
webhook 로직 파일의 기본 export는 `module.exports = async function(req, res){ ... }` 형태다.

```js
const response = require('./_response.sys.js')
const setting = require('../core/setting.js')
const util = require('../core/util.js')
const valider = require('../core/valider.js')
const enums = require('./enums.js')

module.exports = async function(req, res){
    try{
        // 입력값 검증
        if(!valider.isValidString(req.body.id_token)) return res.status(400).send(new response.InputValueNotValid('id_token'))

        // 핵심 비즈니스 처리
        return res.redirect('/')
    }catch(e){
        console.error(e)
        return res.status(500).send(new response.InternalServerError())
    }
}
```

작성 규칙:
- `param`을 받지 않는다. `req.query`, `req.body`, `req.headers`, `req.params`를 직접 사용한다.
- `/API` middleware가 response label, auth token, 예외 변환을 대신 처리하지 않는다.
- 예상 가능한 실패는 throw하지 말고 적절한 status와 response class를 `res.send(...)`로 반환한다.
- async 로직에서 외부 API, DB, 파일 처리를 호출하면 필요한 범위를 `try/catch`로 감싼다.
- response class를 쓰는 JSON 응답은 `res.status(code).send(new response.X())` 형태를 우선한다.
- redirect 응답은 `res.redirect(url)`을 사용하고, 문서화용 response class는 `RedirectTo`를 상속한 `...ProcessOK`로 둔다.
- webhook에서 서비스 핵심 데이터가 생기거나 바뀌면 DB에 저장한다. JSON, txt, 로컬 캐시 파일을 본 저장소로 만들지 않는다.

## 소셜 로그인 Callback
소셜 로그인 callback은 외부 로그인 흐름이 서버로 돌아오는 endpoint다.

기본 흐름:
1. 외부 로그인 흐름이 `/webhook/<domain>/<callback>`으로 redirect 또는 POST한다.
2. webhook이 `code`, `id_token` 등 callback 입력값을 `req.query` 또는 `req.body`에서 읽는다.
3. 필요한 처리를 한 뒤 앱 또는 웹의 다음 화면으로 `res.redirect(...)`하거나 JSON 응답을 반환한다.

작성 규칙:
- provider가 GET으로 redirect하면 `req.query`를 사용한다.
- provider가 POST로 callback을 보내면 `req.body`를 사용한다.
- provider가 form POST를 쓰면 `express.urlencoded({ extended: true })` 설정 필요 여부를 확인한다.
- 소셜 로그인 완료 후 일반 API처럼 token 발급 결과를 반환해야 하면 `/API` operation과 책임을 나눌지 먼저 정한다.

## Response와 문서화
- webhook response 이름에는 `Process`를 포함한다. 예: `AppleSocialLoginProcessOK`, `PaymentEventProcessOK`
- redirect webhook 문서화에는 `RedirectTo` 상속 class를 사용할 수 있다.
- JSON webhook 응답은 일반 response class를 사용해도 된다.
- 실패 response가 명확하면 도메인 `_response.sys.js`에 상태를 드러내는 이름으로 추가한다.
- webhook param schema는 도메인 `_param.sys.js`에 registry key와 같은 key로 둔다.

예:
```js
'/user/appleSocialLogin': {
    id_token: 'provider id token(string)',
}
```

```js
AppleSocialLoginProcessOK: class AppleSocialLoginProcessOK extends rootResponse.RedirectTo {
    path = '# (로그인 완료 후 이동할 앱/웹 경로)'
}
```

## 작업 후
- 도메인 `_webhooks.sys.js`와 root `backend/_webhooks.sys.js` 집계가 맞는지 확인한다.
- `_param.sys.js`, `_response.sys.js`, `/API-doc/webhooks`가 최신 로직과 맞는지 확인한다.
- 실제 요청의 method, content-type, payload key가 문서와 맞는지 확인한다.
- GET webhook은 `req.query`, POST webhook은 `req.body`로 테스트한다.
- 수정한 파일은 `node --check <파일>`로 구문을 확인한다.
