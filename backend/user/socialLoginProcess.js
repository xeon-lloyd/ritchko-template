const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');

module.exports = async function(req, res){
    //webhook은 express를 100% 그대로 사용하기 때문에 get 요청에서 쿼리 데이터를 받을땐 req.query
    if(req.query.code=='test'){
        //webhook은 express를 100% 그대로 사용하기 때문에 res.() 관련 메서드로 응답
        return res.redirect(req.query.state)
    }else{
        return res.redirect("/")
    }
}