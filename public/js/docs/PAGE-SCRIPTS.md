# Page Script Patterns

## 목적
이 문서는 일반 서비스 페이지에서 자주 쓰는 `public/js/` 구현 패턴을 정리한다. HTML 골격은 `views/docs/PAGE-PATTERNS.md`, 스타일 규칙은 `public/scss/CONVENTION.md`를 따른다.

새 페이지를 만들 때 가장 가까운 패턴 하나를 고르고 필요한 부분만 조합한다.

## 기본 페이지 객체

```js
const pageObject = {
    htmlEle: {
        saveButton: document.querySelector('#saveButton'),
    },

    init: function(){
        pageObject.htmlEle.saveButton.addEventListener('click', pageObject.requestSave);
    },

    requestSave: async function(){
        ...
    },
}

pageObject.init();
```

규칙:

- `htmlEle`에는 고정 DOM 참조를 둔다.
- `init()`에는 이벤트 바인딩과 최초 데이터 조회를 둔다.
- 함수 이름은 `get...`, `request...`, `render...`, `open...Modal`, `close...Modal`, `changeScreen`처럼 책임이 보이게 둔다.

## 폼 제출

사용처: 로그인, 회원가입, 설정 저장, 단건 수정.

```js
const profile = {
    htmlEle: {
        displayNameInput: document.querySelector('#displayName'),
        saveButton: document.querySelector('#saveButton'),
    },

    init: function(){
        profile.htmlEle.saveButton.addEventListener('click', profile.requestModifyDisplayName);
    },

    requestModifyDisplayName: async function(){
        if(profile.htmlEle.saveButton.classList.contains('loading')) return;

        profile.clearInvalidStatus();
        profile.htmlEle.saveButton.classList.add('loading');
        profile.htmlEle.saveButton.disabled = true;

        const res = await API.request('ModifyDisplayName', {
            displayName: profile.htmlEle.displayNameInput.value,
        });

        if(res.response == 401){
            return location.href = `/account/signIn#${location.pathname}`;
        }

        if(res.response != 200){
            if(res.label == 'InputValueNotValid' && res.target == 'displayName'){
                profile.htmlEle.displayNameInput.classList.add('invalid');
            }

            alert(res.message, false);
            profile.resetSaveButton();
            return;
        }

        alert(res.message, true);
        profile.resetSaveButton();
    },

    clearInvalidStatus: function(){
        profile.htmlEle.displayNameInput.classList.remove('invalid');
    },

    resetSaveButton: function(){
        profile.htmlEle.saveButton.classList.remove('loading');
        profile.htmlEle.saveButton.disabled = false;
    },
}

profile.init();
```

포인트:

- 요청 전 invalid 상태를 지운다.
- 요청 중 버튼에 `.loading`과 `disabled`를 적용한다.
- 실패/성공 모든 경로에서 버튼 상태를 복구한다.
- 최종 입력값 검증은 백엔드 response를 기준으로 표시한다.

## 인증 실패 이동

인증이 필요한 페이지에서 401을 받으면 로그인 페이지로 이동한다.

```js
if(res.response == 401){
    return location.href = `/account/signIn#${location.pathname}`;
}
```

상세 페이지처럼 query string이 의미 있으면 함께 보존한다.

```js
if(res.response == 401){
    return location.href = `/account/signIn#${location.pathname}${location.search}`;
}
```

## 상태 전환 페이지

사용처: 이메일 인증, 비밀번호 재설정, 결제 결과.

```js
const verifyEmail = {
    htmlEle: {
        verifying: document.querySelector('#verifying'),
        verified: document.querySelector('#verified'),
        failed: document.querySelector('#failed'),
        failedReason: document.querySelector('#failedReason'),
    },

    init: function(){
        verifyEmail.requestVerifyEmail();
    },

    changeScreen: function(target){
        verifyEmail.htmlEle.verifying.classList.remove('active');
        verifyEmail.htmlEle.verified.classList.remove('active');
        verifyEmail.htmlEle.failed.classList.remove('active');

        verifyEmail.htmlEle[target].classList.add('active');
    },

    showFailed: function(message){
        verifyEmail.htmlEle.failedReason.textContent = message || 'Invalid token';
        verifyEmail.changeScreen('failed');
    },

    requestVerifyEmail: async function(){
        const token = new URL(window.location.href).searchParams.get('token');
        if(!token) return verifyEmail.showFailed('Invalid token');

        const res = await API.request('VerifyEmailByToken', { token });
        if(res.response != 200) return verifyEmail.showFailed(res.message);

        verifyEmail.changeScreen('verified');
    },
}

