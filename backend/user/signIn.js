const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');

module.exports = async function(param, req, res){
    if(!param.id || !param.pw) return new response.FormInputRequired();

    let cryptedPW = util.encrypt.oneWay(param.pw)

    let [ user ] = await util.mysql.select(
        'database1',
        'uid',
        'user',
        'id=? AND pw=?',
        [ param.id, cryptedPW ]
    )

    if(user==undefined) return new response.UserNotFound();

    let token = util.token.generateToken(user.uid)

    return new response.SignInOK(token)
}