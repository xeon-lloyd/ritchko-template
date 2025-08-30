const cron = require('node-cron');

const leaveAccountConfirm = require('./leaveAccountConfirm.js')

module.exports = function(){
    // 1시간마다 실행
    cron.schedule('0 * * * *', async () => {
        try{
            // 회원 탈퇴요청 일주일 지난 유저 탈퇴 처리
            await leaveAccountConfirm()
        }catch(e){
            console.error(e);
        }
    });
}