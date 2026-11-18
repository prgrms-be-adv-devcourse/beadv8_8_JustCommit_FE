import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import usePageTitle from '../../hooks/usePageTitle';
import { changeProductHidden, deleteProduct, getProduct } from '../../api/productApi';
import ErrorPage from '../../components/common/ErrorPage';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import { ACTION_ERROR } from '../../constants/actionError';
import ProductDetailView from './ProductDetailView';

function getActionError(error) {
  return error.response?.data?.message ?? ACTION_ERROR.DEFAULT;
}

function ProductDetail({ productId }) {
  usePageTitle('상품 상세');
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const { addToCart, refreshCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | hidden | notFound | error
  const [selected, setSelected] = useState(0);
  const [isBusy, setIsBusy] = useState(false); // 담기 · 바로 구매 · 숨기기 요청 중 (연속 클릭 방지)
  const [actionError, setActionError] = useState('');
  const [cartAddedOpen, setCartAddedOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(null); // 로그인 안내 문구, null이면 닫힘
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    getProduct(productId)
      .then((response) => {
        if (ignore) return;
        setProduct(response.data.data);
        setLoadState('done');
      })
      .catch((error) => {
        if (ignore) return;
        // 403 PRODUCT_HIDDEN: 판매자가 숨긴 상품을 본인이 아닌 사람이 조회 (삭제된 상품은 404)
        const status = error.response?.status;
        if (error.response?.data?.code === 'PRODUCT_HIDDEN') setLoadState('hidden');
        else if (status === 404) setLoadState('notFound');
        else setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [productId, reloadKey]);

  // Modal의 useEffect가 onClose에 의존하므로 고정
  const closeCartAdded = useCallback(() => setCartAddedOpen(false), []);
  const closeLoginPrompt = useCallback(() => setLoginPrompt(null), []);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);

  // 등록·수정 후엔 메인(backTo), 목록에서 왔으면 뒤로가기(필터 유지), 직접 접속이면 홈
  const backTo = location.state?.backTo?.startsWith('/') ? location.state.backTo : null;
  const goBack = () => {
    if (backTo) navigate(backTo);
    else if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      setLoginPrompt('로그인 후 장바구니에 담을 수 있어요.');
      return;
    }
    if (isBusy) return;

    setIsBusy(true);
    setActionError('');
    try {
      await addToCart(product.productId);
      setCartAddedOpen(true);
    } catch (error) {
      // 백엔드 메시지 예: "이미 추가된 상품입니다.", "구매가 불가능한 상품입니다."
      setActionError(getActionError(error));
    } finally {
      setIsBusy(false);
    }
  };

  // 바로 구매: 주문 API가 장바구니 항목 기준이라, 장바구니에 담은 뒤 그 항목 하나로 주문서 이동
  // TODO: 바로 구매 API가 생기면 교체
  const handleBuy = async () => {
    if (!isLoggedIn) {
      setLoginPrompt('로그인 후 구매할 수 있어요.');
      return;
    }
    if (isBusy) return;

    setIsBusy(true);
    setActionError('');
    try {
      let cartItemId;
      try {
        cartItemId = await addToCart(product.productId);
      } catch (error) {
        // 이미 담은 상품이면 기존 장바구니 항목으로 주문
        const latestCart = await refreshCart().catch(() => null);
        cartItemId = latestCart?.items.find((item) => item.productId === product.productId)?.cartItemId;
        if (!cartItemId) throw error;
      }
      navigate(`/checkout?items=${cartItemId}`);
    } catch (error) {
      setActionError(getActionError(error));
    } finally {
      setIsBusy(false);
    }
  };

  // 내 상품 삭제 (시안 02-2-4 「삭제」). 확인 모달은 시안에 없어 내 상품 목록(MyListingsView)과 같은 모달을 씀
  const handleDelete = async () => {
    setDeleteOpen(false);
    if (isBusy) return;
    setIsBusy(true);
    setActionError('');
    try {
      await deleteProduct(product.productId);
      navigate('/mypage/products', { replace: true });
    } catch (error) {
      setActionError(getActionError(error));
      setIsBusy(false);
    }
  };

  // 내 상품 숨기기 · 숨김 해제 (시안 02-2-4 「숨기기」 · 02-2-5 「숨김 해제」)
  const handleToggleHidden = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setActionError('');
    try {
      await changeProductHidden(product.productId, !product.hidden);
      setProduct((prev) => ({ ...prev, hidden: !prev.hidden }));
    } catch (error) {
      setActionError(getActionError(error));
    } finally {
      setIsBusy(false);
    }
  };

  if (loadState === 'loading') {
    return <main className="flex-1" aria-busy="true" />;
  }
  if (loadState === 'hidden') return <ErrorPage type="PRODUCT_HIDDEN" />;
  if (loadState === 'notFound') return <ErrorPage type="PRODUCT_NOT_FOUND" />;
  if (loadState === 'error') {
    return (
      <ErrorPage
        type="SERVER_ERROR"
        onRetry={() => {
          setLoadState('loading');
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  // 화면 표시용 판단 (실제 수정 권한은 백엔드가 본인 상품인지 검사)
  const isOwner = isLoggedIn && user?.memberId === product.sellerId;

  return (
    <>
      <ProductDetailView
        product={product}
        isOwner={isOwner}
        selected={selected}
        onSelectImage={setSelected}
        onBack={goBack}
        isBusy={isBusy}
        actionError={actionError}
        onBuy={handleBuy}
        onAddToCart={handleAddToCart}
        onToggleHidden={handleToggleHidden}
        onDelete={() => setDeleteOpen(true)}
      />

      {deleteOpen && (
        <Modal
          title="상품을 삭제할까요?"
          onClose={closeDelete}
          footer={
            <>
              <ModalButton onClick={closeDelete}>취소</ModalButton>
              <ModalButton variant="danger" onClick={handleDelete}>
                삭제
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">
            <span className="font-semibold text-[#111827]">{product.title}</span>을(를) 삭제하면 목록에서 사라지고 되돌릴 수
            없어요.
          </p>
        </Modal>
      )}

      {cartAddedOpen && (
        <Modal
          title="장바구니에 담았어요"
          width={400}
          onClose={closeCartAdded}
          footer={
            <>
              <ModalButton fit onClick={closeCartAdded}>
                계속 둘러보기
              </ModalButton>
              <ModalButton variant="primary" fit onClick={() => navigate('/cart')}>
                장바구니 보기
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">장바구니로 이동할까요?</p>
        </Modal>
      )}

      {loginPrompt && (
        <Modal
          title="로그인이 필요해요"
          width={400}
          onClose={closeLoginPrompt}
          footer={
            <>
              <ModalButton onClick={closeLoginPrompt}>취소</ModalButton>
              <ModalButton
                variant="primary"
                fit
                onClick={() => navigate('/login', { state: { from: location.pathname } })}
              >
                로그인하기
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">{`${loginPrompt} 로그인하러 갈까요?`}</p>
        </Modal>
      )}
    </>
  );
}

function ProductDetailPage() {
  const { productId } = useParams();
  // 상품이 바뀌면 key가 달라져 컴포넌트를 새로 만듦
  // → 로딩 상태('loading')와 선택한 사진(0)이 처음 값으로 자동 초기화
  return <ProductDetail key={productId} productId={productId} />;
}

export default ProductDetailPage;
