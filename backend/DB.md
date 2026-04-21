# Backend DB Guide

## 목적
- 이 문서는 이 템플릿에서 DB 관련 backend 코드를 작성할 때 따를 기준을 정리한다.
- 기준은 현재 템플릿 구조와 `../_streamtial/streamtial`, `../petpath-api-renewal-v1`에서 반복된 패턴이다.
- 이 템플릿은 ORM이나 repository 레이어보다 `operation + domain module + util.mysql` 조합을 기본으로 한다.

## 먼저 볼 것
1. `backend/core/setting.js`
2. `backend/core/util.js`
3. 작업 대상 도메인의 `*_operations.sys.js`, `*_param.sys.js`, `*_response.sys.js`
4. 작업 대상 operation 파일
5. 필요하면 도메인 `module/`

## 현재 템플릿의 DB 접근 방식
- DB 접속 정보는 `backend/core/setting.js`의 `mysql` 객체에 alias 별로 둔다.
- 실제 쿼리는 `backend/core/util.js`의 `util.mysql`로 실행한다.
- operation 파일이 전체 흐름을 잡고, 재사용 가치가 있는 DB 조회/갱신만 도메인 `module/`로 분리한다.
- 일반적인 ORM 스타일 entity/repository/service 3단 분리는 이 템플릿 기본 구조가 아니다.
- operation 하나에서만 쓰는 단순 조회/검증은 operation 파일 안에 그대로 두는 편이 낫다.

## util.mysql 사용 기준
- `select(db, select, table, where='', params=[], orderBy='', limit='')`
  - 일반 조회에 사용한다.
  - 반환값은 배열이다.
- `count(db, table, where='', params=[])`
  - 존재 여부, 중복 여부, 목록 총개수 확인에 우선 사용한다.
- `sum(db, select, table, where='', params=[])`
  - 합계 계산에 사용한다.
- `insert(db, table, data)`
  - 단건 insert에 사용한다.
- `update(db, table, data, where, params)`
  - 단건/다건 update에 사용한다.
- `delete(db, table, where='', params=[])`
  - 실제 hard delete가 필요한 경우에만 사용한다.
- `exec(db, sql, params)`
  - join, subquery, 집계 SQL처럼 helper로 표현이 어색할 때만 사용한다.

## DB 코드 배치 규칙
- operation 한 곳에서만 쓰는 짧은 조회/검증은 operation 파일에 둔다.
- 여러 operation에서 재사용하는 조회/갱신은 `backend/<domain>/module/`로 분리한다.
- `module/`도 `1파일 1export 함수` 규칙을 그대로 따른다.
- `module/` 파일명은 동작이 드러나게 짓는다.
  - 예: `getAccountByUid.js`, `listDogByOwner.js`, `updateAccessFlag.js`, `softDeleteStream.js`
- `module/`에서 또 다른 `module/`을 연쇄 호출하기보다 상위 operation이 순서를 조합한다.

## 쿼리 작성 규칙
- 입력값 검증을 먼저 하고 그 다음 DB를 친다.
- update/delete 전에는 존재 여부와 권한 여부를 먼저 확인한다.
- 테이블에 `isDeleted`, `deletedAt`가 있으면 hard delete보다 soft delete를 우선한다.
- 문자열은 컬럼 길이를 알고 있으면 insert/update 전에 `substring()`으로 잘라 넣는다.
- 날짜/시간은 저장 포맷을 맞춘 뒤 넣는다.
  - 날짜만 저장: `new Date(param.birthday).stringFormat('y-m-d')`
  - UTC datetime 저장: `new Date().toSQLDatetime()`
- raw SQL을 써도 값 바인딩은 `?` placeholder를 유지한다.
- 문자열 결합으로 사용자 입력을 SQL에 직접 꽂아 넣지 않는다.
- 이 템플릿의 `util.mysql`은 camelCase 컬럼명과 snake_case 컬럼명 매핑 옵션을 지원한다.
  - `setting.sqlCamelToSnakeMapping = true`면 `dogName -> dog_name` 변환이 적용된다.
  - 매핑을 켤지 말지는 프로젝트 초기에 정하고 혼용하지 않는다.

## 권장 흐름
```js
module.exports = async function(param, req, res){
    // 입력값 검증
    if(!valider.isValidString(param.streamId)) return new response.InputValueNotValid('streamId')

    // 존재 여부 확인
    let [ stream ] = await util.mysql.select(
        'database1',
        'pk, uid, isDeleted',
        'stream',
        'pk=?',
        [ param.streamId ]
    )
    if(stream == undefined) return new response.StreamNotFound()

    // 권한 확인
    if(stream.uid !== param.loginUser.uid) return new response.Forbidden()

    // 핵심 비즈니스 처리
    await util.mysql.update(
        'database1',
        'stream',
        {
            isDeleted: 1,
            deletedAt: new Date().toSQLDatetime()
        },
        'pk=?',
        [ stream.pk ]
    )

    return new response.DeleteStreamOK()
}
```

## select/count/insert 사용 패턴
- 단건 조회:
```js
let [ user ] = await util.mysql.select(
    'database1',
    'uid, id, name',
    'user',
    'uid=? AND isDeleted=0',
    [ param.loginUser.uid ]
)
```

- 중복 체크:
```js
let emailAlreadyInUse = await util.mysql.count(
    'database1',
    'user',
    'email=? AND isDeleted=0',
    [ param.email ]
)
if(emailAlreadyInUse > 0) return new response.EmailAlreadyInUse()
```

- insert:
```js
let insertRes = await util.mysql.insert(
    'database1',
    'user',
    {
        email: param.email.slice(0, 100),
        name: param.name.slice(0, 30),
        createdAt: new Date().toSQLDatetime()
    }
)
```

## exec 사용 기준
- 아래처럼 join, group by, subquery가 필요한 경우에만 `exec()`를 쓴다.
```js
let list = await util.mysql.exec(
    'database1',
    `
        SELECT s.pk, s.title, u.name AS ownerName
        FROM stream s
        JOIN user u ON u.uid = s.uid
        WHERE s.uid = ? AND s.is_deleted = 0
        ORDER BY s.pk DESC
        LIMIT 20
    `,
    [ param.loginUser.uid ]
)
```
- `exec()` 결과도 컬럼명 규칙을 일관되게 맞춘다.
- alias를 줄 때도 응답 키 이름을 의식한다.

## 주의할 점
- transaction helper는 아직 템플릿 기본 기능으로 제공되지 않는다.
- 여러 쿼리가 반드시 같은 connection에서 묶여야 하는 작업이 생기면, 그때 transaction helper를 먼저 설계한 뒤 사용한다.
- 무조건 공통 `db.js`, `repository.js`, `model.js`를 만들기보다 현재 도메인 구조를 유지한다.
- 단순 CRUD라도 response class와 API 문서 반영을 생략하지 않는다.
- 인증 사용자 기준 데이터면 `param.loginUser.uid` 조건을 명시적으로 사용한다.

## 작업 전/후 확인
- 작업 직전에는 `backend/DB-CHECKLIST.md`를 함께 본다.
- operation이 바뀌면 `/API-doc` 반영 여부를 확인한다.
