# Backend Worker Guide

## 목적
이 문서는 backend에서 cron, batch, queue consumer 같은 background worker를 작성할 때 따르는 구조 가이드다. 작업 직전 확인용 요약은 `backend/docs/WORKER-CHECKLIST.md`를 본다.

## 기본 구조
- 서버 시작 후 `server.js`의 `server.listen(...)` 안에서 `backend/worker/registCron.js`를 호출한다.
- root worker registry인 `backend/worker/registCron.js`는 도메인별 `backend/<domain>/worker/registCron.js`를 모아 실행한다.
- 도메인별 `registCron.js`는 `node-cron` schedule 등록만 담당한다.
- 실제 작업 로직은 같은 폴더의 `lowerCamelCase.js` worker 파일 또는 도메인 `module/` 함수로 분리한다.
- `registCron.js` 파일명은 기존 템플릿 이름을 유지한다. 새 registry도 `registerCron.js`로 바꾸지 않는다.
- worker는 `/API` operation middleware를 거치지 않는다.
- worker 로직은 보통 `module.exports = async function workerName(){ ... }` 형태로 작성한다.
- worker 파일은 항상 `// producer`, `// consumer` 영역을 구분한다.
- `queueName`은 worker 파일마다 반드시 선언하고, 값은 `WP:<workerName>` 형식을 사용한다.
- consumer가 필요 없으면 `// consumer` 아래에 `// consumer 없음`을 남긴다.
- worker는 `/API-doc` 문서화 대상이 아니다.

## 생성 명령
- 기본 생성: `npm run create:backend-worker -- <domain> <workerName>`
- 단일 경로 인자: `npm run create:backend-worker -- <domain>/<workerName>`
- cron을 바로 활성화하려면 `--cron "0 * * * *"`와 `--comment "1시간마다 실행"`을 함께 지정한다.
- `--cron`을 생략하면 도메인 `worker/registCron.js`에 주석 처리된 schedule block을 생성한다.
- 기본 생성은 consumer 없음으로 만들고, consumer가 필요하면 `--consumer`를 사용한다.
- 기본 worker 파일은 producer 중복 실행 방지용 `util.worker.tryWorkerProcessLock(workerName, ttlSeconds)` guard를 포함한다.
- producer 중복 실행 방지가 필요 없으면 `--no-lock`, TTL을 바꾸려면 `--ttl 600`을 사용한다.

## 언제 worker로 만들지
- 특정 주기로 실행해야 하는 정리, 동기화, 알림, 통계, 결제, 만료 처리
- 서버 부팅 후 한 번 초기화해야 하는 캐시, 외부 데이터 갱신, batch bootstrap
- 한 번에 처리량이 많은 작업을 작은 단위로 나눠 처리하는 queue producer/consumer
- socket event, email, webhook 재시도처럼 사용자 요청과 분리해도 되는 비동기 후속 처리

다음은 worker로 만들지 않는다.
- 사용자의 즉시 응답이 필요한 일반 업무 API
- 인증/권한/입력값 계약이 `/API-doc`에 드러나야 하는 기능
- 외부 서비스가 서버로 직접 호출해야 하는 callback endpoint

이 경우에는 각각 `/API` operation 또는 webhook으로 구현한다.

## Cron Registry 작성
도메인별 `backend/<domain>/worker/registCron.js`는 schedule과 에러 처리만 둔다.

```js
const cron = require('node-cron');

const leaveAccountConfirm = require('./leaveAccountConfirm.js')

module.exports = function(){
    // 1시간마다 실행
    cron.schedule('0 * * * *', async () => {
        try{
            await leaveAccountConfirm()
        }catch(e){
            console.error(e);
        }
    });
}
```

작성 규칙:
- `node-cron` cron expression은 주석으로 사람이 읽을 수 있게 설명한다.
- schedule callback 안에는 긴 비즈니스 로직을 직접 쓰지 말고 worker 함수를 호출한다.
- schedule 단위마다 `try/catch`를 둬서 한 작업의 실패가 프로세스를 종료시키지 않게 한다.
- 운영 알림 채널이 프로젝트에 연결돼 있으면 `console.error(e)` 뒤에 error report 전송을 추가한다.
- 도메인 `worker/registCron.js`를 만들거나 수정하면 root `backend/worker/registCron.js` 집계를 확인한다.
- cron 등록 함수는 async로 만들 필요가 있을 때만 async로 만든다.

## Worker 로직
worker 로직 파일은 operation과 다르게 response class를 반환하지 않는다.

```js
const util = require('../../core/util.js')

// producer
const queueName = 'WP:leaveAccountConfirm'
module.exports = async function leaveAccountConfirm(){
    const ttlSeconds = 10 * 60
    if(!await util.worker.tryWorkerProcessLock('leaveAccountConfirm', ttlSeconds)) return

    // 핵심 비즈니스 처리
    await util.mysql.update(
        'database1',
        'user',
        {
            leaveComplete: 1
        },
        'leaveComplete=0 AND leaveAt<=DATE_SUB(NOW(), INTERVAL 7 DAY)'
    )
}

// consumer
// consumer 없음
```

