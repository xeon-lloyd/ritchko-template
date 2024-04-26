const paramSchema = require('./_param.sys.js');
const responseSchema = require('./_response.sys.js');

module.exports = {
    'SignIn': {
        logic: '/user/signIn.js',
        authRequire: false,

        //documentation
        description: '유저 로그인',
        group: 'user',
        paramSchema: paramSchema.SignIn,
        responseSchema: [
            responseSchema.FormInputRequired,
            responseSchema.UserNotFound,
            responseSchema.SignInOK
        ]
    },

    'GetUserInfo': {
        logic: '/user/getUserInfo.js',
        authRequire: true,

        //documentation
        description: '로그인 유저 정보조회',
        group: 'user',
        paramSchema: null,
        responseSchema: [
            responseSchema.UserNotFound,
            responseSchema.GetUserOK,
        ]
    },
}