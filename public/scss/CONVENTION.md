# SCSS Convention

## 목적
`public/scss/`는 화면 스타일의 원본을 두는 영역이다. 이 문서는 AI agent가 SCSS를 만들거나 수정할 때 따라야 하는 기본 규칙이다.

HTML 구조 규칙은 `views/AGENTS.md`, `views/CONVENTION.md`, `views/docs/PAGE-PATTERNS.md`를 따른다.

## 파일 배치
- 페이지 HTML `views/<path>.html`의 페이지 전용 스타일은 `public/scss/<path>.scss`에 둔다.
- SCSS 빌드 결과는 `public/css/<path>.css`에 생성된다.
- `public/css/`는 빌드 결과물이므로 직접 수정하지 않는다.
- 공통 layout 조각 스타일은 `public/scss/temp/`에 둔다.
- 공통 디자인 시스템 스타일은 `public/scss/designSystem/`에 둔다.
- `public/scss/core.scss`는 기존 호환용 파일로 보고, 새 스타일의 기본 추가 위치로 사용하지 않는다.

## 파일 생성 금지
페이지나 기능 묶음을 이유로 `_auth.scss`, `_form.scss`, `_list.scss` 같은 임의 Sass partial 파일을 새로 만들지 않는다.

금지:

```text
public/scss/_auth.scss
public/scss/account/_form.scss
public/scss/shared/_table.scss
```

스타일은 아래 위치 중 하나에 둔다.

- 페이지 전용 스타일: `public/scss/<path>.scss`
- 공통 partial HTML 전용 스타일: `public/scss/temp/<name>.scss`
- 디자인 시스템으로 승격된 공통 컴포넌트/토큰: `public/scss/designSystem/<name>.scss`

로그인, 회원가입, 비밀번호 재설정처럼 비슷한 화면이 여러 개 있어도 `_auth.scss` 같은 묶음 파일을 만들지 않는다. 먼저 각 페이지 SCSS에 작성하고, 실제로 디자인 시스템 컴포넌트로 승격할 만큼 반복될 때만 사용자 확인 후 `designSystem/`에 추가한다.

## 생성과 연결
새 일반 페이지는 `npm run create:frontend-page -- <path> [--title "페이지 제목"]`로 생성한다.

생성 명령은 같은 path의 HTML, SCSS, JS를 함께 만든다.

```text
views/account/signIn.html
public/scss/account/signIn.scss
public/js/account/signIn.js
```

HTML에는 생성된 CSS 경로를 연결한다.

```html
<link rel="stylesheet" href="/css/account/signIn.css">
```

## `@use` 규칙
SCSS 모듈은 `@use`를 사용한다. 새 페이지 SCSS에서 `@import`를 만들지 않는다.

루트 페이지:

```scss
@use "./designSystem/typo" as typo;
```

하위 폴더 페이지:

```scss
@use "../designSystem/typo" as typo;
```

2단계 이상 하위 폴더:

```scss
@use "../../designSystem/typo" as typo;
```

반응형 breakpoint가 필요하면 `responsive`와 `sass:map`을 함께 사용한다.

```scss
@use "../designSystem/responsive" as *;
@use "sass:map";

@media screen and (max-width: map.get($breakpoints, tablet)) {
    ...
}
```

## 디자인 시스템 강제 규칙
색상은 반드시 `designSystem/color.scss`에서 제공하는 CSS variable token을 사용한다.

권장:

```scss
color: var(--caption-neutral);
background-color: var(--bg-system);
border-color: var(--line-alternative);
```

금지:

```scss
color: #777;
background-color: rgba(0, 0, 0, 0.1);
border-color: blue;
```

페이지 SCSS, temp SCSS, 디자인 시스템 SCSS에서 hex/rgb/hsl/color keyword를 직접 쓰지 않는다. 새 색상이 정말 필요하면 구현 전에 사용자에게 확인하고, 승인된 경우 `designSystem/color.scss`에 token으로 추가한 뒤 `var(--...)`로 사용한다.

타이포는 반드시 `designSystem/typo.scss`의 mixin을 사용한다.

권장:

```scss
@use "../designSystem/typo" as typo;

.sectionTitle {
    @include typo.heading2;
}
```

금지:

```scss
.sectionTitle {
    font-size: 1.25rem;
    line-height: 1.75rem;
}
```

새 타입 스케일이 정말 필요하면 구현 전에 사용자에게 확인하고, 승인된 경우 `designSystem/typo.scss`에 mixin으로 추가한 뒤 페이지에서는 그 mixin만 사용한다.

button, input, checkbox, radio, toggle, modal은 `designSystem/` 기본 스타일을 먼저 사용한다. 페이지 SCSS에서는 배치, 간격, 폭, 페이지 특수 상태만 보강한다.

## 페이지 전용 scope
페이지 전용 스타일은 페이지의 최상위 wrapper나 명확한 영역 selector 아래로 제한한다.

권장:

```scss
.container > #apiKeyList > .list > .row {
    ...
}
```

금지:

```scss
.row {
    ...
}
```

`.title`, `.description`, `.row`, `.value`, `.action`, `.placeholder`처럼 여러 페이지에서 쓰일 수 있는 class는 반드시 부모 selector로 scope를 좁힌다.

