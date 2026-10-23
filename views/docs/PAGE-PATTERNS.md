# View Page Patterns

## 목적
이 문서는 일반 서비스 페이지를 만들 때 사용할 HTML 골격을 정리한다. JS 구현과 SCSS 구현은 각 영역 문서를 따른다.

새 페이지를 만들 때 가장 가까운 유형 하나를 고르고 필요한 컴포넌트를 조합한다.

## 공통 요소

### 페이지 제목과 설명
페이지 최상단 제목은 생성 템플릿의 `#title`을 사용한다.

```html
<div id="title">Account Setting</div>
```

페이지 제목 아래 안내 문구가 필요하면 `.description`을 사용한다.

```html
<div id="title">Streamers</div>
<div class="description">
    Stream Key management is supported only via the API.
</div>
```

### 섹션
설정, 관리, 정보 입력처럼 한 페이지 안에서 주제가 나뉘는 영역은 `.section`을 사용한다.

```html
<section class="section" id="displayName">
    <div class="title">Display Name</div>
    <div class="description">This name is shown to other users.</div>

    <div class="inputArea">
        <label class="label" for="displayName">Display Name</label>
        <input type="text" id="displayName" placeholder="Display Name">
    </div>

    <div class="action">
        <button type="button" id="saveDisplayNameButton" class="btn-solid-primary btn-small">Save</button>
    </div>
</section>
```

기본 순서는 `.title`, `.description`, `.inputArea`, `.action`이다. 필요 없는 요소는 생략한다.

### 입력 필드
입력 필드는 `.inputArea` 단위로 묶는다.

```html
<div class="inputArea">
    <label class="label" for="email">Email Address</label>
    <input type="email" id="email" placeholder="Email Address">
    <div class="description">Verification email will be sent to this address.</div>
</div>
```

### 액션
```html
<div class="action">
    <button type="button" id="saveButton" class="btn-solid-primary btn-small">Save</button>
    <button type="button" id="cancelButton" class="btn-outline-secondary btn-small">Cancel</button>
</div>
```

API 요청, 모달 열기/닫기, 상태 변경은 `button type="button"`을 사용한다. 다른 페이지로 이동하는 경우만 `a href="..."`를 사용한다.

### 빈 상태와 로딩 자리
JS가 데이터를 채우는 영역에는 초기 상태를 명확히 둔다.

```html
<div class="list">[Pending]</div>
<div class="value">[pending]</div>
```

## 설정/폼 페이지
사용처: 계정 설정, 프로필 수정, 서비스 설정, 관리자 단건 수정.

```html
<div id="title">Account Setting</div>

<section class="section" id="email">
    <div class="title">Email Address</div>
    <div class="description">Your email address will be updated after verification.</div>

    <div class="inputArea">
        <label class="label" for="email">Email Address</label>
        <input type="email" id="email" placeholder="Email Address">
    </div>

    <div class="action">
        <button type="button" id="sendVerificationEmailButton" class="btn-solid-primary btn-small">Send Verification Email</button>
    </div>
</section>

<section class="section" id="displayName">
    <div class="title">Display Name</div>

    <div class="inputArea">
        <label class="label" for="displayName">Display Name</label>
        <input type="text" id="displayName" placeholder="Display Name">
    </div>

    <div class="action">
        <button type="button" id="saveDisplayNameButton" class="btn-solid-primary btn-small">Save</button>
    </div>
</section>
```

## 공개/인증 페이지
사용처: 로그인, 회원가입, 비밀번호 재설정, 이메일 인증, 공개 요청 폼.

공개/인증 페이지는 사이드바를 쓰지 않는다. `create:frontend-page`가 만든 기본 파일에서 `body`의 `sidebar before-sidebar-calc` class와 sidebar include를 제거하고, header/footer와 elements include는 유지한다.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <%- include('../temp/head.html') %>
    <title>Sign In - 프로젝트</title>
    <link rel="stylesheet" href="/css/account/signIn.css">
