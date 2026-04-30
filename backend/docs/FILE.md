# Backend File Upload Guide

## 목적
이 문서는 파일 업로드를 다루는 backend 원본 가이드다. 작업 직전 확인용 요약은 `backend/docs/FILE-CHECKLIST.md`를 본다.

## 기본 흐름
1. 클라이언트가 `POST /API/fileUpload`로 `multipart/form-data` 파일 1개를 업로드한다.
2. `backend/_system_/fileUploadInit.sys.js`가 파일을 `setting.fileUpload.tempBucket`에 임시 key로 저장한다.
3. 응답의 `data`에는 암호화된 fileToken이 담긴다.
4. 클라이언트는 실제 operation의 `param`에 fileToken을 전달한다.
5. operation은 `util.fileUpload.decodeFileToken()`으로 token을 검증한다.
6. operation은 `util.fileUpload.moveTo()` 또는 `util.fileUpload.toStream()`으로 임시 파일을 소비한다.

## fileToken 원칙
- fileToken은 임시 업로드 파일을 가리키는 전달값이다.
- token 내부에는 현재 `{ name, mimeType }` 정보가 있다.
- fileToken을 서비스 핵심 데이터처럼 DB에 저장하지 않는다.
- `moveTo()`와 `toStream()`은 임시 버킷의 원본을 삭제하므로 token 재사용을 전제하지 않는다.
- DB에는 최종 목적 bucket의 key/path, mimeType, 상태처럼 재생성 가능한 서비스 데이터만 저장한다.

## operation 예시
```js
module.exports = async function(param, req, res){
    // 입력값 검증
    let fileInfo = null
    try{ fileInfo = util.fileUpload.decodeFileToken(param.uploadedFile) }catch(e){ return new response.FileTokenIsNotValid() }
    if(!enums.AttachmentMimeType.includes(fileInfo.mimeType)) return new response.NotSupportFileType()

    // 대상 생성
    let insertRes = await util.mysql.insert(
        'database1',
        'attachment',
        {
            uid: param.loginUser.uid
        }
    )

    // 파일 이동
    let fileKey = `attachment/${insertRes.insertId}-${util.encrypt.shortHash(Math.random().toString(), 3)}`
    await util.fileUpload.moveTo(param.uploadedFile, setting.s3.buckets.attachment, fileKey)

    await util.mysql.update(
        'database1',
        'attachment',
        {
            fileKey,
            fileMimeType: fileInfo.mimeType
        },
        'pk=?',
        [ insertRes.insertId ]
    )

    return new response.CreateAttachmentOK()
}
```

## 검증 기준
- 필수 파일 param은 입력값 검증 단계에서 token decode를 먼저 한다.
- 선택 파일 param은 `valider.isValueExist(param.file)`로 존재 여부를 확인한 뒤 decode한다.
- token decode 실패는 도메인 response로 반환한다. 예: `FileTokenIsNotValid`
- 파일 형식을 제한할 때는 enum 배열을 두고 `enums.AttachmentMimeType.includes(fileInfo.mimeType)`로 검사한다.
- 보안상 중요한 파일은 token의 mimeType만 믿지 말고 내용 검사, 확장자 정책, 바이러스 검사 필요 여부를 판단한다.

## 저장 위치
- 임시 업로드 파일은 `setting.fileUpload.tempBucket`에 둔다.
- 최종 파일은 `setting.s3.buckets.<domainPurpose>`에 둔다.
- 목적 bucket 설정이 없으면 `setting.js`에 bucket 항목을 추가한다.
- 파일 경로/상태 저장 시에도 `createdAt`, `updatedAt`은 DB 기본값을 사용한다.

## 실패 처리
- 파일 이동과 DB update 중 일부만 성공할 수 있으므로 정리 정책을 먼저 정한다.
- 목적 bucket에 파일을 만든 뒤 후속 처리에 실패하면 `util.s3.delete()`로 정리한다.
- DB insert 후 파일 처리 실패가 가능하면 실패 전 DB row를 soft delete하거나, 파일 처리 후 DB row를 만드는 구조를 검토한다.
- 기존 파일 교체는 새 파일 처리와 DB update가 성공한 뒤 기존 파일을 삭제한다.

## param/response 문서화
- `/API/fileUpload` 자체는 operation response class를 쓰지 않는 별도 endpoint다.
- fileToken 오류, 미지원 파일 형식, 대상 파일 없음은 도메인 `_response.sys.js`에 response class를 추가한다.
- fileToken param schema:
```js
uploadedFile: "업로드 파일 토큰(fileToken)"
uploadedFile: "업로드 파일 토큰(fileToken?)"
```
- operation 설명에는 "파일 업로드 endpoint 호출 후 받은 fileToken을 전달한다"는 전제를 필요한 만큼만 적는다.

## 작업 후
- operation이 바뀌면 `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`, `/API-doc`를 함께 확인한다.
- 작업 직후 `backend/docs/FILE-CHECKLIST.md`를 다시 본다.
