# SCSS 작성 규칙

## 배치와 연결
- 원본은 `public/scss/`, 결과는 `public/css/`다. 결과 CSS를 직접 수정하지 않는다.
- 페이지 전용 스타일은 페이지 SCSS, 공통 조각은 `temp/`, 공통 디자인 시스템은 `designSystem/`에 둔다.
- 새 스타일은 기존 `core.scss`에 추가하지 않는다. 기능별 임의 partial을 새로 만들지 않는다.
- 모듈은 `@use`를 사용한다. 페이지 깊이에 맞게 상대 경로를 지정한다.
- 독립 CSS가 필요한 SCSS 파일은 Sass partial 접두사 `_`를 사용하지 않는다.

## 디자인 시스템
- 색상은 `designSystem/color.scss`의 CSS variable을 사용한다. 직접 색상값을 페이지에 추가하지 않는다.
- 폰트 크기·행간·자간은 `designSystem/typo.scss` mixin을 사용한다. 굵기는 정보 위계에 맞게 보강할 수 있다.
- 기존 button/input/control/modal을 우선 사용하고 페이지에서는 배치·간격·폭·특수 상태를 보강한다.
- 새 공통 토큰이나 컴포넌트는 실제 반복 사용과 사용자 요청 범위를 확인한 뒤 추가한다.

## 범위와 반응형
- 페이지 wrapper 안으로 selector 범위를 제한한다. 페이지 SCSS에서 body/main/button 등 전역 스타일을 재정의하지 않는다.
- breakpoint는 `designSystem/responsive.scss`와 `sass:map`을 사용한다.
- grid/flex 자식의 `min-width: 0`, 긴 값의 줄바꿈·생략, 모바일의 단일 열 전환을 고려한다.
- `.display`는 전역에서 `display: block !important`다. flex/grid가 필요한 표시 상태는 구체 selector로 보강한다.
- 로딩·오류·빈 결과와 키보드 포커스를 함께 설계한다.

## 검토
HTML·SCSS·JS의 selector와 상태 class를 함께 읽어 검토한다. 테스트·빌드·구문 검사·서버 기동은 사용자 명시 요청이 있을 때만 AI가 실행한다. 사용자는 변경한 컴포넌트를 데스크톱·모바일에서 확인한다.
