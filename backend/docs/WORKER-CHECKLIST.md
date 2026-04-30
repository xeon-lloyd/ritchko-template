# Backend Worker Checklist

## 작업 전
- cron, 부팅 1회 작업, queue worker 중 어떤 유형인지 구분한다.
- 새 worker는 `npm run create:backend-worker -- <domain> <workerName>`로 생성하는 것을 우선한다.
- cron을 바로 등록할 작업이면 `--cron`과 `--comment`를 함께 지정할지 확인한다.
- 즉시 응답이 필요한 기능이면 worker가 아니라 `/API` operation으로 구현한다.
- 외부 callback endpoint면 worker가 아니라 webhook으로 구현한다.
- 작업 대상 도메인의 `worker/` 폴더와 `registCron.js` 유무를 확인한다.
- DB 작업이면 `backend/docs/DB.md`, `backend/docs/DB-CHECKLIST.md`를 확인한다.
- 파일 처리 작업이면 `backend/docs/FILE.md`, `backend/docs/FILE-CHECKLIST.md`를 확인한다.
- socket event를 보내면 `backend/docs/SOCKET.md`, `backend/docs/SOCKET-CHECKLIST.md`를 확인한다.
- 단일 실행 작업이면 `tryWorkerProcessLock()`이 필요한지 확인한다.
- queue를 쓰면 Redis 연결과 dependency가 준비돼 있는지 확인한다.

## 구현 중
- root `backend/worker/registCron.js`가 도메인 `worker/registCron.js`를 호출하는지 확인한다.
- 스캐폴드 없이 직접 만들었다면 worker 파일, 도메인 `worker/registCron.js`, root `backend/worker/registCron.js`가 모두 연결됐는지 확인한다.
- 도메인 `registCron.js`에는 schedule 등록과 에러 처리만 둔다.
- 실제 비즈니스 로직은 별도 worker 파일 또는 도메인 `module/` 함수로 분리한다.
- worker 파일명과 export 함수명은 `lowerCamelCase`로 맞춘다.
- cron expression 옆에는 실행 주기를 주석으로 남긴다.
- schedule callback마다 `try/catch`를 둔다.
- 단일 실행 작업이면 worker 시작부에서 `util.worker.tryWorkerProcessLock(workerName, ttlSeconds)`를 호출한다.
- `ttlSeconds`는 예상 작업 소요시간보다 여유 있게 설정한다.
- 여러 서버에서 동시에 실행될 수 있으면 Redis lock 외에도 DB unique key 같은 멱등성 장치를 설계한다.
- 결제, 정산, 알림 발송처럼 중복 피해가 큰 작업은 DB unique key 또는 상태 컬럼으로 보호한다.
- queue payload에는 필요한 최소 식별자와 기준값만 넣는다.
- consumer worker 파일이 도메인 `worker/registCron.js` 또는 서버 부팅 흐름에서 한 번 import되는지 확인한다.
- consumer handler에서는 예상 가능한 실패를 잡고 기록한다.
- 서비스 핵심 데이터는 DB에 저장하고 JSON, txt, 로컬 캐시 파일을 본 저장소로 쓰지 않는다.
- 실제 비밀번호, API 키, 토큰, DB 접속 정보는 커밋하지 않는다.

## 구현 후
- root worker registry와 도메인 worker registry가 모두 갱신됐는지 확인한다.
- cron expression과 한국어 주석의 실행 주기가 일치하는지 확인한다.
- worker가 `/API-doc` 대상이 아니라는 점을 전제로 별도 문서나 운영 메모가 필요한지 확인한다.
- DB update/delete 범위가 과도하지 않은지 확인한다.
- queue worker면 `util.redis.init()`가 worker 실행 전에 완료되는지 확인한다.
- 중복 실행 시에도 결과가 깨지지 않는지 확인한다.
- 필요 시 `npm run build`를 실행한다.
