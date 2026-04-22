# AGENTS.md

## 목적
이 문서는 이 레포에서 작업하는 AI 에이전트를 위한 루트 가이드다. 세부 작업 규칙은 각 영역의 `AGENTS.md`를 먼저 읽는다.

## 이 레포의 성격
- 이 프로젝트는 개인 웹서비스 제작을 위한 Node.js 기반 템플릿이다.
- 프론트는 순수 `html + scss + js`, 백엔드는 순수 `js + express` 기반이다.
- 이 레포는 일반적인 Express 라우터 중심 구조보다 `operation` 레지스트리 중심 구조에 가깝다.

## 먼저 읽을 파일
작업 전 아래 파일을 먼저 확인한다.

1. `server.js`
2. `backend/_system_/initialize.sys.js`
3. `backend/_system_/middleware.sys.js`
4. `backend/_operations.sys.js`
5. 작업 대상 영역의 `AGENTS.md`

## 영역별 작업 가이드
- 백엔드 작업 전: `backend/AGENTS.md`
- 백엔드 구현 직전 체크: `backend/CHECKLIST.md`
- DB 작업 전: `backend/DB.md`, `backend/DB-CHECKLIST.md`
- 뷰 템플릿 작업 전: `views/AGENTS.md`
- 프론트 스크립트 작업 전: `public/js/AGENTS.md`
- 스타일 작업 전: `public/scss/AGENTS.md`

## 프로젝트 구조
- `server.js`: 서버 부팅, 정적 파일 설정, 뷰 렌더링, 시스템 초기화
- `backend/_system_/`: API, webhook, socket, file upload, API 문서 초기화
- `backend/_operations.sys.js`: 전체 operation 진입점
- `backend/_param.sys.js`: 전체 param schema 진입점
- `backend/_response.sys.js`: 전체 response schema 진입점
- `scripts/create-backend-domain.js`: 새 백엔드 도메인 생성 스크립트
- `scripts/create-backend-operation.js`: 도메인 내부 operation 생성 스크립트
- `scripts/templates/backend-domain/`: 새 백엔드 도메인 스캐폴드 원본
- `scripts/templates/backend-operation/`: 새 backend operation 스캐폴드 원본
- `views/`: 렌더링할 HTML 템플릿
- `public/js/`: 프론트 로직
- `public/scss/`: SCSS 스타일 소스
- `public/css/`: SCSS 빌드 결과물

## 백엔드 신규 도메인 생성
- 새 백엔드 도메인은 `npm run create:backend-domain -- <name>`으로 생성한다.
- 스크립트는 `backend/<name>/` 폴더를 만들고 루트 집계 파일도 함께 갱신한다.
- 세부 절차와 생성 후 작업은 `backend/AGENTS.md`를 따른다.

## 백엔드 신규 operation 생성
- 기존 도메인 내부 operation은 `npm run create:backend-operation -- <domain> <OperationName>`으로 생성한다.
- 단일 인자 형식 `npm run create:backend-operation -- <domain>/<OperationName>`도 사용할 수 있다.
- 인증이 필요한 operation은 `--auth`를 붙인다.
- `paramSchema: null`로 시작할 operation은 `--param-null`을 붙인다.
- 설명 초깃값이 필요하면 `--description "설명"`을 사용한다.
- 스크립트는 로직 파일과 도메인별 `_operations.sys.js`, `_param.sys.js`만 갱신한다.
- 기본 `responseSchema`는 `responseSchema.OK`로 등록되고 `_response.sys.js`는 수정하지 않는다.

## 공통 원칙
- 기존 파일 구조와 네이밍을 최대한 유지한다.
- 템플릿에 없는 외부 프레임워크 기준으로 구조를 재편하지 않는다.
- 실제 비밀번호, API 키, 토큰, DB 접속 정보는 커밋하지 않는다.
- 템플릿의 `backend/core/setting.js`, `public/js/env.js`는 placeholder 성격을 유지한다.
- 구현 전에 작업 대상 영역의 `AGENTS.md`와 체크리스트 파일에서 금지 규칙을 먼저 다시 확인한다.
- 이 템플릿에서 서비스의 주 저장소는 기본적으로 DB다. 설정값이 placeholder이거나 로컬에서 즉시 실행이 어렵더라도, 임의의 JSON 파일, txt 파일, 로컬 캐시 파일을 서비스 본 저장소처럼 설계해 우회하지 않는다.
- 파일 저장은 업로드 임시파일, 로그, 캐시, export 산출물처럼 기존 구조상 파일이 맞는 경우에만 사용한다. 서비스 핵심 도메인 데이터 저장은 `backend/DB.md` 기준으로 DB에 맞춰 구현한다.

## 검증 규칙
- `npm run build`
- 필요한 경우 `npm run start:dev`
- operation 추가/수정 시 `/API-doc` 반영 여부 확인
