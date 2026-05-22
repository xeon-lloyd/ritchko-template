# AGENTS.md

## 대상
이 문서는 `public/js/` 작업 규칙이다.

## 핵심 구조
- 번들러나 프레임워크를 전제로 하지 않는다.
- 페이지 단위 스크립트는 전역 객체 패턴을 유지한다.
- 페이지 HTML `views/<path>.html`의 페이지 전용 스크립트는 `public/js/<path>.js`에 둔다.
- 공통 API helper와 유틸은 `public/js/core.js`를 먼저 확인한다.
- 공통 layout 조각의 스크립트는 `public/js/temp/`를 먼저 확인한다.

## 문서 읽기
- 기본 규칙은 `public/js/CONVENTION.md`를 먼저 읽는다.
- 페이지 동작 패턴 예시가 필요하면 `public/js/docs/PAGE-SCRIPTS.md`를 읽는다.
- HTML 구조는 `views/AGENTS.md`, `views/CONVENTION.md`, `views/docs/PAGE-PATTERNS.md`를 함께 확인한다.
- 스타일 상태 class는 `public/scss/AGENTS.md`, `public/scss/CONVENTION.md`를 함께 확인한다.
- 작업 후에는 `public/js/CHECKLIST.md`를 확인한다.

## 작업 규칙
- 공통 네이밍, 주석, 함수 설계, 포매팅은 `convention/README.md`와 관련 `convention/*.md`를 기본값으로 따른다.
- DOM 참조는 한 곳에 모아두고, 이벤트 바인딩과 렌더링 책임을 분리한다.
- 공통 유틸은 `public/js/core.js`를 우선 재사용한다.
- 숫자/날짜 포맷, 쿠키, alert, API 호출 로직을 중복 구현하지 않는다.
- UI 상태 변경은 가능하면 클래스 토글 방식으로 처리한다.
- 새 페이지 스크립트를 추가할 때는 기존 페이지 스크립트의 네이밍과 구조를 따른다.
- 새 일반 페이지는 직접 파일을 만들기 전에 `npm run create:frontend-page -- <path> [--title "페이지 제목"]` 사용 가능 여부를 확인한다.

## API 연동 규칙
- 현재 템플릿 기준 공통 호출 방식은 `API.request(operation, param)`이다.
- 백엔드 구조를 무시하고 프론트에서 임의 endpoint 규칙을 새로 만들지 않는다.
- 인증, 응답 형태, 공통 에러 처리 방식은 `public/js/core.js`와 백엔드 operation 구조를 기준으로 맞춘다.
- 파일 업로드는 반드시 `API.uploadFile(file)`을 사용하고, 성공 시 받은 `uploadKey`를 operation param에 전달한다.
- 페이지 JS에서 업로드 URL 발급, presigned URL PUT, `/API/fileUpload` 직접 호출 로직을 새로 작성하지 않는다.

## 주의할 점
- 프레임워크 기반 구조로 재편하지 않는다.
- 페이지마다 같은 유틸 함수를 복붙하지 않는다.
- 사용자/서버 입력을 동적 HTML에 넣을 때는 escaping 여부를 확인한다.
- `public/js/env.js`는 환경별 설정 파일이므로 실제 비밀값을 커밋하지 않는다.
- 동작 규칙 변경이 필요하면 관련 HTML과 SCSS 영향도 함께 확인한다.

## 검증
- JS 파일을 수정했다면 `node --check <수정한 파일>`로 구문을 확인한다.
- HTML/SCSS selector와 연동되는 변경이면 실제 화면 구조도 함께 확인한다.
