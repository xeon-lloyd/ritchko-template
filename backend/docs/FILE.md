# Backend File Upload Guide

## 목적
이 문서는 파일 업로드를 다루는 backend 원본 가이드다. 작업 직전 확인용 요약은 `backend/docs/FILE-CHECKLIST.md`를 본다.

## 기본 흐름
1. 클라이언트가 `POST /API/fileUpload`로 업로드 URL을 요청한다.
2. `backend/_system_/fileUploadInit.sys.js`가 UUID uploadKey와 presigned PUT URL을 발급한다.
3. uploadKey는 `setting.fileUpload.tempBucket`의 object key로 그대로 사용된다.
4. uploadKey는 Redis에 `sys:fileUpload:{uploadKey}` 키로 저장되고 `setting.fileUpload.uploadKeyExpire` 뒤 만료된다.
5. 클라이언트는 응답받은 uploadUrl로 S3 호환 저장소에 직접 PUT 업로드한다.
6. PUT 업로드에는 `If-None-Match: *` 헤더를 반드시 포함한다.
7. 실제 operation은 param으로 uploadKey를 받는다.
8. operation은 `valider.isValidUploadKey()`로 발급/만료 여부를 검증한다.
9. operation은 `util.fileUpload.getFileInfo()`, `checkFileSize()`와 `fileInfo.ContentType`으로 파일 유효성을 확인한다.
10. operation은 `moveTo()` 또는 `toStream()`으로 업로드 파일을 소비한다.
11. operation은 파일 소비 성공 직후 `util.fileUpload.revokeUploadKey(uploadKey)`를 호출한다.

## 시스템 endpoint
`/API/fileUpload`는 `/API` operation middleware를 거치지 않는 별도 endpoint다.

- method: `POST`
- path: `/API/fileUpload`
- request body: 없음
- request content-type: `application/json`
- auth: 없음
- rate limit: `setting.fileUpload.rateLimit.windowMs`, `setting.fileUpload.rateLimit.max`
- presigned URL 만료: `setting.fileUpload.uploadKeyExpire`
- presigned URL host: `{setting.fileUpload.tempBucket}.{setting.s3.endpoint host}`

`setting.s3.endpoint`는 파일 업로드 URL 발급에 필요하다. R2는 `https://<accountId>.r2.cloudflarestorage.com` 형태를 사용한다.

## `/API/fileUpload` 응답
성공:
```json
{
    "response": 200,
    "label": "GetFileUploadURLOK",
    "target": null,
    "message": "파일 업로드 URL 발급 완료",
    "data": {
        "uploadKey": "UUID",
        "uploadUrl": "Presigned PUT URL",
        "expiresAt": "2026-01-01T00:00:00.000Z"
    }
}
```

요청 제한 초과:
```json
{
    "response": 429,
    "message": "Too many requests",
    "target": null,
    "data": null
}
```

발급 실패:
```json
{
    "response": 500,
    "label": "GetFileUploadURLFail",
    "target": null,
    "message": "파일 업로드 URL 발급 실패",
    "data": null
}
```

## 클라이언트 업로드
```js
await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
        'If-None-Match': '*',
        'Content-Type': file.type
    },
    body: file
})
```

- `If-None-Match: *`는 presigned URL에 서명된 헤더다. 클라이언트가 반드시 같은 헤더를 보내야 한다.
- 같은 uploadKey object가 이미 있으면 저장소가 재업로드를 거부한다.
- `Content-Type`은 현재 presigned URL 서명 조건이 아니다. operation에서 `fileInfo.ContentType`으로 형식을 검증할 수 있도록 클라이언트가 실제 파일 타입을 보내는 것을 전제로 한다.
- 브라우저 직접 업로드를 쓰려면 임시 업로드 bucket CORS에 `PUT` method와 `If-None-Match`, `Content-Type` request header를 허용한다.

## uploadKey 원칙
- uploadKey는 UUID 문자열이다.
- uploadKey는 임시 업로드 object key이자 operation에 전달하는 식별자다.
- uploadKey 자체를 서비스 핵심 데이터처럼 DB에 저장하지 않는다.
- Redis에는 uploadKey 유효성만 저장한다. 파일명, mimeType, size 같은 파일 정보는 저장하지 않는다.
- 파일 정보는 `util.fileUpload.getFileInfo()`의 S3/R2 `headObject` 결과를 기준으로 확인한다.
- 임시 업로드 object는 operation에서 삭제하지 않는다. bucket lifecycle 정책으로 정리한다.
- `util.fileUpload.moveTo()` 또는 `toStream()`으로 파일을 소비한 operation은 성공 직후 반드시 `util.fileUpload.revokeUploadKey(uploadKey)`를 호출해야 한다.
- `util.fileUpload.revokeUploadKey(uploadKey)`가 호출된 uploadKey는 재사용할 수 없다.
- uploadKey에는 원본 파일명, user id, 목적, 도메인명 같은 정보를 포함하지 않는다.

