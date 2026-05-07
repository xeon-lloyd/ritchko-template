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
                        Content-Type: application/json
                    </div>
                </div>

                <div class="description">
                    <ul>
                        <li>S3 호환 저장소에 직접 업로드하기 위한 presigned PUT URL 발급</li>
                        <li>응답된 uploadKey를 저장소 object key로 사용</li>
                        <li>클라이언트는 uploadUrl로 직접 PUT 업로드</li>
                        <li>PUT 업로드 시 If-None-Match: * 헤더 필수</li>
                        <li>uploadKey는 ${(setting.fileUpload.uploadKeyExpire || 10 * 60).secToTime()} 동안 유효</li>
                        <li>최종 API(Operation)의 param으로 uploadKey를 전달하면 백엔드 로직에서 파일 처리</li>
                    </ul>
                </div>
            </div>


            <div class="response">
                <div class="title">Response</div>

                <div class="section">
                    <div class="title">요청 제한 초과</div>
                    <pre>{
    "response": 429,
    "errorCode": "TooManyRequests",
    "target": null,
    "message": "Too many file upload URL requests",
    "data": null
}</pre>
                    
                </div>

                <div class="section">
                    <div class="title">업로드 URL 발급 실패</div>
                    <pre>{
    "response": 500,
    "errorCode": "InternalServerError",
    "target": null,
    "message": "파일 업로드 URL 발급 실패",
    "data": null
}</pre>
                    
                </div>

                <div class="section">
                    <div class="title">업로드 URL 발급 완료</div>
                    <pre>{
    "response": 200,
    "errorCode": null,
    "target": null,
    "message": "파일 업로드 URL 발급 완료",
    "data": {
        "uploadKey": "UUID",
        "uploadUrl": "Presigned PUT URL",
        "expiresAt": "2026-01-01T00:00:00.000Z"
    }
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
