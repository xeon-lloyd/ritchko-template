# View Components

## 목적
이 문서는 일반 페이지에서 재사용할 HTML 컴포넌트 구조와 class 조합을 정리한다.

여기서는 HTML 구조와 class 조합만 다룬다. 이벤트 구현은 `public/js/AGENTS.md`, 스타일 구현은 `public/scss/AGENTS.md`를 따른다.

## 사용 기준
- 실물 샘플: `views/_designSystemSample.html`
- 요약 문서: `views/docs/COMPONENTS.md`
- 공통 include: `views/temp/elements.html`
- 공통 head/include 구조: `views/temp/head.html`

`_designSystemSample.html`은 템플릿에 포함되는 디자인 시스템 샘플 페이지다. 새 페이지는 이 샘플에 있는 컴포넌트 구조와 class 조합을 우선해서 만든다.

다만 샘플 안의 `onclick`, 데모용 inline layout style, 샘플 전용 wrapper class를 새 서비스 페이지에 그대로 복사하지 않는다. 운영 배포에서는 `_designSystemSample.html`처럼 `_`로 시작하는 샘플/내부 view가 외부에서 접근되지 않아야 한다.

## Typography Class
HTML에서 바로 쓸 수 있는 typography class가 있다.

```html
<div class="font-title3">Page Title</div>
<div class="font-heading2">Section Title</div>
<div class="font-body2-normal">Description text</div>
<div class="font-label1">Label</div>
```

일반 페이지에서는 생성 템플릿의 `#title`과 페이지 SCSS를 우선하고, HTML 안에서 꼭 필요한 경우에만 typography class를 붙인다.

## Button
버튼은 디자인 시스템 버튼 class를 조합한다.

```html
<button type="button" id="saveButton" class="btn-solid-primary btn-medium">Save</button>
<button type="button" id="searchButton" class="btn-outline-primary btn-small">Search</button>
<button type="button" id="cancelButton" class="btn-outline-secondary btn-small">Cancel</button>
<button type="button" id="deleteButton" class="btn-solid-delete btn-small">Delete</button>
<button type="button" id="editButton" class="btn-text-primary btn-small">Edit</button>
<a href="/account/signIn" class="btn-outline-primary btn-small">Sign In</a>
```

종류:

- `btn-solid-primary`: 주요 저장, 생성, 확인
- `btn-solid-delete`: 삭제, 되돌릴 수 없는 위험 작업
- `btn-outline-primary`: 보조 실행, 검색, 추가
- `btn-outline-secondary`: 취소, 닫기, 덜 중요한 보조 실행
- `btn-text-primary`: 링크에 가까운 보조 실행
- `btn-text-secondary`: 더 약한 텍스트형 보조 실행

크기:

- `btn-large`: 강조 CTA
- `btn-medium`: 일반 버튼
- `btn-small`: 테이블, 모달, 필터, 조밀한 UI

상태 class를 붙일 수 있도록 HTML을 작성한다.

```html
<button type="button" id="saveButton" class="btn-solid-primary btn-medium" disabled>Disabled</button>
<button type="button" id="submitButton" class="btn-solid-primary btn-medium loading" disabled>Saving</button>
```

너비 helper:

```html
<button type="button" class="btn-solid-primary btn-medium w-hug">Hug Content</button>
<button type="button" class="btn-solid-primary btn-medium w-fill">Fill Width</button>
```

아이콘:

```html
<button type="button" class="btn-solid-primary btn-small">
    <i class="fa-solid fa-plus"></i>
    Create
</button>

<button type="button" class="btn-outline-primary btn-small">
    Export
    <i class="svg" style="--src: url('/img/icon/star.svg');"></i>
</button>
```

`.svg` 아이콘의 `--src` 전달처럼 디자인 시스템이 요구하는 CSS variable 선언은 예외적으로 `style` 속성을 사용할 수 있다.

## Input
input, select, textarea는 기본 태그를 사용한다.

