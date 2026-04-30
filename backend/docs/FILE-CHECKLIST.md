# Backend File Upload Checklist

## 작업 전
- `/API/fileUpload` 시스템 endpoint 수정인지, fileToken 소비 operation 구현인지 구분한다.
- 파일 param이 필수인지 선택인지 정하고 `_param.sys.js`에 `fileToken` 또는 `fileToken?`로 표기한다.
- fileToken decode 실패 response를 도메인 `_response.sys.js`에 둘지 확인한다.
- 허용 mimeType enum이 필요한지 확인한다.
- 최종 파일 key/path를 DB에 저장해야 하는지 확인한다.
- 목적 bucket 설정이 `setting.js`에 있는지 확인한다.
- 파일 처리 실패 시 DB row, 새 파일, 기존 파일을 어떻게 정리할지 정한다.

## 구현 중
- token decode 없이 `moveTo()`나 `toStream()`에 넘기지 않는다.
- 필요한 파일 형식 검증을 수행한다.
- 사용자가 넘긴 파일명, mimeType, token 내용으로 최종 key를 만들지 않는다.
- 기존 파일 교체는 소유권 확인 후 진행한다.
- 기존 파일은 새 파일 처리와 DB update가 성공한 뒤 삭제한다.
- 파일 관련 DB insert/update에서도 `createdAt`, `updatedAt`은 DB 기본값에 맡긴다.

## 작업 후
- 최종 DB에는 재생성 가능한 파일 key/path와 상태만 저장되는지 확인한다.
- fileToken을 DB에 최종 데이터처럼 저장하지 않았는지 확인한다.
- `moveTo()` 또는 `toStream()` 후 같은 token을 다시 쓰는 흐름이 없는지 확인한다.
- 실패 시 생성된 목적 bucket object와 DB 상태가 정리되는지 확인한다.
- operation 설명, param schema, response schema가 최신 흐름과 맞는지 확인한다.
- 필요 시 `/API-doc`를 확인한다.
