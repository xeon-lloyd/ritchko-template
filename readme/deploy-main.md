# 배포 가이드

[README](../readme.md) · [시작하기](./run-main.md) · [프론트엔드](./front-main.md) · [백엔드](./backend-main.md) · **배포**

GitHub Actions가 `develop`·`production` 브랜치 push를 감지해 각각 개발·운영 환경으로 배포합니다. 환경별 폴더에 파일을 동기화하고, 의존성 설치·CSS 빌드·PM2 reload를 수행합니다. 기본 설정은 Docker 없이 서버 접속 정보를 공유하는 구성이며, Secrets와 workflow 매핑을 변경하면 개발·운영 서버를 분리할 수 있습니다.

## 배포 흐름

```text
develop push    → DEV Secrets  → 개발 배포 폴더 → 설치·빌드 → 개발 PM2 앱
production push → PROD Secrets → 운영 배포 폴더 → 설치·빌드 → 운영 PM2 앱
```

기준 파일은 [develop.yml](../.github/workflows/develop.yml), [production.yml](../.github/workflows/production.yml), [ecosystem.config.js](../ecosystem.config.js)입니다. 두 workflow 모두 `npm ci` → `npm run build` → PM2 reload 순서로 처리하고, reload가 실패하면 start를 시도합니다.

## 1. 서버 준비

운영 서버에는 Node.js, npm, PM2, rsync와 SSH 접속 환경이 필요합니다. Node.js와 npm을 준비한 뒤 PM2를 설치합니다.

```bash
npm install -g pm2
```

서버의 MySQL·Redis 등 연결도 운영 설정에 맞게 준비합니다. 개발 실행과 설정 항목은 [실행 가이드](run-main.md)를 참고하세요.

배포 경로는 개발 `/home/<SERVER1_USER>/<APP_NAME_DEV>`, 운영 `/home/<SERVER1_USER>/<APP_NAME_PROD>`입니다. 두 앱 이름은 서로 다른 값으로 지정합니다. workflow는 각 경로를 생성하므로 SSH 사용자가 해당 위치에 쓰기 권한을 가져야 합니다. 배포·의존성 설치·PM2 실행은 같은 사용자로 관리하세요.

## 2. GitHub Secrets 등록

저장소의 GitHub Actions Secrets에 서버 공통 값과 환경별 값을 등록합니다.

| Secret | 값 |
| --- | --- |
| `SERVER1_IP` | 서버 주소 |
| `SERVER1_USER` | SSH 사용자 |
| `SERVER1_PORT` | SSH 포트 |
| `SERVER1_KEY` | SSH private key 전체 내용. key 인증 시 사용 |
| `SERVER1_PASSWORD` | SSH 비밀번호. password 인증 시 사용 |

| 개발 Secret | 운영 Secret | 값 |
| --- | --- | --- |
| `APP_NAME_DEV` | `APP_NAME_PROD` | 환경별 배포 폴더 이름. 예: `my-service-dev`, `my-service-prod` |
| `BACK_SETTING_DEV` | `BACK_SETTING_PROD` | 환경별 `backend/core/setting.js` 전체 내용 |
| `FRONT_ENV_DEV` | `FRONT_ENV_PROD` | 환경별 `public/js/env.js` 전체 내용 |

`SERVER1_KEY`와 `SERVER1_PASSWORD`는 둘 중 하나가 필요하며, 둘 다 있으면 key를 우선합니다. password 방식은 서버가 해당 인증을 허용해야 합니다. 각 workflow는 서버 공통 값과 해당 환경의 필수 값만 확인하며, 누락 시 동기화 전에 실패합니다.

기존 단일 배포에서 사용하던 `APP_NAME` Secret은 더 이상 참조하지 않습니다. 기존 운영 폴더를 유지하려면 그 값을 `APP_NAME_PROD`에 옮기고, 개발용 `APP_NAME_DEV`는 별도로 등록합니다.

## 3. 환경별 설정 준비

[백엔드 설정 템플릿](../backend/core/setting.template.js)과 [프론트 설정 템플릿](../public/js/env.template.js)을 기준으로 개발·운영 설정을 각각 작성하고 해당 Secret에 전체 파일 내용을 넣습니다.

- `isProduction`은 개발 `false`, 운영 `true`로 설정합니다.
- 공개 호스트, DB·Redis와 사용할 외부 서비스의 값을 각 환경에 맞춥니다.
- 같은 서버에서 동시에 실행한다면 `port`는 서로 다른 값으로 설정합니다. 서버를 분리했다면 같은 포트를 사용할 수 있습니다.
- 배포 폴더는 `APP_NAME_DEV`·`APP_NAME_PROD`, PM2 앱 이름은 각 백엔드 설정의 `AppName`으로 정합니다. 같은 서버·사용자의 PM2에서 실행한다면 앱 이름도 환경별로 달라야 하며, 해당 배포 폴더와 같은 이름을 권장합니다.

배포 때마다 Secrets로 두 설정 파일을 생성해 서버에 동기화합니다. 서버에서 직접 고친 설정은 다음 배포 때 덮어써집니다. 프론트 설정은 브라우저에 공개되므로 비밀값을 넣지 않습니다.

