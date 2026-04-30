const util = require('../core/util.js');

module.exports = async function(){
    // worker 관련 redis 초기화
    await util.worker.init();

    require('../user/worker/registCron.js')()
}