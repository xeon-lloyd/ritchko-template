const util = require('../../core/util.js');

module.exports = async function {{workerName}}(){
    // 예상 작업 소요시간보다 넉넉하게 설정
    const ttlSeconds = {{ttlSeconds}}
    if(!await util.worker.tryWorkerProcessLock('{{workerName}}', ttlSeconds)) return

    // 핵심 비즈니스 처리
}

