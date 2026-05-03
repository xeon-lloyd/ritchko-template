const setting = require('../core/setting.js');
const loggingModule = require('./loggingModule.sys.js');

module.exports = function(app){
    let webhooks = require('../_webhooks.sys.js')

    let list = Object.keys(webhooks)
    for(let i=0;i<list.length;i++){
        const webhookPath = list[i];
        const webhook = webhooks[webhookPath];
        const logic = require(`../${webhook.logic}`);

        app[webhook.method.toLowerCase()](`/webhook${webhookPath}`, async function(req, res, next){
            let responseLabel = null;
            let error = null;

            const originSend = res.send.bind(res);
            res.send = function(body){
                responseLabel = responseLabel || body?.constructor?.name || null;
                return originSend(body);
            }

            const originJson = res.json.bind(res);
            res.json = function(body){
                responseLabel = responseLabel || body?.constructor?.name || null;
                return originJson(body);
            }

            const originRedirect = res.redirect.bind(res);
            res.redirect = function(...args){
                responseLabel = 'Redirect';
                return originRedirect(...args);
            }

            try{
                await logic(req, res, next)
            }catch(e){
                error = e;
                console.error(e)
            }

            // 요청 param 마스킹
            const rawParam = req.method == 'GET' ? req.query : req.body;
            const reqParam = Object.fromEntries(
                Object.entries(rawParam || {}).map(([key, value]) => {
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
            const statusCode = error ? 500 : res.statusCode;
            const log = `[${webhookPath}] ${req.method} ${statusCode} ${error ? 'Error' : responseLabel || '-'} ${ip} ${paramString}`
            await loggingModule.recordLog('webhook', log)

            if(error) return next(error);
        })
    }
}
