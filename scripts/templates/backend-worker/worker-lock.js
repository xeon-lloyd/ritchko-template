const util = require('../../core/util.js');

// producer
const queueName = 'WP:{{workerName}}'
module.exports = async function {{workerName}}(){
    const ttlSeconds = {{ttlSeconds}}
    if(!await util.worker.tryWorkerProcessLock('{{workerName}}', ttlSeconds)) return

    // 핵심 비즈니스 처리
}

// consumer
{{consumerBlock}}
