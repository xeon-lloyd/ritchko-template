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
- 기본 시스템은 연결 시 `auth` header의 토큰을 읽어 `socket.loginUser`에 저장한다.
- `authRequire: true`인 message는 `socket.loginUser`가 없으면 로직 실행 전 `Unauthorized`를 `_error`로 emit한다.
- 인증 토큰 해석 규칙은 `/API` 인증과 같은 token/hash 구조를 따른다.
- 브라우저 환경에서 header 전달이 어려운 방식의 클라이언트를 써야 하면, `socket.handshake.auth.token` 같은 추가 입력 경로를 쓰도록 `socketInit.sys.js`를 먼저 일관되게 확장한다.

클라이언트 예시:
```js
const socket = io('', {
    path: '/socket',
    transports: ['websocket'],
    extraHeaders: {
        auth: accessToken
    }
})

socket.on('_error', data => {
    console.error(data)
})
```

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
            responseSchema.InputValueNotValid,
            responseSchema.RoomNotFound,
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

```js
const response = require('./_response.sys.js')
const setting = require('../core/setting.js')
const util = require('../core/util.js')
const valider = require('../core/valider.js')
const enums = require('./enums.js')

module.exports = async function(socket, data){
    // 입력값 검증
    if(!valider.isValidNumber(data.roomId)) return socket.emit('_error', new response.InputValueNotValid('roomId'))

    // 대상 존재 여부 확인
    let [ room ] = await util.mysql.select(
        'database1',
        'pk, ownerUid',
        'chatRoom',
        'pk=? AND isDeleted=0',
        [ data.roomId ]
    )
    if(room == undefined) return socket.emit('_error', new response.RoomNotFound())

    // 권한 확인
    if(room.ownerUid !== socket.loginUser.uid) return socket.emit('_error', new response.Forbidden())

    // 핵심 비즈니스 처리
    socket.leave(`chat:${socket.chatRoomId}`)
    socket.chatRoomId = data.roomId
    socket.join(`chat:${data.roomId}`)

    return new response.JoinRoomMessageOK()
}
```

작성 규칙:
- 처리 순서는 입력값 검증, 대상 존재 여부 확인, 권한 확인, 핵심 처리, 응답 또는 이벤트 전송을 기본으로 한다.
- `data`는 구조분해하지 않고 `data.xxx`로 사용한다.
- 예상 가능한 실패는 throw하지 말고 `socket.emit('_error', new response.X())` 후 return한다.
- 예상치 못한 예외는 listener가 `_error` InternalServerError로 처리한다. 실패 종류를 명시적으로 구분해야 하면 로직 안에 try/catch를 둔다.
- `authRequire: true`인 message에서도 데이터 소유권과 room 입장 권한은 로직에서 별도로 확인한다.
- message 로직에서 response 인스턴스를 반환하면 시스템이 같은 message 이름으로 ack를 emit한다. `_error`를 emit한 뒤 반환(`return socket.emit('_error', ...)` 또는 emit 후 return)하면 ack 없이 처리가 끝난다. 즉시 ack가 필요한 경우에만 `...MessageOK` 같은 response를 반환하고 문서화한다.
- ack 없이 server event만 보내는 message라도 `_error`와 event contract는 `_sockets.sys.js`에 문서화한다.

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
- 소켓으로 fileToken을 받는 경우에도 파일 처리 규칙은 `backend/docs/FILE.md`를 따른다.
- fileToken을 DB에 최종 데이터처럼 저장하지 않는다.
- 채팅 이미지처럼 파일 처리와 DB 저장이 함께 일어나면 일부 성공 후 실패할 때의 정리 정책을 먼저 정한다.

## Response와 문서화
- 시스템/검증/권한 오류는 `_error` 이벤트로 response class를 emit한다.
- 인증 필요 message는 `/API-doc/sockets`에서 `Unauthorized`가 자동 문서화된다.
- message별 실패 response는 `responseSchema`에 추가한다.
- event payload는 `responseSchema`에 `...Event` class로 추가한다.
- 신규 response 이름은 message ack면 `...MessageOK`, event payload면 `...Event`, 실패면 상태를 바로 드러내는 이름을 쓴다.

## 작업 후
- 도메인 `_sockets.sys.js`와 root `backend/_sockets.sys.js` 집계가 맞는지 확인한다.
- `_param.sys.js`, `_response.sys.js`, `/API-doc/sockets`가 최신 로직과 맞는지 확인한다.
- 클라이언트가 `_error`, message ack, event를 각각 올바른 이름으로 listen하는지 확인한다.
- 수정한 파일은 `node --check <파일>`로 구문을 확인한다.
