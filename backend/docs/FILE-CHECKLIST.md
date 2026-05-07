# Backend File Upload Checklist

## 작업 전
- `/API/fileUpload` 업로드 URL 발급 endpoint 수정인지, uploadKey 소비 operation 구현인지 구분한다.
- 파일 param이 필수인지 선택인지 정하고 `_param.sys.js`에 `uploadKey` 또는 `uploadKey?`로 표기한다.
- uploadKey 검증 실패 response를 도메인 `_response.sys.js`에 둘지 백엔드 글로벌 `_response.default.sys.js`에 둘지 확인한다.
- 허용 mimeType enum이 필요한지 확인한다.
- 최종 파일 key/path를 DB에 저장해야 하는지 확인한다.
- 목적 bucket 설정이 `setting.js`에 있는지 확인한다.
- `setting.s3.endpoint`, `setting.fileUpload.tempBucket`, `setting.fileUpload.uploadKeyExpire`, `setting.fileUpload.rateLimit` 설정이 있는지 확인한다.
- 파일 처리 실패 시 DB row, 새 파일, 기존 파일을 어떻게 정리할지 정한다.

## 구현 중
- `await valider.isValidUploadKey(param.uploadKey)` 확인 없이 `getFileInfo()`, `moveTo()`, `toStream()`에 넘기지 않는다.
- 업로드 object 존재 여부는 `util.fileUpload.getFileInfo(uploadKey)`로 확인한다.
- 파일 크기는 `util.fileUpload.checkFileSize(fileInfo)`로 확인한다.
- 파일 형식은 `fileInfo.ContentType`과 enum으로 검증한다.
- 사용자가 넘긴 파일명, mimeType, uploadKey 내용으로 최종 key를 만들지 않는다.
- 기존 파일 교체는 소유권 확인 후 진행한다.
- 기존 파일은 새 파일 처리와 DB update가 성공한 뒤 삭제한다.
- 파일 관련 DB insert/update에서도 `createdAt`, `updatedAt`은 DB 기본값에 맡긴다.
- `moveTo()` 또는 `toStream()` 성공 후 호출한 operation에서 반드시 `util.fileUpload.revokeUploadKey(uploadKey)`를 호출한다.
- 임시 업로드 object는 operation에서 삭제하지 않고 bucket lifecycle 정리에 맡긴다.

## 작업 후
- 최종 DB에는 재생성 가능한 파일 key/path와 상태만 저장되는지 확인한다.
- uploadKey를 DB에 최종 데이터처럼 저장하지 않았는지 확인한다.
- `moveTo()` 또는 `toStream()` 성공 후 호출한 operation에서 `util.fileUpload.revokeUploadKey(uploadKey)`가 호출되는지 확인한다.
- `revokeUploadKey()` 호출 후 같은 uploadKey를 다시 쓰는 흐름이 없는지 확인한다.
- 실패 시 생성된 목적 bucket object와 DB 상태가 정리되는지 확인한다.
- operation 설명, param schema, response schema가 최신 흐름과 맞는지 확인한다.
- 필요 시 `/API-doc`를 확인한다.
