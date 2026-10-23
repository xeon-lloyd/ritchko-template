# 실행 가이드

[README](../readme.md) · **시작하기** · [프론트엔드](./front-main.md) · [백엔드](./backend-main.md) · [배포](./deploy-main.md)

로컬 개발 환경을 설정하고 서버와 SCSS 감시를 함께 실행하는 방법입니다. 운영 배포와 PM2 관리는 [배포 가이드](deploy-main.md)에서 다룹니다.

## 1. 실행 준비

이 템플릿을 바탕으로 본인의 GitHub 저장소를 만든 뒤 로컬로 가져옵니다. 아래 `<저장소-URL>`과 `<프로젝트-폴더>`는 본인 저장소에 맞게 바꿉니다.

```bash
git clone <저장소-URL>
cd <프로젝트-폴더>
```

이후 명령은 모두 이 프로젝트 폴더에서 실행합니다.

- Node.js와 npm을 준비합니다. 저장소에는 Node.js 버전이 고정되어 있지 않습니다.
- Redis 연결을 준비합니다. 서버 시작 시 연결을 기다리며, 토큰과 worker 등에서 사용합니다.
- 공통 MySQL 설정을 확인합니다. 서버 시작 코드가 `database1` alias의 pool을 초기화합니다.
- S3·SMTP·Discord 등은 사용할 기능에 맞게 설정합니다. 파일 업로드에는 S3 설정이 필요합니다.

프로젝트 루트에서 의존성을 설치합니다.

```bash
npm install
```

## 2. 로컬 설정

설정 파일이 없다면 템플릿을 복사합니다. 기존 로컬 설정은 덮어쓰지 말고 필요한 항목을 비교하세요.

PowerShell:

```powershell
Copy-Item backend/core/setting.template.js backend/core/setting.js
Copy-Item public/js/env.template.js public/js/env.js
```

macOS / Linux:

```bash
cp backend/core/setting.template.js backend/core/setting.js
cp public/js/env.template.js public/js/env.js
```

| 파일 | 확인할 항목 |
| --- | --- |
| `backend/core/setting.js` | `AppName`, `hostName`, `port`, `isProduction`, MySQL·Redis 연결, 사용하는 외부 서비스 설정 |
| `public/js/env.js` | 공개 호스트와 프론트 토큰 관련 설정 |

로컬에서는 `isProduction: false`로 설정합니다. 기본 포트는 `80`이며, `setting.port`를 `3000`으로 바꾸면 주소는 `http://localhost:3000`입니다.

템플릿의 접속값은 실제 로컬 환경에 맞게 바꿔야 합니다. Redis를 사용하지 않는 상태로 그대로 시작할 수 있는 구성은 아닙니다. S3 설정이 유효하지 않으면 초기화를 건너뛰며 로그의 S3 백업도 사용할 수 없습니다.

두 로컬 설정 파일은 Git에서 제외됩니다. 실제 비밀번호·API 키·토큰을 설정 템플릿에 넣지 마세요. `public/js/env.js`는 브라우저에 제공되므로 공개 가능한 값만 넣습니다.

## 3. 개발 실행

```bash
npm run start:dev
```

다음 두 작업을 함께 실행합니다.

- `nodemon server.js`: 서버 파일 변경 시 재시작
- `sass --watch public/scss:public/css`: SCSS 변경 시 CSS 생성

기본 포트 기준 접속 주소입니다.

| 주소 | 화면 |
| --- | --- |
| `http://localhost/` | 기본 페이지 |
| `http://localhost/_designSystemSample` | 디자인 시스템 샘플 |
| `http://localhost/API-doc` | operation 문서 |
| `http://localhost/API-doc/webhooks` | webhook 문서 |
| `http://localhost/API-doc/sockets` | socket 문서 |
| `http://localhost/API-doc/fileUpload` | 파일 업로드 문서 |

샘플과 API 문서 화면은 개발 환경에서 제공합니다. 종료하려면 터미널에서 `Ctrl+C`를 누릅니다. PowerShell 실행 정책 오류가 나면 `npm.cmd run start:dev`를 사용하세요.

## 4. CSS 빌드

```bash
npm run build
```

현재 `build`는 SCSS를 압축 CSS로 변환합니다. JavaScript 번들링은 포함하지 않습니다. 생성되는 `public/css/`는 직접 수정하거나 커밋하지 않습니다.

## 프로젝트 구조

```text
ritchko-template/
├── server.js      Express 서버와 페이지 라우팅
├── views/         페이지 HTML과 EJS 공통 조각
├── public/
│   ├── js/        페이지 스크립트와 공통 API helper
│   └── scss/      디자인 시스템과 페이지 스타일
├── backend/       operation·webhook·socket·worker와 공통 유틸
├── scripts/       새 페이지와 백엔드 기능 생성 도구
├── convention/    공통 코드 작성 규칙
└── readme/        사용 가이드
```

## 실행이 안 될 때

| 증상 | 확인할 내용 |
| --- | --- |
| 설정 모듈을 찾지 못함 | 두 설정 템플릿을 복사했는지 확인 |
| 서버가 열리지 않음 | Redis 연결, 시작 오류, 포트 충돌·권한 확인 |
| 스타일이 보이지 않음 | SCSS 감시 또는 CSS 빌드 여부 확인 |
| API 문서·샘플이 열리지 않음 | 접속 포트와 `isProduction` 확인 |
