# Backend Socket Guide

## 목적
이 문서는 backend에서 socket.io 기반 소켓 코드를 작성할 때 따르는 원본 가이드다. 작업 직전 확인용 요약은 `backend/docs/SOCKET-CHECKLIST.md`를 본다.

## 기본 구조
- 소켓은 `server.js`의 HTTP server를 `backend/_system_/initialize.sys.js`가 `backend/_system_/socketInit.sys.js`로 넘겨 초기화한다.
- socket.io path는 `/socket`이고 transport는 `websocket`만 사용한다.
- 초기화된 socket.io instance는 `util.socket`에 저장된다.
- 소켓 registry는 `backend/_sockets.sys.js`가 도메인별 `backend/<domain>/_sockets.sys.js`를 모아 만든다.
- `type: 'message'`는 client에서 server로 보내는 요청이다.
- `type: 'event'`는 server에서 client로 보내는 이벤트 문서화 항목이다.
- `type: 'message'`만 `socketInit.sys.js`에서 자동 listener로 등록된다.
- `/API-doc/sockets`는 `_sockets.sys.js`, `_param.sys.js`, `_response.sys.js`를 기준으로 문서를 생성한다.

## 생성 명령
- message 생성: `npm run create:backend-socket -- <domain> <SocketNameMessage>`
- event 생성: `npm run create:backend-socket -- <domain> <SocketNameEvent>`
- 단일 경로 인자: `npm run create:backend-socket -- <domain>/<SocketNameMessage|SocketNameEvent>`
- 인증 필요 message는 `--auth`를 사용한다.
- message param placeholder를 만들지 않으려면 `--param-null`을 사용한다.
- response placeholder를 만들지 않으려면 `--response-null`을 사용한다.
- 설명 지정은 `--description "설명"`을 사용한다.

## 연결과 인증
- 클라이언트는 socket.io로 `/socket`에 연결한다.
- 기본 시스템은 Socket.IO 연결 승인 전 미들웨어에서 `socket.handshake.headers.auth` 또는 `socket.handshake.auth.token`을 읽는다. WebSocket 전송 연결 자체를 차단하는 방식은 아니다.
- 토큰이 없으면 익명 연결을 허용한다. 토큰이 있으면 검증하고 인증한 사용자 정보를 `socket.loginUser`에 저장한다. 잘못되거나 만료된 토큰을 익명으로 통과시키지 않는다.
- 인증 실패는 연결을 거절하고 클라이언트의 `connect_error`로 전달한다. `error.message`는 오류 메시지, `error.data`는 기존 `Unauthorized` 응답 (`response: 401`)이다.
- `authRequire: true`인 message는 `socket.loginUser`가 없으면 로직 실행 전 `Unauthorized`를 요청의 ack callback으로 전달한다.
- 인증 토큰 해석 규칙은 `/API` 인증과 같은 token/hash 구조를 따른다.
- 인증 성공 후 서버가 `user:<uid>` room 가입을 완료한 뒤 연결을 승인한다. 사용자 대상 전송은 ``util.socket.to(`user:${uid}`).emit(...)`` 형태로 사용한다.
- 로그인·익명 연결 모두 기본 `connect`를 준비 완료 신호로 사용한다. 인증 연결은 이 시점에 사용자 room 가입까지 완료되며, 익명 연결은 사용자 room에 가입하지 않는다.
- 클라이언트는 `connect`, `connect_error`와 서비스 이벤트 listener를 연결 전에 등록한다. 재연결 때 listener가 중복 등록되지 않도록 서비스 이벤트 listener는 `connect` 밖에 둔다.
- Redis adapter를 사용하면 발행·구독 클라이언트가 모두 연결된 뒤 adapter를 등록한다.
- 브라우저처럼 header 전달이 어려운 클라이언트는 `auth: { token: accessToken }`으로 전달한다. 서버의 `socket.handshake.auth.token` 입력 경로는 이미 구현되어 있어 추가 확장이 필요 없다. 두 경로로 함께 전달하면 값이 있는 `auth` header를 우선한다.