공통처럼 보이는 스타일도 한 페이지에서만 쓰이면 페이지 SCSS에 둔다. 여러 페이지에서 같은 구조가 반복되고 디자인 시스템의 일부가 될 때만 `designSystem/` 이동을 검토한다.

## selector 작성
- 기존 HTML 구조와 class/id 이름을 먼저 따른다.
- 직접 자식 관계가 중요한 페이지 구조는 `>` selector를 사용한다.
- JS가 상태 class를 토글하는 요소는 selector 이름을 JS와 맞춘다.
- `body`, `main`, `input`, `button`, `a` 같은 전역 selector를 페이지 SCSS에서 새로 재정의하지 않는다.
- 전역 수정이 필요하면 `designSystem/` 또는 `temp/` 영향 범위를 먼저 확인한다.

## 파일 구성과 공백
SCSS는 한 파일 안에서 주제 단위가 눈에 보여야 한다. 서로 다른 UI 섹션이나 다른 책임의 스타일이 시작될 때는 빈 줄 2줄로 간격을 둔다.

권장:

```scss
/* 검색 영역 */
#itemList > .filter {
    ...
}

#itemList > .filter > input {
    ...
}


/* 리스트 섹션 */
#itemList > .listHead {
    ...
}

#itemList > .list > .row {
    ...
}
```

같은 주제 안의 selector끼리는 빈 줄 1줄만 둔다. 예를 들어 list header와 list row는 같은 리스트 섹션이므로 가까이 두고, 다음 주제인 modal이나 responsive가 시작될 때 빈 줄 2줄과 섹션 주석을 둔다.

권장 섹션 주석:

```scss
/* 폼 영역 */
/* 리스트 섹션 */
/* 상세 정보 */
/* 모달 */
/* 모바일 반응형 */
```

금지:

```scss
/* margin */
/* color */
/* div style */
```

## 상태 class
이 프로젝트는 UI 상태를 class 토글로 표현한다.

- `.display`: 보이기 상태. 전역 기본값은 `display: block !important`이다.
- `.active`: 단계 전환 화면에서 현재 상태.
- `.loading`: 버튼/요청 진행 상태.
- `.invalid`: input validation 실패 상태.
- `.disabled`: 비활성 또는 사용자 조작 불가 상태.

페이지 전용 상태는 해당 페이지 SCSS에 둔다.

```scss
.container > #apiKeyList > .list > .row.expired {
    ...
}

.container > #loadMoreButton.loadFinish {
    ...
}
```

`display: flex`나 `display: grid`가 필요한 요소는 `.display` 전역 동작과 충돌하지 않는지 확인한다. 필요하면 해당 페이지의 구체 selector에서 상태 표시 방식을 별도로 설계한다.

## 반응형
기본 breakpoint는 `designSystem/responsive.scss`의 `$breakpoints`를 사용한다.

```scss
@use "../designSystem/responsive" as *;
@use "sass:map";

@media screen and (max-width: map.get($breakpoints, tablet-large)) {
    ...
}
```

콘텐츠 자체의 길이 때문에 표준 breakpoint로 해결되지 않으면 페이지 전용 px breakpoint를 사용할 수 있다. 이 경우 해당 페이지의 실제 UI 폭 문제를 해결하는 용도로만 사용한다.

목록/표 형태 UI는 모바일에서 아래 중 하나로 전환한다.

- grid/flex row를 세로 card 형태로 전환
- header row를 숨기고 각 item 안에 label을 `::before`로 보강
- 긴 값이 있는 column은 `min-width: 0`, `text-overflow`, `word-break: break-all`, `overflow-x: auto`를 명시

## 긴 텍스트와 고정 폭
URL, token, key, email, 파일명처럼 길어질 수 있는 값은 overflow를 먼저 고려한다.

```scss
.value {
    min-width: 0;
    word-break: break-all;
}
```

한 줄 생략이 필요한 목록 값은 아래 조합을 사용한다.

```scss
.name {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
```

## 모달 스타일
모달 공통 레이아웃은 `designSystem/modal.scss`를 따른다. 페이지 SCSS에서는 특정 모달의 입력 간격, 폭, 에러 문구처럼 해당 모달에만 필요한 스타일만 작성한다.

```scss
#modals > #createItemModal > #content > .inputArea {
    margin-bottom: 1rem;
}
```

모달 스타일을 추가할 때도 색상 token과 typo mixin 규칙은 그대로 적용한다.

## 주석
SCSS 주석은 섹션 구분과 복잡한 반응형 의도를 설명할 때 사용한다.

권장:

```scss
/* 리스트 섹션 */

/* 모바일 반응형 */
// 목록 header를 숨기고 row 내부 label로 전환
```

금지:

```scss
// color를 설정한다
// margin을 준다
```

## 검증
- SCSS를 수정한 뒤 `npm run build` 또는 `npm run build:css`를 실행한다.
- HTML 구조와 selector가 맞는지 확인한다.
- 페이지 UI가 있으면 데스크톱과 모바일 폭에서 깨지지 않는지 확인한다.
- 색상/타이포 직접값을 추가하지 않았는지 검색한다.
