const response = require('../_response.sys.js');
const setting = require('../core/setting.js');
const util = require("../core/util.js");

const crypto = require('crypto');
const getMiddlewareUserData = require('../user/module/getMiddlewareUserData.js');

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
        const subClient = pubClient.duplicate();
        await Promise.all([
            pubClient.connect(),
            subClient.connect()
        ]);

        util.socket.adapter(createAdapter(pubClient, subClient));
    }


    /* type이 message(client > server)인 socketOperation 목록 — 서버 기동 시 한 번만 로드 */
    const socketOperations = require('../_sockets.sys.js')
    const messageOperations = Object.keys(socketOperations)
        .filter(key => socketOperations[key].type === 'message')
        .map(key => ({ name: key, operation: socketOperations[key] }))

    util.socket.use(async function(socket, next) {
        /* 토큰이 없으면 익명으로 연결하고, 있으면 연결 승인 전에 인증한다. */
        const authToken = socket.handshake.headers.auth || socket.handshake.auth?.token
        if(authToken){
            try{
                let [ tokenData, hash ] = authToken.split('.')

                //유저 정보 무결성 체크
                const expectedHash = util.encrypt.oneWayLite(tokenData)
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

                tokenData = JSON.parse(Buffer.from(tokenData, 'base64url').toString('utf8'))
                //토큰 유효시간 체크
                if(setting.token.enableTimeExpire && (new Date() - new Date(tokenData._tokenCreateAt) > setting.token.accessTokenExpire*1000)){
                    throw "expired token"
                }

                const userData = await getMiddlewareUserData(tokenData);

                socket.loginUser = userData

                // 사용자 room 가입
                await socket.join(`user:${userData.uid}`);
            }catch(e){
                const error = new Error("잘못된 토큰입니다");
                error.data = new response.Unauthorized(error.message);
                return next(error);
            }
        }

        next();
    });

    util.socket.on('connection', function(socket) {
        /* 소켓 리스너 설정 */
        for(let i=0; i<messageOperations.length; i++){
            const { name, operation } = messageOperations[i]

            socket.on(name, async function(data, ack) {
                /* 소켓 로직 실행 */
                let result
                try{
                    if(operation.authRequire && socket.loginUser==undefined){
                        result = new response.Unauthorized()
                    }else{
                        result = await require(__dirname + '/..' + operation.logic)(socket, data)
                        if(result == null) result = new response.OK()
                    }
                }catch(e){
                    console.error(e)
                    void util.discord.sendErrorReport(e?.stack || String(e));
                    result = new response.InternalServerError()
                }

                if(typeof ack !== 'function') return

                result.label = result.constructor.name

                /* 결과 응답 */
                ack(result)
            });
        }

    });
}
