# 개발 규칙

## 페이지 추가

1. `src/pages/{모듈}/XxxPage.jsx` 생성

```jsx
import usePageTitle from '../../hooks/usePageTitle';

function ProductListPage() {
  usePageTitle('상품 목록');
  return <h1>상품 목록</h1>;
}

export default ProductListPage;
```

2. `src/App.jsx`의 `Layout` Route 안에 한 줄 추가

```jsx
<Route path="/products" element={<ProductListPage />} />
```

- 파일 이름과 컴포넌트 이름은 같게, 대문자로 시작합니다. (`ProductListPage.jsx` → `ProductListPage`)
- 페이지 파일 이름은 `Page`로 끝냅니다.
- `usePageTitle('제목')`을 호출하면 탭 제목이 `replant - 제목`이 됩니다. 인자 없이 호출하면 기본 제목입니다.

## 스타일

### Tailwind CSS

새 화면은 캔버스 「replant 웹 시안」의 HTML을 Tailwind 클래스 그대로 옮겨 만듭니다. 시안과 같은 Tailwind v3를 쓰므로 클래스가 같으면 화면도 같습니다.

```jsx
<button type="button" className="h-9 w-[88px] bg-[#0f4c3a] text-white text-[14px] font-medium">확인</button>
```

| 규칙 | 내용 |
|---|---|
| 클래스 | 시안 HTML의 `class`를 바꾸지 않고 `className`으로 옮깁니다. 색은 시안처럼 `bg-[#0f4c3a]` 같은 값으로 씁니다 |
| 설정 | `tailwind.config.js`는 시안의 `tailwind.config`와 같게 둡니다 (`replant.forest` 색 하나) |
| 전역 규칙 | `index.css` 맨 위: 모든 요소 Pretendard 글꼴 · 모서리 0px. 원형 배지만 인라인 `border-radius: 9999px !important`로 예외 (`CountBadge` 참고) |
| 글자 조각 | 「닉네임 + 님」처럼 이어지는 글자는 한 문자열로 그립니다 (`` {`${nickname}님`} ``). 조각으로 나누면 글자 폭이 달라져 시안과 어긋납니다 |
| 모달 | 시안은 캔버스용으로 `absolute`지만, 앱에서는 `fixed`로 화면에 고정합니다 (`Modal` 컴포넌트) |
| 없는 값 | 백엔드에 아직 없는 값은 `{넣을값}` 형태의 자리 문구로 둡니다 (예: `{검수 대기 수}`) |
| 확인 | 시안 HTML과 같은 상태로 1440px 화면을 캡처해 픽셀을 비교합니다 |

### 레이아웃

| 컴포넌트 | 쓰는 곳 |
|---|---|
| `Layout designed` | 새 시안 화면. 헤더 · 화면 · 푸터만 쌓고, 화면이 직접 `<main className="flex-1 max-w-[1240px] ...">`을 그립니다 |
| `Layout` | 시안 이전 화면 (CSS Modules). 다시 만들면 `designed`로 옮깁니다 |
| `AdminLayout` | 관리자 화면 (관리자 헤더 + 공통 푸터) |

### 공통 컴포넌트

여러 화면에서 반복되는 요소는 `src/components/common/`에 둡니다.

| 컴포넌트 | 시안 | 내용 |
|---|---|---|
| `Modal` · `ModalButton` | 화면 시안의 모달 (예: 04-1 취소 확인) | 너비 · 위 여백(`top`) · 바닥 버튼. 버튼은 `secondary` · `primary` · `danger`, 기본 88px |
| `ActionErrorBar` · `ActionErrorLine` | 01-1-5 동작 실패 안내 | 토스트 대신 쓰는 빨간 안내 바 · 버튼 아래 한 줄 (문구는 `constants/actionError.js`) |
| `ErrorPage` | 01-1-5 전체 오류 화면 5종 | `NOT_FOUND` · `PRODUCT_NOT_FOUND` · `PRODUCT_HIDDEN` · `FORBIDDEN` · `SERVER_ERROR` |
| `CountBadge` | 01-2-1 헤더 | 장바구니 · 알림 숫자 배지 (0이면 안 보임, 100 이상은 99+) |

### 시안 이전 화면 (CSS Modules)

아직 다시 만들지 않은 화면은 컴포넌트마다 같은 이름의 `.module.css`와 `index.css`의 CSS 변수(`--color-primary` 등)를 씁니다. 새로 만드는 화면에는 쓰지 않고, 다시 만든 화면의 `.module.css`는 지웁니다.

### 아이콘

시안은 아이콘을 인라인 SVG로 그리므로 새 화면도 시안의 `<svg>`를 그대로 씁니다. 시안 이전 화면은 Material Symbols(`index.html`에서 불러옴)를 씁니다.

## API 호출

### client 사용

`axios`를 직접 import하지 않고 `src/api/client.js`를 사용합니다. 토큰 첨부와 401 재발급이 자동으로 처리됩니다.

### API 함수 위치

모듈별로 `src/api/{모듈}Api.js` 파일을 만들고, 페이지에서는 이 함수를 호출합니다.

```js
// src/api/productApi.js
import client from './client';

export function getProducts(params) {
  return client.get('/api/v1/products', { params });
}

export function createProduct(formData) {
  return client.post('/api/v1/products', formData);
}
```

- 실제 API 주소와 요청 형식은 각 모듈 API 명세를 따릅니다. 위 주소는 예시입니다.

### 응답 · 에러 처리

```js
try {
  const response = await getProducts();
  const products = response.data.data;
} catch (error) {
  alert(error.response?.data?.message ?? '요청에 실패했습니다.');
}
```

| 꺼낼 값 | 코드 |
|---|---|
| 성공 데이터 | `response.data.data` |
| 성공 메시지 | `response.data.message` |
| 에러 메시지 | `error.response?.data?.message` |
| 에러 코드 (분기용) | `error.response?.data?.code` |

- 앞의 `response.data`는 axios가 붙이는 이름(응답 본문), 뒤의 `.data`는 백엔드 `ApiResponse`의 필드입니다.
- `?.`는 값이 없을 때 에러 대신 `undefined`를 반환합니다. 네트워크 오류처럼 응답이 아예 없는 경우를 대비합니다.

## 코드 스타일

- 들여쓰기 2칸 (`.editorconfig`)
- Prettier 규칙 (`.prettierrc`): 세미콜론 사용, 작은따옴표, 한 줄 최대 100자
- 저장 시 자동 정렬 설정
  - IntelliJ: Settings → Prettier → **Automatic Prettier configuration** + **Run on save** 체크
  - VS Code: Prettier 확장 설치 + Format On Save 설정
- 전체 파일 한 번에 정리

```bash
npx prettier --write src
```

- ESLint 경고(노란 밑줄)는 커밋 전에 확인합니다. 사용하지 않는 import·변수는 지웁니다.
