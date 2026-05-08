# Backend DB Guide

## 목적
이 문서는 backend에서 DB 코드를 작성할 때 따르는 원본 가이드다. 작업 직전 확인용 요약은 `backend/docs/DB-CHECKLIST.md`를 본다.

## 기본 구조
- DB 설정은 `backend/core/setting.js`의 `setting.mysql` alias를 사용한다.
- 쿼리는 `backend/core/util.js`의 `util.mysql` helper를 우선 사용한다.
- operation 파일이 검증, 조회, 권한 확인, 처리, 응답의 큰 흐름을 가진다.
- 여러 operation에서 반복되는 단일 DB 동작만 `backend/<domain>/module/`로 분리한다.
- ORM, repository, service 계층을 새로 만들지 않는다.
- 서비스 핵심 데이터는 DB에 저장한다. JSON, txt, 로컬 캐시 파일을 본 저장소로 만들지 않는다.

## util.mysql 기준
- `select(db, select, table, where='', params=[], orderBy='', limit='')`: 목록/단건 조회. 반환값은 배열.
- `count(db, table, where='', params=[])`: 존재 여부, 중복 여부, 총개수.
- `sum(db, select, table, where='', params=[])`: 합계.
- `insert(db, table, data)`: 단건 insert.
- `update(db, table, data, where, params)`: update.
- `delete(db, table, where='', params=[])`: hard delete가 꼭 필요할 때만 사용.
- `exec(db, sql, params)`: join, group by, subquery처럼 helper로 표현하기 어색할 때만 사용.

## 작성 규칙
- 입력값 검증을 먼저 한다.
- update/delete 전에는 대상 존재 여부와 권한 여부를 확인한다.
- `isDeleted`, `deletedAt`이 있으면 soft delete를 우선한다.
- 사용자 입력은 raw SQL 문자열에 직접 결합하지 않고 `?` placeholder로 전달한다.
- 문자열 컬럼 길이가 명확하면 insert/update 전에 잘라 넣는다.
- `setting.sqlCamelToSnakeMapping` 사용 여부를 프로젝트 안에서 혼용하지 않는다.

## 날짜/시간 저장
- `createdAt`, `updatedAt`은 기본적으로 DB 기본값(`DEFAULT`, `ON UPDATE`)으로 관리한다.
- insert/update data에 `createdAt`, `updatedAt`을 직접 넣지 않는다.
- 업무상 저장해야 하는 날짜/시간 컬럼은 `new Date()`를 그대로 넣는다.
- 날짜/시간 검색 조건도 `?` placeholder와 `params` 바인딩을 사용하고, 값은 `Date` 객체 그대로 넣는다.
- 날짜/시간 값을 SQL 문자열로 직접 변환하지 않는다. 문자열 변환은 mysql2의 timezone 처리를 우회하므로 사용하지 않는다.
- 날짜만 저장하는 컬럼은 date-only 값이 필요할 때 `new Date(param.birthday).stringFormat('y-m-d')`처럼 맞춘다.

## 기본 흐름 예시
```js
module.exports = async function(param, req, res){
    // 입력값 검증
    if(!valider.isValidNumber(param.streamId)) return new response.InputValueNotValid('streamId')

    // 대상 존재 여부 확인
    let [ stream ] = await util.mysql.select(
        'database1',
        'pk, uid, isDeleted',
        'stream',
        'pk=? AND isDeleted=0',
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
            deletedAt: new Date()
        },
        'pk=?',
        [ stream.pk ]
    )

    return new response.DeleteStreamOK()
}
```

## 자주 쓰는 패턴
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
        email: param.email.substring(0, 100),
        name: param.name.substring(0, 30)
    }
)
```

- 날짜/시간 범위 검색:
```js
let streamList = await util.mysql.select(
    'database1',
    'pk, title, createdAt',
    'stream',
    'uid=? AND createdAt>=? AND createdAt<? AND isDeleted=0',
    [
        param.loginUser.uid,
        new Date(param.startedAt),
        new Date(param.endedAt)
    ]
)
```

- raw SQL:
```js
let list = await util.mysql.exec(
    'database1',
    `
        SELECT s.pk, s.title, u.name AS ownerName
        FROM stream s
        JOIN user u ON u.uid = s.uid
        WHERE s.uid = ? AND s.isDeleted = 0
        ORDER BY s.pk DESC
        LIMIT 20
    `,
    [ param.loginUser.uid ]
)
```

## 작업 후
- operation이 바뀌면 `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`, `/API-doc`를 함께 확인한다.
- 작업 직후 `backend/docs/DB-CHECKLIST.md`를 다시 본다.
