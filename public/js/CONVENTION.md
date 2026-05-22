# Public JS Convention

## 목적
`public/js/`는 브라우저에서 실행되는 페이지 동작과 공통 프론트 helper를 두는 영역이다. 이 문서는 AI agent가 페이지 JS를 만들거나 수정할 때 따르는 기본 규칙이다.

HTML 구조는 `views/AGENTS.md`, `views/CONVENTION.md`, `views/docs/PAGE-PATTERNS.md`를 따른다. 스타일과 상태 class의 시각 규칙은 `public/scss/AGENTS.md`, `public/scss/CONVENTION.md`를 따른다.

## 파일 배치
- 페이지 HTML `views/<path>.html`의 페이지 전용 스크립트는 `public/js/<path>.js`에 둔다.
- 공통 layout partial의 스크립트는 `public/js/temp/<name>.js`에 둔다.
- 공통 API, cookie, alert, format helper는 `public/js/core.js`를 우선 재사용한다.
- 환경 설정은 `public/js/env.js`가 실제 실행 파일이고, 저장소에는 `public/js/env.template.js`를 기준으로 둔다.

새 일반 페이지는 직접 파일을 만들지 말고 생성 명령을 먼저 사용한다.

```bash
npm run create:frontend-page -- <path> [--title "페이지 제목"]
```

Windows PowerShell 실행 정책 문제로 `npm` 실행이 막히면 아래처럼 실행한다.

```bash
npm.cmd run create:frontend-page -- <path> [--title "페이지 제목"]
```

## 로딩 전제
`views/temp/head.html`은 `/js/env.js`와 `/js/core.js`를 먼저 로드한다. 페이지 JS는 보통 HTML 하단에서 로드되므로 `API`, `cookie`, `alert`, `dimmedCover`, format helper를 바로 사용할 수 있다.

번들러, ESM import/export, 프론트 프레임워크, TypeScript 빌드 단계를 전제로 새 구조를 만들지 않는다. 외부 라이브러리가 꼭 필요하면 HTML에서 명시적으로 script를 연결하고, 페이지 JS는 그 전역 객체가 존재한다는 전제를 분명하게 둔다.

## 페이지 객체 패턴
페이지 JS는 기본적으로 하나의 전역 객체를 둔다. 객체 이름은 페이지 이름이나 화면 책임을 드러내는 lowerCamelCase를 사용한다.

```js
const accountSetting = {
    htmlEle: {
        displayNameInput: document.querySelector('#displayName'),
        saveDisplayNameButton: document.querySelector('#saveDisplayNameButton'),
    },

    init: function(){
        accountSetting.htmlEle.saveDisplayNameButton.addEventListener('click', accountSetting.requestModifyDisplayName);
        accountSetting.getAccountInfo();
    },

    getAccountInfo: async function(){
        const res = await API.request('GetAccountInfo');
        ...
    },

    requestModifyDisplayName: async function(){
        ...
    },
}

accountSetting.init();
```

규칙:

- `htmlEle`에는 초기 HTML에 고정으로 존재하는 DOM 참조를 모은다.
- `init()`에는 이벤트 바인딩과 최초 조회 호출을 둔다.
- 서버 요청 함수는 `requestCreate...`, `requestModify...`, `requestDelete...`, `get...`처럼 동작과 대상을 이름에 드러낸다.
- 화면 조립은 `render...`, `compose...HTML`, `changeScreen`, `open...Modal`, `close...Modal`처럼 책임을 분리한다.
- 한 번만 쓰이고 흐름을 더 복잡하게 만드는 helper는 만들지 않는다.

