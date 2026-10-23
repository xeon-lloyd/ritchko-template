const express = require('express');
const crypto = require('crypto');
const { S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");
const { HttpRequest } = require("@smithy/protocol-http");
const { Hash } = require("@smithy/hash-node");
const { formatUrl } = require("@aws-sdk/util-format-url");

const setting = require('../core/setting.js');
const util = require("../core/util.js");
const response = require('../_response.sys.js');

module.exports = function(app){
    const enabled = util.s3.isConfigured() && !!setting.s3.endpoint && !!setting.fileUpload?.tempBucket?.trim();
    let endpoint, uploadHost, presigner;
    if(enabled){
        endpoint = new URL(setting.s3.endpoint);
        uploadHost = `${setting.fileUpload.tempBucket}.${endpoint.host}`;
        presigner = new S3RequestPresigner({
            credentials: {
                accessKeyId: setting.s3.accessKeyId,
                secretAccessKey: setting.s3.secretAccessKey,
            },
            region: setting.s3.region,
            sha256: Hash.bind(null, 'sha256')
        });
    }else{
        console.error('[파일 업로드] S3 설정 또는 endpoint·tempBucket 미설정으로 비활성화합니다. setting.s3와 setting.fileUpload.tempBucket을 확인하세요.');
    }

    app.post('/API/fileUpload', express.json({ limit: '20kb' }), async function(req, res){
        if(!enabled) return res.status(503).json({
            response: 503,
            label: 'GetFileUploadURLFail',
            target: null,
            message: '파일 업로드 저장소가 설정되지 않았습니다',
            data: null
        });

        try{
            const rateLimitAllowed = await util.rateLimit({
                operation: 'sys:FileUpload',
                key: '#IP',
                windowMs: setting.fileUpload.rateLimit.windowMs,
                max: setting.fileUpload.rateLimit.max
            }, req);
            if(!rateLimitAllowed) return res.send(new response.TooManyRequests());

            const uploadKey = crypto.randomUUID();
            const uploadKeyExpire = setting.fileUpload.uploadKeyExpire;
            const expiresAt = new Date(Date.now() + uploadKeyExpire * 1000).toISOString();

            const redisKey = `sys:fileUpload:${uploadKey}`;
            await util.redis.set(redisKey, 'true', uploadKeyExpire);

            const url = new URL(`${endpoint.protocol}//${uploadHost}/${uploadKey}`);

            const signedRequest = await presigner.presign(new HttpRequest({
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port ? Number(url.port) : undefined,
                method: 'PUT',
                path: url.pathname,
                headers: {
                    host: uploadHost,
                    'if-none-match': '*'
                }
            }), {
                expiresIn: uploadKeyExpire,
                unhoistableHeaders: new Set([ 'if-none-match' ])
            });

            res.json({
                response: 200,
                label: 'GetFileUploadURLOK',
                target: null,
                message: "파일 업로드 URL 발급 완료",
                data: {
                    uploadKey,
                    uploadUrl: formatUrl(signedRequest),
                    expiresAt,
                    limitSize: setting.fileUpload.limitSize
                }
            })
        }catch(e){
            console.error(e);
            res.status(500).json({
                response: 500,
                label: "GetFileUploadURLFail",
                target: null,
                message: "파일 업로드 URL 발급 실패",
                data: null
            })
        }
    })
}
