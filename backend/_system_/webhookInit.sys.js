module.exports = function(app){
    let webhooks = require('../_webhooks.sys.js')

    let list = Object.keys(webhooks)
    for(let i=0;i<list.length;i++){
        app[webhooks[list[i]].method.toLowerCase()](`/webhook${list[i]}`, require(`../${webhooks[list[i]].logic}`))
    }
}