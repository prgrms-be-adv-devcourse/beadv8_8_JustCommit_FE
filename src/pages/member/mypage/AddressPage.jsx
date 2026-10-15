import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import { addAddress, getAddresses, setDefaultAddress } from '../../../api/memberApi';
import { formatPhone } from '../../../utils/format';
import AddressModal from './AddressModal';
import styles from './AddressPage.module.css';

// 응답 필드 이름이 isDefault / default 중 어느 쪽이어도 동작하도록
function isDefaultAddress(address) {
  return address.isDefault ?? address.default ?? false;
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

function AddressPage() {
  usePageTitle('배송지 관리');
  const { isLoggedIn, isInitializing } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [changingId, setChangingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;

    getAddresses()
      .then((response) => {
        if (!ignore) setAddresses(response.data.data);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, '배송지를 불러오지 못했습니다.'));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  const refreshAddresses = useCallback(async () => {
    const response = await getAddresses();
    setAddresses(response.data.data);
  }, []);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // 모달에서 호출: 실패하면 에러를 던져서 모달이 메시지를 보여 줌
  const handleAddAddress = async (form) => {
    await addAddress(form);
    await refreshAddresses();
    setIsModalOpen(false);
  };

  const handleSetDefault = async (addressId) => {
    setChangingId(addressId);
    setActionError('');
    try {
      await setDefaultAddress(addressId);
      await refreshAddresses();
    } catch (error) {
      setActionError(getErrorMessage(error, '기본 배송지를 변경하지 못했습니다.'));
    } finally {
      setChangingId(null);
    }
  };

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const sortedAddresses = [...addresses].sort(
    (a, b) => Number(isDefaultAddress(b)) - Number(isDefaultAddress(a)),
  );

  return (
    <div className={styles.page}>
      <Link to="/mypage" className={styles.backLink}>
        <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        마이페이지
      </Link>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>배송지 관리</h1>
        <button type="button" className={styles.addButton} onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          배송지 추가
        </button>
      </div>

      {isLoading && <p className={styles.status}>배송지를 불러오는 중...</p>}
      {loadError && <p className={styles.status} role="alert">{loadError}</p>}
      {actionError && <p className={styles.error} role="alert">{actionError}</p>}

      {!isLoading && !loadError && sortedAddresses.length === 0 && (
        <p className={styles.status}>등록된 배송지가 없습니다.</p>
      )}

      {sortedAddresses.length > 0 && (
        <ul className={styles.list}>
          {sortedAddresses.map((address) => {
            const isDefault = isDefaultAddress(address);
            return (
              <li key={address.addressId} className={`${styles.item} ${isDefault ? styles.itemDefault : ''}`}>
                <div className={styles.itemBody}>
                  <div className={styles.itemHead}>
                    <strong className={styles.itemName}>
                      {address.recipientName}
                      {address.addressName && <span className={styles.itemAlias}> ({address.addressName})</span>}
                    </strong>
                    {isDefault && <span className={styles.defaultBadge}>기본</span>}
                  </div>
                  <span className={styles.itemPhone}>{formatPhone(address.recipientPhone)}</span>
                  <span className={styles.itemAddress}>
                    ({address.zipcode}) {address.address1} {address.address2}
                  </span>
                </div>
                {!isDefault && (
                  <button
                    type="button"
                    className={styles.defaultButton}
                    onClick={() => handleSetDefault(address.addressId)}
                    disabled={changingId !== null}
                  >
                    {changingId === address.addressId ? '변경 중...' : '기본으로 설정'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isModalOpen && <AddressModal onSubmit={handleAddAddress} onClose={closeModal} />}
    </div>
  );
}

export default AddressPage;