작성 규칙:
- 파일명과 export 함수명은 같은 `lowerCamelCase`를 우선한다.
- worker 파일은 `// producer` 영역에 export 함수를 두고, `queueName`은 export 함수보다 위에 둔다.
- `queueName` 값은 반드시 `WP:<workerName>`으로 작성한다.
- `// consumer` 영역은 파일 하단에 두고, consumer가 없으면 `// consumer 없음`을 명시한다.
- worker 내부에서도 입력값 또는 대상 데이터가 있으면 먼저 검증한다.
- update/delete 전에는 대상 존재 여부와 권한 또는 범위 조건을 확인한다.
- DB 접근 규칙은 `backend/docs/DB.md`를 따른다.
- 파일 처리 규칙은 `backend/docs/FILE.md`를 따른다.
- socket event를 보내야 하면 `util.socket`를 사용하고 `backend/docs/SOCKET.md`의 event 문서화 규칙을 따른다.
- 서비스 핵심 데이터는 DB에 저장한다. JSON, txt, 로컬 캐시 파일을 본 저장소로 만들지 않는다.
- 작업 결과를 사용자에게 바로 반환해야 하면 worker가 아니라 operation으로 만든다.

## 중복 실행 방지
cron worker는 서버 프로세스마다 등록된다. PM2 cluster, nodemon 중복 실행, 여러 서버 instance를 쓰는 경우 같은 작업이 여러 번 실행될 수 있다.

기본 규칙:
- 중복 실행되면 안 되는 producer는 함수 시작부에서 `util.worker.tryWorkerProcessLock(workerName, ttlSeconds)`로 실행 lock 획득을 시도한다.
- `workerName`은 worker 함수명과 같은 고유한 이름을 사용한다.
- `ttlSeconds`는 lock key의 만료 시간이며, 예상 작업 소요시간보다 여유 있게 설정한다.
- lock 획득에 실패하면 이미 다른 프로세스 또는 서버에서 실행 중인 것으로 보고 바로 return한다.
- 결제, 정산, 알림 발송처럼 중복 실행 피해가 큰 작업은 Redis lock 외에도 DB unique key 또는 상태 컬럼으로 멱등성을 보장한다.

예:
```js
const ttlSeconds = 30 * 60
if(!await util.worker.tryWorkerProcessLock('createMonthlyInvoice', ttlSeconds)) return
```

## Queue Worker
worker는 기본적으로 producer와 consumer 영역을 나눠 작성한다. 처리량이 큰 작업은 cron에서 전체 처리를 직접 수행하지 말고 producer가 queue에 넣고 consumer가 처리하게 한다.

기본 흐름:
1. cron 또는 operation이 대상 목록을 조회한다.
2. producer가 `util.redis.queue(queueName, payload)`로 작은 작업 단위를 넣는다.
3. consumer가 `util.redis.consume(queueName, handler)`로 작업을 하나씩 처리한다.

작성 규칙:
- `queueName`은 파일 상단에 `const queueName = 'WP:<workerName>'` 형식으로 한 번만 선언한다.
- queue payload에는 필요한 최소 식별자와 처리 기준값만 넣는다.
- `--consumer`로 생성한 worker는 `// consumer` 영역에 `util.redis.consume(queueName, async (data) => { ... })` 기본 블록을 둔다.
- consumer는 파일 load 시점에 한 번만 등록되게 worker 파일의 top-level에 둔다.
- consumer가 있는 worker 파일은 도메인 `worker/registCron.js` 또는 서버 부팅 흐름에서 반드시 한 번 import되게 연결한다.
- consumer가 필요 없는 worker도 `// consumer`와 `// consumer 없음`을 남겨 의도를 명확히 한다.
- consumer handler 내부에서 예상 가능한 실패를 잡고 기록한다.
- 실패 재시도, 중복 처리, poison message 정책이 필요한 작업은 먼저 DB 상태값 또는 재시도 카운터 설계를 정한다.
- `util.redis.queue/consume`을 쓰는 작업은 `server.js`에서 `util.redis.init()`가 worker 실행 전에 완료되는지 확인한다.
- `redis` 설정과 dependency는 placeholder 상태로 두되, 실제 서비스에서 사용할 값은 환경별 설정으로 관리한다.

## 부팅 시 1회 실행 작업
서버 시작 직후 한 번 실행해야 하는 작업은 `server.listen(...)` 안에서 필요한 초기화 뒤에 호출한다.

작성 규칙:
- DB, S3, Redis 등 필요한 연결이 완료된 뒤 실행한다.
- 필수 초기화라면 `await`로 실패를 드러낸다.
- best-effort 갱신이면 `try/catch`로 감싸고 서버 시작을 막을지 여부를 명확히 정한다.
- 반복 실행되는 작업이면 부팅 1회 호출과 cron 등록을 분리한다.

## 에러 처리와 관측
- cron callback에는 `try/catch`를 둔다.
- worker 함수는 호출자가 에러 처리 방침을 정할 수 있게 예상 밖 에러를 숨기지 않는다.
- 예상 가능한 데이터 상태는 throw보다 조건 분기로 처리한다.
- 외부 API, 결제, 이메일, 파일, queue consumer는 실패 기록 위치를 명확히 둔다.
- 운영 알림을 붙일 때 실제 토큰이나 webhook URL은 설정 파일에 커밋하지 않는다.

## 작업 후
- 도메인 `worker/registCron.js`와 root `backend/worker/registCron.js` 집계가 맞는지 확인한다.
- cron expression과 주석이 서로 맞는지 확인한다.
- producer 중복 실행 방지가 필요한 작업이면 `tryWorkerProcessLock()`을 사용하고 `ttlSeconds`가 예상 작업 소요시간보다 넉넉한지 확인한다.
- worker 파일에 `queueName`, `// producer`, `// consumer` 또는 `// consumer 없음`이 모두 있는지 확인한다.
- worker가 DB를 바꾸면 `backend/docs/DB.md` 규칙을 다시 확인한다.
- queue worker면 Redis 연결 순서와 consumer 등록 위치를 확인한다.
- 기본 검증은 `npm run build`로 수행한다.
