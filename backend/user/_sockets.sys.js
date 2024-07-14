const paramSchema = require('./_param.sys.js');
const responseSchema = require('./_response.sys.js');

module.exports = {
    'SetUserStatusMessage': {
        type: 'receive',
        logic: '/user/setUserStatusMessage.js',
        authRequire: true,

        //documentation
        description: '유저 상태 설정',
        group: 'user',
        paramSchema: paramSchema.SetUserStatusMessage,
        responseSchema: [
            responseSchema.SetUserStatusMessageOK,
        ]
    },

    'UserStatusUpdateEvent': {
        type: 'emit',
        authRequire: true,

        //documentation
        description: '유저 상태 업데이트 이벤트',
        group: 'user',
        responseSchema: [
            responseSchema.UserStatusUpdateEvent
        ]
    }
}