const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');

module.exports = async function(req, res){
    function getUserInfoExample(uid){
        return console.log(uid)
    }

    //webhook은 express를 100% 그대로 사용하기 때문에 post 요청에서 body 데이터를 받을땐 req.body
    getUserInfoExample(req.body.uid)

    //webhook은 express를 100% 그대로 사용하기 때문에 res.() 관련 메서드로 응답
    return res.send(new response.UserInfoUpdateProcessOK())
}