## DOM 참조와 selector
- JS에서 직접 참조해야 하는 요소만 HTML에 id를 둔다.
- 반복 row나 item은 class와 `data-*`를 우선 사용한다.
- selector는 HTML 구조와 페이지 scope가 드러나게 작성한다.
- 동적으로 생성되는 요소는 렌더링 후 다시 선택하거나, 안정적인 부모에 이벤트 위임을 사용한다.
- 공통 partial JS처럼 여러 페이지에 로드되는 파일은 대상 요소가 없을 수 있음을 고려한다. 페이지 전용 JS는 필요한 요소가 HTML에 있다고 보고, selector와 HTML 구조가 어긋나지 않게 수정한다.

`htmlEle` 이름은 역할을 드러내는 suffix를 붙인다.

```js
emailInput
saveButton
deleteModal
itemList
emptyView
failedReason
```

## 이벤트 바인딩
- 새 HTML에 `onclick`, `onchange`, `href="javascript:..."`를 만들지 않는다.
- 버튼 동작은 `button type="button"`에 JS에서 `addEventListener`로 연결한다.
- 페이지 이동은 `a href="..."`를 사용한다.
- 동적 목록은 row를 렌더링한 뒤 이벤트를 다시 적용하거나, 부모 요소에 이벤트를 위임한다.
- 입력값을 제한하는 `input` 이벤트는 한글 IME 조합을 고려해 `e.isComposing`과 `compositionend`를 함께 확인한다.

## API 요청
일반 앱 API 호출은 `API.request(operation, param)`을 사용한다.

```js
const res = await API.request('ModifyDisplayName', {
    displayName: accountSetting.htmlEle.displayNameInput.value,
});
```

규칙:

- 프론트에서 REST endpoint를 임의로 새로 만들지 않는다.
- operation 이름은 백엔드 `_operations.sys.js` registry의 key와 맞춘다.
- 인증 토큰 header, 401 retry, refresh token rotate는 `core.js`가 처리하므로 페이지 JS에서 다시 구현하지 않는다.
- `res.response == 200`이면 성공으로 처리한다.
- `res.response == 401`이면 로그인 페이지로 이동한다.
- `res.response != 200`이면 기본적으로 `alert(res.message, false)`로 사용자에게 알린다.
- 입력값 실패는 `res.label == 'InputValueNotValid'`와 `res.target`을 기준으로 해당 input에 `.invalid`를 붙인다.

인증 페이지 이동은 현재 경로를 hash로 넘겨 복귀 경로를 보존한다.

```js
if(res.response == 401){
    return location.href = `/account/signIn#${location.pathname}`;
}
```

query string까지 보존해야 하는 상세 페이지는 명시적으로 포함한다.

```js
if(res.response == 401){
    return location.href = `/account/signIn#${location.pathname}${location.search}`;
}
```

## 요청 중 상태
서버 요청을 보내는 버튼은 중복 클릭을 막는다.

```js
if(page.htmlEle.saveButton.classList.contains('loading')) return;

page.htmlEle.saveButton.classList.add('loading');
page.htmlEle.saveButton.disabled = true;

const res = await API.request('SaveSomething', {});

