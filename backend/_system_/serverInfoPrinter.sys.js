const setting = require('../core/setting.js');

module.exports = function serverInfoPrinter(){
    let font = {
        reset: '\x1b[0m',

        appName: '\x1b[1m\x1b[35m',

        envProd: '\x1b[1m\x1b[7m\x1b[31m',
        envDev: '\x1b[1m\x1b[7m\x1b[33m',

        date: '\x1b[2m\x1b[3m',

        info: '\x1b[33m',

        link: '\x1b[4m\x1b[3m\x1b[34m',
    }

    let environment = setting.isProduction?`${font.envProd} Production `:`${font.envDev} Development `

    let content;
    if(setting.isProduction){
        content = `
 - Running Port\t:\t${font.info}${setting.port}${font.reset}`
    }else{
        content = `${font.date}${new Date().toISOString()}${font.reset}
 - Web server\t:\t${font.link}${setting.hostName}:${setting.port}${font.reset}
 - API Document\t:\t${font.link}${setting.hostName}:${setting.port}/API-doc${font.reset}`
    }

    console.log(`${font.appName}${setting.AppName}${font.reset} 서버 시작 ${environment}${font.reset} ${content}`)
}