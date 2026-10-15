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

### CSS Modules

컴포넌트마다 같은 이름의 `.module.css` 파일을 만듭니다.

```
ProductCard.jsx
ProductCard.module.css
```

```jsx
import styles from './ProductCard.module.css';

<div className={styles.card}>...</div>
```

- 클래스 이름이 파일마다 고유하게 바뀌므로 다른 파일과 겹치지 않습니다.
- 클래스 이름은 camelCase로 씁니다. (`styles.primaryButton`)
- 클래스 두 개를 함께 쓸 때

```jsx
<span className={`material-symbols-outlined ${styles.icon}`}>search</span>
```

### 디자인 토큰 (CSS 변수)

색상·간격·글자 크기·모서리는 `index.css`에 정의된 변수를 사용합니다. Stitch 디자인 값을 그대로 옮긴 것입니다.

```css
.button {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-label-md);
  color: var(--color-on-primary);
  background-color: var(--color-primary-container);
  border-radius: var(--radius-full);
}
```

| 종류 | 변수 예시 |
|---|---|
| 색상 | `--color-primary`, `--color-secondary`, `--color-surface-container-low`, `--color-error` |
| 간격 | `--space-xs` ~ `--space-xl`, `--margin`, `--gutter` |
| 글자 크기 | `--text-headline-xl` ~ `--text-label-sm` (줄 높이는 `--leading-*`) |
| 글꼴 | `--font-headline`, `--font-body` |
| 모서리 | `--radius`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-full` |

- 색상 값(`#012d1d` 등)을 직접 쓰지 않고 변수를 사용합니다. 디자인이 바뀌면 `index.css`만 고치면 됩니다.
- Stitch 코드는 Tailwind 클래스로 되어 있습니다. 그대로 쓰지 않고, 클래스가 뜻하는 값을 CSS로 옮겨 씁니다. (예: `px-4 py-2 rounded-full` → `padding: var(--space-sm) var(--space-md); border-radius: var(--radius-full);`)

### 공통 컴포넌트

버튼, 입력창처럼 여러 페이지에서 반복되는 요소는 `src/components/common/`에 만들어 함께 씁니다. 긴 스타일은 공통 컴포넌트 안에 두고, 페이지 코드는 짧게 유지합니다.

```jsx
<Button type="submit">로그인</Button>
```

### 아이콘

Material Symbols를 사용합니다. (`index.html`에서 불러옴)

```jsx
<span className="material-symbols-outlined">shopping_bag</span>
```

아이콘 이름은 Google Fonts의 Material Symbols에서 찾을 수 있습니다.

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
