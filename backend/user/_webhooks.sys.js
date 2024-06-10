const paramSchema = require('./_param.sys.js');
const responseSchema = require('./_response.sys.js');

module.exports = {
    '/user/socialLoginProcess': {
        logic: '/user/socialLoginProcess.js',
        method: 'get',

        //documentation
        description: '소셜 로그인 처리',
        group: 'user',
        paramSchema: paramSchema['/user/socialLoginProcess'],
        responseSchema: [
            responseSchema.SocialLoginProcessOK
        ]
    },

    '/user/userInfoUpdate': {
        logic: '/user/userInfoUpdate.js',
        method: 'post',

        //documentation
        description: '유저 정보 업데이트 이벤트 웹훅',
        group: 'user',
        paramSchema: paramSchema['/user/userInfoUpdate'],
        responseSchema: [
            responseSchema.UserInfoUpdateProcessOK
        ]
    }
}