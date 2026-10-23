const setting = require('../../core/setting.js');
const operationSetting = require('../../_sockets.sys.js');
const response = require('../../_response.sys.js');

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
            <title>Socket Document</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <link rel="stylesheet" href="/API-doc/socket-doc.css">
        </head>
        <body>

        <div class="container">
            <div class="documentTitle">${setting.AppName} Socket Document</div>

            <div class="links">
                <a href="/API-doc">Operations</a>
                <a href="/API-doc/webhooks">Webhooks</a>
                <a href="/API-doc/sockets">Sockets</a>
                <a href="/API-doc/fileUpload">FileUpload</a>
            </div>

            <div class="usage">
                <div class="title">Usage</div>

                <div class="path">
                    <div class="label">Host</div>
                    <div>
                        ${req.protocol}://${req.get('host')}
                    </div>

                    <br>

                    <div class="label">Path</div>
                    <div>
                        <span>socket.io</span>
                        /socket
                    </div>
                </div>

                <div class="body">
                    <div class="label">Body</div>
                    <pre>socket.emit("messageName", param, result => handler(result))</pre>
                    <div class="description">
                        <ul>
                            <li>client > server 로 전송되는 소켓 operation은 "Message"라고 지칭됨</li>
                            <li>해당 소켓 operation의 Param이 param으로 전달됨</li>
                            <li>성공·검증·인증·시스템 오류 응답은 해당 요청의 ack callback으로 전달됨</li>
                            <li>callback이 없으면 처리만 수행하며, 반환값이 없으면 기본 OK로 응답함</li>
                        </ul>
                    </div>

                    <br>

                    <pre>socket.on("eventName", data => handler(data))</pre>
                    <div class="description">
                        <ul>
                            <li>server > client 로 전송되는 소켓 operation은 "Event"라고 지칭됨</li>
                            <li>해당 소켓 operation의 Response가 data로 전달됨</li>
                        </ul>
                    </div>

                    <br>

                    <pre>socket.on("connect_error", error => errorHandler(error.data || error.message))</pre>
                    <div class="description">
                        <ul>
                            <li>잘못되거나 만료된 토큰은 연결 승인 전에 거절됨 (error.data.response: 401)</li>
                            <li>refresh가 가능하면 토큰 갱신 후 명시적으로 재연결하며 반복 재시도에 유의</li>
                        </ul>
                    </div>
                </div>                
            </div>


            <div class="setAuth">
                <div class="title">Set Auth Key</div>
                <div class="description">
                    <ul>
                        <li>인증키는 연결 시 header의 <b>auth</b> 또는 auth 옵션의 <b>token</b>으로 전달 (header 우선)</li>
                        <li>토큰이 없으면 익명 연결 허용. 인증 연결은 사용자 room 가입 완료 후 기본 connect 발생</li>
                    </ul>
                </div>
            </div>`;

    let opreationList = Object.keys(operationSetting);

    let groupOption = '<option value="">ALL</option>';
    let groupList = [...new Set(opreationList.map((operationName)=> operationSetting[operationName].group ))];
    groupList.forEach((group)=>{ groupOption += `<option value="${group}">${group}</option>` })
    

    html += `<div class="operations">
        <div class="title">Sockets</div>
        <div class="filter">
            <select class="group">${groupOption}</select>
            <select class="type">
                <option value="">ALL</option>
                <option value="message">Message</option>
                <option value="event">Event</option>
            </select>
            <input type="text" class="keyword" placeholder="Filter... (operationName, description)">
        </div>
    </div>`

    for(let i=0;i<opreationList.length;i++){
        let responses = '';
        if(operationSetting[opreationList[i]].authRequire){
            responses += `<div>
                <div class="label">${response.Unauthorized.name}</div>
                <textarea readonly>${JSON.stringify(new response.Unauthorized(), null, 4)}</textarea>
            </div>`
        }
        for(let j=0;j<operationSetting[opreationList[i]].responseSchema?.length;j++){
            responses += `<div>
                <div class="label">${operationSetting[opreationList[i]].responseSchema[j].name}</div>
                <textarea readonly>${JSON.stringify(new operationSetting[opreationList[i]].responseSchema[j](), null, 4)}</textarea>
            </div>`
        }

        let needAuth = ""
        if(operationSetting[opreationList[i]].authRequire && operationSetting[opreationList[i]].type=='message') needAuth = `<i class="auth-icon fa-solid fa-lock"></i>`
        html += `
            <div class="operation folded" id="${opreationList[i]}" data-group="${operationSetting[opreationList[i]].group}" data-type="${operationSetting[opreationList[i]].type}" data-operation="${opreationList[i]}">
                <div class="title">
                    ${opreationList[i]}
                    ${needAuth}
                    <div class="description">- ${operationSetting[opreationList[i]].description}</div>
                    <i class="fold-toggle fa-solid fa-chevron-down"></i>
                    <i class="copy-icon fa-solid fa-clipboard"></i>
                </div>
                <div class="param">
                    <div class="label">Param</div>
                    <textarea readonly>${JSON.stringify(operationSetting[opreationList[i]].paramSchema, null, 4)}</textarea>
                </div>

                <div class="response">
                    <div class="label">${operationSetting[opreationList[i]].type=='message'?'Ack Response':'Response'}</div>
                    <div class="list">
                        ${responses}
                    </div>
                </div>
            </div>
        `
    }

    html += `
        </div>

        <div id="alertArea"></div>

        <script src="/API-doc/socket-doc.js"></script>

        </body>
    </html>
    `

    res.send(html)
}
