const crypto = require('crypto');
const fs = require('fs').promises;

const response = require('../_response.sys.js');
const setting = require('../core/setting.js');
const util = require("../core/util.js");

const operationSetting = require('../_operations.sys.js');
const getMiddlewareUserData = require('../user/module/getMiddlewareUserData.js');
const loggingModule = require('./loggingModule.sys.js');

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
            let [ tokenData, hash ] = req.header('auth').split('.')

            //유저 정보 무결성 체크
            const expectedHash = util.encrypt.oneWayLite(tokenData)
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

            tokenData = JSON.parse(Buffer.from(tokenData, 'base64url').toString('utf8'))
            //토큰 유효시간 체크
            if(setting.token.enableTimeExpire && (new Date() - new Date(tokenData._tokenCreateAt) > setting.token.accessTokenExpire*1000)){
                throw "expired token"
            }

            const userData = await getMiddlewareUserData(tokenData);

            body.param.loginUser = userData;
        }catch(e){
            return res.send(new response.Unauthorized("잘못된 토큰입니다"))
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



    // 로그 기록
    // 유저 uid 기록
    const uid = body.param.loginUser?.uid || null;
    delete body.param.loginUser;

    // 요청 param 마스킹
    const reqParam = Object.fromEntries(
        Object.entries(body.param).map(([key, value]) => {
            if(setting.logging.maskParams.includes(key)) return [key, '**'];
            if(typeof value === 'object') return [key, JSON.stringify(value)];
            return [key, value];
        })
    );

    // 요청 param 문자열 길이 제한
    const maxParamLogLength = setting.logging.maxParamLogLength ?? 1000;
    let paramString = JSON.stringify(reqParam);
    if(0 < maxParamLogLength && maxParamLogLength < paramString.length){
        const originLength = paramString.length;
        paramString = `${paramString.slice(0, maxParamLogLength)}... [truncated:${originLength}]`;
    }

    // 로그 기록
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip
    const log = `[${body.operation}] ${result.response} ${result.label} U:${uid} ${ip} ${paramString}`
    await loggingModule.recordLog('operation', log)
}
