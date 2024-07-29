const setting = require('../../core/setting.js');

module.exports = function(req, res, next){
    if(setting.isProduction){
        next();
        return;
    }

    let html = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FileUpload Document</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <link rel="stylesheet" href="/API-doc/fileUpload-doc.css">
        </head>
        <body>

        <div class="container">
            <div class="documentTitle">${setting.AppName} FileUpload Document</div>

            <div class="links">
                <a href="/API-doc">Operations</a>
                <a href="/API-doc/webhooks">Webhooks</a>
                <a href="/API-doc/sockets">Sockets</a>
                <a href="/API-doc/fileUpload">FileUpload</a>
            </div>

            <div class="usage">
                <div class="title">Usage</div>

                <div class="path">
                    <div class="label">Path</div>
                    <div>
                        <span>POST</span>
                        ${req.protocol}://${req.get('host')}/API/fileUpload
                    </div>
                </div>

                <div class="header">
                    <div class="label">Header</div>
                    <div>
                        Content-Type: multipart/form-data
                    </div>
                </div>

                <div class="description">
                    <ul>
                        <li>파일을 저장소로 업로드하는 통합 파일 업로드 시스템</li>
                        <li>key(name)에 상관없이 파일 업로드</li>
                        <li>한 번에 1개의 파일만 업로드</li>
                        <li>${setting.fileUpload.limitSize.byteSizeToString()}의 파일 용량 제한</li>
                        <li>파일을 업로드 한 후 "File Token" 응답</li>
                        <li>응답된 "File Token"을 API(Operation)의 param으로 전달하면 백엔드 로직에서 파일 처리</li>
                    </ul>
                </div>
            </div>


            <div class="response">
                <div class="title">Response</div>

                <div class="section">
                    <div class="title">파일 미첨부</div>
                    <pre>{
    "response": 400,
    "errorCode": "FileNotFound",
    "target": null,
    "message": "첨부한 파일이 없습니다. 1개의 파일을 첨부해주시기 바랍니다.",
    "data": null
}</pre>
                    
                </div>

                <div class="section">
                    <div class="title">파일 용량 초과</div>
                    <pre>{
    "response": 413,
    "errorCode": "FileTooLarge",
    "target": null,
    "message": "첨부된 파일의 용량이 ${setting.fileUpload.limitSize.byteSizeToString()}를 초과하여 업로드가 거부 되었습니다",
    "data": null
}</pre>
                    
                </div>

                <div class="section">
                    <div class="title">업로드 완료</div>
                    <pre>{
    "response": 200,
    "errorCode": null,
    "target": null,
    "message": "파일 업로드 완료",
    "data": "File Token(String)"
}</pre>
                    
                </div>
            </div>

        </div>

        <div id="alertArea"></div>

        <script src="/API-doc/fileUpload-doc.js"></script>

        </body>
    </html>
    `

    res.send(html)
}