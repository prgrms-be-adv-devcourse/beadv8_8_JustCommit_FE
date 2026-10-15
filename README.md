# replant - Frontend

반려식물 C2C 안심 거래 마켓 **replant**의 프론트엔드 레포입니다. (팀 일단커밋)

## 기술 스택

- React + Vite (JavaScript)
- react-router-dom (라우팅)
- axios (REST API 호출)
- CSS Modules + CSS 변수 (Tailwind 미사용)
- ESLint, Prettier

## 실행 방법

```bash
npm install
npm run dev
```

- 접속: http://localhost:5173
- API를 확인하려면 **백엔드도 로컬 8080에서 실행**해야 합니다.
- 개발 중 `/api`로 시작하는 요청은 Vite 프록시가 `http://localhost:8080`으로 전달합니다.

## 문서

| 문서 | 내용 |
|---|---|
| [frontend-structure.md](docs/frontend-structure.md) | 폴더 구조, 라우팅·Layout, axios·토큰 처리, 환경변수 |
| [convention.md](docs/convention.md) | 페이지 추가, 스타일, API 호출, 코드 스타일 |