브라우저 클라이언트 예시:
```js
const socket = io('', {
    path: '/socket',
    transports: ['websocket'],
    auth: callback => {
        const token = cookie.get('accessToken')
        callback(token ? { token } : {})
    },
    autoConnect: false,
})

socket.on('connect', () => {
    console.log('연결 준비 완료 (인증 연결이면 사용자 room 가입 완료)')
})

socket.on('connect_error', error => {
    console.error(error.message, error.data)
})

socket.connect()
```

header를 지원하는 클라이언트는 `auth` 옵션 대신 `extraHeaders: { auth: accessToken }`으로 전달할 수 있다.

### 재연결과 토큰 갱신
- 위 예시의 `cookie`는 `public/js/core.js`의 helper다. `auth` 콜백은 매 연결 시 최신 access token을 읽는다. header 방식도 재연결 전에 최신 토큰으로 갱신해야 한다.
- 네트워크 복구 후 재연결할 때 access token이 만료되어 인증이 거절될 수 있다. 서버 미들웨어에서 거절된 연결은 자동 재연결에 의존하지 않고 명시적으로 `socket.connect()`를 호출해야 한다.
- `connect_error`의 `error.data?.response === 401`이고 refresh가 가능하면 기존 `API.rotateToken(연결에 사용한 accessToken)`을 재사용할 수 있다. 연결 시 사용한 토큰을 별도로 기록하고, 갱신 성공 후 최신 토큰으로 한 번 재연결한다.
- 갱신 후 재시도도 인증에 실패하면 반복 갱신·재연결을 중단하고 로그인 상태를 확인한다. 네트워크 오류처럼 인증 실패가 아닌 오류에는 토큰 갱신을 시도하지 않는다.
- 로그인·로그아웃으로 인증 상태가 바뀌면 토큰 저장 또는 제거를 완료한 뒤 `socket.disconnect()`와 `socket.connect()`로 새 연결을 만든다. 연결 중 쿠키만 변경해도 기존 `socket.loginUser`와 room이 바뀌지는 않는다.
- 프론트 공통 소켓 helper와 자동 refresh는 제공하지 않는다. 서비스에서 연결 수명과 재시도 정책에 맞춰 처리한다.

## Registry 작성
도메인별 `backend/<domain>/_sockets.sys.js`는 `paramSchema`, `responseSchema`를 import하고 socket 항목을 export한다.

```js
const paramSchema = require('./_param.sys.js')
const responseSchema = require('./_response.sys.js')

module.exports = {
    JoinRoomMessage: {
        type: 'message',
        logic: '/chat/joinRoomMessage.js',
        authRequire: true,

        //documentation
        description: '채팅방 입장',
        group: 'chat',
        paramSchema: paramSchema.JoinRoomMessage,
        responseSchema: [
            responseSchema.JoinRoomMessageOK,
            responseSchema.InputValueNotValid,
            responseSchema.RoomNotFound,
            responseSchema.Forbidden,
        ]
    },

    RoomUpdatedEvent: {
        type: 'event',

        //documentation
        description: '채팅방 정보 변경 이벤트',
        group: 'chat',
        responseSchema: [
            responseSchema.RoomUpdatedEvent,
        ]
    },
}
```

작성 규칙:
- message 이름은 `Message`, event 이름은 `Event` suffix를 우선한다.
- message에는 `type`, `logic`, `authRequire`, `description`, `group`, `paramSchema`, `responseSchema`를 둔다.
- event에는 `type`, `description`, `group`, `responseSchema`를 둔다.
- socket key는 전체 registry에서 유일해야 한다.
- 도메인 `_sockets.sys.js`를 추가하거나 수정하면 root `backend/_sockets.sys.js` 집계도 확인한다.
- message param은 도메인 `_param.sys.js`에 같은 key로 추가한다.
- event payload와 message error/ack payload는 도메인 `_response.sys.js`에 class로 추가한다.

## Message 로직
message 로직 파일의 기본 export는 `module.exports = async function(socket, data){ ... }` 형태다.
성공·실패 response를 반환하면 공통 listener가 Socket.IO의 ack callback으로 응답한다. 개별 로직은 ack를 직접 호출하지 않는다.

