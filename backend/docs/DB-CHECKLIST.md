# Backend DB Checklist

## 작업 전
- 입력값 검증이 DB 접근보다 앞에 오는지 확인한다.
- 사용자 소유 데이터면 `param.loginUser.uid` 조건 또는 권한 확인 위치를 정한다.
- update/delete 대상은 먼저 조회해 존재 여부와 권한을 확인한다.
- soft delete 컬럼(`isDeleted`, `deletedAt`)이 있으면 hard delete 대신 soft delete를 쓴다.
- 반복될 DB 조회/갱신만 `module/` 분리를 검토한다.
- helper로 충분하면 `select/count/sum/insert/update/delete`를 쓰고, raw SQL은 필요한 경우에만 쓴다.

## 저장 규칙
- `createdAt`, `updatedAt`은 DB 기본값으로 처리하고 코드에서 직접 넣지 않는다.
- insert/update에 업무 날짜값을 저장해야 하면 `new Date()`를 그대로 쓴다.
- 날짜/시간 검색 조건도 `?` placeholder와 `params` 바인딩을 사용하고, `Date` 객체를 그대로 넣는다.
- 날짜/시간 값을 SQL 문자열로 직접 변환하지 않는다.
- 문자열 컬럼 길이가 명확하면 저장 전에 `substring()` 등으로 자른다.
- DB 설정이 비어 있어도 서비스 데이터를 JSON, txt, 로컬 파일 저장소로 우회하지 않는다.

## 작업 후
- 성공/실패 분기가 response class로 정리됐는지 확인한다.
- operation 설명, param schema, response schema가 최신 로직과 맞는지 확인한다.
- 컬럼명 매핑 방식(`setting.sqlCamelToSnakeMapping`)과 select alias가 충돌하지 않는지 확인한다.
- raw SQL을 썼다면 placeholder와 alias를 다시 확인한다.
- 필요 시 `/API-doc`를 확인한다.
