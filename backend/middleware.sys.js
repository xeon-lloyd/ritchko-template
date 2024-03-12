const operationSetting = require('./_operations.sys.js');
const response = require('./_response.sys.js');
const setting = require('./core/setting.js');
const util = require("./core/util.js");

module.exports = async function(req, res, next){
    if(req.method!='POST'){
        res.status(405).send(new response.MethodNotAllowed())
        return;
    }

    const tasks = [];

    for(let i=0; i<req.body.length; i++){
        const body = req.body[i];

        if(body.operation == undefined){
            tasks.push(new response.BadRequest(undefined, `'operation' 속성 누락`));
            continue;
        }

        if(operationSetting[body.operation] == undefined){
            tasks.push(new response.NotFound(undefined, `'${body.operation}' 식별자를 찾을 수 없음`));
            continue;
        }

        if(body.param==undefined) body.param = {};

        const operation = operationSetting[body.operation];

        //로그인 필수인데 로그인 안했으면
        if(operation.authRequire){
            if(req.header('auth')==undefined){
                tasks.push(new response.Unauthorized());
                continue;
            }

            try{
                let token = JSON.parse(util.encrypt.decode(req.header('auth')))

                //토큰 유효시간 체크
                if(setting.token.enableTimeExpire && (new Date() - new Date(token.createAt) > setting.token.expire*1000)){
                    throw "expired token"
                }

                body.param.uid = token.uid;
            }catch(e){
                tasks.push(new response.Unauthorized(null, "잘못된 토큰입니다"));
                continue;
            }
        }

        tasks.push(require(__dirname + operation.logic)(body.param, req, res, next))
    }


    let result = await Promise.allSettled(tasks);
    result.forEach((r) => r.reason?console.error(r.reason):'')
    result = result.map((r) => r.value?r.value:new response.InternalServerError());

    res.send(result)
}