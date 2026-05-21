# AGENTS.md

## 대상
이 문서는 `views/` 작업 규칙이다.

## 핵심 구조
- `server.js`는 `views/<path>.html` 파일 존재 여부를 기준으로 페이지를 렌더링한다.
- 단순 페이지 추가는 보통 별도 라우트 파일 대신 `views/`에 HTML을 추가해 처리한다.
- 공통 조각은 `views/temp/`를 먼저 확인한다.

## 문서 읽기
- 기본 규칙은 `views/CONVENTION.md`를 먼저 읽는다.
- 컴포넌트 실물은 `views/_designSystemSample.html`에서 확인한다.
- 컴포넌트 사용법이 필요하면 `views/docs/COMPONENTS.md`를 읽는다.
- 페이지 유형별 구현 예시가 필요하면 `views/docs/PAGE-PATTERNS.md`를 읽는다.
- 작업 후에는 `views/CHECKLIST.md`를 확인한다.

## 작업 규칙
- 공통 네이밍, 주석, 함수 설계, 포매팅은 `convention/README.md`와 관련 `convention/*.md`를 기본값으로 따른다.
- HTML 페이지 생성과 기본 작성 규칙은 `views/CONVENTION.md`를 따른다.
- 기존 HTML 구조와 네이밍을 최대한 유지한다.
- 공통 레이아웃 조각이 이미 있으면 `views/temp/`를 우선 재사용한다.
- 페이지별 UI 변경 시 관련 `public/js/`, `public/scss/` 파일이 함께 필요한지 확인한다.
- 단순 마크업 수정인지, 스크립트/스타일 변경까지 필요한지 먼저 판단한다.

## 주의할 점
- 템플릿 구조를 무시하고 한 파일에 모든 마크업을 몰아넣지 않는다.
- 스타일이나 동작을 HTML 안에 직접 과하게 넣지 않는다.
- `views/_designSystemSample.html`의 데모용 wrapper, inline layout style, `onclick`을 일반 페이지에 그대로 복사하지 않는다.
- 프론트 동작 규칙은 `public/js/AGENTS.md`, 스타일 규칙은 `public/scss/AGENTS.md`를 따른다.
