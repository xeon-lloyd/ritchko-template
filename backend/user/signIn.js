const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');
const valider = require('../core/valider.js');
const enums = require('./enums.js');

module.exports = async function(param, req, res){
    // ratelimit 체크
    const rateLimitAllowed = await util.rateLimit({ operation: 'signIn', key: '#IP', windowMs: 60 * 1000, max: 5 }, req);
    if(!rateLimitAllowed) return new response.TooManyRequests();

    // 입력값 검증
    if(!valider.isValidString(param.id)) return new response.InputValueNotValid('id');
    if(!valider.isValidString(param.pw)) return new response.InputValueNotValid('pw');

    // 비밀번호 암호화
    let cryptedPW = util.encrypt.oneWay(param.pw)

    // 유저 조회
    let [ user ] = await util.mysql.select(
        'database1',
        'uid',
        'user',
        'id=? AND pw=?',
        [ param.id, cryptedPW ]
    )
    if(!user) return new response.UserNotFound();

    // 토큰 생성
    let token = await util.token.createInitialToken({
        uid: user.uid
    })

    return new response.SignInOK(token)
}
