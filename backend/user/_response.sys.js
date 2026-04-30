const rootResponse = require('../_response.default.sys.js')

module.exports = {
    ...rootResponse,

    /* SignIn */
    UserNotFound: class UserNotFound extends rootResponse.NotFound {
        message = "해당 유저를 찾을 수 없음"
    },

    SignInOK: class SignInOK extends rootResponse.OK {
        constructor(token){
            super()
            if(token) this.data = token
        }

        message = "로그인 성공"
        data = {
            accessToken: '로그인 토큰(string)',
            refreshToken: '리프레시 토큰(string)'
        }
    },

    /* GetUserInfo */
    GetUserOK: class GetUserOK extends rootResponse.OK {
        constructor(user){
            super()
            if(user) this.data = user
        }

        message = "유저 정보 조회 성공"
        data = {
            id: "유저 아이디(string)",
            uid: "유저 고유번호(string)",
            name: "유저 프로필 이름(string)"
        }
    },

    /* SignOut */
    SignOutOK: class SignOutOK extends rootResponse.OK {
        message = "로그아웃 완료"
    },


    /* // webhooks (이름에 Process를 포함하여 webhook의 응답이란것을 명시) // */


    /* // sockets (이름에 Message, Event를 포함하여 socket의 응답이란것을 명시) // */

}
