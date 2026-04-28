# Backend DB Checklist

## 작업 직전 체크
- 수정 대상 operation이 실제로 DB를 치는지 먼저 확인한다.
- 입력값 검증이 DB 접근보다 앞에 오는지 확인한다.
- 대상이 사용자 소유 데이터면 `param.loginUser.uid` 조건을 어디서 확인할지 먼저 정한다.
- delete가 필요한데 테이블에 `isDeleted`, `deletedAt`가 있으면 soft delete로 처리하는지 확인한다.
- 같은 쿼리가 여러 operation에서 반복될 것 같으면 `module/`로 뺄지 먼저 판단한다.
- raw SQL이 꼭 필요한지 보고, 가능하면 `select/count/sum/insert/update/delete` helper를 먼저 쓴다.
- insert/update할 문자열 컬럼 길이를 알고 있으면 잘라 넣는 코드가 필요한지 확인한다.
- DB 설정이 비어 있거나 로컬 실행이 어려워도, JSON 파일이나 txt 파일을 서비스 본 저장소로 대신 쓰지 않는지 확인한다.

## 가장 자주 깨지는 규칙
- 존재 여부 확인 없이 바로 `update()`나 `delete()`를 호출하지 않는다.
- 사용자 입력을 문자열 결합으로 SQL에 직접 넣지 않는다.
- 단순 재사용 로직을 거대한 공용 repository 레이어로 몰지 않는다.
- operation 한 파일에서 처리 흐름이 안 보일 정도로 DB 접근을 과도하게 숨기지 않는다.
- `module/`에서 `module.exports = { ... }` 객체 export를 만들지 않는다.
- 응답은 임의 객체 대신 `*_response.sys.js` 클래스를 사용한다.
- DB 대신 `backend/<domain>/data/*.json` 같은 파일 저장소를 새로 도입하지 않는다.

## 수정 직후 체크
- 성공/실패 분기가 response class로 정리됐는지 확인한다.
- operation 설명, param schema, response schema가 최신 로직과 맞는지 확인한다.
- DB 컬럼명과 JS 키 이름 매핑 방식이 프로젝트 설정과 충돌하지 않는지 확인한다.
- `exec()`를 썼다면 placeholder와 alias 이름이 적절한지 한 번 더 확인한다.
- 필요 시 `/API-doc`와 `npm run build`를 확인한다.