page.htmlEle.saveButton.classList.remove('loading');
page.htmlEle.saveButton.disabled = false;
```

모든 실패/성공 return 경로에서 `.loading`과 `disabled`를 복구한다. 분기가 많으면 작은 `reset...LoadingStatus()` helper를 둔다.

## UI 상태 class
이 프로젝트의 프론트 상태는 class 토글을 기본으로 표현한다.

- `.display`: 숨겨진 요소 표시
- `.active`: 단계 전환 화면의 현재 상태
- `.loading`: 버튼이나 요청 진행 상태
- `.invalid`: input/select/textarea 검증 실패
- `.disabled`: 사용자 조작 불가 상태
- `.loadFinish`: 목록 더보기 종료 상태

JS에서 새 상태 class를 만들면 해당 페이지 SCSS selector와 의미가 일치해야 한다.

## 렌더링과 동적 HTML
단순 텍스트 변경은 `textContent` 또는 `innerText`를 우선한다.

```js
profile.htmlEle.name.textContent = res.data.name;
```

여러 row나 복합 markup을 조립할 때만 `innerHTML`을 사용한다. 사용자 입력, 서버 응답, URL, 파일명, 제목처럼 외부에서 온 값은 `escapeHtml()` 후 넣는다.

```js
composeUserRowHTML: function(user){
    const name = (user.name || '').toString().escapeHtml();

    return `
        <div class="row" data-user-id="${user.id}">
            <div class="name">${name}</div>
        </div>
    `;
}
```

규칙:

- `innerHTML`에 외부 값을 직접 넣지 않는다.
- URL을 `href`나 `src`에 넣을 때도 신뢰 가능한 값인지 확인한다.
- row 식별자는 `data-pk`, `data-id`, `data-target` 같은 `data-*`에 둔다.
- 동적 row 내부에는 중복 id보다 class를 우선한다.

## 폼과 입력 검증
- 요청 전 기존 `.invalid` 상태를 초기화한다.
- 프론트 검증은 즉시 막을 수 있는 단순 검증에 한정한다.
- 최종 검증 기준은 백엔드 operation response다.
- 백엔드가 `InputValueNotValid`와 `target`을 반환하면 해당 input/select/textarea에 `.invalid`를 붙인다.
- 비밀번호 확인처럼 프론트에서만 비교 가능한 값은 요청 전에 처리한다.

## 상태 전환 화면
이메일 인증, 비밀번호 재설정, 결제 결과처럼 한 페이지에서 여러 화면이 바뀌는 경우 모든 상태 wrapper를 HTML에 두고 `.active`만 전환한다.

```js
changeScreen: function(target){
    resetPassword.htmlEle.request.classList.remove('active');
    resetPassword.htmlEle.sent.classList.remove('active');
    resetPassword.htmlEle.failed.classList.remove('active');

    resetPassword.htmlEle[target].classList.add('active');
}
```

실패 사유처럼 동적으로 바뀌는 텍스트는 별도 요소에 `textContent`로 넣는다.

## 목록, 검색, 더보기
목록 페이지는 아래 상태를 명시적으로 관리한다.

- `currentPage`
- 검색어나 필터 값
- `loadFinish`

검색을 새로 시작하면 page와 종료 상태를 초기화하고 목록 영역을 비운 뒤 다시 조회한다. 더보기 결과가 없으면 `loadFinish = true`로 두고 버튼에 `.loadFinish`를 붙인다.

동적 row 이벤트는 렌더링 후 적용하거나 부모에서 위임한다. 같은 목록을 여러 번 append하는 구조라면 기존 row 이벤트가 중복 바인딩되지 않는지 확인한다.

## 모달
모달은 `#modals` 안의 `.modal` 요소를 사용한다.

- 열기: `dimmedCover.display()` 후 modal에 `.display` 추가
- 닫기: modal state/input을 초기화하고 `.display` 제거 후 `dimmedCover.hide()`
- 삭제 대상, 수정 대상 같은 식별자는 modal의 `data-target` 또는 페이지 객체 state에 둔다.
- 모달 내부 확인 버튼도 요청 중 `.loading`과 `disabled`를 적용한다.

## 파일 업로드
파일 업로드는 반드시 `API.uploadFile(file)`을 사용한다. 페이지 JS에서 업로드 URL 발급, presigned URL PUT, `/API/fileUpload` 직접 호출 로직을 새로 작성하지 않는다.

```js
const uploadResult = await API.uploadFile(fileInput.files[0]);
if(!uploadResult.success){
    return alert(uploadResult.label, false);
}

const res = await API.request('CreateAttachment', {
    uploadKey: uploadResult.uploadKey,
});
```

규칙:

- 브라우저에서 직접 업로드 endpoint, presigned URL 발급, presigned URL PUT 로직을 구현하지 않는다.
- `uploadKey`는 최종 operation param으로 전달한다.
- 업로드 파일 검증과 소비, revoke는 백엔드 operation 규칙을 따른다.
- 파일이 없는 경우와 `uploadResult.success == false`인 경우를 분리해서 처리한다.