## operation 예시
```js
module.exports = async function(param, req, res){
    // 입력값 검증
    if(!(await valider.isValidUploadKey(param.uploadKey))) return new response.UploadKeyIsNotValid()

    let fileInfo = await util.fileUpload.getFileInfo(param.uploadKey)
    if(!fileInfo) return new response.UploadFileNotFound()
    if(!util.fileUpload.checkFileSize(fileInfo)) return new response.FileTooLarge()
    if(!enums.AttachmentMimeType.includes(fileInfo.ContentType)) return new response.NotSupportFileType()

    // 대상 생성
    let insertRes = await util.mysql.insert(
        'database1',
        'attachment',
        {
            uid: param.loginUser.uid
        }
    )

    // 파일 복사
    let fileKey = `attachment/${insertRes.insertId}-${util.encrypt.shortHash(Math.random().toString(), 3)}`
    try{ await util.fileUpload.moveTo(param.uploadKey, setting.s3.buckets.attachment, fileKey) }catch(e){ return new response.InternalServerError() }
    await util.fileUpload.revokeUploadKey(param.uploadKey)

    await util.mysql.update(
        'database1',
        'attachment',
        {
            fileKey,
            fileMimeType: fileInfo.ContentType
        },
        'pk=?',
        [ insertRes.insertId ]
    )

    return new response.CreateAttachmentOK()
}
```

## 검증 기준
- 필수 파일 param은 입력값 검증 단계에서 `await valider.isValidUploadKey(param.uploadKey)`를 먼저 한다.
- 선택 파일 param은 `valider.isValueExist(param.uploadKey)`로 존재 여부를 확인한 뒤 `isValidUploadKey()`를 호출한다.
- uploadKey 검증 실패는 도메인 response로 반환한다. 예: `UploadKeyIsNotValid`
- 업로드 object 존재 여부는 `util.fileUpload.getFileInfo()`로 확인한다.
- 파일 크기는 `util.fileUpload.checkFileSize(fileInfo)`로 확인한다.
- 파일 형식은 enum 배열을 두고 `enums.AttachmentMimeType.includes(fileInfo.ContentType)`로 검사한다.
- 보안상 중요한 파일은 `ContentType`만 믿지 말고 내용 검사, 확장자 정책, 바이러스 검사 필요 여부를 판단한다.

## 저장 위치
- 임시 업로드 파일은 `setting.fileUpload.tempBucket`에 둔다.
- 최종 파일은 `setting.s3.buckets.<domainPurpose>`에 둔다.
- 목적 bucket 설정이 없으면 `setting.js`에 bucket 항목을 추가한다.
- 파일 경로/상태 저장 시에도 `createdAt`, `updatedAt`은 DB 기본값을 사용한다.

## 실패 처리
- `moveTo()` 또는 `toStream()`으로 파일을 소비한 operation은 성공 직후 반드시 `util.fileUpload.revokeUploadKey(uploadKey)`를 호출한다. 이후 같은 uploadKey로 재시도할 수 없다.
- 파일 복사와 DB update 중 일부만 성공할 수 있으므로 정리 정책을 먼저 정한다.
- 목적 bucket에 파일을 만든 뒤 후속 처리에 실패하면 `util.s3.delete()`로 목적 object를 정리한다.
- DB insert 후 파일 처리 실패가 가능하면 실패 전 DB row를 soft delete하거나, 파일 처리 후 DB row를 만드는 구조를 검토한다.
- 기존 파일 교체는 새 파일 처리와 DB update가 성공한 뒤 기존 파일을 삭제한다.
- 임시 업로드 object는 실패/성공 여부와 무관하게 직접 삭제하지 않고 lifecycle 정리에 맡긴다.

## param/response 문서화
- uploadKey 오류, 미지원 파일 형식, 대상 파일 없음은 도메인 `_response.sys.js`에 response class를 추가한다.
- uploadKey param schema:
```js
uploadKey: "업로드 키(uploadKey)"
uploadKey: "업로드 키(uploadKey?)"
```
- operation 설명에는 "파일 업로드 endpoint 호출 후 받은 uploadKey를 전달한다"는 전제를 필요한 만큼만 적는다.

## 작업 후
- operation이 바뀌면 `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`, `/API-doc`를 함께 확인한다.
- 작업 직후 `backend/docs/FILE-CHECKLIST.md`를 다시 본다.
