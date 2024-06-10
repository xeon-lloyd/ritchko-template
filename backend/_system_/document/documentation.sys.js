const router = require("express").Router();
const fs = require("fs");

router.get("/", require('./operations.sys.js'))
router.get("/webhooks", require('./webhooks.sys.js'))

router.get("/:filename(*)", function(req, res, next){
    if(fs.existsSync(__dirname + '/' + req.params.filename)){
        res.sendFile(__dirname + '/' + req.params.filename)
    }else{
        res.status(404).send('not found')
    }
})

module.exports = router;