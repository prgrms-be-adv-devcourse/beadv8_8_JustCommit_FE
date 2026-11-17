import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getSeller } from '../../api/memberApi';
import { getSellerProducts } from '../../api/productApi';
import { getSellerReviews } from '../../api/reviewApi';
import ErrorPage from '../../components/common/ErrorPage';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/format';
import SellerShopView from './SellerShopView';

const RECENT_REVIEW_SIZE = 3;

// 리뷰 응답 → 최근 리뷰 한 줄 (구매 상품이 여러 개면 "첫 상품 외 N건")
function toRecentReview(review) {
  const names = review.productNames ?? [];
  return {
    key: review.reviewId,
    nickname: review.reviewerNickname ?? null, // null = 탈퇴한 회원
    rating: review.rating,
    dateText: formatDate(review.createdAt),
    productText: names.length > 1 ? `${names[0]} 외 ${names.length - 1}건` : (names[0] ?? ''),
    content: review.content,
  };
}

// 판매자 상점 B안 (시안 02-4-4 · 02-4-5). 누구나 봄 (로그인 필요 없음)
function SellerShop({ sellerId }) {
  const location = useLocation();
  const [data, setData] = useState(null); // { seller, products, productTotal, reviews }
  const [loadState, setLoadState] = useState('loading'); // loading | done | notFound | error
  usePageTitle(data ? `${data.seller.nickname}님의 상점` : '판매자 상점');

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getSeller(sellerId),
      getSellerProducts(sellerId, { onSale: true }),
      getSellerReviews(sellerId, { size: RECENT_REVIEW_SIZE }),
    ])
      .then(([seller, products, reviews]) => {
        if (ignore) return;
        setData({
          seller: seller.data.data,
          products: products.data.content,
          productTotal: products.data.totalElements,
          reviews: reviews.data,
        });
        setLoadState('done');
      })
      .catch((error) => {
        if (ignore) return;
        // 404 SELLER_NOT_FOUND: 없는 판매자 (판매자 등록을 안 한 회원 포함)
        setLoadState(error.response?.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [sellerId]);

  if (loadState === 'notFound') return <ErrorPage type="NOT_FOUND" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;
  if (loadState === 'loading') return <main className="flex-1" />;

  const { seller, products, productTotal, reviews } = data;
  // 상품 상세에서 왔으면 그 상품으로, 아니면(마이페이지 「내 상점 보기」 · 직접 접속) 홈으로
  const fromProductId = location.state?.fromProductId;

  return (
    <SellerShopView
      seller={{
        nickname: seller.nickname,
        // TODO: 평균 별점 · 리뷰 수 API 없음 (리뷰 API docs ⬜)
        ratingText: reviews.averageRating == null ? '{평균 별점}' : reviews.averageRating.toFixed(1),
        reviewCountText: reviews.totalCount == null ? '{리뷰 수}' : reviews.totalCount.toLocaleString('ko-KR'),
        // TODO: 판매 완료 수가 GET sellers/{sellerId} 응답에 없음 → soldCount 필드 요청
        soldCountText: seller.soldCount == null ? '{판매 완료 수}' : seller.soldCount.toLocaleString('ko-KR'),
      }}
      products={products}
      productCountText={`${productTotal.toLocaleString('ko-KR')}개`}
      reviews={reviews.content.slice(0, RECENT_REVIEW_SIZE).map(toRecentReview)}
      backTo={fromProductId ? `/products/${fromProductId}` : '/'}
      reviewsTo={null}
    />
  );
}

function SellerShopPage() {
  const { sellerId } = useParams();
  // 판매자가 바뀌면 상태를 새로 시작
  return <SellerShop key={sellerId} sellerId={sellerId} />;
}

export default SellerShopPage;
