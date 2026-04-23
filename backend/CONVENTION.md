# Backend Convention

## 목적
- 이 문서는 `backend/` 영역의 네이밍과 주석 컨벤션을 정리한다.
- 기준은 템플릿의 `/API` operation 구조와 이 템플릿에서 유지할 일반 backend 패턴이다.
- `openApi/` 계열은 별도 기능과 별도 규칙이므로 이 문서의 공통 backend 컨벤션 기준에서 제외한다.
- 공통 네이밍, 주석, 함수 설계, 포매팅 기본값은 `convention/README.md`와 관련 `convention/*.md`를 따른다.
- 이 문서는 그 공통 규칙 위에 backend에서 반드시 추가로 지켜야 할 구체 규칙을 덧붙인다.

## 1. 파일/식별자 네이밍
- 도메인 폴더명은 `lowerCamelCase`를 기본으로 한다. 예: `user`, `streamSystem`
- operation 로직 파일명은 `lowerCamelCase`를 사용한다. 예: `signIn.js`, `getUserInfo.js`, `checkStreamKeyValid.js`
- `module/`, `worker/` 내부 파일명도 `lowerCamelCase`를 사용한다. 예: `updateAccessFlag.js`, `deleteStreamBatch.js`, `createMonthlyInvoice.js`
- JS 내부 지역 변수, 함수명, helper 함수명은 `camelCase`를 사용한다.
- enum/export 상수명은 신규 작성 시 `PascalCase`를 우선한다. 예: `ImageMimeType`, `ApiKeyExpiryOption`, `VultrRegionCode`
- 과거 코드에 `cardType` 같은 예외가 있어도 신규 추가는 `PascalCase` 쪽으로 맞춘다.

## 1-1. Enum 파일 규칙
- 도메인 `enums.js`는 `../_streamtial/streamtial` 코드베이스의 패턴처럼 enum마다 개별 배열 상수를 선언한 뒤 export 한다.
- enum 값은 무조건 배열 형식으로 선언한다. 예: `const CardType = ['main', 'backup']`
- 도메인 `enums.js`의 export는 무조건 root enum을 먼저 포함한 객체 형식을 사용한다. 예: `module.exports = { ...require('../enums.js'), CardType }`
- 도메인 enum 파일에서 `module.exports = { Horizon: {...} }` 같은 객체형 enum 선언은 금지한다.
- enum이 아닌 메타 정보, 가중치 맵, 설명 객체, 계산 옵션은 `enums.js`에 두지 않는다.
- 별도 enum이 없는 도메인이라도 필요 시 `module.exports = { ...require('../enums.js') }` 형태를 유지한다.
- enum 입력값 검증은 `if(!enums.CardType.includes(param.cardType)) return ...`처럼 enum 배열에 직접 `includes()`를 호출한다.
- `Object.values(enums.CardType).includes(...)` 같은 객체형 enum 전제 코드는 금지한다.

## 2. Operation 이름 규칙
- 내부 `/API` operation key는 `PascalCase`를 기본으로 한다. 예: `SignIn`, `GetUserInfo`, `CheckStreamKeyValid`
- operation key와 `paramSchema` 키는 같은 이름을 사용한다.
- operation key는 가능하면 `동사 + 명사` 또는 `동사 + 대상 + 목적어` 형태로 만든다.
- 가장 기본적인 읽기 계열 동사는 `Get`, 생성은 `Create`, 수정은 `Modify` 또는 `Update`, 삭제는 `Delete`, 재설정은 `Reset`, 검증은 `Verify`, 전송은 `Send`, 시작/종료는 `Start`/`End`를 우선한다.
- 한 단어 동사만으로 의미가 약하면 대상 명사를 바로 붙인다. 예: `SignIn`, `SignOut`, `SignUp`
- 조회 계열은 가능한 `Get + 대상` 구조를 유지한다. 예: `GetAccountInfo`, `GetFullAccountInfo`, `GetStreamList`
- 생성/삭제/수정 계열은 가능한 `Create/Delete/Modify/Reset + 대상` 구조를 유지한다. 예: `CreateApiKey`, `DeleteStream`, `ModifyPassword`, `ResetStreamKey`
- 검증/토큰 기반 처리처럼 조건이 붙는 경우는 `동사 + 대상 + 조건` 순서를 우선한다. 예: `VerifyEmailByToken`, `ResetPasswordByToken`
- 시스템 내부 성격이 강한 operation은 의미를 숨기지 말고 대상과 행위를 그대로 드러낸다. 예: `CheckStreamKeyValid`, `StartStream`, `EndStream`
- 기존 예시 프로젝트의 `payment` 도메인처럼 `addCard`, `getCard` 형태의 lowerCamel operation 예외가 있더라도 신규 operation은 `PascalCase`로 통일한다.

