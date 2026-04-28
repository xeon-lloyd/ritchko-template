# Backend File Upload Checklist

## 작업 직전 체크
- 이번 작업이 `/API/fileUpload` 시스템 endpoint 수정인지, fileToken을 소비하는 operation 구현인지 먼저 구분한다.
- 파일 param이 필수인지 선택인지 정하고 `_param.sys.js`에 `fileToken` 또는 `fileToken?`로 표기한다.
- fileToken decode 실패 응답을 도메인 `_response.sys.js`에 둘지 확인한다.
- 허용 mimeType enum이 필요한지 확인한다.
- 최종 파일 key/path를 DB에 저장해야 하는지 확인한다.
- 목적 버킷 설정이 `setting.js`, `setting.template.js`에 함께 잡혀 있는지 확인한다.
- 파일 처리가 실패했을 때 DB row, 새 파일, 기존 파일을 어떻게 정리할지 먼저 정한다.

## 가장 자주 깨지는 규칙
- fileToken을 DB에 최종 데이터처럼 저장하지 않는다.
- tempBucket 파일을 영구 파일처럼 사용하지 않는다.
- token decode 없이 바로 `moveTo()`나 `toStream()`에 넘기지 않는다.
- 필요한 파일 형식 검증 없이 파일을 처리하지 않는다.
- 사용자가 넘긴 파일명, mimeType, token 내용을 신뢰해서 최종 key를 만들지 않는다.
- 기존 파일 교체에서 새 파일 처리 전에 기존 파일을 먼저 삭제하지 않는다.
- 파일 처리 실패 후 목적 버킷에 남은 파일을 방치하지 않는다.
- 서비스 핵심 데이터 저장을 로컬 파일이나 임시 파일로 우회하지 않는다.
- `module/`에 여러 파일 처리 함수를 객체 export로 묶지 않는다.

## 수정 직후 체크
- 입력값 검증 단계에서 fileToken 검증이 먼저 수행되는지 확인한다.
- 지원하지 않는 파일 형식이 도메인 response class로 반환되는지 확인한다.
- 최종 DB에는 재사용 가능한 파일 key/path만 저장되는지 확인한다.
- `moveTo()` 또는 `toStream()` 호출 후 같은 token을 다시 쓰는 흐름이 없는지 확인한다.
- 파일 처리 실패 시 생성된 S3 object와 DB 상태가 정리되는지 확인한다.
- 기존 파일 교체 operation이면 소유권 확인 후 파일 처리가 진행되는지 확인한다.
- operation 설명, param schema, response schema가 최신 파일 처리 흐름과 맞는지 확인한다.
- 필요 시 `/API-doc`와 `npm run build`를 확인한다.
