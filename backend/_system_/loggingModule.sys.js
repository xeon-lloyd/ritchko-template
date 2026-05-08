const fs = require('fs').promises;
const { createReadStream } = require('fs');

const setting = require('../core/setting.js');
const util = require('../core/util.js');

const originalConsoleLog = console.log.bind(console);
const originalConsoleError = console.error.bind(console);

module.exports = {
    init: function(){
        if(setting.logging.captureConsole){
            console.log = (...args) => {
                originalConsoleLog(...args);
                this.recordLog('console-log', args.join(' '))
            }
            
            console.error = (...args) => {
                originalConsoleError(...args);
                this.recordLog('console-error', args.join(' '))
            }
        }

        /* 서버 시작 시 남은 로그 파일 업로드 */
        this.rotateAndUploadLog();
    },

    recordLog: async function(category, log){
        const timestamp = new Date().stringFormat('y-m-d h:i:s')
        const logDate = new Date().stringFormat('y-m-d')
        const logString = `${timestamp} ${log}`
        
        await fs.appendFile(`./logs/${setting.logging.uploadKeyPrefix}_${logDate}.${category}.log`, `${logString}\n`)
    },

    rotateAndUploadLog: async function(){
        // pm2 cluster에서는 0번 프로세스에서만 실행한다. (tryWorkerProcessLock 사용 X)
        if(process.env.NODE_APP_INSTANCE!==undefined && process.env.NODE_APP_INSTANCE!=='0') return

        let today = new Date().stringFormat('y-m-d');        
        let logFiles = await fs.readdir('./logs');
        let uploadTarget = logFiles.filter(file => {
            if(!file.endsWith('.log')) return false;
            if(!file.startsWith(`${setting.logging.uploadKeyPrefix}_`)) return false;

            let logDate = file.replace('.log', '').split('.').pop();
            
            return (logDate!==today)
        });

        for(let i=0; i<uploadTarget.length; i++){
            let file = uploadTarget[i];
            let filePath = `./logs/${file}`;

            try{
                let stat = await fs.stat(filePath);
                await util.s3.auth.putObject({
                    Bucket: setting.logging.uploadBucket,
                    Key: file.replaceAll('_', '/'),
                    Body: createReadStream(filePath),
                    ContentLength: stat.size,
                    ContentType: 'text/plain; charset=utf-8',
                });
            }catch(err){
                console.error(`로그파일 업로드 오류 (${file}): `, err);
                throw err
            }

            try{
                await fs.unlink(filePath);
                console.log(`로그파일 업로드 및 삭제 완료 (${file})`);
            }catch(err){
                console.error(`로그 파일 삭제 오류 (${file}): `, err);
                throw err
            }
        }
    }
}
