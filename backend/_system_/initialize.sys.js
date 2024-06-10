const express = require('express');

module.exports = function(expressApp){
    /* API 및 API 문서 라우팅 설정(B) */
    const API = require('./middleware.sys.js');    
    expressApp.use(express.json());
    expressApp.use('/API', API);

    /* 문서 라우팅 설정 */
    const API_doc = require('./document/documentation.sys.js');
    expressApp.use('/API-doc', API_doc);
}