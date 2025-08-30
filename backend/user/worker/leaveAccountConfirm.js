let util = require('../../core/util.js')

module.exports = async function(){
    // 0번 프로세스에서만 실행
    if(process.env.NODE_APP_INSTANCE!=0 && process.env.NODE_APP_INSTANCE!=undefined) return

    // 회원 탈퇴 처리 쿼리(업데이트) 실행
    await util.mysql.update(
        'example',
        'user',
        {
            leaveComplete: 1
        },
        'leaveComplete=0 AND leaveAt<=DATE_SUB(NOW(), INTERVAL 7 DAY)'
    )
}