```js
const response = require('./_response.sys.js')
const setting = require('../core/setting.js')
const util = require('../core/util.js')
const valider = require('../core/valider.js')
const enums = require('./enums.js')

module.exports = async function(socket, data){
    // 입력값 검증
    if(!valider.isValidNumber(data.roomId)) return new response.InputValueNotValid('roomId')

    // 대상 존재 여부 확인
    let [ room ] = await util.mysql.select(
        'database1',
        'pk, ownerUid',
        'chatRoom',
        'pk=? AND isDeleted=0',
        [ data.roomId ]
    )
    if(room == undefined) return new response.RoomNotFound()

    // 권한 확인
    if(room.ownerUid !== socket.loginUser.uid) return new response.Forbidden()

    // 핵심 비즈니스 처리
    await socket.leave(`chat:${socket.chatRoomId}`)
    socket.chatRoomId = data.roomId
    await socket.join(`chat:${data.roomId}`)

    return new response.JoinRoomMessageOK()
}
```

작성 규칙:
- 처리 순서는 입력값 검증, 대상 존재 여부 확인, 권한 확인, 핵심 처리, 응답 또는 이벤트 전송을 기본으로 한다.
- `data`는 구조분해하지 않고 `data.xxx`로 사용한다.
- 예상 가능한 실패는 throw하지 말고 `return new response.X()`로 반환한다.
- 예상치 못한 예외는 listener가 기록하고 `InternalServerError`를 ack로 전달한다. 실패 종류를 명시적으로 구분해야 하면 로직 안에 try/catch를 둔다.
- `authRequire: true`인 message에서도 데이터 소유권과 room 입장 권한은 로직에서 별도로 확인한다.
- 반환한 response에는 공통 listener가 `label`을 추가하고 ack callback을 한 번 호출한다. 반환값이 없거나 `null`이면 기본 `OK` (`response: 200`, `data: null`)를 전달한다.
- 클라이언트가 ack callback을 생략해도 로직은 실행하지만 응답은 보내지 않는다. 같은 message 이름의 응답 event와 `_error`는 사용하지 않는다.
- event를 전송하는 message도 처리 결과는 ack로 구분하고, ack response와 event contract를 `_sockets.sys.js`에 문서화한다. `return socket.emit(...)` 대신 event 전송 후 response를 반환한다.

### 클라이언트 요청과 응답
별도 프론트 helper 없이 Socket.IO 기본 ack callback을 사용한다. 같은 message를 동시에 여러 번 보내도 각 요청의 callback으로 응답한다.

```js
socket.timeout(10000).emit('JoinRoomMessage', { roomId: 12 }, (error, result) => {
    if(error){
        console.error('응답 대기 시간 초과')
        return
    }
    if(result.response !== 200){
        console.error(result.label, result.message, result.target)
        return
    }
    console.log('입장 완료', result.data)
})
```

- `timeout(10000)`은 예시 대기 시간이다. timeout을 사용하지 않으면 `socket.emit(name, param, result => { ... })`처럼 응답 하나를 받는다.
- timeout은 서버의 처리 취소나 실패 확정을 뜻하지 않는다. 중복 처리가 문제가 되는 요청은 결과 확인 없이 자동 재전송하지 않는다.
- 서버가 먼저 보내는 알림은 기존처럼 `socket.on('RoomUpdatedEvent', data => { ... })`으로 받는다.

## Event 전송
event는 자동 listener가 아니다. 필요한 operation, worker, socket message 로직에서 직접 emit한다.

```js
util.socket.to(`chat:${roomId}`).emit(
    'RoomUpdatedEvent',
    new response.RoomUpdatedEvent(roomInfo)
)

socket.emit(
    'JoinedRoomEvent',
    new response.JoinedRoomEvent(roomInfo)
)
```

