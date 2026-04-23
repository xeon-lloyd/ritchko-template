# 포매팅 컨벤션

## 목적
- 포매팅은 보기 좋게 꾸미는 작업이 아니라 읽는 순서를 설계하는 작업이다.
- 이 문서는 코드가 위에서 아래로 자연스럽게 읽히고, 관련 개념이 붙어 보이며, helper를 찾기 위해 파일을 과하게 왕복하지 않게 만드는 기준을 정한다.

## 핵심 원칙
- 독자가 먼저 봐야 하는 큰 흐름을 위에 둔다.
- 그 흐름을 바로 이해하는 데 필요한 보조 코드는 아래쪽 가까운 곳에 둔다.
- 공백은 장식이 아니라 개념 경계를 드러내는 용도로만 사용한다.
- 한 파일 안에서는 하나의 배치 철학만 유지한다.

## 기본 규칙

### 1. 메인 흐름을 먼저 보이게 둔다
- 파일에서 가장 중요한 entry, orchestration, public surface를 먼저 둔다.
- 로컬 helper가 그 흐름을 직접 지원하면 호출부 바로 아래에 둔다.
- 작은 detail을 맨 위에 길게 깔아두지 않는다.

예시:

```js
module.exports = async function(param, req, res){
    if(!param.signalId) return new response.FormInputRequired('signalId');

    const signal = await getSignalById(param.signalId);
    if(!signal) return new response.SignalNotFound();

    await archiveSignal(signal.id);

    return new response.ArchiveSignalOK();
}

async function getSignalById(signalId){
    return util.mysql.selectOne('signal', { id: signalId });
}

async function archiveSignal(signalId){
    return util.mysql.update('signal', { status: 'archived' }, { id: signalId });
}
```

### 2. 관련 코드는 붙여 둔다
- 서로 직접 연결된 함수, 상수, 처리 블록은 가까이 둔다.
- 도입한 개념의 구현을 파일 아래 어딘가에 흩어 놓지 않는다.
- 다만 backend operation처럼 큰 흐름을 한 파일에서 보여야 하는 경우, helper 분리가 흐름을 해치면 무리하게 쪼개지 않는다.

### 3. 공백은 개념 경계를 보여야 한다
- import 블록과 본문 사이
- 상수 묶음과 함수 본문 사이
- 메서드와 메서드 사이
- 긴 함수 안에서 실제로 다른 단계가 시작되는 지점

위 경우에만 한 줄 공백을 둔다.

### 4. 메서드와 함수는 각자 독립된 시각적 블록으로 보이게 한다
- 함수 사이에는 한 줄 공백을 둔다.
- 함수 안쪽 들여쓰기와 줄 간격을 일정하게 유지한다.
- 여러 함수가 한 덩어리처럼 붙어 보여 독자가 범위를 놓치게 만들지 않는다.

### 5. 지역 변수는 사용하는 곳 가까이에 둔다
- 함수 시작부에 불필요하게 지역 변수를 몰아두지 않는다.
- 처음 의미 있게 쓰는 시점 근처에 선언한다.
- 선언과 사용 사이에 unrelated 코드가 길게 끼지 않게 한다.

### 6. 기존 스캐폴드와 파일 배치를 먼저 따른다
- 이 레포는 템플릿과 스캐폴드가 정한 파일 구조가 있다.
- 특정 영역 문서가 import 순서, 함수 위치, 블록 구성을 지정하면 그 규칙을 그대로 따른다.
- 공통 포매팅 원칙은 스캐폴드가 비어 있는 부분을 채우는 기본값이다.

## 기본 배치 기준

### 파일
1. import / require
2. export 상수와 타입 비슷한 선언
3. 메인 export 함수 또는 class
4. 메인 흐름을 직접 받치는 helper
5. 더 낮은 수준의 utility

### 함수
1. 입력값 검증과 early return
2. 메인 orchestration
3. 사용 직전에 오는 지역 변수 선언
4. 반환
5. 필요하면 바로 아래의 file-local helper

### class
- 이 레포는 class 중심 구조가 아니므로 class를 기본값으로 도입하지 않는다.
- class를 써야 한다면 fields, constructor, public method, private helper 순서로 묶는다.

## 피해야 할 포매팅
- unrelated 코드를 공백 없이 한 블록에 몰아넣기
- helper를 파일 맨 아래 먼 곳에 흩뿌리기
- compact하게 보이려고 함수 사이 공백을 없애기
- 개념 구분 없는 빈 줄 남발
- 기존 파일이 가진 배치 철학과 다른 스타일을 같은 파일 안에 섞기

## 최종 점검
- 파일 맨 위에서 큰 흐름이 바로 보이는가
- 호출한 helper를 찾으려고 위아래를 과하게 왕복하지 않아도 되는가
- 빈 줄이 실제 개념 구분을 설명하고 있는가
- 지역 변수가 너무 일찍 선언되어 읽는 흐름을 끊지 않는가
- 같은 파일 안에 서로 다른 배치 스타일이 섞이지 않았는가

한 줄 요약:

**메인 흐름을 먼저 보여주고, 그 흐름을 이해하는 데 필요한 디테일을 바로 아래에서 찾을 수 있게 배치한다.**
