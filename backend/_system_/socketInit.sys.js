const response = require('../_response.sys.js');
const setting = require('../core/setting.js');
const util = require("../core/util.js");

module.exports = function(server){
    util.socket.io = require('socket.io')(server);

    util.socket.io.on('connection', function(socket) {
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

            if(operation.type!='receive') continue;

            socket.on(list[i], async function(data) {
                if(operation.authRequire && socket.loginUser==undefined) return socket.emit("message", new response.Unauthorized())
                
                let result = await require(__dirname + '/..' + operation.logic)(socket, data)
                result.name = list[i]
                    
                socket.emit("_result", result)
            });
        }
        
    });
}