verifyEmail.init();
```

포인트:

- 모든 상태 wrapper는 HTML에 미리 둔다.
- JS는 `.active`만 전환한다.
- 실패 사유는 `textContent`로 넣는다.

## 목록, 검색, 더보기

사용처: 관리자 리스트, API key 목록, 결제 내역, 로그 목록.

```js
const itemList = {
    currentPage: 0,
    searchKeyword: '',
    loadFinish: false,

    htmlEle: {
        keywordInput: document.querySelector('#keyword'),
        searchButton: document.querySelector('#searchButton'),
        count: document.querySelector('#itemCount'),
        list: document.querySelector('#itemList'),
        loadMoreButton: document.querySelector('#loadMoreButton'),
    },

    init: function(){
        itemList.htmlEle.searchButton.addEventListener('click', itemList.searchItems);
        itemList.htmlEle.loadMoreButton.addEventListener('click', itemList.getItemList);
        itemList.getItemList();
    },

    searchItems: function(){
        itemList.searchKeyword = itemList.htmlEle.keywordInput.value;
        itemList.currentPage = 0;
        itemList.loadFinish = false;
        itemList.htmlEle.loadMoreButton.classList.remove('loadFinish');
        itemList.getItemList();
    },

    getItemList: async function(){
        if(itemList.loadFinish) return;

        const res = await API.request('GetItemList', {
            page: itemList.currentPage,
            keyword: itemList.searchKeyword,
        });

        if(res.response == 401){
            return location.href = `/account/signIn#${location.pathname}`;
        }

        if(res.response != 200){
            return alert(res.message, false);
        }

        itemList.htmlEle.count.textContent = res.data.totalCount;

        let html = '';
        for(let i = 0; i < res.data.list.length; i++){
            html += itemList.composeItemRowHTML(res.data.list[i]);
        }

        if(itemList.currentPage == 0) itemList.htmlEle.list.innerHTML = '';
        itemList.htmlEle.list.innerHTML += html;
        itemList.applyRowEvent();

        if(res.data.list.length == 0){
            itemList.loadFinish = true;
            itemList.htmlEle.loadMoreButton.classList.add('loadFinish');
            return;
        }

        itemList.currentPage++;
    },

    composeItemRowHTML: function(item){
        const name = (item.name || '').toString().escapeHtml();

        return `
            <div class="row" data-pk="${item.pk}">
                <div class="name">${name}</div>
                <button type="button" class="deleteButton" aria-label="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    },

    applyRowEvent: function(){
        const deleteButtons = itemList.htmlEle.list.querySelectorAll('.deleteButton');

        deleteButtons.forEach(function(button){
            button.addEventListener('click', function(e){
                const pk = e.currentTarget.closest('.row').dataset.pk;
                itemList.openDeleteModal(pk);
            });
        });
    },
}

itemList.init();
```

포인트:

- 검색 시 page, 종료 상태, 버튼 상태를 초기화한다.
- 첫 페이지 조회면 목록을 비우고, 이후 페이지는 append한다.
- 서버/사용자 값은 row HTML에 넣기 전에 escaping한다.
- 반복 item 식별자는 `data-*`를 사용한다.

## 생성 모달

사용처: API key 생성, 항목 추가, 카드 등록.

```js
const apiKey = {
    htmlEle: {
        openCreateModalButton: document.querySelector('#openCreateApiKeyModalButton'),
        createModal: document.querySelector('#createApiKeyModal'),
        nameInput: document.querySelector('#apiKeyName'),
        closeCreateModalButton: document.querySelector('#closeCreateApiKeyModalButton'),
        createButton: document.querySelector('#createApiKeyButton'),
        error: document.querySelector('#createApiKeyError'),
    },

    init: function(){
        apiKey.htmlEle.openCreateModalButton.addEventListener('click', apiKey.openCreateModal);
        apiKey.htmlEle.closeCreateModalButton.addEventListener('click', apiKey.closeCreateModal);
        apiKey.htmlEle.createButton.addEventListener('click', apiKey.requestCreateApiKey);
    },

    openCreateModal: function(){
        dimmedCover.display();
        apiKey.htmlEle.createModal.classList.add('display');
    },

    closeCreateModal: function(){
        apiKey.htmlEle.nameInput.value = '';
        apiKey.htmlEle.error.textContent = '';
        apiKey.htmlEle.createModal.classList.remove('display');
        dimmedCover.hide();
    },

    requestCreateApiKey: async function(){
        apiKey.htmlEle.nameInput.classList.remove('invalid');
        apiKey.htmlEle.createButton.classList.add('loading');
        apiKey.htmlEle.createButton.disabled = true;

        const res = await API.request('CreateApiKey', {
            name: apiKey.htmlEle.nameInput.value,
        });

        if(res.response == 401){
            return location.href = `/account/signIn#${location.pathname}`;
        }

        if(res.response != 200){
            if(res.label == 'InputValueNotValid' && res.target == 'name'){
                apiKey.htmlEle.nameInput.classList.add('invalid');
            }

            apiKey.htmlEle.error.textContent = res.message;
            apiKey.resetCreateButton();
            return;
        }

        apiKey.closeCreateModal();
        apiKey.resetCreateButton();
        apiKey.getApiKeyList();
    },

    resetCreateButton: function(){
        apiKey.htmlEle.createButton.classList.remove('loading');
        apiKey.htmlEle.createButton.disabled = false;
    },
}