작성 규칙:
- event payload는 `_response.sys.js`의 `...Event` class로 만든다.
- 특정 socket 한 명에게 보낼 때는 `socket.emit(...)`을 사용한다.
- room 또는 전체 socket instance를 대상으로 보낼 때는 `util.socket.to(room).emit(...)`을 사용한다.
- operation 로직에서 socket event를 보내야 할 때도 `util.socket`를 사용한다.
- emit하는 event는 도메인 `_sockets.sys.js`에 `type: 'event'`로 문서화한다.

## Room과 Socket 상태
- room 이름은 `<domain>:<id>` 형태를 우선한다. 예: `chat:12`, `walk:45`, `user:7`
- room join 전에는 대상 존재 여부와 접근 권한을 먼저 확인한다.
- 한 socket이 같은 목적의 room을 하나만 가져야 하는 단일 구독 모델이면 새 room join 전에 기존 room을 `leave()`한다.
- 여러 room을 동시에 구독해야 하는 로직이면 기존 room을 유지하고, 해제 조건을 별도로 명확히 둔다.
- socket instance에 저장하는 값은 현재 연결의 임시 상태로만 사용한다. 서비스 핵심 상태는 DB에 저장한다.
- `socket.loginUser`는 인증 토큰에서 온 값이다. 최신 사용자 정보가 필요하면 DB에서 다시 조회한다.
- `fetchSockets()` 등으로 여러 instance의 socket data를 읽어야 하면 필요한 최소값만 `socket.data`에 넣는다.

## Redis Adapter
- `setting.socket.redisAdapter.enable`이 true면 `@socket.io/redis-adapter`를 사용한다.
- 여러 Node process 또는 여러 서버 instance에서 room broadcast가 필요할 때만 켠다.
- Redis host, port, password는 `backend/core/setting.js`의 placeholder 구조를 유지한다.
- Redis adapter를 켜도 socket instance의 메모리 상태는 영구 저장소가 아니다.

## 파일과 DB 처리
- 소켓 message도 서비스 핵심 데이터는 DB에 저장한다.
- DB 접근 규칙은 `backend/docs/DB.md`를 따른다.
- 소켓으로 uploadKey를 받는 경우에도 `backend/docs/FILE.md`의 uploadKey 검증, 파일 정보 조회, 크기/형식 검증, 소비 규칙을 따른다.
- uploadKey는 `await valider.isValidUploadKey(data.uploadKey)`로 먼저 검증한다.
- 파일 정보는 `util.fileUpload.getFileInfo(data.uploadKey)`로 조회한다.
- 파일 크기는 `util.fileUpload.checkFileSize(fileInfo)`로 확인한다.
- uploadKey를 DB에 최종 데이터처럼 저장하지 않는다.
- `util.fileUpload.moveTo()` 또는 `toStream()`으로 파일을 소비한 socket handler는 성공 직후 반드시 `util.fileUpload.revokeUploadKey(data.uploadKey)`를 호출한다.
- `revokeUploadKey()` 호출 후 같은 uploadKey 재사용을 전제하지 않는다.
- 채팅 이미지처럼 파일 처리와 DB 저장이 함께 일어나면 일부 성공 후 실패할 때의 정리 정책을 먼저 정한다.

## Response와 문서화
- message의 성공·시스템·검증·권한 응답은 ack callback으로 전달한다. 연결 인증 실패는 `connect_error`로 전달한다.
- 인증 필요 message는 `/API-doc/sockets`에서 `Unauthorized`가 자동 문서화된다.
- message별 성공·실패 response는 `responseSchema`에 추가한다. 기본 `OK`를 사용하는 경우에도 문서화한다.
- event payload는 `responseSchema`에 `...Event` class로 추가한다.
- 신규 response 이름은 message ack면 `...MessageOK`, event payload면 `...Event`, 실패면 상태를 바로 드러내는 이름을 쓴다.

## 작업 후
- 도메인 `_sockets.sys.js`와 root `backend/_sockets.sys.js` 집계가 맞는지 확인한다.
- `_param.sys.js`, `_response.sys.js`, `/API-doc/sockets`가 최신 로직과 맞는지 확인한다.
- 클라이언트가 message 응답은 ack callback, 서버 event는 `socket.on()`으로 받는지 확인한다.
- 수정한 파일은 `node --check <파일>`로 구문을 확인한다.
