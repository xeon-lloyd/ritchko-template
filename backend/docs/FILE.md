# Backend File Upload Guide

## 목적
- 이 문서는 이 템플릿에서 파일 업로드 관련 backend 코드를 작성할 때 따를 기준을 정리한다.
- 기준은 현재 템플릿의 `/API/fileUpload`, `util.fileUpload` 구조와 이 레포의 operation 처리 방식이다.
- 이 템플릿의 파일 업로드는 일반 operation이 아니라 별도 업로드 endpoint와 fileToken을 조합하는 방식이다.

## 먼저 볼 것
1. `backend/_system_/fileUploadInit.sys.js`
2. `backend/core/setting.js`
3. `backend/core/util.js`의 `s3`, `fileUpload`
4. `backend/_system_/document/fileUpload.sys.js`
5. 작업 대상 도메인의 `_param.sys.js`, `_response.sys.js`, `enums.js`
6. DB에 파일 경로나 상태를 저장하면 `backend/docs/DB.md`, `backend/docs/DB-CHECKLIST.md`

## 현재 템플릿의 업로드 흐름
1. 클라이언트가 `POST /API/fileUpload`로 `multipart/form-data` 파일 1개를 전송한다.
2. `backend/_system_/fileUploadInit.sys.js`가 `connect-busboy`로 파일을 읽는다.
3. 파일은 `setting.fileUpload.tempBucket`에 임시 key로 업로드된다.
4. 응답의 `data`에는 암호화된 fileToken이 담긴다.
5. 클라이언트는 이후 실제 operation의 `param`에 fileToken을 전달한다.
6. operation은 `util.fileUpload.decodeFileToken()`으로 token을 검증하고 파일 정보를 확인한다.
7. operation은 `util.fileUpload.moveTo()` 또는 `util.fileUpload.toStream()`으로 임시 파일을 실제 처리한다.

## fileToken 의미
- fileToken은 임시 업로드 파일을 가리키는 짧은 전달값이다.
- token 내부에는 현재 `{ name, mimeType }` 형태의 정보가 들어 있다.
- token은 서비스 핵심 데이터로 DB에 저장하지 않는다.
- DB에는 최종 목적 버킷의 파일 key, 공개 URL 생성에 필요한 path, 파일 상태 같은 서비스 데이터만 저장한다.
- `moveTo()`와 `toStream()`은 임시 버킷의 원본을 삭제하므로 같은 token을 재사용할 수 있다고 가정하지 않는다.

## operation에서 파일을 받는 기본 흐름
```js
module.exports = async function(param, req, res){
    // 입력값 검증
    try{ util.fileUpload.decodeFileToken(param.uploadedFile) }catch(e){ return new response.FileTokenIsNotValid() }

    let fileInfo = util.fileUpload.decodeFileToken(param.uploadedFile)
    if(!enums.AttachmentMimeType.includes(fileInfo.mimeType)) return new response.NotSupportFileType()

    // 대상 생성 또는 조회
    let insertRes = await util.mysql.insert(
        'database1',
        'attachment',
        {
            uid: param.loginUser.uid,
            createdAt: new Date().toSQLDatetime()
        }
    )

    // 파일 이동
    let filePath = `${insertRes.insertId}-${util.encrypt.shortHash(Math.random().toString(), 3)}`
    await util.fileUpload.moveTo(param.uploadedFile, setting.s3.buckets.attachment, filePath)

    await util.mysql.update(
        'database1',
        'attachment',
        {
            filePath,
            fileMimeType: fileInfo.mimeType
        },
        'pk=?',
        [ insertRes.insertId ]
    )

    return new response.CreateAttachmentOK()
}
```

