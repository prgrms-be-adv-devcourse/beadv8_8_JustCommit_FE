# AGENTS.md

replant(반려식물 C2C 중고거래) 웹 프론트엔드. React 19 + Vite + JavaScript(JSX), CSS Modules, axios, react-router-dom.
백엔드는 별도 레포(`beadv8_8_JustCommit_BE`, Spring Boot)이고, 이 레포는 화면만 만든다.

## 작업 순서

1. 작업할 페이지를 [docs/pages.md](docs/pages.md)에서 찾는다. 경로, 권한, 쓰는 API, 화면 상태가 정해져 있다. 목록에 없는 페이지나 기능은 만들지 않고 사용자에게 묻는다.
2. 호출할 API를 [docs/api.md](docs/api.md)에서 확인한다. "미구현"으로 표시된 API는 목 데이터로 화면을 만들고, 코드에 `// TODO(api): <엔드포인트>`를 남긴다.
3. 화면 문구, 상태 배지, 버튼 활성 조건은 [docs/domain.md](docs/domain.md)의 규칙을 따른다.
4. 색, 글꼴, 간격은 [docs/design.md](docs/design.md)와 `src/index.css`의 토큰을 쓴다.
5. 끝나면 `npm run lint`와 `npm run build`가 둘 다 통과해야 완료다. 실패하면 고치고 다시 돌린다.
6. 보고할 때 만든 것, 목 데이터로 남긴 것, 확인하지 못한 것을 나눠서 적는다.

## 코드 규칙

- 페이지는 `src/pages/<도메인>/<이름>Page.jsx`, 스타일은 같은 폴더의 `<이름>Page.module.css`. 도메인 폴더: `member`, `product`, `market`(장바구니·주문·배송), `payment`(예치금), `settlement`, `notification`.
- 두 페이지 이상에서 쓰는 UI는 `src/components/common/`, 레이아웃은 `src/components/layout/`.
- 라우트는 `src/App.jsx`에 추가하고, 경로는 docs/pages.md의 경로를 그대로 쓴다.
- 페이지마다 `usePageTitle('<페이지 이름>')`을 호출한다.
- API 호출은 `src/api/<도메인>.js`에 함수로 모으고, 반드시 `src/api/client.js`의 `client`를 쓴다. 토큰 첨부와 401 재발급이 거기서 처리된다.
- 스타일은 CSS Modules + `var(--토큰)`만 쓴다. 색 hex를 컴포넌트에 직접 쓰지 않는다.
- 새 npm 패키지는 사용자 승인 후에만 추가한다. 이유를 함께 묻는다.

## 지켜야 할 경계

- Access 토큰은 메모리(`src/api/tokenStore.js`)에만 둔다. localStorage, sessionStorage, 쿠키에 저장하지 않는다. 리프레시 토큰은 서버가 HttpOnly 쿠키로 관리한다.
- `.env*`에 비밀값을 넣지 않는다. 여기 값은 빌드 결과에 그대로 노출된다.
- 근거 없는 서비스 문구(수수료 0원, 정산 D+1, 제휴사, 인증 마크, 고객센터 번호 등)를 만들지 않는다. 쓸 수 있는 정책 문구는 docs/domain.md에 있는 것뿐이다.
- 커밋, push, PR 생성은 사용자가 요청할 때만 한다. 규칙은 [docs/conventions.md](docs/conventions.md).

## 실행

- `npm install` 후 `npm run dev`. `/api` 요청은 Vite 프록시로 `http://localhost:8080`(백엔드)에 간다.
- 백엔드 없이 화면만 볼 때는 목 데이터로 렌더링되게 만든다.
