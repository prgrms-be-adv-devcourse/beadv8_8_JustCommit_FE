import { formatReportDate } from '../../utils/adminFormat';

// 일별 순수익 꺾은선 그래프 (시안 09-3 리포트의 SVG를 그대로 계산해서 그림, 라이브러리 없음)
// 그림 영역: x 40 ~ 1000, y 20(맨 위 눈금) ~ 200(0)
const LEFT = 40;
const RIGHT = 1000;
const TOP = 20;
const BOTTOM = 200;
const UNIT = 10000; // 눈금 단위: 1만 원
const MAX_TICKS = 5;

// 눈금 간격: 1만 · 2만 · 5만 · 10만 ... 중 눈금이 5개 이하가 되는 가장 작은 값
function tickStep(max) {
  const factors = [1, 2, 5];
  for (let scale = UNIT; ; scale *= 10) {
    const step = factors
      .map((factor) => factor * scale)
      .find((value) => Math.ceil(max / value) <= MAX_TICKS);
    if (step) return step;
  }
}

function tickLabel(value) {
  return value === 0 ? '0' : `${value / UNIT}만`;
}

const fixed = (value) => value.toFixed(1);

// points: [{ date: '2026-10-01', value }] 날짜 오름차순. rangeText: aria-label에 넣을 기간
function DailyRevenueChart({ points, rangeText }) {
  const max = Math.max(0, ...points.map((point) => point.value));
  const step = tickStep(max);
  const tickCount = Math.max(1, Math.ceil(max / step));
  const top = step * tickCount;

  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => index * step);
  const yFor = (value) => BOTTOM - (value / top) * (BOTTOM - TOP);
  const xFor = (index) =>
    points.length > 1 ? LEFT + (index * (RIGHT - LEFT)) / (points.length - 1) : LEFT;
  // 날짜가 8개를 넘으면 한 칸씩 건너 표시
  const labelEvery = points.length > 8 ? 2 : 1;

  const coords = points.map((point, index) => ({
    x: xFor(index),
    y: yFor(point.value),
    date: point.date,
  }));

  return (
    <svg
      viewBox="0 0 1040 224"
      className="w-full h-[220px]"
      role="img"
      aria-label={`일별 순수익, ${rangeText}. 아래 표에 같은 숫자가 있어요.`}
    >
      {ticks.map((tick) => {
        const y = yFor(tick);
        return [
          <line key={`l${tick}`} x1="40" x2="1000" y1={fixed(y)} y2={fixed(y)} stroke="#f3f4f6" />,
          <text key={`t${tick}`} x="0" y={fixed(y + 4)} fontSize="11" fill="#9ca3af">
            {tickLabel(tick)}
          </text>,
        ];
      })}
      {coords.length > 0 && (
        <polyline
          fill="none"
          stroke="#0f4c3a"
          strokeWidth="2"
          points={coords.map(({ x, y }) => `${fixed(x)},${fixed(y)}`).join(' ')}
        />
      )}
      {coords.map(({ x, y, date }) => (
        <rect
          key={`p${date}`}
          x={fixed(x - 3)}
          y={fixed(y - 3)}
          width="6"
          height="6"
          fill="#0f4c3a"
        />
      ))}
      {coords.map(({ x, date }, index) =>
        index % labelEvery === 0 ? (
          <text
            key={`d${date}`}
            x={fixed(x)}
            y="220"
            fontSize="11"
            fill="#6b7280"
            textAnchor="middle"
          >
            {formatReportDate(date).short}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export default DailyRevenueChart;
