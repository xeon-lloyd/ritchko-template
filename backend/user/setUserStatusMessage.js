const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');
const valider = require('../core/valider.js');
const enums = require('./enums.js');

module.exports = async function(socket, data){
    // socket 객체에 로그인한 유저(auth header) 정보 접근
    data.user = socket.loginUser.uid

    socket.emit("UserStatusUpdateEvent", new response.UserStatusUpdateEvent(data))
    //util.to("socket_id").emit("UserStatusUpdateEvent", new response.UserStatusUpdateEvent(data.status)) //특정 사람한테 전송

    return new response.SetUserStatusMessageOK()
}