</head>
<body>
    <!-- Elements -->
    <%- include('../temp/elements.html') %>

    <!-- Header -->
    <%- include('../temp/header.html') %>

    <main>
        <div class="container">
            <div class="authView" id="signInView">
                <div id="title">Sign In</div>

                <div class="inputArea">
                    <label class="label" for="email">Email Address</label>
                    <input type="email" id="email" placeholder="Email Address">
                </div>

                <div class="inputArea">
                    <label class="label" for="password">Password</label>
                    <input type="password" id="password" placeholder="Password" autocomplete="current-password">
                </div>

                <button type="button" id="signInButton" class="btn-solid-primary btn-medium w-fill">Sign In</button>

                <div class="actions">
                    <a href="/account/signUp">Create an account</a>
                    <a href="/account/resetPassword">Reset password</a>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <%- include('../temp/footer.html') %>

    <script src="/js/account/signIn.js"></script>
</body>
</html>
```

규칙:

- 사이드바가 필요 없는 공개/인증 페이지는 `body`에 sidebar 관련 class를 붙이지 않는다.
- `views/temp/sidebar.html`을 include하지 않는다.
- `views/temp/elements.html`, `views/temp/header.html`, `views/temp/footer.html`은 기본적으로 유지한다.
- 폼 입력은 `.inputArea`와 `label for` 구조를 사용한다.
- 제출, 인증 요청, 재설정 같은 동작은 `button type="button"`을 사용한다.
- 로그인/회원가입/비밀번호 재설정 같은 페이지 이동은 `a href`를 사용한다.
- 상태가 여러 개로 바뀌는 인증 페이지는 아래의 `상태 전환 페이지` 패턴을 함께 사용한다.

## 목록/검색/더보기 페이지
사용처: API key 목록, stream 목록, 결제 내역, 관리자 리스트.

```html
<div id="title">API Keys</div>

<div id="apiKeyList">
    <div class="listHeader">
        <div class="filter">
            <input type="text" id="apiKeyName" placeholder="Search by name">
            <button type="button" id="searchButton" class="btn-outline-primary btn-small">Search</button>
        </div>

        <div class="count"><span>[Pending]</span> API Keys</div>
    </div>

    <div class="listHead">
        <div>Name</div>
        <div>Created At</div>
        <div>Expiry</div>
        <div></div>
    </div>

    <div class="list">[Pending]</div>

    <button type="button" id="loadMoreButton" class="loadMore btn-outline-primary btn-small">Load More</button>
</div>
```

동적 row가 들어갈 영역은 `.list`로 둔다. row 내부 HTML은 JS에서 만들더라도 class와 `data-*`를 우선 사용한다.

예상 row 형태:

```html
<div class="row" data-pk="">
    <div class="name">[name]</div>
    <div class="createdAt">yyyy-mm-dd hh:ii</div>
    <div class="expiry">yyyy-mm-dd hh:ii</div>
    <button type="button" class="deleteButton" aria-label="Delete API key">
        <i class="fa-solid fa-trash"></i>
    </button>
</div>
```

## 상세 정보 페이지
사용처: 단건 상세, 로그 상세, 결제 상세, stream 상세.

```html
<div id="title">Stream Detail</div>

<div id="streamInfo">
    <div class="prop" id="streamId">
        <div class="label">Stream Id</div>
        <div class="value">[pending]</div>
    </div>

    <div class="prop" id="createdAt">
        <div class="label">Created At</div>
        <div class="value">yyyy-mm-dd hh:ii:ss</div>
    </div>
</div>

<div id="notFoundView" class="stateView">
    <i class="fa-solid fa-circle-exclamation"></i>
    <div class="description">Stream not found</div>
</div>
```

규칙:

- 정보 한 줄은 `.prop`으로 묶는다.
- 이름은 `.label`, 값은 `.value`를 사용한다.
- 값이 URL, 상태, 숫자, 날짜여도 `.value`를 유지하고 추가 class로 의미를 보강한다.
- 단순 key-value 표현에 table을 쓰지 않는다.

## 생성/수정/삭제 모달 페이지
사용처: API key 생성, 카드 추가, 삭제 확인, stream key reset.

```html
<button type="button" id="openCreateApiKeyModalButton" class="btn-solid-primary btn-small">Create API Key</button>

<div id="modals">
    <div class="modal" id="createApiKeyModal">
        <div id="title">
            <div id="mainTitle">Create API Key</div>
            <div id="subtitle">Enter the name of the API key.</div>
        </div>

        <div id="content">
            <div class="inputArea">
                <label class="label" for="apiKeyName">Name</label>
                <input type="text" id="apiKeyName" placeholder="API Key Name">
            </div>
            <div id="createApiKeyError" class="error"></div>
        </div>

        <div id="action">
            <button type="button" id="closeCreateApiKeyModalButton" class="btn-outline-secondary btn-small">Close</button>
            <button type="button" id="createApiKeyButton" class="btn-solid-primary btn-small">Create</button>
        </div>
    </div>
