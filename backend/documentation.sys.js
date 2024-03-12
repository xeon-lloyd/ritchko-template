const router = require("express").Router();

const setting = require('./core/setting.js');
const operationSetting = require('./_operations.sys.js');
const response = require('./_response.sys.js');

router.get("/style.css", function(req, res, next){
    res.sendFile(__dirname + '/doc-style.css')
})

router.get("/script.js", function(req, res, next){
    res.sendFile(__dirname + '/doc-script.js')
})

router.get("/", function(req, res, next){
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
            <title>API Document</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <link rel="stylesheet" href="/API-doc/style.css">
        </head>
        <body>

        <div class="container">
            <div class="documentTitle">${setting.AppName} API Document</div>

            <div class="usage">
                <div class="title">Usage</div>

                <div class="path">
                    <div class="label">Path</div>
                    <div>
                        <span>POST</span>
                        ${setting.hostName}/API
                    </div>
                </div>

                <div class="body">
                    <div class="label">Body</div>
                    <pre>[
    {
        "operation": "OperationOne",
        "param": {
            "id": "123",
            "pw": "test"
        }        
    },
    {
        "operation": "OperationTwo",
        "param": {
            "commentPK": 13
        }        
    },
    {
        "operation": "OtherOperation",
        "param": {}        
    }
]</pre>
                    <div class="description">
                        <ul>
                            <li>API 요청 Path는 /API로 고정</li>
                            <li>요청 정보는 Body에 배열로 담기며 한 번의 요청으로 여러개의 작업을 시행할 수 있음</li>
                            <li>각각의 요청 정보는 "Operation"과 "param"으로 이루어져 있음</li>
                        </ul>
                    </div>
                </div>                
            </div>


            <div class="setAuth">
                <div class="title">Set Auth Key</div>
                <div class="input">
                    <div class="label">Auth key</div>
                    <input placeholder="Auth key" type="password">
                </div>
                <div class="description">
                    <ul>
                        <li>인증키는 POST 요청시 header에 <b>auth</b> 이름으로 포함</li>
                    </ul>
                </div>
            </div>


            <div class="operations">
                <div class="title">Operations</div>
            </div>
    `;

    let opreationList = Object.keys(operationSetting);

    for(let i=0;i<opreationList.length;i++){
        let responses = '';
        if(operationSetting[opreationList[i]].authRequire){
            responses += `<div>
                <div class="label">${response.Unauthorized.name}</div>
                <textarea readonly>${JSON.stringify(new response.Unauthorized(), null, 4)}</textarea>
            </div>`
        }
        for(let j=0;j<operationSetting[opreationList[i]].responseSchema.length;j++){
            responses += `<div>
                <div class="label">${operationSetting[opreationList[i]].responseSchema[j].name}</div>
                <textarea readonly>${JSON.stringify(new operationSetting[opreationList[i]].responseSchema[j](), null, 4)}</textarea>
            </div>`
        }

        let needAuth = ""
        if(operationSetting[opreationList[i]].authRequire) needAuth = `<i class="fa-solid fa-lock"></i>`
        html += `
            <div class="operation folded" id="${opreationList[i]}" data-operation="${opreationList[i]}">
                <div class="title">
                    ${opreationList[i]}
                    ${needAuth}
                    <i class="fold-toggle fa-solid fa-chevron-down"></i>
                </div>
                <div class="param">
                    <div class="label">Param</div>
                    <textarea>${JSON.stringify(operationSetting[opreationList[i]].paramSchema, null, 4)}</textarea>
                    <button class="requset">Test Request</button>
                    <div class="requestAt"></div>
                    <pre class="API_Response"></pre>
                </div>

                <div class="response">
                    <div class="label">Response</div>
                    <div class="list">
                        ${responses}
                    </div>
                </div>
            </div>
        `
    }

    html += `
        </div>

        <script src="/API-doc/script.js"></script>

        </body>
    </html>
    `

    res.send(html)
})


module.exports = router;