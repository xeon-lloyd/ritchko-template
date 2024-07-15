const response = require('../_response.sys.js');
const setting = require('../core/setting.js');
const util = require("../core/util.js");

module.exports = function(server){
    util.socket.io = require('socket.io')(server, {
        path: '/socket.io',
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

        util.socket.io.adapter(createAdapter(pubClient, subClient));
    }


    util.socket.io.on('connection', function(socket) {
        /* auth에 토크이 있다면 loginUser로 decode */
        try{
            let [ userData, hash ] = socket.handshake.headers.auth.split('.')

            //토큰 유효시간 체크
            if(setting.token.enableTimeExpire && (new Date() - new Date(userData._tokenCreateAt) > setting.token.expire*1000)){
                throw "expired token"
            }

            //유저 정보 무결성 체크
            if(hash!=util.encrypt.oneWayLite(userData)){
                throw "user data modified"
            }

            userData = JSON.parse(Buffer.from(userData, 'base64').toString('utf8'))

            delete userData._tokenCreateAt;

            socket.loginUser = userData
        }catch(e){
            socket.emit("_result", new response.Unauthorized(null, "잘못된 토큰입니다"));
        }
        

        /* type이 receive(client > server)인 socketOpertaion 설정 */
        let socketOperations = require('../_sockets.sys.js')
        let list = Object.keys(socketOperations)
        for(let i=0; i<list.length; i++){
            let operation = socketOperations[list[i]]

            /* receive type의 operation이 아니라면 건너뛰기 */
            if(operation.type!='receive') continue;

            /* 소켓 리스너 설정 */
            socket.on(list[i], async function(data) {
                /* 로그인 필수 체크 */
                if(operation.authRequire && socket.loginUser==undefined) return socket.emit("message", new response.Unauthorized())
                
                /* 소켓 로직 실행 */
                let result = await require(__dirname + '/..' + operation.logic)(socket, data)
                result.name = list[i]
                
                /* 결과 응답 */
                socket.emit("_result", result)
            });
        }
        
    });
}