## 외부 스크립트 callback
captcha, player SDK처럼 외부 스크립트가 전역 callback 이름을 요구하는 경우에만 명시적으로 전역에 연결한다.

```js
onCaptchaSuccess = signUp.turnstile.onCaptchaSuccess;
onCaptchaError = signUp.turnstile.onCaptchaError;
onCaptchaExpired = signUp.turnstile.onCaptchaExpired;
```

이 경우 callback이 어느 페이지 객체의 책임인지 이름과 위치로 드러나야 한다.

## `core.js` 수정 기준
`core.js`는 모든 페이지에 영향을 준다. 아래 경우가 아니면 페이지 JS에서 처리한다.

- 여러 페이지에서 실제로 반복되는 공통 API/helper
- 인증 token, cookie, alert, dimmed cover 같은 전역 계약
- 프로젝트 전체의 숫자/날짜/string format helper

새 prototype 확장은 신중하게 판단한다. 한 페이지에서만 필요한 format은 페이지 함수로 둔다.

## 보안과 민감 정보
- 실제 비밀번호, API key, access token, refresh token 값을 코드나 문서에 넣지 않는다.
- `public/js/env.js`는 placeholder 성격을 유지하고 실제 값은 커밋하지 않는다.
- 민감값을 localStorage/sessionStorage에 새로 저장하지 않는다.
- API key처럼 한 번만 보여줘야 하는 값은 화면에 표시한 뒤 사용자가 닫으면 DOM 값도 초기화한다.

## 주석
프론트 JS는 주석을 0으로 만드는 스타일이 아니다. 다만 단순 폼 제출이나 한두 개 이벤트만 있는 파일에는 주석을 억지로 붙이지 않는다. 목록, 모달, 상태 전환, 외부 SDK callback, player control처럼 코드가 여러 책임을 오가는 지점에만 짧은 한국어 단계 주석을 남겨 로직 구획이 보이게 한다.

권장하는 주석:

- `init()` 안에서 서로 다른 이벤트 묶음이 여러 개일 때: `// 검색 및 더보기 이벤트`, `// 삭제 모달 이벤트`
- 한 객체 안에 기능 영역이 나뉠 때: `// 이메일 관련`, `// 비밀번호 관련`, `// 생성 모달`
- 동적 HTML을 조립하기 전에 데이터 변환 의도가 있을 때: `// 서버 값을 row HTML에 넣기 전에 escape 처리`
- 브라우저 이벤트가 복잡할 때: `// IME 조합 중에는 입력값 보정을 미룬다`
- 외부 SDK나 전역 callback 제약이 있을 때: `// Turnstile 콜백 함수`
- tooltip, drag, keyboard shortcut, player control처럼 상호작용 흐름이 긴 경우

피해야 할 주석:

- 단순 폼의 `// 저장 이벤트`처럼 없어도 흐름이 바로 보이는 주석
- `// 버튼 클릭 이벤트 추가`처럼 `addEventListener` 한 줄을 그대로 번역한 주석
- `// display 클래스 추가`, `// API 요청`, `// alert 표시`처럼 코드만 읽어도 같은 의미인 주석
- 실제 코드와 쉽게 어긋날 상세 구현 설명
- 오래된 코드, 변경 이력, 작성자, 날짜, 주석 처리된 구 구현

주석은 설명할 코드 바로 위에 둔다. 큰 기능 구획은 `// 이메일 관련`처럼 한 줄로 나누고, 세부 구현은 이름과 함수 분리로 읽히게 한다.

## 검증
- 수정한 JS 파일은 `node --check <file>`로 구문 확인한다.
- HTML selector를 바꿨다면 관련 `views/<path>.html`과 `public/scss/<path>.scss`도 함께 확인한다.
- SCSS 상태 class가 바뀌었다면 `npm run build` 또는 `npm run build:css`를 실행한다.
