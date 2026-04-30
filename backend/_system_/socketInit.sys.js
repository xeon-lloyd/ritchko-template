const crypto = require('crypto');

const response = require('../_response.sys.js');
const setting = require('../core/setting.js');
const util = require("../core/util.js");

module.exports = async function(server){
    util.socket = require('socket.io')(server, {
        path: '/socket',
        transports: ['websocket'],
    });

    /* 클러스팅 (redis로 연결) */
    if(setting.socket.redisAdapter.enable){
        const { createClient } = require("redis");
        const { createAdapter } = require("@socket.io/redis-adapter");

        const pubClient = createClient({
            socket: {
                host: setting.socket.redisAdapter.redis.host,
                port: setting.socket.redisAdapter.redis.port,
            },
            password: setting.socket.redisAdapter.redis.password,
        });
        await pubClient.connect();

        const subClient = pubClient.duplicate();

        util.socket.adapter(createAdapter(pubClient, subClient));
    }


    /* type이 message(client > server)인 socketOperation 목록 — 서버 기동 시 한 번만 로드 */
    const socketOperations = require('../_sockets.sys.js')
    const messageOperations = Object.keys(socketOperations)
        .filter(key => socketOperations[key].type === 'message')
        .map(key => ({ name: key, operation: socketOperations[key] }))

    util.socket.on('connection', function(socket) {
        /* auth에 토큰이 있다면 loginUser로 decode */
        if(socket.handshake.headers.auth){
            try{
                let [ userData, hash ] = socket.handshake.headers.auth.split('.')

                //유저 정보 무결성 체크
                const expectedHash = util.encrypt.oneWayLite(userData)
                if(hash.length !== expectedHash.length){
                    throw "user data modified"
                }

                const isHashEqual = crypto.timingSafeEqual(
                    Buffer.from(hash),
                    Buffer.from(expectedHash)
                )
                if(!isHashEqual){
                    throw "user data modified"
                }

                userData = JSON.parse(Buffer.from(userData, 'base64url').toString('utf8'))
                //토큰 유효시간 체크
                if(setting.token.enableTimeExpire && (new Date() - new Date(userData._tokenCreateAt) > setting.token.accessTokenExpire*1000)){
                    throw "expired token"
                }

                delete userData._tokenCreateAt;

                socket.loginUser = userData
            }catch(e){
                socket.emit("_error", new response.Unauthorized(null, "잘못된 토큰입니다"));
                socket.disconnect(true);
                return;
            }
        }

        /* 소켓 리스너 설정 */
        for(let i=0; i<messageOperations.length; i++){
            const { name, operation } = messageOperations[i]

            socket.on(name, async function(data) {
                /* 로그인 필수 체크 */
                if(operation.authRequire && socket.loginUser==undefined) return socket.emit("_error", new response.Unauthorized())

                /* 소켓 로직 실행 */
                let result = await require(__dirname + '/..' + operation.logic)(socket, data)

                /* 결과 응답 */
                socket.emit(name, result)
            });
        }

    });
}