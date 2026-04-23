# AGENTS.md

## 대상
이 문서는 `public/scss/` 작업 규칙이다.

## 핵심 규칙
- 스타일 수정은 `public/scss/` 기준으로 작업한다.
- `public/css/`는 SCSS 빌드 결과물이므로 직접 수정하지 않는다.
- 수정 전 기존 디자인 시스템 파일과 페이지별 SCSS 구조를 먼저 확인한다.

## 작업 규칙
- 공통 네이밍과 포매팅은 `convention/README.md`와 관련 `convention/*.md`를 기본값으로 따른다.
- 공통 스타일은 `designSystem/` 구조를 우선 확인한다.
- 페이지 전용 스타일은 해당 페이지 SCSS 파일에 넣고, 공통 규칙이 아니면 전역으로 퍼뜨리지 않는다.
- 기존 네이밍과 파일 분리 방식을 최대한 유지한다.
- 스타일 수정 후에는 빌드 결과와 실제 렌더링을 함께 확인한다.

## 검증
- `npm run build` 또는 `npm run build:css`
- 필요한 경우 `npm run watch:css`
