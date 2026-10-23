const paramSchema = require('./_param.sys.js');
const responseSchema = require('./_response.sys.js');

module.exports = {
    UserSocketReadyEvent: {
        type: 'event',

        //documentation
        description: '인증 및 사용자 room 가입 완료',
        group: 'user',
        responseSchema: [
            responseSchema.UserSocketReadyEvent
        ],
    },
}
