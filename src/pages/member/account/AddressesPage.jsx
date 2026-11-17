import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { addAddress, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatPhone } from '../../../utils/format';
import AddressModal from '../mypage/AddressModal';
import AccountLayout from './AccountLayout';
import AddressDeleteModal from './AddressDeleteModal';
import AddressesView from './AddressesView';

const MAX_ADDRESSES = 4; // 회원당 최대 4개 (BE docs/services/member.md 「정책」 배송지)

// 응답 필드 이름이 isDefault / default 중 어느 쪽이어도 동작하도록
function isDefaultAddress(address) {
  return address.isDefault ?? address.default ?? false;
}

function errorMessage(error) {
  return error.response?.data?.message ?? ACTION_ERROR.DEFAULT;
}

function toViewAddress(address) {
  return {
    ...address,
    isDefault: isDefaultAddress(address),
    phoneText: formatPhone(address.recipientPhone),
    // 삭제 확인 모달(06-5-11): 「배송지 이름 · 주소」 한 줄
    addressLine: [address.addressName, [address.address1, address.address2].filter(Boolean).join(', ')]
      .filter(Boolean)
      .join(' · '),
    addressText: `(${address.zipcode}) ${[address.address1, address.address2].filter(Boolean).join(', ')}`,
  };
}

function AddressesPage() {
  usePageTitle('배송지 관리');
  const { isLoggedIn, isInitializing } = useAuth();

  const [addresses, setAddresses] = useState(null); // null = 로딩 중
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null); // null | { initial: 배송지 | null }
  const [deleteTarget, setDeleteTarget] = useState(null); // 삭제 확인 모달에 띄운 배송지
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getAddresses()
      .then((response) => {
        if (!ignore) setAddresses(response.data.data);
      })
      .catch((error) => {
        if (!ignore) setLoadError(errorMessage(error));
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  const refresh = useCallback(async () => {
    const response = await getAddresses();
    setAddresses(response.data.data);
  }, []);

  const closeModal = useCallback(() => setModal(null), []);
  const closeDelete = useCallback(() => {
    setDeleteTarget(null);
    setDeleteError('');
  }, []);

  // 모달에서 호출: 실패하면 에러를 던져서 모달이 메시지를 보여 줌
  const handleSubmit = async (form) => {
    if (modal?.initial) {
      await updateAddress(modal.initial.addressId, form);
    } else {
      await addAddress(form);
    }
    await refresh();
    setModal(null);
  };

  // 버튼 하나 누르는 동작 (기본 설정 · 삭제) 공통 처리
  const runAction = async (addressId, action) => {
    setBusyId(addressId);
    setActionError('');
    try {
      await action();
      await refresh();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  // 삭제 확인 모달의 「삭제」: 실패하면 모달 안에 메시지
  const runDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAddress(deleteTarget.addressId);
      await refresh();
      closeDelete();
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/mypage/addresses' }} />;
  if (loadError || !addresses) {
    return (
      <AccountLayout active="addresses" wide>
        <p className="text-sm text-[#6b7280]" role={loadError ? 'alert' : undefined}>
          {loadError || '배송지를 불러오는 중...'}
        </p>
      </AccountLayout>
    );
  }

  const viewAddresses = addresses
    .map(toViewAddress)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <>
      <AddressesView
        addresses={viewAddresses}
        maxCount={MAX_ADDRESSES}
        onAdd={() => setModal({ initial: null })}
        onEdit={(address) => setModal({ initial: address })}
        onDelete={setDeleteTarget}
        onSetDefault={(address) => runAction(address.addressId, () => setDefaultAddress(address.addressId))}
        busyId={busyId}
        actionError={actionError}
      />
      {deleteTarget && (
        <AddressDeleteModal
          address={deleteTarget}
          deleting={deleting}
          error={deleteError}
          onClose={closeDelete}
          onConfirm={runDelete}
        />
      )}
      {modal && <AddressModal initial={modal.initial} onSubmit={handleSubmit} onClose={closeModal} />}
    </>
  );
}

export default AddressesPage;
