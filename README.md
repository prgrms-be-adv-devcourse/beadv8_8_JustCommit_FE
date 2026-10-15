# replant FE

반려식물 C2C 중고거래 서비스 replant의 웹 프론트엔드입니다. (백엔드: `beadv8_8_JustCommit_BE`)

## 실행

```bash
npm install
npm run dev
```

`/api` 요청은 Vite 프록시로 `http://localhost:8080`(로컬 백엔드)에 전달됩니다.

## 문서

| 문서 | 내용 |
|---|---|
| [AGENTS.md](AGENTS.md) | AI 에이전트 작업 규칙 (사람도 같이 읽어 주세요) |
| [docs/pages.md](docs/pages.md) | 페이지 목록, 경로, 권한, 화면 명세 |
| [docs/api.md](docs/api.md) | API 호출 방법, 인증, 엔드포인트와 구현 상태 |
| [docs/domain.md](docs/domain.md) | 서비스 정책, 상태 코드 표시 이름, 버튼 조건 |
| [docs/design.md](docs/design.md) | 디자인 토큰, 레이아웃, 공통 컴포넌트 |
| [docs/conventions.md](docs/conventions.md) | 브랜치, 커밋, PR, 코드 스타일 |
