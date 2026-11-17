import { useEffect, useId, useState } from 'react';
import { searchSpecies } from '../../api/productApi';

const SUGGESTION_SIZE = 8;

// 품종 검색 → 선택 (시안 02-1-1 메인 필터의 「품종 검색」 칸)
// 카테고리를 고른 상태면 그 카테고리 품종만 추천
// 시안에 없는 부분: 추천 목록 · 고른 품종 표시(입력칸에 이름) · ✕ 해제 버튼
function SpeciesFilter({ category, selected, onSelect, onClear }) {
  const listId = useId();
  const [keyword, setKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // 입력이 멈추고 0.3초 뒤에 요청
  useEffect(() => {
    if (!isOpen) return undefined;

    let ignore = false;
    const timer = setTimeout(async () => {
      try {
        const response = await searchSpecies({
          keyword: keyword.trim() || undefined,
          category: category || undefined,
          size: SUGGESTION_SIZE,
        });
        if (!ignore) setSuggestions(response.data.data.content ?? []);
      } catch {
        if (!ignore) setSuggestions([]);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [keyword, category, isOpen]);

  const handleSelect = (species) => {
    onSelect(species);
    setKeyword('');
    setIsOpen(false);
  };

  const handleChange = (event) => {
    // 고른 품종이 있는 상태에서 다시 입력하면 선택을 풀고 새로 찾음
    if (selected) onClear();
    setKeyword(event.target.value);
    setIsOpen(true);
  };

  return (
    <div className="relative w-full">
      <input
        className="form-input w-full h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-replant-forest focus:ring-1 focus:ring-replant-forest transition-all"
        placeholder="품종 이름으로 찾기"
        type="text"
        role="combobox"
        aria-label="품종 검색"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        value={selected ? selected.name : keyword}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      />
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" x2="16.65" y1="21" y2="16.65" />
        </svg>
      </span>
      {selected && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-900"
          aria-label="품종 선택 해제"
          onClick={onClear}
        >
          ✕
        </button>
      )}

      {isOpen && !selected && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-20 max-h-[240px] overflow-y-auto bg-white border border-gray-200 shadow-sm py-1"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-gray-400">검색 결과가 없어요</li>
          ) : (
            suggestions.map((species) => (
              <li key={species.speciesId} role="option" aria-selected="false">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                  // 클릭보다 입력창 blur가 먼저 일어나 목록이 닫히는 것을 막음
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(species)}
                >
                  {species.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default SpeciesFilter;
