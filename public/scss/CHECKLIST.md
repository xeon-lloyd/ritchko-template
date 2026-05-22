# SCSS Checklist

## 파일 위치
- 수정 대상이 `public/scss/` 원본 파일인가?
- `public/css/` 빌드 결과물을 직접 수정하지 않았는가?
- 페이지 HTML `views/<path>.html`과 SCSS `public/scss/<path>.scss` 경로가 대응되는가?
- `_auth.scss`, `_form.scss`, `_list.scss` 같은 임의 Sass partial 파일을 새로 만들지 않았는가?
- 공통 layout 조각 변경이면 `public/scss/temp/`, 디자인 시스템 변경이면 `public/scss/designSystem/` 영향 범위를 확인했는가?

## 디자인 시스템
- 색상을 모두 `var(--...)` token으로 작성했는가?
- 새 hex/rgb/hsl/color keyword를 추가하지 않았는가?
- 타이포를 모두 `@include typo.*` mixin으로 작성했는가?
- 새 `font-size`, `line-height`, `letter-spacing` 직접값을 추가하지 않았는가?
- button/input/control/modal 기본 스타일을 새로 만들기 전에 디자인 시스템 class를 먼저 사용했는가?

## scope
- 페이지 전용 스타일이 해당 페이지 wrapper나 명확한 부모 selector 아래에 제한되어 있는가?
- `.title`, `.description`, `.row`, `.value`, `.action` 같은 흔한 class가 전역처럼 새지 않는가?
- `body`, `main`, `input`, `button`, `a` 같은 전역 selector를 페이지 SCSS에서 새로 재정의하지 않았는가?
- 공통 스타일로 옮긴 변경이 실제로 여러 페이지에서 필요한 규칙인가?

## 구성과 공백
- 주제가 바뀌는 지점에 빈 줄 2줄로 간격을 두었는가?
- 큰 UI 섹션 앞에 `/* 리스트 섹션 */` 같은 섹션 주석을 넣었는가?
- 같은 주제 안의 selector는 가까이 묶고, 다른 주제와는 시각적으로 구분했는가?
- `/* margin */`, `/* color */`처럼 코드 자체를 반복하는 주석을 만들지 않았는가?

## 상태와 JS 연계
- JS에서 토글하는 class 이름과 SCSS selector가 일치하는가?
- `.display`, `.active`, `.loading`, `.invalid`, `.disabled`의 의미를 기존 방식과 다르게 쓰지 않았는가?
- `display: flex` 또는 `display: grid`가 필요한 요소가 `.display` 전역 규칙과 충돌하지 않는가?
- 로딩/비활성/에러 상태가 기존 디자인 시스템 상태와 어긋나지 않는가?

## 반응형
- 표준 breakpoint가 필요한 경우 `designSystem/responsive.scss`의 `$breakpoints`를 사용했는가?
- 페이지 전용 px breakpoint를 썼다면 콘텐츠 폭 문제 해결에 필요한 경우인가?
- 모바일에서 목록/표/카드/폼/모달이 overflow되지 않는가?
- 긴 URL, token, key, 파일명, email 값에 `min-width: 0`, `text-overflow`, `word-break`, `overflow-x` 중 필요한 처리가 있는가?

## 검증
- `npm run build` 또는 `npm run build:css`를 실행했는가?
- 관련 HTML selector와 SCSS selector가 실제 구조와 맞는가?
- 데스크톱과 모바일 폭에서 주요 UI가 깨지지 않는지 확인했는가?
- 변경 범위가 요청한 화면이나 공통 요소에만 한정되어 있는가?
