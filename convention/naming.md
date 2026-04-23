# 네이밍 컨벤션

## 목적
- 이름은 코드 이해 비용을 줄이는 가장 싼 수단이다.
- 좋은 이름은 설명을 덜 하게 만들고, 검색을 쉽게 하며, 인접한 개념과의 차이를 분명하게 만든다.

## 핵심 원칙
- 무엇인지, 왜 있는지, 주변 것과 어떻게 다른지가 이름에서 드러나야 한다.
- 이름은 사람 입으로 읽을 수 있어야 하고, 검색으로 다시 찾기 쉬워야 한다.
- 같은 개념은 레포 전체에서 같은 단어를 유지한다.

## 기본 규칙

### 1. 의도가 드러나는 이름을 쓴다
권장:
- `createdAt`
- `retryLimit`
- `fetchUserProfile`
- `isEmailVerified`
- `signalVaultList`

금지:
- `data`
- `value`
- `item`
- `obj`
- `temp`
- `thing`

### 2. 실제 형태와 다른 이름을 붙이지 않는다
- 배열이 아니면 `List`, `Array`를 붙이지 않는다.
- 단건이면 복수형으로 쓰지 않는다.
- cache가 아니면 `cache`, validation이 아니면 `validator` 같은 단어를 붙이지 않는다.
- async 동작이 아닌데 `fetch`나 `load`처럼 읽힐 이름을 함부로 쓰지 않는다.

### 3. 차이가 있다면 이름으로도 드러나야 한다
권장:
- `billingAddress` / `shippingAddress`
- `draftSignal` / `savedSignal`
- `startDate` / `endDate`
- `primaryEmail` / `backupEmail`

금지:
- `data1`, `data2`
- `valueA`, `valueB`
- 책임 차이가 모호한 `Manager`, `Handler`, `Processor`

### 4. 발음 가능하고 검색 가능한 이름을 쓴다
- `id`, `url`, `api`, `html` 같은 보편 약어를 제외하면 축약을 남발하지 않는다.
- 아주 짧고 국소적인 루프 인덱스 외에는 `x`, `v`, `tmp`, `e` 같은 이름을 피한다.
- 매직 넘버가 의미를 갖는다면 상수로 빼고 이름을 준다.

### 5. 타입 정보를 이름에 억지로 넣지 않는다
금지:
- `strFirstName`
- `numRetry`
- `objUser`
- `arrSignalList`
- `dtoPayload`

권장:
- `firstName`
- `retryCount`
- `user`
- `signalList`

### 6. 도메인 언어를 우선한다
- 기술 용어보다 서비스 도메인 단어를 우선한다.
- `payload`, `resultObj`, `info` 같은 generic 단어보다 실제 도메인 명사를 사용한다.
- backend, frontend, DB, API에서 같은 개념은 최대한 같은 단어를 쓴다.

예:
- `signal`, `signalVault`, `accessToken`, `thumbnailKey`

### 7. 함수 이름은 동사 + 대상을 기본으로 한다
권장:
- `getUserById`
- `calculateInvoiceTotal`
- `sendVerificationEmail`
- `markAsPaid`

boolean 반환은 아래 접두를 우선한다.
- `isExpired`
- `hasPermission`
- `canRetry`
- `shouldSync`

가급적 피할 이름:
- `handle`
- `process`
- `run`
- `execute`
- `manage`

### 8. 파일 이름과 export 이름은 역할을 맞춘다
- 파일명은 그 파일의 주된 export나 책임과 맞아야 한다.
- 이 레포는 class보다 function/file 중심이므로, 파일 책임이 이름에 바로 드러나야 한다.
- backend `module/`과 `worker/`는 `lowerCamelCase`를 유지하고, 파일명과 export 함수명을 맞춘다.

예:

```js
// updateAccessFlag.js
module.exports = async function updateAccessFlag(param){
    ...
}
```

## 이 레포에서 자주 쓰는 이름 패턴
- backend operation key: `PascalCase`
  - `CreateApiKey`, `GetSignalVaultList`, `VerifyPasswordResetToken`
- backend operation logic file: `lowerCamelCase`
  - `createApiKey.js`, `getSignalVaultList.js`
- response class: `PascalCase`
  - 성공은 `...OK`
  - 실패는 `UserNotFound`, `EmailAlreadyInUse`
- boolean 변수: `is`, `has`, `can`, `should`
- 개수 변수: `Count`
- 목록 변수: `List` 또는 실제 복수형
- 식별자 변수: 대상명 + `Id`

backend 세부 네이밍 규칙은 `backend/CONVENTION.md`를 우선한다.

## 이름을 바꿔야 하는 경우
- 이름이 거짓말할 때
- 너무 generic해서 설명이 더 필요할 때
- 타입만 말하고 의미를 말하지 않을 때
- 인접한 이름과 차이를 설명하기 어려울 때
- 도메인이 바뀌었는데 옛 이름이 남아 있을 때

## 최종 점검
- 이름만 보고 의도를 짐작할 수 있는가
- nearby identifier와 차이가 의미 있게 드러나는가
- 사람이 자연스럽게 읽고 말할 수 있는가
- 검색으로 다시 찾기 쉬운가
- 타입이나 구현 detail을 불필요하게 이름에 밀어 넣지 않았는가
- 이 이름이 6개월 뒤에도 여전히 맞는 설명일 것 같은가

한 줄 요약:

**generic한 이름 대신, 도메인과 책임이 드러나는 검색 가능한 이름을 쓴다.**
