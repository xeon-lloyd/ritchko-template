module.exports = {
    'SignIn': {
        id: '유저 id(string)',
        pw: '유저 password(string)'
    },

    /* // webhooks // */
    '/user/socialLoginProcess': {
        code: '로그인 후 리다이렉트로 받은 코드(string)',
        state: '로그인 후 이동할 페이지 경로(string)'
    },

    '/user/userInfoUpdate': {
        uid: '유저 고유번호(string)'
    }
}