const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');

module.exports = async function(param, req, res){
    let [ user ] = await util.mysql.select(
        'database1',
        'id, uid, name, profileImage',
        'user',
        'uid=?',
        [ param.uid ]
    )

    if(user==undefined) return new response.UserNotFound();

    return new response.GetUserOK(user)
}