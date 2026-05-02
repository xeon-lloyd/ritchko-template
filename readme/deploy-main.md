# 배포 세부설명 문서

이 프로젝트는 GitHub Actions와 PM2를 사용해서 `production` 브랜치 push 시 운영 서버로 자동 배포한다.

Docker는 사용하지 않는다. GitHub Actions runner가 저장소 파일을 checkout한 뒤 SSH/rsync로 서버에 밀어넣고, 서버에서 `npm ci`, `npm run build`, `pm2 reload`를 실행한다.

[돌아가기](../readme.md#배포)

## 배포 흐름

1. `production` 브랜치에 push한다.
2. GitHub Actions가 저장소를 checkout한다.
3. GitHub Secrets 값으로 운영 설정 파일을 생성한다.
   - `backend/core/setting.js`
   - `public/js/env.js`
4. SSH로 서버에 접속한다.
5. `rsync --delete`로 프로젝트 파일을 서버 배포 폴더에 동기화한다.
6. 서버에서 의존성을 설치하고 프론트 CSS를 빌드한다.
7. PM2로 앱을 reload한다. 실행 중인 앱이 없으면 start한다.

## 서버 준비

운영 서버에는 아래 프로그램이 설치되어 있어야 한다.

```bash
node
npm
pm2
rsync
```

Ubuntu/Debian 기준 설치 예:

```bash
sudo apt update && sudo apt install -y nodejs npm rsync && sudo npm i -g pm2
```

PM2는 전역 설치를 권장한다.

```bash
npm i -g pm2
```

배포 폴더는 SSH 접속 유저가 쓰기 권한을 가져야 한다.

```bash
sudo mkdir -p /home/<SERVER_USER>/<APP_NAME>
sudo chown -R <SERVER_USER>:<SERVER_USER> /home/<SERVER_USER>/<APP_NAME>
```

기존에 `sudo`로 배포한 적이 있으면 `node_modules`, PM2 실행 유저, 배포 폴더 소유권이 꼬일 수 있다. 가능하면 배포, `npm ci`, PM2 실행은 모두 같은 유저로 맞춘다.

## GitHub Secrets

`.github/workflows/production.yml`은 아래 Secrets를 사용한다.

```text
APP_NAME
SERVER1_IP
SERVER1_USER
SERVER1_PORT
SERVER1_KEY
SERVER1_PASSWORD
BACK_SETTING_PROD
FRONT_ENV_PROD
```

`SERVER1_KEY`와 `SERVER1_PASSWORD`는 둘 중 하나만 있어도 된다.

- SSH key 인증 서버: `SERVER1_KEY` 사용
- password 인증 서버: `SERVER1_PASSWORD` 사용

둘 다 있으면 `SERVER1_KEY`를 우선 사용한다.

## 운영 설정 파일

운영 서버의 아래 파일은 수동으로 관리하지 않는다.

```text
backend/core/setting.js
public/js/env.js
```

배포 시 GitHub Secrets 값으로 생성해서 서버에 업로드한다.

`BACK_SETTING_PROD`에는 `backend/core/setting.js`의 전체 파일 내용을 넣는다.

`FRONT_ENV_PROD`에는 `public/js/env.js`의 전체 파일 내용을 넣는다.

## PM2 실행

PM2 실행 이름과 instance 수는 운영 `backend/core/setting.js`에서 설정한다.

`BACK_SETTING_PROD`에 넣는 `setting.js` 내용에서 아래 값을 운영 환경에 맞게 수정한다.

```js
const setting = {
    AppName: 'my-service',
    pm2InstanceCount: 0,
    // ...
}
```

`AppName`은 PM2 앱 이름으로 사용된다.

`pm2InstanceCount`는 PM2 실행 instance 수다.

- `1`: fork mode로 1개 실행
- `0`: CPU 수만큼 cluster mode 실행
- `2` 이상: 지정한 개수만큼 cluster mode 실행

## 운영 배포 명령

개발자는 보통 아래 흐름으로 배포한다.

```bash
git checkout production
git merge main
git push origin production
```

push 이후 GitHub Actions의 `production deploy` workflow가 자동 실행된다.

## 주의사항

- `rsync --delete`를 사용하므로 저장소에서 삭제한 파일은 서버에서도 삭제된다.
- 서버에만 존재해야 하는 파일은 workflow에서 exclude하거나 GitHub Secret으로 생성해야 한다.
- `backend/core/setting.js`, `public/js/env.js`는 GitHub Secret이 원본이다.
- 서버에 password SSH를 사용할 경우 password login이 허용되어 있어야 한다.
- SSH key 방식을 사용할 경우 secret에는 private key 전체 내용을 넣는다.
- PM2 앱이 root로 떠 있으면 deploy user의 `pm2 reload`가 기존 앱을 못 찾을 수 있다.

## 문제 해결

### SSH 접속 실패

확인할 값:

```text
SERVER1_IP
SERVER1_USER
SERVER1_PORT
SERVER1_KEY 또는 SERVER1_PASSWORD
```

서버가 password login을 막고 있으면 `SERVER1_PASSWORD` 방식은 실패한다. 이 경우 SSH key 방식을 사용한다.

### rsync 권한 오류

배포 폴더의 소유권을 확인한다.

```bash
ls -al /home/<SERVER_USER>/<APP_NAME>
```

필요하면 소유권을 맞춘다.

```bash
sudo chown -R <SERVER_USER>:<SERVER_USER> /home/<SERVER_USER>/<APP_NAME>
```

### npm ci 실패

서버의 Node/npm 버전과 `package-lock.json` 상태를 확인한다.

```bash
node -v
npm -v
```

`package.json`과 `package-lock.json`이 맞지 않으면 `npm ci`는 실패한다.

### PM2 reload 실패

PM2 앱 목록을 확인한다.

```bash
pm2 list
```

배포 workflow는 reload가 실패하면 start를 시도한다. 그래도 실패하면 PM2 로그를 확인한다.

```bash
pm2 logs
```
