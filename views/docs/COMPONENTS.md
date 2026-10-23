# 공통 컴포넌트

실물 예시는 `views/_designSystemSample.html`을 참고한다. 운영 환경에서는 해당 샘플 경로가 404를 반환한다.

## 기본 연결
일반 페이지는 `temp/head.html`, `temp/elements.html`, 필요한 header/sidebar/footer를 include한다. `#alertArea`, `#dimmedCover`를 중복 생성하지 않는다. 페이지 스타일과 JS는 각각 연결한다.

## 타이포와 색상
- 영문 Roboto, 한글 Pretendard를 사용한다. 글자 크기와 행간은 `designSystem/typo.scss` mixin 또는 `.font-heading2`, `.font-body2-reading` 등 기존 클래스를 사용한다.
- 색상은 `var(--primary-normal)`, `var(--caption-neutral)`, `var(--bg-system)` 등 역할 토큰을 사용한다.
- 인디고 primary는 주요 행동, 앰버 `--accent-*`는 보조 강조에 사용한다. 오류는 `--error-*`, 결과 상태는 `--state-*`를 사용한다.

## 버튼과 아이콘
```html
<button type="button" class="btn-solid-primary btn-medium">저장</button>
<button type="button" class="btn-outline-secondary btn-small">취소</button>
<button type="button" class="btn-solid-delete btn-small">삭제</button>
<a href="/" class="btn-text-primary btn-small">홈</a>
```
크기는 `btn-large/medium/small`, 폭은 `w-fill/w-hug`를 조합한다. 요청 중에는 기존 `.loading` 스타일과 실제 `disabled` 속성을 함께 사용한다.

Font Awesome 7.0.0은 공통 head에서 로드한다. 장식 아이콘에는 `aria-hidden="true"`, 아이콘만 있는 버튼에는 `aria-label`을 지정한다. 정렬된 메뉴 아이콘에는 `fa-fw`를 사용한다. 기존 SVG mask 방식과 `--src`도 유지한다.

## 입력과 컨트롤
```html
<div class="inputArea">
    <label for="displayName">표시 이름</label>
    <input type="text" id="displayName" placeholder="표시 이름">
</div>
<div class="controlItem">
    <input type="checkbox" class="toggle" id="notifications">
    <label for="notifications">알림 받기</label>
</div>
```
input/select/textarea 기본 스타일을 재사용한다. label 연결, disabled, `.invalid` 상태를 함께 고려한다. radio는 그룹 내 같은 name을 사용한다.

## 모달
`main` 밖 `#modals`에 `.modal`과 구체 id를 가진 요소를 둔다. 내부 `#title > #mainTitle + #subtitle`, `#content`, `#action` 구조는 기존 계약을 유지한다. 기본 폭은 최대 28rem이며 뷰포트 높이에 맞춰 내부 스크롤한다.

표시는 기존 `.display`와 `dimmedCover.display()/hide()`로 제어한다. 모달 제목을 `aria-labelledby`로 연결하고 열기/닫기 시 포커스 이동, Escape, Tab 순환을 구현한다.

## 헤더
`upBarLogin`은 기존 `GetUserInfo`의 name만 사용한다. 프로필 이미지나 별도 API는 필요하지 않다. 메뉴 항목을 바꿀 때 HTML의 `.menuItem` 구조를 유지하고 실제 서비스 경로를 연결한다.
