# Backend Socket Checklist

## 작업 전
- client > server 요청인지 server > client 이벤트인지 구분한다.
- 새 socket은 `npm run create:backend-socket -- <domain> <SocketNameMessage|SocketNameEvent>`로 생성하는 것을 우선한다.
- message 이름은 `Message`, event 이름은 `Event` suffix로 정한다.
- 인증이 필요하면 `_sockets.sys.js`에 `authRequire: true`를 둘지 확인한다.
- room join이 필요한지, room 이름을 `<domain>:<id>` 형태로 정할지 확인한다.
- room join 전 대상 존재 여부와 권한 확인 조건을 정한다.
- message param을 도메인 `_param.sys.js`에 추가할지 확인한다.
- event payload, message ack, 실패 response를 도메인 `_response.sys.js`에 추가할지 확인한다.
- DB 작업이면 `backend/docs/DB.md`, 파일 처리면 `backend/docs/FILE.md`를 함께 확인한다.
- 여러 서버 instance에서 broadcast가 필요하면 Redis adapter 설정 필요 여부를 확인한다.

## 구현 중
- message/event 추가 시 `_sockets.sys.js`, `_param.sys.js`, `_response.sys.js`를 스캐폴드 산출물 구조와 맞춘다.
- message 로직 기본 export를 `module.exports = async function(socket, data){ ... }`로 작성한다.
- 입력값 검증을 가장 먼저 둔다.
- `data`는 구조분해하지 않고 `data.xxx`로 사용한다.
- 예상 가능한 실패는 throw하지 않고 `socket.emit('_error', new response.X())` 후 return한다.
- `authRequire`는 로그인 여부만 보장하므로 소유권과 room 접근 권한은 별도로 확인한다.
- room join 전 DB에서 대상 존재 여부와 권한을 확인한다.
- 기존 room을 유지할지, 새 room join 전에 `leave()`할지 로직 기준으로 결정한다.
- socket instance에 저장하는 값은 연결 중 임시 상태로만 둔다.
- 서비스 핵심 상태는 DB에 저장하고 socket 메모리에만 의존하지 않는다.
- event 전송은 `socket.emit(...)` 또는 `util.socket.to(room).emit(...)`을 사용한다.
- emit하는 event는 `_sockets.sys.js`에 `type: 'event'`로 문서화한다.
- uploadKey를 받으면 `await valider.isValidUploadKey(uploadKey)`, `util.fileUpload.getFileInfo(uploadKey)`, `util.fileUpload.checkFileSize(fileInfo)`를 확인하고, `moveTo()` 또는 `toStream()` 성공 후 socket handler에서 반드시 `util.fileUpload.revokeUploadKey(uploadKey)`를 호출한다.

## 구현 후
- 도메인 `_sockets.sys.js`의 `description`, `group`, `paramSchema`, `responseSchema`가 최신인지 확인한다.
- root `backend/_sockets.sys.js` 집계가 갱신됐는지 확인한다.
- `_param.sys.js`에 message param schema가 있는지 확인한다.
- `_response.sys.js`에 event payload와 실패 response class가 있는지 확인한다.
- 클라이언트가 `_error`를 listen하는지 확인한다.
- 클라이언트가 message ack와 event를 서로 다른 이름으로 listen하는지 확인한다.
- `/API-doc/sockets` 반영 여부를 확인한다.
- 수정한 파일은 `node --check <파일>`로 구문을 확인한다.
