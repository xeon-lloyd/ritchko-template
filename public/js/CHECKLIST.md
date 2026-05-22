# Public JS Checklist

## 파일과 로딩
- 페이지 JS가 `views/<path>.html`과 대응되는 `public/js/<path>.js`에 있는가?
- 새 일반 페이지를 수동 생성하지 않고 `npm run create:frontend-page` 사용 가능 여부를 확인했는가?
- 공통 partial 동작이면 `public/js/temp/` 수정 대상인지 확인했는가?
- `public/js/core.js`를 수정해야 할 만큼 전역 공통 책임인지 확인했는가?
- `public/js/env.js`에 실제 비밀값을 커밋하지 않았는가?

## 페이지 구조
- 페이지 단위 전역 객체와 `htmlEle`, `init()` 구조를 유지했는가?
- DOM 참조, 이벤트 바인딩, API 요청, 렌더링 책임이 섞이지 않았는가?
- 목록, 모달, 상태 전환, 외부 SDK처럼 흐름이 여러 단계인 파일에만 짧은 한국어 단계 주석으로 로직 구획을 표시했는가?
- 단순 코드 번역 주석이나 오래 남기 어려운 주석을 만들지 않았는가?
- selector가 현재 HTML 구조와 맞는가?
- 동적 요소 이벤트를 렌더링 후 적용하거나 이벤트 위임으로 처리했는가?
- 새 inline `onclick`, `onchange`, `href="javascript:..."`를 만들지 않았는가?

## API 연동
- 일반 API 호출에 `API.request(operation, param)`을 사용했는가?
- operation 이름이 백엔드 registry key와 맞는가?
- 직접 `/API` fetch/XHR 로직을 새로 만들지 않았는가?
- 200 성공, 401 인증 실패, 400/InputValueNotValid, 기타 실패 처리가 있는가?
- 인증 실패 시 로그인 페이지 이동이 현재 경로를 보존하는가?
- 파일 업로드는 예외 없이 `API.uploadFile(file)`을 사용하고 `uploadKey`만 operation에 전달하는가?
- 페이지 JS에 업로드 URL 발급, presigned URL PUT, `/API/fileUpload` 직접 호출 로직을 새로 만들지 않았는가?

## 요청 상태
- 요청 버튼에 `.loading`과 `disabled`를 적용했는가?
- 모든 성공/실패/early return 경로에서 loading 상태가 복구되는가?
- 중복 클릭이나 중복 요청을 막는 조건이 있는가?
- 요청 실패 시 사용자가 이해할 수 있는 `alert(res.message, false)` 또는 화면 상태가 있는가?

## 입력과 상태 class
- 요청 전 기존 `.invalid` 상태를 초기화했는가?
- `InputValueNotValid`의 `target`과 input 이름 매핑이 맞는가?
- `.display`, `.active`, `.loading`, `.invalid`, `.disabled`, `.loadFinish` 의미를 기존과 다르게 쓰지 않았는가?
- JS에서 추가/제거하는 class가 관련 SCSS selector와 일치하는가?

## 렌더링과 보안
- 단순 텍스트는 `textContent` 또는 `innerText`를 사용했는가?
- `innerHTML`에 사용자 입력이나 서버 응답을 넣을 때 `escapeHtml()`을 적용했는가?
- 동적 row 식별자는 `data-*`를 사용했는가?
- 반복 row 내부에 불필요한 중복 id를 만들지 않았는가?
- URL, token, API key, 파일명 같은 긴 값의 표시 방식이 HTML/SCSS와 함께 검토됐는가?
- 민감값을 localStorage/sessionStorage에 새로 저장하지 않았는가?

## 모달과 상태 화면
- 모달 열기/닫기에서 `dimmedCover.display()`와 `dimmedCover.hide()`를 함께 처리했는가?
- 모달을 닫을 때 input, error, `data-target`, 페이지 객체 state를 초기화했는가?
- 상태 전환 페이지는 모든 상태 wrapper를 HTML에 두고 `.active`만 전환하는가?
- 실패 사유 같은 동적 텍스트는 별도 요소에 안전하게 넣는가?

## 연계 확인
- HTML 구조 변경 때문에 JS selector 수정이 필요한가?
- JS 상태 class 변경 때문에 SCSS 수정이 필요한가?
- API operation 추가/수정이 함께 있었다면 `/API-doc` 반영 여부를 확인했는가?

## 검증
- 수정한 JS 파일에 `node --check <수정한 파일>`을 실행했는가?
- 문서만 수정한 경우 구문 검사가 필요 없음을 확인했는가?
- 실제 화면 동작이 있는 변경이면 주요 클릭/입력/실패 상태를 확인했는가?
- 변경 범위가 요청한 페이지나 공통 요소에 한정되어 있는가?
