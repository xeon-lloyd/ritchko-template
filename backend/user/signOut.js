const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');
const valider = require('../core/valider.js');
const enums = require('./enums.js');

module.exports = async function(param, req, res){
    // 입력값 검증
    if(!valider.isValidString(param.refreshToken)) return new response.InputValueNotValid('refreshToken');

    // 리프레시 토큰 만료처리
    await util.token.revokeRefreshToken(param.refreshToken)

    return new response.SignOutOK()
}