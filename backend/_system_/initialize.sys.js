const express = require('express');

module.exports = function(expressApp){
    /* fileUpload 초기화 */
    const fileUpload = require('./fileUploadInit.sys.js')(expressApp);

    /* API 및 API 문서 라우팅 설정(B) */
    const API = require('./middleware.sys.js');    
    expressApp.use(express.json());
    expressApp.use('/API', API);

    /* webhook 초기화 */
    require('./webhookInit.sys.js')(expressApp)

    /* 문서 라우팅 설정 */
    const API_doc = require('./document/documentation.sys.js');
    expressApp.use('/API-doc', API_doc);
    expressApp.use('/API-doc/:type', API_doc);
}