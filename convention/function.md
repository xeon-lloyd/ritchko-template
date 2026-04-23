# 함수 설계 컨벤션

## 목적
- 함수는 읽는 사람이 "무엇을 하는지", "무엇에 의존하는지", "무엇을 바꾸는지"를 빠르게 파악할 수 있게 만들어야 한다.
- 목표는 무조건 잘게 쪼개는 것이 아니라, 책임이 분명하고 흐름이 예측 가능한 함수를 만드는 것이다.

## 핵심 원칙
- 한 함수는 하나의 개념적 책임을 가진다.
- 같은 함수 안에서는 같은 수준의 추상화로 읽혀야 한다.
- 함수 이름만 보고도 의도와 대상이 어느 정도 드러나야 한다.
- 호출자가 모르게 큰 부수효과를 일으키지 않는다.

## 기본 규칙

### 1. 한 함수는 하나의 책임만 가진다
- `fetchUser`
- `validateOrder`
- `calculateDiscount`
- `saveInvoice`

처럼 한 동작을 드러내는 이름을 우선한다.

- 조회 + 검증 + 저장 + 후처리를 한 함수에 다 섞지 않는다.
- 함수 설명에 `하고`, `and`가 계속 붙으면 보통 책임이 너무 많다.

### 2. 추상화 수준을 섞지 않는다
- 상위 함수는 큰 흐름이 읽혀야 한다.
- 저수준 계산, DB 접근, 외부 연동 detail이 흐름을 가리면 helper로 뺀다.
- 다만 이 레포 backend operation처럼 전체 검증/조회/처리/응답 흐름을 한 파일에서 보여야 하는 경우, 흐름 자체는 operation 파일에 남긴다.

예시:

```js
module.exports = async function(param, req, res){
    if(!param.userId) return new response.FormInputRequired('userId');

    const user = await getUserById(param.userId);
    if(!user) return new response.UserNotFound();

    await updateUserStatus(user.id, 'inactive');

    return new response.UpdateUserStatusOK();
}
```

위 예시에서 검증, 대상 확인, 응답 경계는 operation에 남기고, 반복되거나 저수준인 DB detail만 helper로 내릴 수 있다.

### 3. 시그니처는 레포의 기존 계약을 유지한다
- 기존 파일이 정한 시그니처가 있으면 그 계약을 유지한다.
- backend operation은 `module.exports = async function(param, req, res){ ... }` 형태를 기본으로 따른다.
- backend operation의 `param`은 구조분해보다 `param.xxx` 사용을 우선한다.
- 인자가 많다고 무조건 객체 하나로 감싸거나, 반대로 객체 하나를 무리하게 분해하지 않는다. 기존 계약과 읽기 흐름을 먼저 본다.

### 4. boolean flag 인자로 동작을 바꾸지 않는다
- `createUser(user, isAdmin)`처럼 하나의 함수에 두 동작을 숨기지 않는다.
- 가능하면 `createAdminUser`, `createRegularUser`처럼 행위를 분리한다.

### 5. 숨은 부수효과를 피한다
- 함수 이름에서 예상되지 않는 cache clear, global state 변경, 외부 호출을 몰래 하지 않는다.
- 부수효과가 핵심이면 이름으로 드러낸다.
- unavoidable한 경우에는 호출 경계나 주석으로 의도를 분명히 한다.

### 6. query와 command를 필요 이상으로 섞지 않는다
- 상태를 확인하는 함수와 상태를 바꾸는 함수를 가능하면 분리한다.
- 단, 이 레포 backend operation처럼 검증 후 바로 response를 반환하는 orchestration 함수는 예외다.
- 중요한 것은 읽는 사람이 함수의 성격을 오해하지 않게 만드는 것이다.

### 7. type 분기 로직을 반복하지 않는다
- 같은 `switch(type)`나 `if(type === ...)` 분기를 여러 곳에서 반복하지 않는다.
- 클래스 다형성을 강제할 필요는 없지만, 분기 테이블, helper 분리, 명시적 dispatcher 등 더 단순한 구조로 모은다.
- 이 레포는 class 중심 구조가 아니므로, 분기를 줄이기 위해 불필요한 class 계층을 새로 도입하지 않는다.

### 8. 함수는 작되, 과하게 쪼개지 않는다
- 중첩을 줄이고 early return을 활용한다.
- 재사용되지도 않고 이름만 한 번 더 따라가야 하는 helper를 과도하게 만들지 않는다.
- backend operation은 "한 번에 큰 흐름이 보이는 것"도 중요한 요구사항이다.

### 9. 에러와 응답은 올바른 경계에서 처리한다
- 함수마다 제각각 다른 에러 shape를 반환하지 않는다.
- backend operation 경계에서는 `*_response.sys.js`의 response 클래스를 사용한다.
- 내부 helper는 책임이 명확할 때만 throw하고, 그 예외를 어느 레이어가 처리하는지 분명해야 한다.
- raw error code 문자열을 여러 레이어에 흘리는 패턴은 피한다.

## 피해야 할 함수
- `handle`
- `process`
- `run`
- `execute`
- `doThing`

처럼 행위와 대상을 충분히 설명하지 못하는 이름

- boolean flag로 분기하는 함수
- 검증, 저장, 후처리, 알림을 모두 한 몸에 넣은 함수
- 호출자가 예상 못 하는 side effect를 숨긴 함수
- 리턴 shape가 상황마다 제각각인 함수

## 최종 점검
- 이 함수가 실제로 한 가지 책임만 가지는가
- 같은 함수 안에서 추상화 수준이 갑자기 튀지 않는가
- 이름만 보고도 행위와 대상을 짐작할 수 있는가
- 부수효과가 호출자를 놀라게 하지 않는가
- backend라면 operation 흐름이 helper 뒤로 과하게 숨지 않았는가
- 리턴과 에러 처리 경계가 일관적인가

한 줄 요약:

**함수는 작고 선명해야 하지만, 이 레포에서는 특히 전체 흐름을 보존하는 방향으로 작아야 한다.**
