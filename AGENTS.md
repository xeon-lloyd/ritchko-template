# AGENTS.md

## 목적
이 문서는 레포 전체의 진입점이다. 세부 규칙은 작업 영역의 `AGENTS.md`와 주제별 문서를 따른다.

## 프로젝트 성격
- 개인 웹서비스 제작용 Node.js 템플릿이다.
- 프론트는 순수 `html + scss + js`, 백엔드는 순수 `js + express` 기반이다.
- 백엔드는 REST 라우터보다 `/API` 단일 endpoint와 `operation` 레지스트리 중심 구조다.

## 작업 전 읽는 순서
1. `server.js`
2. `backend/_system_/initialize.sys.js`
3. `backend/_system_/middleware.sys.js`
4. `backend/_operations.sys.js`
5. 작업 영역의 `AGENTS.md`
6. 작업 주제별 가이드와 체크리스트
7. 필요한 `convention/*.md`

## 영역별 문서
- 백엔드: `backend/AGENTS.md`, `backend/CHECKLIST.md`, `backend/CONVENTION.md`
- DB: `backend/docs/DB.md`, `backend/docs/DB-CHECKLIST.md`
- 파일 업로드: `backend/docs/FILE.md`, `backend/docs/FILE-CHECKLIST.md`
- 뷰 템플릿: `views/AGENTS.md`
- 프론트 스크립트: `public/js/AGENTS.md`
- 스타일: `public/scss/AGENTS.md`
- 공통 컨벤션: `convention/README.md`

## 핵심 원칙
- 기존 구조와 네이밍을 우선한다.
- 템플릿에 없는 외부 프레임워크 기준으로 구조를 재편하지 않는다.
- 실제 비밀번호, API 키, 토큰, DB 접속 정보는 커밋하지 않는다.
- `backend/core/setting.js`, `public/js/env.js`는 placeholder 성격을 유지한다.
- 서비스 핵심 도메인 데이터는 DB에 저장한다. JSON, txt, 로컬 캐시 파일을 본 저장소처럼 새로 도입하지 않는다.
- 파일 저장은 업로드 임시파일, 로그, 캐시, export 산출물처럼 파일이 본질인 경우에만 사용한다.
- DB 날짜 저장 규칙은 `backend/docs/DB.md`를 따른다.

## 생성 명령
- 백엔드 도메인: `npm run create:backend-domain -- <name>`
- 백엔드 operation: `npm run create:backend-operation -- <domain> <OperationName>`
- Windows PowerShell 실행 정책 문제가 있으면 `npm.cmd run ...`을 사용한다.

## 검증
- 기본 검증: `npm run build`
- 필요한 경우: `npm run start:dev`
- operation 추가/수정 시 `/API-doc` 반영 여부를 확인한다.
