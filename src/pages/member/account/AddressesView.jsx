import { ActionErrorLine } from '../../../components/common/ActionError';
import AccountLayout from './AccountLayout';

// 시안 06-5-10 배송지 관리 (4 / 4 가득 참) · 06-5-11 배송지 추가 모달은 AddressModal
// props
//   addresses = [{ addressId, recipientName, addressName, phoneText, addressText, addressLine, isDefault }] (기본 배송지가 맨 위)
//   maxCount(4), onAdd, onEdit(address), onDelete(address), onSetDefault(address), busyId, actionError

const OUTLINE_BUTTON = 'h-9 w-[72px] bg-white border border-[#d1d5db] text-sm font-semibold';

function AddressItem({ address, onEdit, onDelete, onSetDefault, busy }) {
  return (
    <li className={`p-5 border ${address.isDefault ? 'border-2 border-[#0f4c3a]' : 'border-[#e5e7eb]'} space-y-3`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-[#111827]">{address.recipientName}</p>
            {address.addressName && (
              <span className="h-6 px-2 flex items-center bg-[#f3f4f6] text-xs font-semibold text-[#4b5563]">{address.addressName}</span>
            )}
            {address.isDefault && (
              <span className="h-6 px-2 flex items-center bg-[#0f4c3a] text-white text-xs font-semibold">기본 배송지</span>
            )}
          </div>
          <p className="text-sm text-[#4b5563] tabular-nums">{address.phoneText}</p>
          <p className="text-sm text-[#111827]">{address.addressText}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!address.isDefault && (
            <button
              type="button"
              disabled={busy}
              className="h-9 px-3 bg-white border border-[#0f4c3a] text-sm font-semibold text-[#0f4c3a]"
              onClick={() => onSetDefault(address)}
            >
              기본으로 설정
            </button>
          )}
          <button type="button" className={`${OUTLINE_BUTTON} text-[#111827]`} onClick={() => onEdit(address)}>
            수정
          </button>
          {address.isDefault ? (
            <button type="button" disabled className="h-9 w-[72px] bg-[#f3f4f6] text-sm font-semibold text-[#9ca3af] cursor-not-allowed">
              삭제
            </button>
          ) : (
            <button type="button" disabled={busy} className={`${OUTLINE_BUTTON} text-[#b91c1c]`} onClick={() => onDelete(address)}>
              삭제
            </button>
          )}
        </div>
      </div>
      {address.isDefault && (
        <p className="text-[13px] text-[#6b7280]">기본 배송지는 삭제할 수 없어요. 다른 배송지를 기본으로 바꾼 뒤 삭제할 수 있어요.</p>
      )}
    </li>
  );
}

function AddressesView({ addresses, maxCount = 4, onAdd, onEdit, onDelete, onSetDefault, busyId, actionError }) {
  const isFull = addresses.length >= maxCount;
  return (
    <AccountLayout active="addresses" wide>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#111827]">
            배송지 관리{' '}
            <span className="text-base font-semibold text-[#6b7280] tabular-nums">{`${addresses.length} / ${maxCount}`}</span>
          </h2>
          <p className="text-[13px] text-[#6b7280]">
            {isFull
              ? `배송지는 기본 배송지를 포함해 최대 ${maxCount}개까지 등록할 수 있어요. 새로 추가하려면 하나를 삭제해 주세요.`
              : `배송지는 기본 배송지를 포함해 최대 ${maxCount}개까지 등록할 수 있어요.`}
          </p>
        </div>
        {isFull ? (
          <button type="button" disabled className="h-10 w-[120px] bg-[#f3f4f6] text-sm font-semibold text-[#9ca3af] cursor-not-allowed">
            + 배송지 추가
          </button>
        ) : (
          <button type="button" className="h-10 w-[120px] bg-[#0f4c3a] text-white text-sm font-semibold" onClick={onAdd}>
            + 배송지 추가
          </button>
        )}
      </div>
      <ActionErrorLine message={actionError} className="" />
      {addresses.length === 0 ? (
        <p className="text-sm text-[#6b7280]">등록된 배송지가 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <AddressItem
              key={address.addressId}
              address={address}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetDefault={onSetDefault}
              busy={busyId !== null && busyId !== undefined}
            />
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}

export default AddressesView;