```html
<div class="inputArea">
    <label class="label" for="displayName">Display Name</label>
    <input type="text" id="displayName" placeholder="Display Name">
</div>

<div class="inputArea">
    <label class="label" for="password">Password</label>
    <input type="password" id="password" placeholder="Password" autocomplete="new-password">
</div>

<div class="inputArea">
    <label class="label" for="email">Email</label>
    <input type="email" id="email" placeholder="Email">
</div>
```

select/textarea:

```html
<div class="inputArea">
    <label class="label" for="expiry">Expiry</label>
    <select id="expiry">
        <option value="" disabled selected hidden>선택해주세요</option>
        <option value="7d">7 days</option>
    </select>
</div>

<div class="inputArea">
    <label class="label" for="description">Description</label>
    <textarea id="description" placeholder="Description"></textarea>
</div>
```

상태 class를 붙일 수 있다.

```html
<input type="text" id="disabledInput" placeholder="disabled state" disabled>
<input type="text" id="invalidInput" class="invalid" placeholder="invalid state">
```

아이콘 input:

```html
<input
    type="text"
    class="left-icon"
    style="--left-icon-src: url('/img/icon/pen.svg');"
    placeholder="left icon"
>

<input
    type="text"
    class="right-icon"
    style="--right-icon-src: url('/img/icon/check.svg');"
    placeholder="right icon"
>
```

아이콘 경로를 넘기기 위한 CSS variable 선언은 예외적으로 `style` 속성을 사용할 수 있다.

## Control
체크박스, 라디오, 토글은 기본 input과 label 조합을 사용한다.

체크박스:

```html
<div class="controlItem">
    <input type="checkbox" id="emailOptIn">
    <label for="emailOptIn">Receive email updates</label>
</div>
```

라디오:

```html
<div class="controlItem">
    <input type="radio" id="billingMonthly" name="billingCycle" value="monthly">
    <label for="billingMonthly">Monthly</label>
</div>

<div class="controlItem">
    <input type="radio" id="billingYearly" name="billingCycle" value="yearly">
    <label for="billingYearly">Yearly</label>
</div>
```

토글:

```html
<div class="controlItem">
    <input type="checkbox" id="isEnabled" class="toggle">
    <label for="isEnabled">Enabled</label>
</div>
```

규칙:

- label의 `for`와 input의 `id`를 맞춘다.
- radio는 같은 그룹끼리 같은 `name`을 사용한다.
- 토글은 `input[type="checkbox"].toggle`을 사용한다.

## Modal
모달은 `main` 밖, footer include 앞에 있는 `#modals` 안에 둔다.

현재 공통 modal HTML 구조는 id 기반이다.

```html
<div id="modals">
    <div class="modal" id="deleteApiKeyModal" data-target="">
        <div id="title">
            <div id="mainTitle">Delete API Key</div>
            <div id="subtitle">This action cannot be undone.</div>
        </div>

        <div id="content">
            ...
        </div>

        <div id="action">
            <button type="button" id="closeDeleteApiKeyModalButton" class="btn-outline-secondary btn-small">Close</button>
            <button type="button" id="deleteApiKeyButton" class="btn-solid-delete btn-small">Delete</button>
        </div>
    </div>
</div>
```

규칙:

- modal wrapper는 `.modal` class와 구체적인 id를 함께 사용한다.
- 대상 식별자가 필요하면 `data-target` 같은 `data-*` 속성을 사용한다.
- 닫기/확인 버튼은 div가 아니라 button을 사용한다.
- 모달 내부 id 구조는 현재 디자인 시스템 계약이므로 예외적으로 허용한다.

## Alert 준비 요소
일반 페이지는 생성 템플릿이 `views/temp/elements.html`을 include한다.

```html
<%- include('../temp/elements.html') %>
```

이 include 안의 `#alertArea`, `#dimmedCover`는 alert와 modal 표시를 위한 공통 요소다. 페이지 HTML에서 같은 요소를 중복으로 만들지 않는다.
