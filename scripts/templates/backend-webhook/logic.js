const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');
const valider = require('../core/valider.js');
const enums = require('./enums.js');

module.exports = async function(req, res){
    try{
        // 입력값 검증

        // 핵심 비즈니스 처리

        {{successStatement}}
    }catch(e){
        console.error(e)
        return res.status(500).send(new response.InternalServerError())
    }
}

