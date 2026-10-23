# 이메일 템플릿

종류별 폴더에 독립적인 HTML 문서를 둔다. 폴더명과 파일명은 자유롭게 정하며 언어 판별이나 fallback은 없다.

```js
const email = await util.mail.renderTemplate('example/default', { name: 'User' });
await util.mail.send({ to: 'user@example.com', ...email });
```

- 경로는 이 폴더 기준이며 `.html`은 자동으로 붙는다. 절대 경로와 루트 밖 경로는 허용하지 않는다.
- 경로는 서버 코드에서 지정한다. 템플릿 폴더에 외부 경로를 가리키는 심볼릭 링크를 두지 않는다.
- `<title>`을 제목으로 사용하고 `{ subject, html }`을 반환한다. 파일 또는 title이 없으면 오류가 발생한다.
- 데이터 값은 문자열이며 `{{key}}`를 HTML escape하여 치환한다. key는 영문·숫자·밑줄을 사용한다.
- 전달하지 않은 placeholder는 유지하고, 템플릿에 없는 key는 무시한다. 치환된 값을 다시 placeholder로 해석하지 않는다.
- 렌더링과 발송은 분리한다. 수신자, 발송 시점, 실패 처리는 호출부에서 결정한다.
- SMTP 설정은 `backend/core/setting.js`의 `emailSmtp`를 사용한다. 설정과 운영 알림은 [운영 가이드](../docs/OPERATIONS.md)를 참고한다.
