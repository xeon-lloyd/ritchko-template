# Views Convention

## 목적
`views/`는 HTML 페이지 파일을 두는 영역이다. 이 문서는 AI agent가 HTML 파일을 만들거나 수정할 때 항상 읽는 최소 규칙이다.

세부 문서는 필요한 경우에만 읽는다.

- HTML 컴포넌트 사용 예시: `views/docs/COMPONENTS.md`
- HTML 페이지 유형별 골격: `views/docs/PAGE-PATTERNS.md`
- HTML 점검표: `views/CHECKLIST.md`

JS 구현 규칙은 `public/js/AGENTS.md`, 스타일 구현 규칙은 `public/scss/AGENTS.md`를 따른다.

## 페이지 생성
새 일반 페이지는 직접 파일을 만들지 말고 생성 명령을 사용한다.

```bash
npm run create:frontend-page -- <path> [--title "페이지 제목"]
```

Windows PowerShell 실행 정책 문제로 `npm` 실행이 막히면 아래처럼 실행한다.

```bash
npm.cmd run create:frontend-page -- <path> [--title "페이지 제목"]
```

예:

```bash
npm run create:frontend-page -- account/signIn --title "로그인"
npm run create:frontend-page -- product/list --title "상품 목록"
npm run create:frontend-page -- dashboard
```

## path 규칙
`<path>`는 확장자를 제외한 `views/` 기준 경로다.

- `account/signIn` -> `/account/signIn`
- `product/list` -> `/product/list`
- `dashboard` -> `/dashboard`

각 path segment는 `lowerCamelCase`를 사용한다.

권장:

```text
account/signIn
account/resetPassword
payment/history
product/detail
```

금지:

```text
Account/signIn
account/sign-in
account/reset_password
account/../admin
```

## 생성되는 파일
`create:frontend-page`는 같은 path로 HTML, SCSS, JS 파일을 함께 만든다.

```text
views/account/signIn.html
public/scss/account/signIn.scss
public/js/account/signIn.js
```

이미 같은 경로의 파일이 있으면 생성 명령은 덮어쓰지 않고 실패한다. 기존 페이지를 수정하는 작업이면 생성 명령을 다시 실행하지 말고 기존 파일을 확인한 뒤 필요한 부분만 수정한다.

## 라우팅 전제
이 프로젝트는 단순 페이지 추가에 별도 라우트 파일을 만들지 않는다.

- `server.js`는 `views/<path>.html` 파일이 존재하면 `/<path>` 요청을 해당 HTML로 렌더링한다.
- 공통 head, header, sidebar, footer, elements는 `views/temp/` 조각을 재사용한다.
- HTML에는 생성 템플릿이 만든 page CSS와 page JS 연결을 유지한다.

백엔드 초기화 순서, Express middleware 내부, API 문서 생성 방식은 HTML 작성 규칙에 넣지 않는다.

## 기본 작업 순서
1. `npm run create:frontend-page`로 기본 파일을 생성한다.
2. 생성된 `views/<path>.html`에서 `main > .container` 내부를 구현한다.
3. `views/_designSystemSample.html`에서 사용할 디자인 시스템 컴포넌트를 확인한다.
4. `views/docs/COMPONENTS.md`에서 해당 컴포넌트의 HTML 작성 규칙을 확인한다.
5. 페이지 유형이 분명하면 `views/docs/PAGE-PATTERNS.md`의 HTML 골격을 따른다.
6. HTML 구조를 바꿨다면 관련 JS/SCSS 파일도 필요한지 확인한다.
7. HTML 점검은 `views/CHECKLIST.md`로 확인한다.

## 디자인 시스템 우선
새 UI를 만들기 전에 `views/_designSystemSample.html`에 있는 디자인 시스템 컴포넌트 조합으로 해결되는지 먼저 확인한다. `views/docs/COMPONENTS.md`는 agent가 빠르게 읽을 수 있도록 샘플의 HTML 작성 규칙을 압축해 둔 문서다.

우선 재사용할 컴포넌트:

- button class 조합
- input/select/textarea
- checkbox/radio/toggle
- modal HTML 구조
- alert 사용을 위한 기본 elements
- typography class

새 페이지에서 임의의 버튼 구조, input 구조, 모달 구조를 직접 만들지 않는다. 먼저 디자인 시스템 컴포넌트를 조합하고, 없는 형태만 페이지 전용 wrapper로 감싼다.

## `_designSystemSample.html` 취급
`views/_designSystemSample.html`은 템플릿에 포함되는 디자인 시스템 샘플 페이지다. 일반 페이지는 이 파일에 있는 컴포넌트를 조합해서 만든다.

- AI agent는 `views/_designSystemSample.html`로 실제 컴포넌트 형태를 확인하고, `views/docs/COMPONENTS.md`로 작성 규칙을 빠르게 확인한다.
- 버튼, input, control, modal 같은 기본 컴포넌트는 샘플 파일에 있는 구조와 class 조합을 우선한다.
- 샘플 안의 데모용 wrapper, inline layout style, 임시 텍스트, `onclick`은 일반 페이지에 그대로 복사하지 않는다.
- 컴포넌트 규칙을 추가하거나 바꿔야 하면 `views/_designSystemSample.html`과 `views/docs/COMPONENTS.md`를 함께 갱신한다.
- 운영 배포에서는 `_designSystemSample.html`처럼 `_`로 시작하는 샘플/내부 view가 외부에서 접근되지 않아야 한다.

## HTML 작성 원칙
- `create:frontend-page`가 만든 기본 구조는 유지한다.
- 페이지별 구현은 기본적으로 `main > .container` 내부에 작성한다.
- `id`는 JS에서 직접 참조하거나 페이지에서 유일해야 하는 요소에만 사용한다.
- 반복되는 구조 이름은 `class`를 사용한다.
- 단, 현재 디자인 시스템 컴포넌트가 id 기반 구조를 요구하면 그 컴포넌트 계약을 우선한다. 대표적으로 modal은 `#title`, `#mainTitle`, `#subtitle`, `#content`, `#action` 구조를 사용한다.
- 제목, 설명, 라벨, 값, 액션 영역은 같은 단어를 반복해서 쓴다.
- 화면 표시 상태는 `active`, `display`, `loading`, `invalid`, `disabled` 같은 class로 표현할 수 있게 HTML을 작성한다.
- 동작 요소는 `button type="button"`을 사용한다.
- 페이지 이동은 `a href="..."`를 사용한다.
- 새 HTML에 `href="javascript:..."`를 만들지 않는다.
- 이벤트는 HTML `onclick`이 아니라 page JS에서 연결할 수 있게 요소 id/class를 준비한다.
- 일반 시각 스타일은 `style=""`로 넣지 않는다. 단, 디자인 시스템 아이콘 컴포넌트가 CSS variable 전달을 요구하는 경우는 예외다.

## 생성 명령을 쓰지 않는 경우
아래 경우에는 `create:frontend-page`를 바로 쓰지 말고 기존 구조를 먼저 확인한다.

- 이미 같은 URL의 페이지가 있는 경우
- 기존 HTML만 수정하면 되는 경우
- 공통 partial인 `views/temp/*`를 수정하는 경우
- `_designSystemSample.html`처럼 샘플이나 문서 성격의 파일을 수정하는 경우
- 프로젝트 특수 목적의 독립 HTML을 다루는 경우

일반 서비스 페이지라면 기본값은 항상 `create:frontend-page`다.
