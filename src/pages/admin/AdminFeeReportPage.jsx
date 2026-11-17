import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFeeReport } from '../../api/adminApi';
import usePageTitle from '../../hooks/usePageTitle';
import ErrorPage from '../../components/common/ErrorPage';
import { REPORT_PERIODS } from '../../constants/adminReport';
import AdminFeeReportView from './AdminFeeReportView';

const DEFAULT_PERIOD = 'MONTH';

// 일별 내역 CSV (표와 같은 열, 금액 단위: 원)
function buildCsv(report) {
  const header = [
    '날짜',
    '정산 건수',
    '수수료',
    '판매자 부담금',
    '순수익',
    '배송비 수납',
    '배송비 환불',
    '총 입금',
  ];
  const rows = [...report.daily]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((row) => {
      const net = row.fee + row.sellerBurden;
      const deposit = net + row.shippingCollected - row.shippingRefunded;
      return [
        row.date,
        row.settlementCount,
        row.fee,
        row.sellerBurden,
        net,
        row.shippingCollected,
        -row.shippingRefunded,
        deposit,
      ];
    });
  // 엑셀에서 한글이 깨지지 않도록 BOM을 붙임
  return `\uFEFF${[header, ...rows].map((cells) => cells.join(',')).join('\r\n')}`;
}

function downloadCsv(report) {
  const blob = new Blob([buildCsv(report)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `replant-fee-report-${report.from}-${report.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// 09-3-1 · 09-3-2 수수료 · 배송비 리포트 (/admin/reports/fees?period=MONTH|WEEK|TODAY)
function AdminFeeReportPage() {
  usePageTitle('수수료 · 배송비 리포트');
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('period');
  const period = REPORT_PERIODS.some(({ key }) => key === requested) ? requested : DEFAULT_PERIOD;
  const [result, setResult] = useState({ period: null, report: null, status: null });

  useEffect(() => {
    let ignore = false;
    // TODO: 「직접 선택」은 기간 고르기 시안이 없어 아직 조회하지 않음
    if (period === 'CUSTOM') return undefined;
    getFeeReport({ period })
      .then((response) => {
        if (!ignore) setResult({ period, report: response.data.data, status: null });
      })
      .catch((error) => {
        // TODO: BE 리포트 API가 생기기 전에는 실패하므로 자리 문구 화면을 그대로 둠
        if (!ignore) setResult({ period, report: null, status: error.response?.status ?? null });
      });
    return () => {
      ignore = true;
    };
  }, [period]);

  if (result.status === 403) return <ErrorPage type="FORBIDDEN" />;

  const report = result.period === period ? result.report : null;

  return (
    <AdminFeeReportView
      period={period}
      report={report}
      onPeriodChange={(key) => setSearchParams({ period: key })}
      onDownloadCsv={() => report && downloadCsv(report)}
    />
  );
}

export default AdminFeeReportPage;
