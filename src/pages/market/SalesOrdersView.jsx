import { Link } from 'react-router-dom';
import { CountTabs } from '../../components/seller/SellerParts';
import PageBackLink from '../../components/common/PageBackLink';
import InfoNote from '../../components/common/InfoNote';
import { SALES_ORDER_STATUS } from '../../constants/seller';

const ACTION = {
  ACCEPT: {
    label: '수락 · 거절',
    className: 'h-9 w-[88px] flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-semibold',
  },
  RETURN: {
    label: '반품 확인',
    className:
      'h-9 w-[88px] flex items-center justify-center bg-white border border-[#0f4c3a] text-sm font-semibold text-[#0f4c3a]',
  },
  DETAIL: {
    label: '상세 보기',
    className:
      'h-9 w-[88px] flex items-center justify-center bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827]',
  },
};

// 시안 08-5-1 판매 주문 (화면만, 데이터는 props)
// rows = [{ sellerOrderId, createdAtText, orderNo, thumbnailUrl, itemName, amountText,
//           statusKey, statusLabel, statusNote, action: ACCEPT | RETURN | DETAIL }]
function SalesOrdersView({ tabs, tab, onTabChange, rows }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[1160px] mx-auto space-y-6">
        <PageBackLink to="/mypage" label="마이페이지" />
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">판매 주문</h1>
        </div>
        <CountTabs tabs={tabs} value={tab} onChange={onTabChange} />
        {rows.length > 0 ? (
          <table className="w-full bg-white border border-[#e5e7eb] text-sm">
            <thead>
              <tr className="bg-[#f9fafb] text-[13px] text-[#4b5563] text-left">
                <th className="px-5 py-3 font-semibold">주문일 · 주문번호</th>
                <th className="px-5 py-3 font-semibold">상품</th>
                <th className="px-5 py-3 font-semibold">판매 금액</th>
                <th className="px-5 py-3 font-semibold w-[240px]">상태</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = SALES_ORDER_STATUS[row.statusKey];
                const action = ACTION[row.action];
                return (
                  <tr key={row.sellerOrderId} className="border-t border-[#e5e7eb] align-middle">
                    <td className="px-5 py-4">
                      <p className="text-[#111827] tabular-nums">{row.createdAtText}</p>
                      <p className="text-xs text-[#6b7280] tabular-nums">{row.orderNo}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 shrink-0 border border-[#e5e7eb] overflow-hidden">
                          <img src={row.thumbnailUrl} alt={row.itemName} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[#111827]">{row.itemName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#111827] tabular-nums">{row.amountText}</td>
                    <td className="px-5 py-4 space-y-1">
                      <span className={`h-7 px-2.5 inline-flex items-center text-xs font-semibold ${status.tone}`}>
                        {row.statusLabel ?? status.label}
                      </span>
                      {row.statusNote && <p className={`text-xs ${status.noteTone}`}>{row.statusNote}</p>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/orders/seller/${row.sellerOrderId}`} className={action.className}>
                        {action.label}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">{tab ? '이 상태의 주문이 없어요' : '아직 들어온 주문이 없어요'}</h2>
            <p className="text-[15px] text-[#4b5563]">
              {tab ? '다른 탭에서 주문을 확인해 보세요.' : '상품이 판매되면 여기에 주문이 표시돼요.'}
            </p>
          </div>
        )}
        <InfoNote>결제가 끝난 주문은 판매자가 24시간 안에 수락해야 택배가 접수돼요. 일부 상품만 거절할 수도 있어요.</InfoNote>
      </div>
    </main>
  );
}

export default SalesOrdersView;