## 배포 전 확인

현재 workflow는 `rsync --delete`를 사용하며 `.git`, `node_modules`, `logs`를 제외합니다. `logs`는 배포 동기화에서 보존되지만, 그 외 배포 폴더에만 존재하는 파일은 삭제될 수 있습니다. 업로드 등 보존할 파일이 있다면 배포 전에 폴더를 분리하거나 workflow의 제외 목록을 조정해야 합니다.

### 개발·운영 서버를 분리하는 경우

현재 두 workflow는 공통 `SERVER1_*` Secrets로 같은 서버에 접속합니다. 서버를 분리하려면 주소·사용자·SSH 포트·인증값을 서버별 Secrets로 등록하고, 각 workflow가 배포할 서버의 값을 참조하도록 변경합니다. Secret 이름과 서버 구분 방식은 사용자가 원하는 대로 정하면 됩니다.

각 workflow에서 `env`의 `SERVER_HOST`, `SERVER_USER`, `SERVER_PORT`, `SERVER_KEY`, `SERVER_PASSWORD` 매핑과 `DEPLOY_PATH`의 사용자 참조를 맞춥니다. 필수 Secret 검사와 오류 메시지에도 실제로 정한 이름을 반영합니다. 인증값은 각 서버에서 key 또는 password 중 하나만 준비하면 됩니다.

앱 이름과 설정 파일은 기존 `APP_NAME_DEV`·`APP_NAME_PROD`, `BACK_SETTING_DEV`·`BACK_SETTING_PROD`, `FRONT_ENV_DEV`·`FRONT_ENV_PROD` 구분을 유지합니다. 설정 파일의 호스트·포트·외부 서비스 연결값도 각 서버 환경에 맞춥니다. 현재 파일 동기화와 PM2 실행 단계는 환경당 한 서버를 대상으로 하며, 한 환경을 여러 서버에 동시에 배포하려면 별도 확장이 필요합니다.

## 4. 배포 실행

브랜치는 개발용 `develop`과 운영 배포용 `production` 구성을 권장합니다. 각 브랜치 이름은 해당 workflow의 `on.push.branches` 설정과 일치해야 합니다.

개발 배포는 `develop` 브랜치에 커밋한 뒤 push합니다.

```bash
git push origin develop
```

아래는 두 브랜치가 준비된 상태에서 `develop`의 변경을 운영에 반영하는 예시입니다. 로컬 변경을 정리하고 병합 결과를 검토한 뒤 push합니다.

```bash
git checkout production
git merge develop
git push origin production
```

GitHub Actions의 `develop deploy` 또는 `production deploy` 실행 결과를 확인합니다. 각 workflow는 해당 배포 폴더에서 다음 순서로 처리합니다.

```bash
npm ci
npm run build
pm2 reload ecosystem.config.js
```

reload가 실패하면 `pm2 start ecosystem.config.js`를 시도합니다. 배포 후에는 실제 서비스 접속과 PM2 로그를 확인하세요.

## 5. PM2 실행과 관리

`ecosystem.config.js`는 백엔드 설정의 다음 값을 사용합니다.

| 설정 | 동작 |
| --- | --- |
| `AppName` | PM2 앱 이름 |
| `pm2InstanceCount: 1` | fork 모드로 1개 실행 |
| `pm2InstanceCount: 0` | CPU 수에 맞춰 cluster 모드 실행 |
| `pm2InstanceCount: 2` 이상 | 지정한 개수로 cluster 모드 실행 |

자동 배포에서는 workflow가 PM2 실행을 처리합니다. 수동으로 처음 실행할 때는 해당 환경의 설정과 의존성 설치, CSS 빌드가 준비된 서버의 개발 또는 운영 배포 폴더에서 실행합니다.

```bash
pm2 start ecosystem.config.js
```

이후 상태 확인, 로그 조회, 재실행, 중지는 다음 명령을 사용합니다. `<AppName>`은 해당 환경 설정의 실제 앱 이름으로 바꿉니다. `ecosystem.config.js`를 사용하는 명령은 관리할 환경의 배포 폴더에서 실행합니다.

```bash
pm2 list
pm2 logs <AppName>
pm2 reload ecosystem.config.js
pm2 stop <AppName>
```

## 문제 해결

| 증상 | 확인할 내용 |
| --- | --- |
| Secrets 검증 실패 | 필수 값과 SSH 인증값 등록 여부 |
| SSH 접속 실패 | 주소·포트·사용자, key 전체 내용, 서버 인증 정책 |
| rsync 권한 오류 | 배포 경로 소유권과 SSH 사용자 쓰기 권한 |
| `npm ci` 실패 | 서버 Node.js·npm 환경, manifest와 lockfile 일치 여부 |
| 빌드 실패 | Actions 로그의 SCSS 오류 |
| PM2 앱을 찾지 못함 | 실행 사용자와 설정의 `AppName` |
| 서버 시작 실패 | 운영 설정, Redis 연결, 포트와 PM2 로그 |