## 검증 기준
- 파일 param이 필수면 입력값 검증 단계에서 `decodeFileToken()`을 먼저 호출한다.
- 파일 param이 선택이면 `valider.isValueExist(param.file)`로 존재 여부를 확인한 뒤 token을 검증한다.
- token decode 실패는 도메인 response로 명시한다. 예: `FileTokenIsNotValid`
- 파일 형식을 제한해야 하면 mimeType enum을 도메인 또는 root `enums.js`에 두고 `enums.AttachmentMimeType.includes(fileInfo.mimeType)`처럼 검사한다.
- 신규 enum은 배열 상수로 선언한다. 객체형 enum이나 `Object.values()` 검증은 쓰지 않는다.
- 보안상 중요한 파일은 token의 mimeType만 믿지 말고 실제 파일 내용 검사, 확장자 정책, 바이러스 검사 같은 추가 검증 필요 여부를 먼저 판단한다.

## 저장 위치와 DB 기준
- 임시 업로드 파일은 `setting.fileUpload.tempBucket`에 둔다.
- operation 처리 후 실제 서비스 파일은 목적 버킷으로 이동한다.
- 목적 버킷은 `setting.s3.buckets.<domainPurpose>`처럼 설정에서 관리한다. 해당 구조가 없다면 `setting.js`와 `setting.template.js`를 함께 갱신한다.
- 파일 경로나 상태가 서비스 데이터라면 DB에 저장한다.
- 파일 자체를 로컬 JSON, txt, 임의 data 파일에 저장소처럼 기록하지 않는다.
- 공개 URL이 필요하면 DB에는 URL 전체보다 재생성 가능한 key/path를 저장하는 쪽을 우선 검토한다.

## 실패 처리와 정리
- 파일 이동과 DB update 중 일부만 성공할 수 있으므로 실패 시 삭제할 key를 먼저 정한다.
- 목적 버킷에 파일을 만든 뒤 후속 처리에서 실패하면 생성된 파일을 `util.s3.delete()`로 정리한다.
- DB insert 후 파일 처리가 실패할 수 있으면 아래 중 하나를 명확히 선택한다.
  - 실패 응답 전 DB row를 soft delete 또는 rollback 성격으로 정리한다.
  - 파일 없이 저장 가능한 도메인이면 파일 없음 상태로 대체하고 성공 처리한다.
  - 파일 처리를 먼저 끝낸 뒤 DB row를 생성할 수 있는 구조로 바꾼다.
- 신규 구현은 도메인 요구사항에 맞는 실패 정책을 명시적으로 고른다.

## response와 param schema
- `/API/fileUpload` 자체는 operation response class를 쓰지 않는 별도 시스템 endpoint다.
- 일반 operation에서 파일 token 오류, 지원하지 않는 파일 형식, 대상 파일 없음 같은 실패는 도메인 `_response.sys.js`에 response class를 추가한다.
- 파일 token param schema는 아래처럼 쓴다.
```js
uploadedFile: "업로드 파일 토큰(fileToken)"
uploadedFile: "업로드 파일 토큰(fileToken?)"
```
- operation 설명에는 "파일 업로드 endpoint 호출 후 받은 fileToken을 전달한다"는 전제를 필요한 만큼만 적는다.

## 주의할 점
- `/API/fileUpload`는 파일을 최종 서비스 데이터로 확정하지 않는다. 최종 확정은 operation에서 한다.
- tempBucket 파일은 영구 저장소가 아니다.
- 같은 fileToken을 여러 operation에서 재사용하는 설계를 만들지 않는다.
- 인증이 필요한 파일 처리는 `/API/fileUpload`가 아니라 fileToken을 소비하는 operation에서 권한을 확인한다.
- 사용자 소유 리소스의 파일 교체는 기존 DB row 소유권 확인 후 진행한다.
- 기존 파일 교체 시 새 파일 처리와 기존 파일 삭제 순서를 신중히 정한다. 새 파일 처리가 실패했는데 기존 파일을 먼저 지우면 복구가 어렵다.

## 작업 전/후 확인
- 작업 직전에는 `backend/docs/FILE-CHECKLIST.md`를 함께 본다.
- 파일 경로나 상태를 DB에 저장하면 `backend/docs/DB-CHECKLIST.md`도 함께 본다.
- operation이 바뀌면 `/API-doc` 반영 여부를 확인한다.
