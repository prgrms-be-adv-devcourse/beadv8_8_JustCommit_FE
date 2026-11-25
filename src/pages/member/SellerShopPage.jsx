import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getSeller } from '../../api/memberApi';
import { getSellerProducts, getSellerSoldOutProducts } from '../../api/productApi';
import { getSellerReviewSummary } from '../../api/reviewApi';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import SellerShopView from './SellerShopView';
import { toShopSeller } from './sellerShopFormat';
import { EMPTY } from '../../constants/emptyText';

const SOLD_PAGE_SIZE = 6;

function getSoldErrorMessage(error) {
  return error.response?.data?.message ?? '판매 완료 상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
}

// 판매자 상점 B안 (시안 02-3-1 · 02-3-2 · 02-3-4). 누구나 봄 (로그인 필요 없음)
function SellerShop({ sellerId }) {
  const location = useLocation();
  const { user } = useAuth();
  const [data, setData] = useState(null); // { seller, products, productTotal, reviewSummary }
  const [loadState, setLoadState] = useState('loading'); // loading | done | notFound | error
  // 판매 완료 줄: SOLD_OUT이면서 숨기지 않은 상품만 (BE docs/services/product.md 「상태」 · 「숨김」)
  const [soldProducts, setSoldProducts] = useState([]);
  const [soldTotal, setSoldTotal] = useState(null); // null = 모름 (API 없음 → 「-」)
  const [soldPage, setSoldPage] = useState(0);
  const [isLoadingMoreSold, setIsLoadingMoreSold] = useState(false);
  const [soldErrorMessage, setSoldErrorMessage] = useState('');
  usePageTitle(data ? `${data.seller.nickname}님의 상점` : '판매자 상점');

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getSeller(sellerId),
      getSellerProducts(sellerId),
      getSellerSoldOutProducts(sellerId, { page: 0, size: SOLD_PAGE_SIZE }),
      // 리뷰 집계를 못 불러와도 상점은 보여 줌 (별점 · 리뷰 수만 「-」)
      getSellerReviewSummary(sellerId).catch(() => null),
    ])
      .then(([seller, products, sold, summary]) => {
        if (ignore) return;
        setData({
          seller: seller.data.data,
          products: products.data.content,
          productTotal: products.data.totalElements,
          reviewSummary: summary?.data.data ?? null,
        });
        setSoldProducts(sold.data.content);
        setSoldTotal(sold.data.totalElements);
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

  const handleLoadMoreSold = async () => {
    setIsLoadingMoreSold(true);
    setSoldErrorMessage('');
    try {
      const response = await getSellerSoldOutProducts(sellerId, { page: soldPage + 1, size: SOLD_PAGE_SIZE });
      setSoldProducts((prev) => [...prev, ...response.data.content]);
      setSoldPage(soldPage + 1);
      setSoldTotal(response.data.totalElements);
    } catch (error) {
      setSoldErrorMessage(getSoldErrorMessage(error));
    } finally {
      setIsLoadingMoreSold(false);
    }
  };

  if (loadState === 'notFound') return <ErrorPage type="NOT_FOUND" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;
  if (loadState === 'loading') return <main className="flex-1" />;

  const { seller, products, productTotal, reviewSummary } = data;
  // 상품 상세에서 왔으면 그 상품으로, 아니면(마이페이지 「내 상점 보기」 · 직접 접속) 홈으로
  const fromProductId = location.state?.fromProductId;

  return (
    <SellerShopView
      seller={toShopSeller(seller, reviewSummary, soldTotal)}
      products={products}
      productCountText={productTotal == null ? EMPTY : `${productTotal.toLocaleString('ko-KR')}개`}
      // 판매 완료 0개면 줄을 통째로 숨김. 개수를 모르면(API 없음) 줄은 보이고 개수는 「-」
      sold={
        soldTotal === 0
          ? null
          : {
              products: soldProducts,
              countText: soldTotal == null ? EMPTY : `${soldTotal.toLocaleString('ko-KR')}개`,
              hasMore: soldTotal != null && soldProducts.length < soldTotal,
              isLoadingMore: isLoadingMoreSold,
              onLoadMore: handleLoadMoreSold,
              errorMessage: soldErrorMessage,
            }
      }
      backTo={fromProductId ? `/products/${fromProductId}` : '/'}
      // 내 상점이면 소개글을 고치러 갈 수 있게 (판매자 번호 = 회원 번호)
      introEditTo={user?.memberId === Number(sellerId) ? '/mypage/account/intro' : null}
    />
  );
}

function SellerShopPage() {
  const { sellerId } = useParams();
  // 판매자가 바뀌면 상태를 새로 시작
  return <SellerShop key={sellerId} sellerId={sellerId} />;
}

export default SellerShopPage;