## 3. Response 이름 규칙
- response class는 `PascalCase`를 사용한다.
- 성공 응답은 기본적으로 `...OK` suffix를 사용한다. 예: `SignInOK`, `GetStreamListOK`, `DeleteApiKeyOK`
- 실패 응답은 에러 상태를 바로 드러내는 명사/형용사구를 사용한다. 예: `AccountNotFound`, `EmailAlreadyInUse`, `CurrentPasswordIsIncorrect`
- 입력값 검증 실패는 필수 입력 누락과 형식 오류를 따로 나누지 않고 `InputValueNotValid` 하나로 통일한다.
- 신규 backend 구현에서 `FormInputRequired` 응답 클래스는 만들지 않는다.
- 특정 operation에 종속된 실패 응답이면 필요 시 operation의 핵심 명사를 포함한다. 예: `VerifyPasswordResetTokenExpired`, `ResetPasswordByTokenInvalid`
- response 블록 주석은 operation 단위로 `/* OperationName */` 형태를 사용한다.
- webhook 응답은 이름에 `Process`를 포함해 일반 operation 응답과 구분한다. 예: `SocialLoginProcessOK`
- socket 응답은 이름에 `Event` 또는 `Message`를 포함해 socket 응답임을 드러낸다. 예: `UserStatusUpdateEvent`

## 4. 동사/명사 조합 원칙
- 동사는 가능하면 하나만 사용한다. 읽기 쉬운 조합이 우선이며, 불필요하게 긴 구문형 이름은 피한다.
- 명사는 도메인 모델 이름을 그대로 사용한다. 예: `Account`, `User`, `Stream`, `StreamKey`, `ApiKey`
- 같은 대상에 대해 여러 단계가 있으면 `Get`보다 더 구체적인 동사를 선택한다. 예: 단순 조회는 `GetAccountInfo`, 검증은 `VerifyEmailByToken`, 전송은 `SendVerificationEmail`
- 리스트 반환은 `List`, 단건 상세는 `Info` 또는 더 구체적인 명사를 사용한다. 예: `GetStreamList`, `GetStreamDetailInfo`, `GetStreamPlayInfo`
- 전체/상세/요약처럼 범위 차이가 있으면 명사 뒤에 범위를 붙인다. 예: `GetAccountInfo`, `GetFullAccountInfo`
- `do`, `handle`, `process`, `work`, `data`처럼 의미가 약한 단어는 operation 이름의 기본 명사로 쓰지 않는다.
- 불가피하게 보조 조건이 붙을 때만 `By...`, `With...`를 사용한다. 예: `VerifyEmailByToken`, `ResetPasswordByToken`

## 5. 함수/모듈 네이밍
- 로직 파일의 기본 export는 익명 함수여도 되지만, `module/`이나 `worker/`처럼 재사용 의미가 큰 파일은 기명 함수 export를 우선한다.
- operation 로직 파일은 사람이 처음 읽을 때 전체 처리 흐름이 한 파일에서 보여야 하므로, 검증/조회/가공/응답 흐름을 과도하게 `module/`로 분산하지 않는다.
- `module/`은 1파일 1export 메서드를 기본으로 한다.
- `module/` 파일명과 export 함수명은 동일한 lowerCamelCase로 맞춘다. 예: `updateAccessFlag.js` -> `module.exports = async function updateAccessFlag(...)`
- 여러 재사용 메서드가 필요하면 한 파일에 객체로 묶지 말고 파일을 분리하고, 기본적으로 상위 operation 로직 파일이 이를 조합한다.
- `module.exports = { readA, writeB }` 같은 객체 export는 `module/`에서 금지한다. 이런 경우 `readA.js`, `writeB.js`로 나눈다.
- `module -> module` 직접 호출은 예외로 두고, 가능하면 operation에서 순서를 제어한다.
- `module/`은 보통 저장소 접근, 외부 서비스 호출, 여러 operation에서 공통으로 쓰는 단일 처리에 한정한다.
- 재사용 module 이름은 `동사 + 대상` 구조를 기본으로 한다. 예: `updateAccessFlag`, `executePayment`, `sendPaymentSuccessEmail`
- worker 이름도 실제 작업 단위를 드러내는 `동사 + 대상` 구조를 사용한다. 예: `createMonthlyInvoice`, `updateCurrency`, `leaveAccountConfirm`
- boolean 의미를 담는 변수는 가능하면 `is`, `has`, `can`, `should` 접두를 사용한다. 예: `isLive`, `isSlotOccupied`, `isSameHashCardExist`
- 개수 변수는 `Count` suffix를 우선한다. 예: `totalCount`, `currentKeyCount`
- 목록 변수는 `List` 또는 컬렉션 의미가 드러나는 복수형을 사용한다. 예: `payMethodList`, `thumbnailKeys`
- 식별자 변수는 대상명 + `Id`를 사용한다. 예: `streamId`, `cardId`, `paymentId`

