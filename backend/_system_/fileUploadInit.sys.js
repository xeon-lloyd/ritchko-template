const express = require('express');
const crypto = require('crypto');
const { S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");
const { HttpRequest } = require("@smithy/protocol-http");
const { Hash } = require("@smithy/hash-node");
const { formatUrl } = require("@aws-sdk/util-format-url");

const setting = require('../core/setting.js');
const util = require("../core/util.js");
const response = require('../_response.sys.js');

const endpoint = new URL(setting.s3.endpoint);
const uploadHost = `${setting.fileUpload.tempBucket}.${endpoint.host}`;
const presigner = new S3RequestPresigner({
    credentials: {
        accessKeyId: setting.s3.accessKeyId,
        secretAccessKey: setting.s3.secretAccessKey,
    },
    region: setting.s3.region,
    sha256: Hash.bind(null, 'sha256')
});

module.exports = function(app){
    app.post('/API/fileUpload', express.json({ limit: '20kb' }), async function(req, res){
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
                    expiresAt
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
