const setting = require('../../core/setting.js');
const webhookSetting = require('../../_webhooks.sys.js');
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
            <title>API Document</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <link rel="stylesheet" href="/API-doc/webhook-doc.css">
        </head>
        <body>

        <div class="container">
            <div class="documentTitle">${setting.AppName} Webhook endpoint Document</div>

            <div class="usage">
                <div class="title">Usage</div>

                <div class="path">
                    <div class="label">Path</div>
                    <div>
                        ${req.protocol}://${req.get('host')}/webhook/{webhook path}
                    </div>
                </div>

                <div class="body">
                    <div class="description">
                        <ul>
                            <li>API 요청 Path는 /API로 고정</li>
                            <li>요청 정보는 Body에 배열로 담기며 한 번의 요청으로 여러개의 작업을 시행할 수 있음</li>
                            <li>각각의 요청 정보는 "Operation"과 "param"으로 이루어져 있음</li>
                        </ul>
                    </div>
                </div>                
            </div>
        `;

    let webhookList = Object.keys(webhookSetting);

    let groupOption = '<option value="">ALL</option>';
    let groupList = [...new Set(webhookList.map((webhookName)=> webhookSetting[webhookName].group ))];
    groupList.forEach((group)=>{ groupOption += `<option value="${group}">${group}</option>` })
    

    html += `<div class="webhooks">
        <div class="title">webhooks</div>
        <div class="filter">
            <select class="group">${groupOption}</select>
            <input type="text" class="keyword" placeholder="Filter... (webhookPath, description)">
        </div>
    </div>`

    for(let i=0;i<webhookList.length;i++){
        let responses = '';
        if(webhookSetting[webhookList[i]].authRequire){
            responses += `<div>
                <div class="label">${response.Unauthorized.name}</div>
                <textarea readonly>${JSON.stringify(new response.Unauthorized(), null, 4)}</textarea>
            </div>`
        }
        for(let j=0;j<webhookSetting[webhookList[i]].responseSchema.length;j++){
            responses += `<div>
                <div class="label">${webhookSetting[webhookList[i]].responseSchema[j].name}</div>
                <textarea readonly>${JSON.stringify(new webhookSetting[webhookList[i]].responseSchema[j](), null, 4)}</textarea>
            </div>`
        }

        let needAuth = ""
        if(webhookSetting[webhookList[i]].authRequire) needAuth = `<i class="auth-icon fa-solid fa-lock"></i>`
        html += `
            <div class="webhook folded" id="${webhookList[i]}" data-group="${webhookSetting[webhookList[i]].group}" data-webhook="${webhookList[i]}" data-method="${webhookSetting[webhookList[i]].method.toLowerCase()}">
                <div class="title">
                    <span class="method">${webhookSetting[webhookList[i]].method.toUpperCase()}</span>
                    ${webhookList[i]}
                    ${needAuth}
                    <div class="description">- ${webhookSetting[webhookList[i]].description}</div>
                    <i class="fold-toggle fa-solid fa-chevron-down"></i>
                    <i class="copy-icon fa-solid fa-clipboard"></i>
                </div>
                <div class="param">
                    <div class="label">Param <span class="description">GET 요청에서는 쿼리 스트링, POST 요청에서는 body 데이터</span></div>
                    <textarea>${JSON.stringify(webhookSetting[webhookList[i]].paramSchema, null, 4)}</textarea>
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

        <div id="alertArea"></div>

        <script src="/API-doc/webhook-doc.js"></script>

        </body>
    </html>
    `

    res.send(html)
}