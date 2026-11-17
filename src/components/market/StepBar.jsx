// 단계 바 (시안 03-5 주문 상세 · 04-4 반품 단계)
// steps: [{ label, time }] — time은 보여 줄 단계에만 넣습니다 (시안: 일부 단계에만 시각 표시)
// current: 지금 단계 번호(0부터). 그 앞은 완료, 뒤는 대기로 그립니다.
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function labelClass(reached, isCurrent) {
  if (isCurrent) return 'text-xs text-[#0f4c3a] font-bold';
  return reached ? 'text-xs text-[#4b5563] font-medium' : 'text-xs text-[#9ca3af] font-medium';
}

function StepBar({ steps, current, label }) {
  return (
    <ol aria-label={label} className="px-5 pt-5 pb-4 flex border-b border-[#f3f4f6]">
      {steps.map((step, index) => {
        const reached = index <= current;
        const isCurrent = index === current;
        return (
          <li
            key={step.label}
            aria-current={isCurrent ? 'step' : undefined}
            className="relative flex-1 flex flex-col items-center gap-1.5"
          >
            {index > 0 && (
              <span
                className={`absolute top-[13px] right-1/2 w-full h-0.5 -z-0 ${reached ? 'bg-[#0f4c3a]' : 'bg-[#e5e7eb]'}`}
                style={{ marginRight: '14px' }}
              />
            )}
            <span className="relative z-10">
              {reached ? (
                <span
                  className={`w-7 h-7 flex items-center justify-center bg-[#0f4c3a] text-white${isCurrent ? ' ring-2 ring-offset-2 ring-[#0f4c3a]' : ''}`}
                >
                  <CheckIcon />
                </span>
              ) : (
                <span className="block w-7 h-7 bg-white border-2 border-[#d1d5db]" />
              )}
            </span>
            <span className={labelClass(reached, isCurrent)}>{step.label}</span>
            <span className="text-[11px] text-[#6b7280] tabular-nums h-4">{step.time}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default StepBar;