</div>
```

삭제 확인 모달:

```html
<div id="modals">
    <div class="modal" id="deleteApiKeyModal" data-target="">
        <div id="title">
            <div id="mainTitle">Delete API Key</div>
            <div id="subtitle">This action cannot be undone.</div>
        </div>

        <div id="action">
            <button type="button" id="closeDeleteApiKeyModalButton" class="btn-outline-secondary btn-small">Close</button>
            <button type="button" id="deleteApiKeyButton" class="btn-solid-delete btn-small">Delete</button>
        </div>
    </div>
</div>
```

## 상태 전환 페이지
사용처: 이메일 인증, 비밀번호 재설정, 결제 결과처럼 한 페이지 안에서 상태 화면이 바뀌는 페이지.

```html
<div id="requestStep" class="stateView active">
    <div class="title">Reset your password</div>
    <div class="description">Enter your account email.</div>

    <div class="inputArea">
        <label class="label" for="email">Email Address</label>
        <input type="email" id="email" placeholder="Email">
    </div>

    <button type="button" id="sendButton" class="btn-solid-primary btn-medium w-fill">Send reset link</button>
</div>

<div id="successStep" class="stateView">
    <div class="title">Check your email</div>
    <div class="description">Password reset email has been sent.</div>
</div>

<div id="failedStep" class="stateView">
    <div class="title">Unable to reset password</div>
    <div class="description"><span id="failedReason"></span></div>
</div>
```

규칙:

- 모든 상태 wrapper를 HTML에 둔다.
- 기본으로 보일 상태에만 `active`를 붙인다.
- 실패 사유처럼 동적으로 바뀌는 텍스트는 별도 span id를 둔다.

## 카드와 빈 자리
요약 정보, 등록된 결제수단, 통계처럼 하나의 독립된 덩어리로 보여야 하는 정보는 card 구조를 사용한다.

```html
<div class="summaryCard">
    <div class="title">Remaining Balance</div>
    <div class="value">$<span id="remainingBalance">[pending]</span></div>
    <div class="description">Amounts below the third decimal place are rounded up.</div>
</div>
```

아직 등록된 데이터가 없어서 같은 자리에 안내와 액션을 보여줘야 하면 `.placeholder`를 사용한다.

```html
<div class="placeholder">
    <i class="fa-regular fa-credit-card"></i>
    <p>No payment method registered</p>
    <button type="button" id="addPaymentMethodButton" class="btn-outline-primary btn-small">Add Card</button>
</div>
```

## 표 형태 레이아웃
일반 목록과 상세 내부 표 형태 UI는 대부분 실제 `table`이 아니라 `div` 기반 구조로 만든다.

목록형 표:

```html
<div id="streamerList">
    <div class="listHead">
        <div>Id</div>
        <div>Storage region</div>
        <div>Created date</div>
    </div>

    <div class="list">
        <div class="row" data-pk="">
            <div class="id">streamer_001</div>
            <div class="storageRegion">kr-standard</div>
            <div class="createdDate">yyyy-mm-dd hh:ii:ss</div>
        </div>
    </div>
</div>
```

상세 내부의 작은 표 형태:

```html
<div class="prop" id="transcode">
    <div class="label">Transcode</div>
    <div class="transTable">
        <div class="head">
            <div>Size</div>
            <div>Video Bitrate</div>
            <div>Audio Bitrate</div>
            <div>FPS</div>
        </div>
        <div class="row">
            <div>720p</div>
            <div>2500kbps</div>
            <div>128kbps</div>
            <div>30</div>
        </div>
    </div>
</div>
```

규칙:

- 동적 목록, 관리자 리스트, 상세 내부 표 형태는 `div` 기반 `listHead/list/row` 또는 `head/row` 구조를 우선한다.
- 단순 key-value 상세 정보는 `.prop > .label + .value`를 사용한다.
- 실제 `<table>`은 정적 안내표처럼 HTML table 의미가 명확한 경우에만 예외적으로 사용한다.
