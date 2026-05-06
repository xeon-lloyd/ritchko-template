const paramSchema = require('./_param.sys.js');
const responseSchema = require('./_response.sys.js');

module.exports = {
    SignIn: {
        logic: '/user/signIn.js',
        authRequire: false,

        //documentation
        description: '유저 로그인',
        group: 'user',
        paramSchema: paramSchema.SignIn,
        responseSchema: [
            responseSchema.TooManyRequests,
            responseSchema.InputValueNotValid,
            responseSchema.UserNotFound,
            responseSchema.SignInOK,
        ]
    },

    GetUserInfo: {
        logic: '/user/getUserInfo.js',
        authRequire: true,

        //documentation
        description: '로그인 유저 정보조회',
        group: 'user',
        paramSchema: null,
        responseSchema: [
            responseSchema.GetUserOK,
        ]
    },

    RotateUserToken: {
        logic: '/user/rotateUserToken.js',
        authRequire: false,

        //documentation
        description: '리프레시 토큰으로 로그인 토큰 갱신',
        group: 'user',
        paramSchema: paramSchema.RotateUserToken,
        responseSchema: [
            responseSchema.InputValueNotValid,
            responseSchema.RefreshTokenNotValid,
            responseSchema.RotateUserTokenOK,
        ]
    },

    SignOut: {
        logic: '/user/signOut.js',
        authRequire: false,

        //documentation
        description: '로그아웃(RT 만료처리)',
        group: 'user',
        paramSchema: paramSchema.SignOut,
        responseSchema: [
            responseSchema.InputValueNotValid,
            responseSchema.SignOutOK,
        ]
    },
}
