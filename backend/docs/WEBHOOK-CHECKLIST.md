# Backend Webhook Checklist

## 작업 전
- 외부 서비스 callback인지, 내부 앱 API인지 먼저 구분한다.
- 내부 앱 API면 webhook이 아니라 `/API` operation으로 구현한다.
- 새 webhook은 `npm run create:backend-webhook -- <domain> <webhookNameWithoutProcess>`로 생성하는 것을 우선한다.
- 입력 webhook 이름에는 `Process` suffix를 붙이지 않는다. 예: `appleSocialLogin`
- 실제 endpoint가 `/webhook{registryKey}`가 되는지 확인한다.
- 호출 method가 GET인지 POST인지 확인한다.
- 입력값을 `req.query`에서 읽을지 `req.body`에서 읽을지 확인한다.
- JSON 외의 body parser가 필요한지 확인한다.
- webhook param을 도메인 `_param.sys.js`에 추가할지 확인한다.
- redirect 또는 JSON response를 도메인 `_response.sys.js`에 추가할지 확인한다.

## 구현 중
- 도메인 `_webhooks.sys.js`에 `logic`, `method`, `description`, `group`, `paramSchema`, `responseSchema`를 모두 작성한다.
- registry key와 paramSchema key는 `/domain/action`이고, handler 파일은 `/domain/actionProcess.js`인지 확인한다.
- root `backend/_webhooks.sys.js` 집계를 확인한다.
- handler 기본 export를 `module.exports = async function(req, res){ ... }`로 작성한다.
- `/API` operation의 `param` 형식을 만들지 않고 `req.query`, `req.body`, `req.headers`를 직접 사용한다.
- 입력값 검증을 가장 먼저 둔다.
- 예상 가능한 실패는 적절한 status와 response class로 반환한다.
- redirect 응답은 `res.redirect(...)`로 처리한다.
- async 외부 API, DB, 파일 처리에는 필요한 범위의 `try/catch`를 둔다.
- 서비스 핵심 데이터는 DB에 저장하고 JSON, txt, 로컬 캐시 파일을 본 저장소로 쓰지 않는다.

## 구현 후
- `/API-doc/webhooks`에 endpoint, method, description, param, response가 반영됐는지 확인한다.
- endpoint가 `/webhook/<domain>/<action>`이고 파일명이 `<action>Process.js`인지 확인한다.
- 실제 요청의 method, content-type, payload key와 문서가 맞는지 확인한다.
- GET webhook은 `req.query`, POST webhook은 `req.body`로 테스트한다.
- root `backend/_webhooks.sys.js` 집계가 갱신됐는지 확인한다.
- `_param.sys.js`와 `_response.sys.js`가 registry와 같은 key/name을 쓰는지 확인한다.
- 수정한 파일은 `node --check <파일>`로 구문을 확인한다.
