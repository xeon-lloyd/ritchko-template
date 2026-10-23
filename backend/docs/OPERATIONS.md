# 공통 유틸과 운영 설정

## SMTP

`setting.js`와 `setting.template.js`는 다음 구조를 사용한다. 실제 접속 정보는 커밋하지 않는다.

```js
emailSmtp: {
    host: 'smtp.example.com',
    port: 465,
    secure: true,
    user: 'smtp-user',
    password: 'smtp-password',
    fromEmail: 'noreply@example.com',
    replyTo: '', // 답장 주소 (선택)
},
```

`util.mail.send(options)`는 이 설정으로 발송한다. `options.from`을 생략하면 `fromEmail`을 사용한다. 기존 `gmailSmtp` 사용 환경은 위 구조로 변경해야 하며 기존 설정으로의 fallback은 없다. 템플릿 사용법은 [이메일 가이드](../emailTemplate/README.md)를 따른다.

`options.replyTo`를 생략하면 `emailSmtp.replyTo`를 사용한다. 설정값도 비어 있으면 Reply-To 헤더를 추가하지 않는다. 발송별 `options.replyTo`를 지정하면 설정값보다 우선한다.

transporter는 최초 발송 시 한 번 생성하고 `pool: true`로 SMTP 연결을 재사용한다. 끊어진 연결은 Nodemailer가 정리하고 필요할 때 새로 연결한다. 발송 실패는 호출부에 전달하며, 실패한 메일의 재시도는 호출부가 결정한다. SMTP 접속 설정을 변경하면 프로세스를 재시작한다. 정상 종료 처리에서는 생성된 pool을 `util.mail.transporter?.close()`로 닫을 수 있다.

## Discord 알림

`errorReport: { enable: false, webhookUrl: '' }`가 기본값이다. 활성화하려면 서버의 로컬 설정에 URL을 지정한다.

- `await util.discord.sendMessage(webhookUrl, data)`: Discord webhook payload를 전송한다.
- `await util.discord.sendErrorReport(content)`: `errorReport.enable`이 켜져 있을 때만 전송한다.
- API·소켓 로직의 예상 밖 예외와 전역 `uncaughtException`, `unhandledRejection`을 기록하고 알린다. 정상적인 인증·검증 실패는 알리지 않는다.
- 네트워크 요청은 5초 제한이며 전송 실패는 콘솔에 기록하고 호출부로 재전파하지 않는다. 오류 문자열에 실제 토큰·비밀번호를 포함하지 않는다.
- 전역 오류 후 프로세스는 계속 실행한다. 이는 오류 이후 프로세스 상태가 정상임을 보장하지 않으며, 운영자가 상태를 확인해야 한다.

## Redis Pub/Sub

`util.redis.pub(channel, value)`는 JSON 직렬화하고 `sub(channel, callback)`은 역직렬화한 값을 callback에 전달한다. 객체·배열·문자열 등 JSON으로 표현 가능한 값을 사용한다. 외부 publisher도 JSON을 보내야 하며 raw 문자열 메시지와는 호환되지 않는다. 잘못된 JSON은 파싱 오류가 된다.

## URL 검증

`valider.isValidHttpUrl(value)`는 HTTP(S), 자격증명 없는 도메인 형식의 링크를 확인한다. localhost·IP 주소는 허용하지 않는다. 내부망 접근 방지나 SSRF 방어를 보장하지 않으므로 서버 fetch용 보안 검증으로 사용하지 않는다.

## 로그와 색인

로깅 초기화는 `logs` 폴더를 생성한 뒤 기존 로그 업로드·기록을 시작한다. 비운영 환경(`isProduction: false`)에서는 static·API·페이지 응답에 `X-Robots-Tag: noindex, nofollow`를 설정한다. 운영 환경에서는 이 헤더를 추가하지 않는다.