## 6. 주석 스타일
- 기본 원칙은 `convention/comment.md`를 따른다.
- backend에서 주석의 기본 목적은 코드 번역이 아니라 처리 단계 구분이다.
- 함수 내부 단계 주석은 `//` 한 줄 주석을 사용한다.
- 함수/파일 단위 섹션 주석은 `/* ... */`를 사용한다.
- 주석은 가능한 한국어를 기본으로 하고, 팀 내에서 이미 굳은 영어 용어는 그대로 둔다. 예: `API key`, `token`, `stream`
- 주석은 짧은 명사형 또는 동작 설명형으로 작성한다. 예: `// 입력값 검증`, `// 기존 카드 중복 확인`, `// 결제 실패 이메일 전송`
- 코드 한 줄을 그대로 풀어쓴 번역형 주석은 쓰지 않는다.
- 주석이 없으면 흐름 파악이 어려운 지점에만 쓴다. 단순 대입, 단순 return, obvious한 if문마다 주석을 달지 않는다.
- 주석 하나는 보통 바로 아래 2~10줄 정도의 처리 묶음을 설명하도록 유지한다.
- `module/` 파일도 계산 단계나 데이터 가공 단계가 두 묶음 이상이면 각 처리 블록 앞에 짧은 단계 주석을 붙인다.
- TODO는 실제 후속 작업이 있을 때만 남긴다. 즉시 행동 계획이 없는 TODO 남발은 피한다.

## 6-1. 가드 절 스타일
- 한 줄 반환으로 끝나는 가드 절은 예외 없이 인라인으로 작성한다.
- backend 코드에서 `if (...) { return ... }` 형태의 블록 가드는 금지한다.
- 특히 입력값 검증, 존재 여부 확인, 권한 확인, 상태 검증에서 자주 깨지므로 먼저 확인한다.
- 금지:
```js
if(!valider.isValidString(param.blueprintId)){
    return new response.FormInputRequired();
}
```
- 권장:
```js
if(!valider.isValidString(param.blueprintId)) return new response.InputValueNotValid('blueprintId');
```

## 7. Import 배치
- 기본 포매팅 원칙은 `convention/formatting.md`를 따른다.
- operation 로직 파일과 `module/` 파일은 스캐폴드의 기본 import 블록을 유지한다.
- 기본 import 대상은 `response`, `setting`, `util`, `valider`, `enums` 순서를 기준으로 둔다.
- 추가 import가 필요하면 기본 import 블록 아래를 한 줄 비운 뒤 작성한다.
- 예시:
```js
const response = require('./_response.sys.js');
const setting = require('../core/setting.js');
const util = require('../core/util.js');
const valider = require('../core/valider.js');
const enums = require('./enums.js');

const other = require('other');
```

## 7-1. Param Schema 표기
- `_param.sys.js`의 설명 문자열은 기본적으로 `설명(type)` 형식을 사용한다.
- optional 파라미터는 `설명(string?)`, `설명(number?)`, `설명(boolean?)`처럼 타입명 뒤에 `?`를 붙여 표기한다.
- enum은 `설명(enum:a|b|c)` 형식을 유지하고, optional enum이면 `설명(enum:a|b|c?)`처럼 타입 블록 내부 마지막에 `?`를 붙인다.
- `설명(string, optional)`처럼 영어 `optional` 문구를 추가하는 표기는 금지한다.

## 7-2. DB 접근 네이밍
- DB 접근 상세 규칙은 `backend/DB.md`를 따른다.
- 단건 조회 module 이름은 `get + 대상 + 기준` 구조를 우선한다. 예: `getAccountByUid`, `getDogByRegisterNum`
- 목록 조회 module 이름은 `list + 대상 + 조건` 또는 `get + 대상 + List`를 사용한다. 예: `listStreamByOwner`, `getApiKeyList`
- 갱신 module 이름은 `update + 대상`, soft delete는 `softDelete + 대상`처럼 동작을 드러낸다.
- 존재 여부 확인용 boolean/count helper를 만들면 `count + 대상`, `is + 대상 + Exist`보다 실제 반환값과 맞는 이름을 쓴다.
- operation 파일 안의 지역 변수는 `user`, `stream`, `dogList`, `totalCount`, `insertRes`처럼 쿼리 결과 형태가 드러나게 짓는다.

## 8. 권장 예시
- operation: `CreateApiKey`, `GetStreamDetailInfo`, `VerifyPasswordResetToken`, `ResetStreamKey`
- response: `CreateApiKeyOK`, `ApiKeyNotFound`, `VerifyEmailByTokenExpired`, `UserStatusUpdateEvent`
- module: `updateAccessFlag`, `executePayment`, `emitForceEndStreamEvent`
- worker: `createMonthlyInvoice`, `updateCurrency`, `leaveAccountConfirm`

## 9. module 분리 예시
- 금지:
```js
module.exports = {
    ensureStoreReady,
    readBlueprintList,
    writeBlueprintList,
}
```

- 권장:
```js
// readBlueprintList.js
module.exports = async function readBlueprintList(){
    ...
}
```

```js
// writeBlueprintList.js
module.exports = async function writeBlueprintList(list){
    ...
}
```
