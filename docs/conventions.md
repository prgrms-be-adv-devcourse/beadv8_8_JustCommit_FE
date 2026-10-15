# 협업 규칙

## 브랜치

- `main` ← `develop` ← 작업 브랜치. 작업 브랜치는 `develop`에서 만든다.
- 이름: `{GitHub 아이디}/{도메인}-{이슈번호}-{짧은설명}` (예: `gasic37200/market-12-cart-page`)
- 하나의 브랜치에는 하나의 이슈만 담는다.

## 커밋 메시지

- 형식: `타입: 내용` (예: `Feat: 장바구니 페이지 추가`)
- 타입: `Feat` 기능, `Fix` 버그, `Refactor` 동작 변화 없는 구조 개선, `Style` 화면 스타일, `Docs` 문서, `Chore` 설정·빌드
- 제목과 본문은 한글. 제목은 50자 이내, 끝에 마침표 없음.
- 제목과 본문 사이 한 줄 비우고, 본문에는 "어떻게"보다 "무엇을, 왜"를 쓴다. 변경이 여러 개면 `-`로 나열한다.
- AI가 커밋하면 마지막 줄에 `Co-Authored-By:` 줄을 남긴다.

## PR

- 제목은 커밋과 같은 형식. 본문에 `Closes #이슈번호`.
- 본문에 만든 화면 스크린샷을 넣는다.
- `develop`에는 Squash merge. 리뷰어 1명 승인 후 머지.
- 머지 전 `npm run lint`, `npm run build` 통과.

## 코드 스타일

- 포맷은 `.prettierrc`, 린트는 `eslint.config.js`가 기준이다. 저장 시 Prettier 적용을 권장한다.
- 컴포넌트는 함수 선언 + 파일 끝 `export default`. 파일 이름은 PascalCase(`CartPage.jsx`), 훅은 `use`로 시작하는 camelCase(`useCart.js`).
- 서버 데이터는 API 함수 + `useEffect`/`useState`로 가져온다. 상태 관리 라이브러리(React Query, Zustand 등)는 팀 합의 후 도입한다.
