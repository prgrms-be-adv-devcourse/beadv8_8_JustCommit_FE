import { useState } from 'react';
import { Link } from 'react-router-dom';
import TermsModal from '../common/TermsModal';
import logo from '../../assets/logo.png';

// 시안: 캔버스 「replant 웹 시안」 01-2-2 공통 푸터
// 이용약관은 모달(01-1-4 「11. 이용약관 보기」, Large 680px)로 열고, 약관 본문은 아직 준비 중
function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <footer className="w-full border-t text-xs text-gray-500 bg-white border-gray-100 pt-4 pb-3">
      <div className="max-w-[1240px] mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center overflow-hidden h-4 w-20 shrink-0">
              <img src={logo} alt="replant" className="h-20 w-auto max-w-none object-contain" />
            </span>
            <span>· © 2026 replant. All rights reserved.</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <a
            className="hover:text-gray-900 transition-colors"
            href="/terms"
            onClick={(event) => {
              event.preventDefault();
              setIsTermsOpen(true);
            }}
          >
            이용약관
          </a>
          <Link className="font-bold text-gray-800 hover:text-replant-forest transition-colors" to="/privacy">
            개인정보처리방침
          </Link>
        </div>
      </div>

      {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
    </footer>
  );
}

export default Footer;
