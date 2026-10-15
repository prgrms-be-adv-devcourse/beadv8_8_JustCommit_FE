import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { addAddress, getAddresses, getMyInfo, setDefaultAddress } from '../../api/memberApi';
import { BANKS } from '../../constants/banks';
import { formatPhone } from '../../utils/format';
import AddressForm from './mypage/AddressForm';
import styles from './MyPage.module.css';

const ROLE_LABEL = { MEMBER: '일반 회원', SELLER: '판매자', ADMIN: '관리자' };
const PROVIDER_LABEL = { LOCAL: '이메일 가입', KAKAO: '카카오 가입' };

// 응답 필드 이름이 isDefault / default 중 어느 쪽이어도 동작하도록
function isDefaultAddress(address) {
  return address.isDefault ?? address.default ?? false;
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

function MyPage() {
  usePageTitle('마이페이지');
  const { isLoggedIn, isInitializing } = useAuth();

  const [myInfo, setMyInfo] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [changingId, setChangingId] = useState(null);

  // 처음 들어올 때 내 정보와 배송지 목록을 동시에 조회
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;

    async function load() {
      try {
        const [infoResponse, addressResponse] = await Promise.all([getMyInfo(), getAddresses()]);
        if (ignore) return;
        setMyInfo(infoResponse.data.data);
        setAddresses(addressResponse.data.data);
      } catch (error) {
        if (!ignore) setLoadError(getErrorMessage(error, '내 정보를 불러오지 못했습니다.'));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  const refreshAddresses = useCallback(async () => {
    const response = await getAddresses();
    setAddresses(response.data.data);
  }, []);

  const handleAddAddress = async (form) => {
    await addAddress(form);
    await refreshAddresses();
    setIsAdding(false);
  };

  const handleSetDefault = async (addressId) => {
    setChangingId(addressId);
    setAddressError('');

    try {
      await setDefaultAddress(addressId);
      await refreshAddresses();
    } catch (error) {
      setAddressError(getErrorMessage(error, '기본 배송지를 변경하지 못했습니다.'));
    } finally {
      setChangingId(null);
    }
  };

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (isLoading) return <p className={styles.status}>내 정보를 불러오는 중...</p>;
  if (loadError) {
    return (
      <p className={styles.status} role="alert">
        {loadError}
      </p>
    );
  }

  const isSeller = myInfo.role === 'SELLER';
  const bankName = BANKS.find((bank) => bank.code === myInfo.account?.bankCode)?.name;
  const sortedAddresses = [...addresses].sort(
    (a, b) => Number(isDefaultAddress(b)) - Number(isDefaultAddress(a)),
  );

  return (
    <div className={styles.page}>
      {/* 왼쪽: 프로필 */}
      <aside className={`${styles.card} ${styles.profile}`}>
        <span className={styles.avatar} aria-hidden="true">
          {myInfo.nickname.slice(0, 1)}
        </span>
        <h1 className={styles.nickname}>{myInfo.nickname}님</h1>
        <p className={styles.email}>{myInfo.email}</p>
        <span className={`${styles.roleBadge} ${isSeller ? styles.roleSeller : ''}`}>
          {isSeller && <span className="material-symbols-outlined">storefront</span>}
          {ROLE_LABEL[myInfo.role] ?? myInfo.role}
        </span>

        {isSeller ? (
          <Link to="/products/new" className={styles.profileAction}>
            <span className="material-symbols-outlined">add_circle</span>
            식물 판매하기
          </Link>
        ) : (
          <Link to="/seller/register" className={styles.profileAction}>
            <span className="material-symbols-outlined">storefront</span>
            판매자 등록하기
          </Link>
        )}
      </aside>

      <div className={styles.sections}>
        {/* 내 정보 */}
        <section className={styles.card} aria-labelledby="info-title">
          <div className={styles.sectionHeader}>
            <h2 id="info-title" className={styles.sectionTitle}>
              <span className="material-symbols-outlined">person</span>
              내 정보
            </h2>
          </div>
          <dl className={styles.infoList}>
            <dt>이메일</dt>
            <dd>{myInfo.email}</dd>
            <dt>닉네임</dt>
            <dd>{myInfo.nickname}</dd>
            <dt>휴대폰 번호</dt>
            <dd>{formatPhone(myInfo.phone)}</dd>
            <dt>가입 방식</dt>
            <dd>{PROVIDER_LABEL[myInfo.provider] ?? myInfo.provider}</dd>
          </dl>
        </section>

        {/* 정산·환급 계좌 */}
        <section className={styles.card} aria-labelledby="account-title">
          <div className={styles.sectionHeader}>
            <h2 id="account-title" className={styles.sectionTitle}>
              <span className="material-symbols-outlined">account_balance</span>
              정산·환급 계좌
            </h2>
          </div>
          {myInfo.account ? (
            <dl className={styles.infoList}>
              <dt>은행</dt>
              <dd>{bankName ?? myInfo.account.bankCode}</dd>
              <dt>계좌번호</dt>
              <dd>{myInfo.account.maskedAccountNo}</dd>
              <dt>예금주</dt>
              <dd>{myInfo.account.accountHolder}</dd>
            </dl>
          ) : (
            <p className={styles.empty}>등록된 계좌가 없습니다.</p>
          )}
          <p className={styles.notice}>예치금 환불과 판매 대금 정산에 사용되는 계좌입니다.</p>
        </section>

        {/* 배송지 관리 */}
        <section className={styles.card} aria-labelledby="address-title">
          <div className={styles.sectionHeader}>
            <h2 id="address-title" className={styles.sectionTitle}>
              <span className="material-symbols-outlined">local_shipping</span>
              배송지 관리
            </h2>
            {!isAdding && (
              <button type="button" className={styles.smallButton} onClick={() => setIsAdding(true)}>
                <span className="material-symbols-outlined">add</span>
                배송지 추가
              </button>
            )}
          </div>

          {addressError && (
            <p className={styles.error} role="alert">
              {addressError}
            </p>
          )}

          {sortedAddresses.length === 0 ? (
            <p className={styles.empty}>등록된 배송지가 없습니다.</p>
          ) : (
            <ul className={styles.addressList}>
              {sortedAddresses.map((address) => {
                const isDefault = isDefaultAddress(address);
                return (
                  <li
                    key={address.addressId}
                    className={`${styles.addressItem} ${isDefault ? styles.addressDefault : ''}`}
                  >
                    <div>
                      <div className={styles.addressHead}>
                        <span className={styles.addressName}>
                          {address.addressName || address.recipientName}
                        </span>
                        {isDefault && <span className={styles.defaultBadge}>기본 배송지</span>}
                      </div>
                      <p className={styles.addressText}>
                        {address.recipientName} · {formatPhone(address.recipientPhone)}
                      </p>
                      <p className={styles.addressText}>
                        ({address.zipcode}) {address.address1} {address.address2}
                      </p>
                    </div>
                    {!isDefault && (
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => handleSetDefault(address.addressId)}
                        disabled={changingId !== null}
                      >
                        {changingId === address.addressId ? '변경 중...' : '기본 배송지로 설정'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {isAdding && (
            <AddressForm onSubmit={handleAddAddress} onCancel={() => setIsAdding(false)} />
          )}
        </section>
      </div>
    </div>
  );
}

export default MyPage;
