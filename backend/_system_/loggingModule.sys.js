const fs = require('fs').promises;
const setting = require('../core/setting.js');

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
    },

    recordLog: async function(category, log){
        const timestamp = new Date().stringFormat('y-m-d h:i:s')
        const logDate = new Date().stringFormat('y-m-d')
        const logString = `${timestamp} ${log}`
        
        await fs.appendFile(`./logs/${setting.logging.uploadKeyPrefix}_${category}.${logDate}.log`, `${logString}\n`)
    }
}
