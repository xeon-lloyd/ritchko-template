# Backend Checklist

## 목적
- 이 문서는 `backend/` 작업 직전에 빠르게 다시 보는 체크리스트다.
- `backend/AGENTS.md`의 핵심 금지 규칙만 짧게 재확인하는 용도다.

## 작업 직전 체크
- 이번 수정이 `/API` operation 구조를 따르는지 확인한다.
- 수정 대상 도메인의 `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`까지 같이 볼지 먼저 판단한다.
- DB 작업이면 `backend/DB.md`, `backend/DB-CHECKLIST.md`를 다시 본다.
- 새 operation/도메인은 가능하면 생성 스크립트로 만들고 수동 생성은 예외로 둔다.
- 공통 네이밍, 주석, 함수 설계, 포매팅은 `convention/README.md`와 관련 문서를 다시 확인한다.

## 가장 자주 깨지는 규칙
- `module/`은 `1파일 1export 함수`만 허용한다.
- `module/`에서 `module.exports = { ... }` 형태 객체 export를 금지한다.
- `module/` 파일명과 export 함수명은 동일한 `lowerCamelCase`로 맞춘다.
- 여러 재사용 동작이 필요하면 한 파일에 묶지 말고 파일을 분리한 뒤 operation에서 조합한다.
- operation 로직 파일은 큰 흐름이 한 파일에서 보이게 유지하고, `module/` 뒤로 과하게 숨기지 않는다.
- update/delete 전에는 존재 여부와 권한 여부를 먼저 확인한다.
- raw SQL에서는 사용자 입력을 문자열 결합으로 직접 넣지 않고 placeholder를 유지한다.
- 테이블에 soft delete 컬럼이 있으면 hard delete를 기본값처럼 쓰지 않는다.
- DB 기반 작업을 파일 저장으로 우회하지 않는다. 서비스 본 데이터를 JSON 파일이나 txt 파일에 영속 저장하는 구조를 새로 만들지 않는다.
- 도메인 `enums.js`는 배열 enum 선언 + `...require('../enums.js')` export 형식을 유지한다.
- enum 검증은 `if(!enums.CardType.includes(param.cardType)) return ...`처럼 배열에 직접 `includes()`를 호출한다.
- `_param.sys.js`의 optional 표기는 `string?`, `number?`, `boolean?`처럼 타입 뒤 `?`로 적고 `optional` 문구는 쓰지 않는다.
- 한 줄 가드 절은 예외 없이 인라인으로 작성한다.
- `if (...) { return ... }` 형태의 블록 가드는 금지한다.
- 입력값 검증 실패 응답은 무조건 `InputValueNotValid`를 쓴다. `FormInputRequired`는 새 코드에서 금지한다.

## 빠른 금지 예시
- 금지:
```js
module.exports = {
    ensureStoreReady,
    readBlueprintList,
    writeBlueprintList,
}
```

- 허용:
```js
module.exports = async function readBlueprintList(){
    ...
}
```

- 금지:
```js
module.exports = {
    CardType: {
        Main: 'main',
        Backup: 'backup',
    },
}
```

- 허용:
```js
const CardType = [
    'main',
    'backup',
]

module.exports = {
    ...require('../enums.js'),
    CardType,
}
```

- 금지:
```js
if(!valider.isValidString(param.blueprintId)){
    return new response.FormInputRequired();
}
```

- 허용:
```js
if(!valider.isValidString(param.blueprintId)) return new response.InputValueNotValid('blueprintId');
```

- 금지:
```js
if(!Object.values(enums.CardType).includes(param.cardType)) return new response.InputValueNotValid('cardType');
```

- 허용:
```js
if(!enums.CardType.includes(param.cardType)) return new response.InputValueNotValid('cardType');
```

- 금지:
```js
nickname: '닉네임(string, optional)'
```

- 허용:
```js
nickname: '닉네임(string?)'
```

## 수정 직후 체크
- 입력값 검증이 먼저 오는지 확인한다.
- 성공/실패 응답이 `*_response.sys.js` 클래스를 쓰는지 확인한다.
- `description`, `group`, `paramSchema`, `responseSchema` 누락이 없는지 확인한다.
- `enums.js`, enum 검증 코드, `paramSchema` 표기가 최신 규칙과 맞는지 한 번 더 확인한다.
- 필요 시 `/API-doc`와 `npm run build`로 반영 여부를 본다.
