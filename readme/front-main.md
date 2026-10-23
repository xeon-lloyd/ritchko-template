# 프론트엔드 가이드

[README](../readme.md) · [시작하기](./run-main.md) · **프론트엔드** · [백엔드](./backend-main.md) · [배포](./deploy-main.md)

프론트는 HTML·SCSS·JavaScript로 작성합니다. 서버가 EJS로 공통 HTML 조각을 합쳐 렌더링하고, 브라우저에서는 일반 스크립트로 동작합니다.

## 화면과 파일 구조

`/`에서 기본 레이아웃을, `/_designSystemSample`에서 컴포넌트 예시를 확인합니다. 샘플은 개발 환경에서 제공합니다. 마크업 작성 시 [컴포넌트 문서](../views/docs/COMPONENTS.md)를 함께 참고하세요.

| 위치 | 역할 |
| --- | --- |
| `views/<path>.html` | 페이지 마크업. 경로가 페이지 URL에 대응 |
| `views/temp/` | head·header·sidebar·footer 등 공통 HTML 조각 |
| `public/js/<path>.js` | 페이지별 DOM 참조, 이벤트, 렌더링 |
| `public/js/core.js` | API 호출, 쿠키, 포맷 등 공통 helper |
| `public/js/temp/` | 공통 레이아웃 스크립트 |
| `public/scss/<path>.scss` | 페이지 전용 스타일 |
| `public/scss/designSystem/` | 공통 스타일과 디자인 시스템 |
| `public/css/` | SCSS 빌드 결과물. 직접 수정하지 않음 |

`server.js`는 `/`를 `views/index.html`로 렌더링하고, 나머지는 `views/<path>.html`의 존재 여부로 페이지를 찾습니다. 단순 페이지 추가에는 별도 라우터가 필요하지 않습니다.

<a id="create-page"></a>

## 새 페이지 만들기

프로젝트 루트에서 실행합니다.

```bash
npm run create:frontend-page -- demo/hello --title "첫 페이지"
```

다음 세 파일이 함께 생성됩니다.

```text
views/demo/hello.html
public/scss/demo/hello.scss
public/js/demo/hello.js
```

1. HTML에 내용을 작성합니다. 공통 include와 페이지 CSS·JS 연결은 생성된 구조를 활용합니다.
2. SCSS에 페이지 전용 스타일을 작성합니다.
3. JS의 페이지 객체에 DOM 참조와 동작을 작성합니다. 생성된 `init()` 호출을 진입점으로 사용합니다.
4. 개발 서버에서 `/demo/hello`를 엽니다. `start:dev` 실행 중에는 SCSS 변경을 감시합니다.

경로의 각 구간은 `lowerCamelCase`를 사용하고 확장자는 생략합니다. 대상 파일이 이미 있으면 생성기는 덮어쓰지 않고 중단합니다. PowerShell 실행 정책 문제가 있으면 `npm` 대신 `npm.cmd`를 사용하세요.

## API 연결하기

공통 head에서 불러오는 `core.js`의 `API.request(operation, param)`을 사용합니다. 아래는 [백엔드 가이드](./backend-main.md#create-operation)의 `GetGreeting`을 구현한 뒤 호출하는 예입니다.

```js
const result = await API.request('GetGreeting', {});

if(result == null){
    // 네트워크 오류 등으로 응답을 받지 못한 경우
}else if(result.response == 200){
    console.log(result.data.message);
}else{
    console.log(result.message);
}
```

helper는 같은 서버의 `/API`로 JSON을 전송하고, 저장된 access token이 있으면 `auth` 헤더에 추가합니다. 응답 본문의 `response`로 성공·실패를 판단하고 `data`를 사용합니다. `null` 응답도 처리하세요.

## 작업 규칙

페이지 스크립트는 기존 전역 객체 패턴을 따르고 DOM 참조, 이벤트 연결, 렌더링을 구분합니다. 공통 기능은 `core.js`, 공통 UI는 `views/temp/`와 디자인 시스템을 먼저 확인합니다.

상세 규칙: [뷰](../views/AGENTS.md) · [스크립트](../public/js/AGENTS.md) · [스타일](../public/scss/AGENTS.md) · [SCSS 컨벤션](../public/scss/CONVENTION.md)