apiKey.init();
```

포인트:

- 모달을 닫을 때 입력값과 에러를 초기화한다.
- 모달 버튼도 loading/disabled 복구를 빠뜨리지 않는다.
- 성공 후 목록을 다시 조회하거나 필요한 영역만 갱신한다.

## 삭제 확인 모달

```js
const item = {
    htmlEle: {
        deleteModal: document.querySelector('#deleteItemModal'),
        closeDeleteModalButton: document.querySelector('#closeDeleteItemModalButton'),
        deleteButton: document.querySelector('#deleteItemButton'),
    },

    openDeleteModal: function(pk){
        item.htmlEle.deleteModal.dataset.target = pk;
        dimmedCover.display();
        item.htmlEle.deleteModal.classList.add('display');
    },

    closeDeleteModal: function(){
        item.htmlEle.deleteModal.dataset.target = '';
        item.htmlEle.deleteModal.classList.remove('display');
        dimmedCover.hide();
    },

    requestDeleteItem: async function(){
        const pk = Number(item.htmlEle.deleteModal.dataset.target);

        item.htmlEle.deleteButton.classList.add('loading');
        item.htmlEle.deleteButton.disabled = true;

        const res = await API.request('DeleteItem', { pk });

        if(res.response == 401){
            return location.href = `/account/signIn#${location.pathname}`;
        }

        if(res.response != 200){
            alert(res.message, false);
            item.resetDeleteButton();
            return;
        }

        alert(res.message, true);
        item.closeDeleteModal();
        item.resetDeleteButton();
        item.getItemList();
    },

    resetDeleteButton: function(){
        item.htmlEle.deleteButton.classList.remove('loading');
        item.htmlEle.deleteButton.disabled = false;
    },
}
```

## 상세 페이지

사용처: 단건 상세, 로그 상세, 결제 상세.

```js
const detail = {
    htmlEle: {
        infoArea: document.querySelector('#info'),
        notFoundView: document.querySelector('#notFoundView'),
        name: document.querySelector('#name > .value'),
        createdAt: document.querySelector('#createdAt > .value'),
    },

    init: function(){
        const id = new URL(window.location.href).searchParams.get('id');
        detail.getDetail(id);
    },

    getDetail: async function(id){
        if(!id) return detail.showNotFound();

        const res = await API.request('GetItemDetail', { id });

        if(res.response == 401){
            return location.href = `/account/signIn#${location.pathname}${location.search}`;
        }

        if(res.response == 404){
            return detail.showNotFound();
        }

        if(res.response != 200){
            return alert(res.message, false);
        }

        detail.renderDetail(res.data);
    },

    renderDetail: function(data){
        detail.htmlEle.name.textContent = data.name || '-';
        detail.htmlEle.createdAt.textContent = data.createdAt
            ? new Date(data.createdAt).stringFormat('y-m-d h:i:s')
            : '-';
    },

    showNotFound: function(){
        detail.htmlEle.infoArea.classList.remove('display');
        detail.htmlEle.notFoundView.classList.add('display');
    },
}

