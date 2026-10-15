# 디자인 규칙

기준 디자인은 Stitch 시안이고, 토큰은 `src/index.css`의 `:root`에 있다. 색·글꼴 크기·간격·모서리는 토큰 이름으로만 쓴다.

## 토큰 쓰는 법

| 용도 | 토큰 |
|---|---|
| 주요 버튼, 링크, 로고 글자 | `--color-primary` / 글자 `--color-on-primary` |
| 보조 강조(배지, 선택된 칩) | `--color-secondary-container` / 글자 `--color-on-secondary-container` |
| 페이지 배경 | `--color-background` |
| 카드 배경 | `--color-surface-container-lowest` |
| 테두리, 구분선 | `--color-outline-variant` |
| 보조 글자 | `--color-on-surface-variant` |
| 에러 문구, 잔액 부족 | `--color-error` / 배경 `--color-error-container` |
| 제목 / 본문 글꼴 | `--font-headline` / `--font-body` |
| 크기 | `--text-*`와 같은 이름의 `--leading-*`를 짝으로 쓴다 |
| 간격 | `--space-*`, 페이지 여백 `--margin`, 그리드 간격 `--gutter` |
| 모서리 | 버튼·입력 `--radius-lg`, 카드 `--radius-xl`, 칩·배지 `--radius-full` |

필요한 토큰이 없으면 `src/index.css`에 추가하고, 컴포넌트에는 새 토큰 이름만 쓴다.

## 레이아웃

- 본문 최대 너비 1200px, 가운데 정렬(`Layout`이 처리). 헤더는 상단 고정 80px.
- 상품 카드 그리드: 데스크톱 4열, 태블릿 2열, 모바일 1열. 기준 너비 1024px, 640px.
- 모바일 화면(360px)에서 가로 스크롤이 생기지 않아야 한다.

## 공통 컴포넌트 (`src/components/common/`)

두 번째로 필요해지는 시점에 만든다. 이름은 아래를 쓴다.

| 컴포넌트 | 용도 |
|---|---|
| `Button` | primary / secondary / text, `disabled`, `loading` |
| `StatusBadge` | 상태 코드를 받아 [domain.md](domain.md)의 표시 이름과 색으로 표시 |
| `Price` | 금액을 `12,000원` 형식으로. 음수·양수 색 옵션 |
| `EmptyState` | 빈 목록 안내 + 이동 버튼 |
| `LoadMore` | "더 불러오기" 페이지네이션 |
| `Modal` | 배송지 추가 등 |
| `ProductCard` | 메인, 내 판매 목록 |

## 아이콘과 글꼴

- 아이콘은 `index.html`에서 불러온 Material Symbols Outlined를 쓴다: `<span className="material-symbols-outlined">shopping_cart</span>`. 이미지 아이콘을 따로 만들지 않는다.
- Inter, Plus Jakarta Sans에는 한글이 없어서 한글은 시스템 글꼴로 보인다. 한글 글꼴(예: Pretendard)을 넣을지는 팀 결정 사항이다.

## 로고

- 지금 `public/favicon.svg`와 헤더의 `replant` 글자는 임시다.
- 확정 로고는 하트 + 새싹 심볼(딥 그린, 흰색, 앱 아이콘 버전)이다. 파일이 레포에 들어오면 `public/logo/`에 두고 이 섹션을 갱신한다.

## 이미지

- 상품 사진은 정사각형으로 잘라 보여 준다(`object-fit: cover`, `aspect-ratio: 1`).
- 모든 `<img>`에 `alt`를 넣는다(상품명).
