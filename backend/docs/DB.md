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
- 연결 생략 시 기존 pool을 사용한다. 트랜잭션에서는 같은 연결을 전달하고 호출자가 `beginTransaction`, `commit`, 실패·조기 반환 시 `rollback`, `finally`의 `release`를 관리한다.
- `delete`, `insertMany`, `sum`은 연결 인자를 지원하지 않는다. 트랜잭션 안에서 필요하면 연결을 지정한 `exec` 또는 해당 연결의 바인딩 쿼리를 사용한다.
- `select(db, select, table, where='', params=[], orderBy='', limit='', connection=null)`: 목록/단건 조회. 반환값은 배열.
- `count(db, table, where='', params=[], connection=null)`: 존재 여부, 중복 여부, 총개수.
- `sum(db, select, table, where='', params=[])`: 합계.
- `insert(db, table, data, connection)`: 단건 insert. 연결 인자는 선택적이다.
- `update(db, table, data, where, params, connection)`: update. 연결 인자는 선택적이다.
- `delete(db, table, where='', params=[])`: hard delete가 꼭 필요할 때만 사용.
- `exec(db, sql, params, connection)`: join, group by, subquery처럼 helper로 표현하기 어색할 때만 사용. 연결 인자는 선택적이다.

## 트랜잭션과 연결 점유
- 트랜잭션은 여러 DB 변경을 함께 성공·실패시켜야 하거나 동시성 제어가 필요한 경우에만 사용한다. 단순 조회·단일 쿼리·서로 독립적인 작업에는 관성적으로 추가하지 않는다.
- 단일 조건부 UPDATE나 unique 제약 등으로 요구사항을 충족할 수 있으면 명시적 트랜잭션보다 우선 검토한다.
- 외부 API, SMTP, S3, Discord, 파일 처리, 오래 걸리는 연산, `sleep`·재시도 대기를 트랜잭션 안에 넣지 않는다. 외부 호출은 DB rollback으로 취소되지 않는다.
- 입력 검증과 준비 작업은 연결 획득 전에 끝내고, 연결은 필요한 직전에 획득한다. 트랜잭션에는 원자성·잠금 유지에 필요한 DB 작업만 포함한다. 동시성에 민감한 상태 확인은 트랜잭션 안에서 다시 확인한다.
- 성공 시 commit, 실패·조기 반환 시 rollback하고, finally에서 즉시 release한다. commit 후 외부 호출을 기다리는 동안에도 전용 연결을 잡아두지 않는다. 외부 후속 작업은 연결 반환 뒤 실행한다.
- 장시간 batch는 전체를 하나의 트랜잭션으로 묶지 말고 필요한 원자성 단위로 나눈다. 연결과 잠금의 장기 점유로 pool 고갈·잠금 경합·요청 지연을 유발하지 않도록 범위를 최소화한다.

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
