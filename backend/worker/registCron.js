const cron = require('node-cron');

const loggingModule = require('../_system_/loggingModule.sys.js');

module.exports = function(){
    require('../user/worker/registCron.js')()

    // 1시간마다 실행
    cron.schedule('0 * * * *', async () => {
        // 로그 파일 업로드 및 삭제(system)
        try{
            await loggingModule.rotateAndUploadLog()
        }catch(e){
            console.error(e);
        }
    });
}