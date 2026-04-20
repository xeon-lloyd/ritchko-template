# Backend Checklist

## 목적
- 이 문서는 `backend/` 작업 직전에 빠르게 다시 보는 체크리스트다.
- `backend/AGENTS.md`의 핵심 금지 규칙만 짧게 재확인하는 용도다.

## 작업 직전 체크
- 이번 수정이 `/API` operation 구조를 따르는지 확인한다.
- 수정 대상 도메인의 `_operations.sys.js`, `_param.sys.js`, `_response.sys.js`까지 같이 볼지 먼저 판단한다.
- 새 operation/도메인은 가능하면 생성 스크립트로 만들고 수동 생성은 예외로 둔다.

## 가장 자주 깨지는 규칙
- `module/`은 `1파일 1export 함수`만 허용한다.
- `module/`에서 `module.exports = { ... }` 형태 객체 export를 금지한다.
- `module/` 파일명과 export 함수명은 동일한 `lowerCamelCase`로 맞춘다.
- 여러 재사용 동작이 필요하면 한 파일에 묶지 말고 파일을 분리한 뒤 operation에서 조합한다.
- operation 로직 파일은 큰 흐름이 한 파일에서 보이게 유지하고, `module/` 뒤로 과하게 숨기지 않는다.
- 한 줄 가드 절은 예외 없이 인라인으로 작성한다.
- `if (...) { return ... }` 형태의 블록 가드는 금지한다.

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
if(!valider.isValidString(param.blueprintId)){
    return new response.FormInputRequired();
}
```

- 허용:
```js
if(!valider.isValidString(param.blueprintId)) return new response.FormInputRequired();
```

## 수정 직후 체크
- 입력값 검증이 먼저 오는지 확인한다.
- 성공/실패 응답이 `*_response.sys.js` 클래스를 쓰는지 확인한다.
- `description`, `group`, `paramSchema`, `responseSchema` 누락이 없는지 확인한다.
- 필요 시 `/API-doc`와 `npm run build`로 반영 여부를 본다.
