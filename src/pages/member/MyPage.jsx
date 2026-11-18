import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useNotification from '../../hooks/useNotification';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { getMyInfo } from '../../api/memberApi';
import { formatPrice } from '../../utils/format';
import MyPageView from './MyPageView';

// 2026-10-15T16:22:48 → 2026.10.15
function formatJoinDate(value) {
  return value ? value.slice(0, 10).replaceAll('-', '.') : '';
}

function MyPage() {
  usePageTitle('마이페이지');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const { balance } = useWallet(); // null = 조회 실패 또는 로딩 중
  const { unreadCount } = useNotification();

  const [myInfo, setMyInfo] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;

    getMyInfo()
      .then((response) => {
        if (!ignore) setMyInfo(response.data.data);
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.response?.data?.message ?? '내 정보를 불러오지 못했습니다.');
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/mypage' }} />;
  if (loadError || !myInfo) {
    return (
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-8 pb-16">
        <p className="max-w-[880px] mx-auto text-sm text-[#6b7280]" role={loadError ? 'alert' : undefined}>
          {loadError || '내 정보를 불러오는 중...'}
        </p>
      </main>
    );
  }

  return (
    <MyPageView
      profile={{
        nickname: myInfo.nickname,
        email: myInfo.email,
        joinedAt: formatJoinDate(myInfo.createdAt),
        isSeller: myInfo.role === 'SELLER',
      }}
      balanceText={balance === null ? '-' : formatPrice(balance)}
      counts={{
        // TODO: 쓸 수 있는 리뷰 수 API 없음 (리뷰 API docs ⬜)
        reviews: '{리뷰 수}',
        notifications: unreadCount,
        // TODO: 수락 대기 판매 주문 수 API 없음
        salesOrders: '{수락 대기 수}',
      }}
      // 판매자 상점 B안 (02-4-1). sellerId = memberId (BE SellerProfileService)
      links={{ shop: `/sellers/${user.memberId}` }}
    />
  );
}

export default MyPage;
