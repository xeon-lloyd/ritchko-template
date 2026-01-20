const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');
const valider = require('../core/valider.js');
const enums = require('./enums.js');

module.exports = async function(param, req, res){
    return new response.GetUserOK(param.loginUser)
}