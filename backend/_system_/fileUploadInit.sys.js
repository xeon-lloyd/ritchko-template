const setting = require('../core/setting.js');
const util = require("../core/util.js");
const busboy = require("connect-busboy");

module.exports = function(app){
    app.use(busboy({
        limits: {
            files: 1,
            fileSize: setting.fileUpload.limitSize
        }
    }));

    app.post('/API/fileUpload', async function(req, res){
        let chunks = [], fInfo;
        let IS_LIMIT = false
    
        if(req.busboy==undefined){
            // 파일 없음 응답
            return res.status(400).json({
                response: 400,
                errorCode: "FileNotFound",
                message: "첨부한 파일이 없습니다. 1개의 파일을 첨부해주시기 바랍니다.",
                data: null
            })
        }
    
        req.busboy.on('file', function(fieldname, file, fileInfo) {
            fInfo = fileInfo
    
            file.on('data', function(data) {
                chunks.push(data)
            });
    
            file.on('limit', async function(){
                IS_LIMIT = true
            })
    
            file.on('end', async function() {
                
            });
        });
    
        req.busboy.on('finish', async function() {
            if(IS_LIMIT){
                // 용량 초과 응답
                return res.status(413).json({
                    response: 413,
                    errorCode: "FileTooLarge",
                    message: `첨부된 파일의 용량이 ${setting.fileUpload.limitSize.byteSizeToString()}를 초과하여 업로드가 거부 되었습니다`,
                    data: null
                })
            }

            let fileName = `${new Date().getTime()}-${parseInt(Math.random()*9999+1000)}-${parseInt(Math.random()*9999+1000)}`
    
            await util.s3.upload({
                Bucket: setting.fileUpload.tempBucket,
                Key: fileName,
                BodyRaw: Buffer.concat(chunks),
                ContentType: fInfo.mimeType
            })
    
            // 완료 응답
            res.json({
                response: 200,
                errorCode: null,
                message: "파일 업로드 완료",
                data: util.encrypt.encode(fileName)
            })
        });
    
        req.pipe(req.busboy)
    })
}