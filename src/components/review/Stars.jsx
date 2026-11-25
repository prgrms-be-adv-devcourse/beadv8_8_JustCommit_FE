import { starFill } from '../../constants/review';

// 별 모양 (시안 02-3-3 · 05 공통 path)
const STAR_PATH =
  'M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z';

const FILLED = 'text-[#0f4c3a]';
const EMPTY = 'text-[#d1d5db]';

export function StarIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d={STAR_PATH} />
    </svg>
  );
}

// 별 하나: fill = 'full' | 'half' | 'empty'. size = 'w-4 h-4' 같은 크기 클래스
function Star({ fill, size }) {
  if (fill === 'half') {
    return (
      <span className={`relative ${size}`}>
        <StarIcon className={`absolute inset-0 ${size} ${EMPTY}`} />
        <span className="absolute inset-0 w-1/2 overflow-hidden">
          <StarIcon className={`${size} ${FILLED}`} />
        </span>
      </span>
    );
  }
  return <StarIcon className={`${size} ${fill === 'full' ? FILLED : EMPTY}`} />;
}

// 별점 보기 (0.5 단위). 시안: <span class="flex items-center" role="img" aria-label="별점 5점 중 5.0점"> 별 5개
function Stars({ rating, size = 'w-4 h-4' }) {
  return (
    <span
      className="flex items-center"
      role="img"
      aria-label={`별점 5점 중 ${rating.toFixed(1)}점`}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} fill={starFill(rating, index)} size={size} />
      ))}
    </span>
  );
}

export default Stars;
