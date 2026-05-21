# Views Checklist

## 새 페이지 생성
- `npm run create:frontend-page`로 생성할 수 있는 페이지를 수동으로 만들지 않았는가?
- path segment가 `lowerCamelCase`인가?
- 기존 같은 URL/page가 없는지 확인했는가?

## HTML 구조
- 생성 템플릿의 기본 구조를 유지했는가?
- 페이지 구현은 기본적으로 `main > .container` 내부에 있는가?
- `views/_designSystemSample.html`의 기본 HTML 컴포넌트를 먼저 확인했는가?
- `views/docs/COMPONENTS.md`에서 해당 컴포넌트의 작성 규칙을 확인했는가?
- 공통 partial을 새로 만들기 전에 `views/temp/`를 확인했는가?
- 버튼은 `button type="button"` 또는 이동용 `a href`인가?
- 새 `href="javascript:..."`를 만들지 않았는가?
- 새 `onclick`을 만들지 않았는가?
- 반복되는 제목/설명/라벨은 class를 사용했는가?
- JS에서 직접 참조해야 하는 요소만 id를 갖는가?
- 동적 row가 들어갈 영역은 class와 `data-*`를 쓰기 쉽게 되어 있는가?
- 디자인 시스템이 요구하는 모달 id 구조는 지켰는가?
- `#alertArea`, `#dimmedCover` 같은 공통 elements를 중복 생성하지 않았는가?
- 일반 시각 스타일을 `style=""`로 넣지 않았는가?

## 연계 확인
- HTML 구조 변경 때문에 page JS selector 수정이 필요한가?
- HTML 구조 변경 때문에 page SCSS selector 수정이 필요한가?
- SCSS를 수정했다면 `npm run build`가 필요한가?

## 범위
- 공통 partial 변경이 필요한 작업인지, 페이지 전용 변경인지 구분했는가?
- `_designSystemSample.html` 같은 샘플 파일을 일반 페이지 규칙에 억지로 맞추지 않았는가?
- 프로젝트 특수 목적 독립 HTML을 일반 페이지 규칙에 억지로 맞추지 않았는가?
