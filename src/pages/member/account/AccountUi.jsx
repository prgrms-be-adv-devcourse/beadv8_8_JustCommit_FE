// 회원 정보 수정 화면들이 같이 쓰는 입력 · 버튼 모양 (시안 06-5 클래스 그대로)

// 카드 제목 (+ 설명)
export function CardTitle({ title, description }) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-xl font-bold text-[#111827]">{title}</h2>
      {description && <p className="text-sm text-[#4b5563]">{description}</p>}
    </div>
  );
}

// 카드 아래 큰 버튼 (막혔을 때 회색)
export function SubmitButton({ disabled, onClick, children, variant = 'primary' }) {
  if (disabled) {
    return (
      <button type="button" disabled className="w-full h-12 bg-[#f3f4f6] text-[#9ca3af] text-base font-bold cursor-not-allowed">
        {children}
      </button>
    );
  }
  const color = variant === 'danger' ? 'bg-[#b91c1c]' : 'bg-[#0f4c3a]';
  return (
    <button type="button" onClick={onClick} className={`w-full h-12 ${color} text-white text-base font-bold`}>
      {children}
    </button>
  );
}

// 입력칸 옆 120px 버튼 (중복 확인 · 인증번호 받기 · 확인)
// variant: outline(흰 바탕 초록 테두리) · primary(초록) · disabled(회색)
export function SideButton({ variant = 'outline', onClick, children }) {
  if (variant === 'disabled') {
    return (
      <button type="button" disabled className="h-12 w-[120px] text-sm font-semibold shrink-0 bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed">
        {children}
      </button>
    );
  }
  if (variant === 'primary') {
    return (
      <button type="button" onClick={onClick} className="h-12 w-[120px] bg-[#0f4c3a] text-white text-sm font-semibold shrink-0">
        {children}
      </button>
    );
  }
  return (
    <button type="button" onClick={onClick} className="h-12 w-[120px] text-sm font-semibold shrink-0 bg-white border border-[#0f4c3a] text-[#0f4c3a]">
      {children}
    </button>
  );
}

// 초록 안내 상자 (i 아이콘)
export function InfoNote({ children }) {
  return (
    <div className="p-4 border bg-[#f4f8f6] border-[#d1e7dd] flex items-start gap-2.5 text-sm text-[#111827] leading-relaxed">
      <svg className="w-5 h-5 text-[#0f4c3a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

// 초록 체크 한 줄 (인증번호를 보냈어요 등)
export function CheckLine({ children, className = 'flex items-center gap-1.5 text-[13px] font-medium text-[#0f4c3a]', iconClass = 'w-4 h-4 shrink-0', strokeWidth = '2.5' }) {
  return (
    <p className={className}>
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M5 13l4 4L19 7" />
      </svg>
      {children}
    </p>
  );
}

// 체크 상자 + 문구 (기본 배송지로 설정 · 탈퇴 동의)
export function CheckBox({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {checked ? (
        <span className="w-5 h-5 flex items-center justify-center bg-[#0f4c3a] text-white shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      ) : (
        <span className="w-5 h-5 border-2 border-[#d1d5db] bg-white shrink-0" />
      )}
      <span className="text-[15px] font-medium text-[#111827]">{children}</span>
    </label>
  );
}
