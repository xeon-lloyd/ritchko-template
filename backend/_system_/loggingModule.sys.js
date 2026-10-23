const fs = require('fs').promises;
const { createReadStream, mkdirSync } = require('fs');

const setting = require('../core/setting.js');
const util = require('../core/util.js');

const originalConsoleLog = console.log.bind(console);
const originalConsoleError = console.error.bind(console);

module.exports = {
    init: function(){
        // 로그 폴더 생성
        mkdirSync('./logs', { recursive: true });

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
        if(!util.s3.isConfigured() || !util.s3.auth || !setting.logging?.uploadBucket?.trim()){
            console.error('[로그 백업] S3 미초기화 또는 uploadBucket 미설정으로 백업을 건너뜁니다. 로컬 로그는 유지합니다.');
        }
        this.rotateAndUploadLog().catch(err => {
            console.error('로그 백업 오류: ', err);
        });
    },

    recordLog: async function(category, log){
        const timestamp = new Date().stringFormat('y-m-d h:i:s')
        const logDate = new Date().stringFormat('y-m-d')
        const logString = `${timestamp} ${log}`
        
        await fs.appendFile(`./logs/${setting.logging.uploadKeyPrefix}_${logDate}.${category}.log`, `${logString}\n`)
    },

    rotateAndUploadLog: async function(){
        if(!util.s3.isConfigured() || !util.s3.auth || !setting.logging?.uploadBucket?.trim()) return;

        // pm2 cluster에서는 0번 프로세스에서만 실행한다. (tryWorkerProcessLock 사용 X)
        if(process.env.NODE_APP_INSTANCE!==undefined && process.env.NODE_APP_INSTANCE!=='0') return

        let today = new Date().stringFormat('y-m-d');        
        let logFiles = await fs.readdir('./logs');
        let uploadTarget = logFiles.filter(file => {
            if(!file.endsWith('.log')) return false;
            if(!file.startsWith(`${setting.logging.uploadKeyPrefix}_`)) return false;

            let logDate = file.slice(`${setting.logging.uploadKeyPrefix}_`.length).split('.')[0]
            
            return (logDate!==today)
        });

        for(let i=0; i<uploadTarget.length; i++){
            let file = uploadTarget[i];
            let filePath = `./logs/${file}`;
            let stream;

            try{
                let stat = await fs.stat(filePath);
                stream = createReadStream(filePath);
                await util.s3.auth.putObject({
                    Bucket: setting.logging.uploadBucket,
                    Key: file.replaceAll('_', '/'),
                    Body: stream,
                    ContentLength: stat.size,
                    ContentType: 'text/plain; charset=utf-8',
                });
            }catch(err){
                console.error(`로그파일 업로드 오류 (${file}): `, err);
                continue;
            }finally{
                stream?.destroy();
            }

            try{
                await fs.unlink(filePath);
                console.log(`로그파일 업로드 및 삭제 완료 (${file})`);
            }catch(err){
                console.error(`로그 파일 삭제 오류 (${file}): `, err);
            }
        }
    }
}
