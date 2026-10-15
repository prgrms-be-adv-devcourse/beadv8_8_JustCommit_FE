# 프론트엔드 구조

## 폴더 구조

```
src/
├─ api/                  axios 공통 설정, 토큰 보관, 도메인별 API 함수
│  ├─ client.js
│  └─ tokenStore.js
├─ assets/               이미지 등 정적 파일
├─ components/
│  ├─ common/            공통 컴포넌트 (Button, Input …)
│  └─ layout/            Header, Footer, Layout
├─ hooks/                커스텀 훅
│  └─ usePageTitle.js
├─ pages/                페이지 (백엔드 모듈과 같은 이름)
│  ├─ HomePage.jsx
│  ├─ NotFoundPage.jsx
│  ├─ member/
│  ├─ product/
│  ├─ market/
│  ├─ payment/
│  ├─ settlement/
│  └─ notification/
├─ utils/                도우미 함수
├─ App.jsx               라우트 설정
├─ main.jsx              시작점
└─ index.css             디자인 토큰(CSS 변수) + 기본 스타일
```

- `pages/` 아래 폴더는 백엔드 모듈(`member`, `product`, `market`, `payment`, `settlement`, `notification`)과 이름을 맞춥니다.
- 아직 파일이 없는 폴더에는 Git에 폴더를 남기기 위한 `.gitkeep`이 있습니다. 실제 파일을 추가하면 지워도 됩니다.

## 라우팅 · Layout

`App.jsx`에서 `BrowserRouter` + `Routes`로 페이지 주소를 설정합니다.

```jsx
<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

- `Layout` Route 안에 있는 페이지는 모두 Header·Footer가 붙습니다.
- `Layout`의 `<Outlet />` 자리에 현재 주소에 맞는 페이지가 그려집니다.
- `path="*"`는 등록되지 않은 모든 주소를 404 페이지로 보냅니다.

### Layout 구성

| 영역 | 설명 |
|---|---|
| Header | 화면 위 고정(`position: fixed`), 높이 80px |
| main | Header 높이만큼 `padding-top: 80px`, 본문 최대 너비 1200px |
| Footer | 내용이 짧아도 화면 맨 아래에 붙음 |

Header 높이를 바꾸면 `Header.module.css`의 `height`와 `Layout.module.css`의 `padding-top`을 함께 바꿔야 합니다.

## API 호출 · 토큰 처리

### 토큰 보관

| 토큰 | 보관 위치 | 비고 |
|---|---|---|
| Access 토큰 | 메모리 (`tokenStore.js`) | 로그인 응답으로 받아 저장. 새로고침하면 사라짐 |
| Refresh 토큰 | HttpOnly 쿠키 | 백엔드가 설정. JavaScript로 읽을 수 없고 브라우저가 자동 전송 |

Access 토큰을 localStorage에 두지 않는 이유는 XSS 공격 시 스크립트로 바로 읽힐 수 있기 때문입니다.

### client.js 동작

```
요청
 └─ 요청 인터셉터: Access 토큰이 있으면 Authorization: Bearer 헤더 첨부
      ↓
응답 401
 └─ 응답 인터셉터
      ├─ POST /api/v1/auth/reissue (Refresh 쿠키 자동 전송)
      ├─ 성공 → 새 Access 토큰 저장 → 원래 요청 1회 재시도
      └─ 실패 → Access 토큰 삭제, 에러 전달
```

- 로그인·재발급·로그아웃 요청은 401이 나도 재발급하지 않습니다. (로그인 실패도 401이기 때문)
- 여러 요청이 동시에 401을 받아도 재발급은 한 번만 보냅니다. 백엔드가 재발급할 때마다 이전 Refresh 토큰을 폐기(Refresh Rotation)하기 때문입니다.
- `withCredentials: true`로 Refresh 쿠키를 함께 보냅니다.
- `Content-Type`은 공통으로 고정하지 않습니다. 객체는 JSON, `FormData`는 multipart로 axios가 자동 설정합니다.

### 백엔드 응답 형식

```json
{ "status": 200, "code": null, "message": "...", "data": { } }
```

에러도 같은 형식이며 `data`가 없습니다.

## 환경변수 · 프록시

| 파일 | 사용 시점 | `VITE_API_BASE_URL` |
|---|---|---|
| `.env.development` | `npm run dev` | 빈 값 → `/api/...` 상대 경로 요청 |
| `.env.production` | `npm run build` | 배포된 백엔드 주소 |

- 개발 중에는 `vite.config.js`의 프록시가 `/api` 요청을 `http://localhost:8080`으로 전달합니다. 브라우저는 같은 출처로 요청하므로 CORS 문제가 없습니다.
- 프록시는 개발 서버에서만 동작합니다. 배포 환경에서는 nginx 설정 또는 백엔드 CORS 설정이 필요합니다.
- Vite 환경변수는 빌드 결과에 그대로 포함되므로 비밀 값을 넣지 않습니다.
