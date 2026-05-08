const setting = require('./backend/core/setting.js');
process.env.TZ = setting.appTimeZone;
const util = require('./backend/core/util.js');

const express = require('express');
const fs = require('fs');

const loggingModule = require('./backend/_system_/loggingModule.sys.js');
const appCronRegister = require('./backend/worker/registCron.js')
const serverInfoPrinter = require('./backend/_system_/serverInfoPrinter.sys.js');

const app = express();
const server = require('http').createServer(app);

/* 쿠키 사용 설정(F/B) */
app.use(require('cookie-parser')());

/* 백엔드 로직 초기화(api, webhook, socket, api-doc)(B) */
require('./backend/_system_/initialize.sys.js')(app, server);

/* static 리소스 폴더 설정(F) */
app.use(express.static('public'));

/* ejs 설정 */
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

/* request aborted 핸들링 */
app.use((err, req, res, next) => {
    if(err && err.code === 'ECONNABORTED'){
        res.status(400).end();
    }else{
        next(err);
    }
});

/* 메인페이지 */
app.get('/', function(req, res){
	res.render('index.html');
})

/* 프론트 라우팅 */
app.get('/:view(*)', function(req, res, next){
	if(!fs.existsSync(`./views/${req.params.view}.html`)){
		next();
		return false;
	}

	res.render(`${req.params.view}.html`);
})



// 최초 init 함수
async function init(){
    /* DB 연결 */
    util.mysql.connect('database1');

    /* s3 초기화 */
    util.s3.setAuth()

    /* redis 초기화 */
    await util.redis.init();

    /* 로깅 초기화 */
    loggingModule.init();

    /* cron 등록 */
    appCronRegister()


    /* 서버 listen 시작 */
    server.listen(setting.port, async function(){
        /* pm2 준비 완료 알림 */
        if(process.send) process.send('ready');

        serverInfoPrinter();
    })
}
init().catch((e) => {
    console.error('[서버 시작 실패]', e);
    process.exit(1);
});