detail.init();
```

포인트:

- query param은 `new URL(window.location.href).searchParams`로 읽는다.
- 404는 alert보다 not found 화면으로 전환하는 편이 자연스럽다.
- 날짜와 숫자는 `core.js` format helper를 재사용한다.

## 파일 업로드

사용처: 이미지, 첨부파일, export 대상 업로드.

```js
const attachment = {
    htmlEle: {
        fileInput: document.querySelector('#attachmentFile'),
        uploadButton: document.querySelector('#uploadButton'),
    },

    init: function(){
        attachment.htmlEle.uploadButton.addEventListener('click', attachment.requestCreateAttachment);
    },

    requestCreateAttachment: async function(){
        const file = attachment.htmlEle.fileInput.files[0];
        if(!file) return alert('File is required', false);

        attachment.htmlEle.uploadButton.classList.add('loading');
        attachment.htmlEle.uploadButton.disabled = true;

        const uploadResult = await API.uploadFile(file);
        if(!uploadResult.success){
            alert(uploadResult.label, false);
            attachment.resetUploadButton();
            return;
        }

        const res = await API.request('CreateAttachment', {
            uploadKey: uploadResult.uploadKey,
        });

        if(res.response == 401){
            return location.href = `/account/signIn#${location.pathname}`;
        }

        if(res.response != 200){
            alert(res.message, false);
            attachment.resetUploadButton();
            return;
        }

        alert(res.message, true);
        attachment.resetUploadButton();
    },

    resetUploadButton: function(){
        attachment.htmlEle.uploadButton.classList.remove('loading');
        attachment.htmlEle.uploadButton.disabled = false;
    },
}

attachment.init();
```

포인트:

- 프론트는 업로드 URL 발급과 PUT 전송을 반드시 `API.uploadFile()`에 맡긴다.
- 페이지 JS에서 업로드 URL 발급, presigned URL PUT, `/API/fileUpload` 직접 호출 로직을 새로 작성하지 않는다.
- 성공 시 받은 `uploadKey`만 operation에 전달한다.
- 최종 파일 검증과 revoke는 백엔드 operation에서 처리한다.

## 제한 입력

사용처: API key 이름, 슬러그, 코드, 숫자 입력.

```js
checkApiKeyNameInput: function(e){
    if(e && e.type == 'input' && e.isComposing) return;

    let value = apiKey.htmlEle.nameInput.value || '';
    value = value.replace(/\s/g, '_');
    value = value.replace(/[^a-zA-Z0-9_]/g, '');
    value = value.slice(0, 20);

    apiKey.htmlEle.nameInput.value = value;
}
```

이벤트는 `input`과 `compositionend`를 함께 연결한다.

```js
apiKey.htmlEle.nameInput.addEventListener('input', apiKey.checkApiKeyNameInput);
apiKey.htmlEle.nameInput.addEventListener('compositionend', apiKey.checkApiKeyNameInput);
```

프론트 제한은 사용자 경험을 위한 보조 장치다. 백엔드 validation을 대체하지 않는다.

## 외부 callback 연결

외부 script가 전역 callback 이름을 요구하는 경우에만 페이지 객체 메서드를 전역 이름에 연결한다.

```js
const signUp = {
    turnstile: {
        captchaToken: '',

        onCaptchaSuccess: function(token){
            signUp.turnstile.captchaToken = token;
        },

        onCaptchaError: function(){
        },

        onCaptchaExpired: function(){
            signUp.turnstile.captchaToken = '';
        },
    },
}

onCaptchaSuccess = signUp.turnstile.onCaptchaSuccess;
onCaptchaError = signUp.turnstile.onCaptchaError;
onCaptchaExpired = signUp.turnstile.onCaptchaExpired;
```

전역 callback 이름은 HTML의 외부 script 설정과 맞아야 한다.
