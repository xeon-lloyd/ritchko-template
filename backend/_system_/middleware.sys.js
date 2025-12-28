const crypto = require('crypto');

const operationSetting = require('../_operations.sys.js');
const response = require('../_response.sys.js');
const setting = require('../core/setting.js');
const util = require("../core/util.js");

module.exports = async function(req, res, next){
    if(req.method!='POST'){
        res.status(405).send(new response.MethodNotAllowed())
        return;
    }

    let result = null
    const body = req.body;

    if(body.operation == undefined){
        return res.send(new response.BadRequest(undefined, `'operation' 속성 누락`))
    }

    if(operationSetting[body.operation] == undefined){
        return res.send(new response.NotFound(undefined, `'${body.operation}' 식별자를 찾을 수 없음`))
    }

    if(body.param==undefined) body.param = {};

    const operation = operationSetting[body.operation];

    //로그인 필수인데 로그인 안했으면
    if(operation.authRequire){
        if(req.header('auth')==undefined){
            return res.send(new response.Unauthorized())
        }

        try{
            let [ userData, hash ] = req.header('auth').split('.')

            //유저 정보 무결성 체크
            const expectedHash = util.encrypt.oneWayLite(userData)
            if(hash.length !== expectedHash.length){
                throw "user data modified"
            }

            const isHashEqual = crypto.timingSafeEqual(
                Buffer.from(hash),
                Buffer.from(expectedHash)
            )
            if(!isHashEqual){
                throw "user data modified"
            }

            userData = JSON.parse(Buffer.from(userData, 'base64url').toString('utf8'))
            //토큰 유효시간 체크
            if(setting.token.enableTimeExpire && (new Date() - new Date(userData._tokenCreateAt) > setting.token.accessTokenExpire*1000)){
                throw "expired token"
            }

            delete userData._tokenCreateAt;

            body.param.loginUser = userData;
        }catch(e){
            return res.send(new response.Unauthorized(null, "잘못된 토큰입니다"))
        }
    }

    try{
        result = await require(__dirname + '/..' + operation.logic)(body.param, req, res, next)
    }catch(e){
        result = new response.InternalServerError()
        console.error(e)
        // util.slack.sendErrorReport(e.stack) // 비동기 실행
    }
    result.label = result.constructor.name

    res.send(result)
}