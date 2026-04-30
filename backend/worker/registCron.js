const util = require('../core/util.js');

module.exports = async function(){
    require('../user/worker/registCron.js')()
}