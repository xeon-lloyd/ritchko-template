const rootResponse = require('../_response.default.sys.js')
const { token } = require('../core/setting.js')

module.exports = {
    ...rootResponse,

    /* SignIn */
    'FormInputRequired': class FormInputRequired extends rootResponse.BadRequest {
        message = "필수 입력 누락"
        errorCode = "(id|pw)"
    },

    'SignInOK': class SignInOK extends rootResponse.OK {
        constructor(token){
            super()
            if(token) this.data = { token }
        }

        message = "로그인 성공"
        data = {
            token: '로그인 토큰(string)'
        }
    },

    /* GetUserInfo */
    'UserNotFound': class UserNotFound extends rootResponse.NotFound {
        message = "해당 유저를 찾을 수 없음"
    },

    'GetUserOK': class GetUserOK extends rootResponse.OK {
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
}