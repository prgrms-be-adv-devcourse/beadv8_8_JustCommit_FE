import { useEffect, useId, useState } from 'react';
import { searchSpecies } from '../../api/productApi';
import styles from './SpeciesFilter.module.css';

const SUGGESTION_SIZE = 8;

// 품종 검색 → 선택 (카테고리를 고른 상태면 그 카테고리 품종만 추천)
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

  if (selected) {
    return (
      <div className={styles.selected}>
        <span className="material-symbols-outlined" aria-hidden="true">
          eco
        </span>
        <span>{selected.name}</span>
        <button type="button" className={styles.clearButton} aria-label="품종 선택 해제" onClick={onClear}>
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>
      </div>
    );
  }

  const handleSelect = (species) => {
    onSelect(species);
    setKeyword('');
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <span className={`material-symbols-outlined ${styles.searchIcon}`} aria-hidden="true">
        search
      </span>
      <input
        type="search"
        className={styles.input}
        role="combobox"
        aria-label="품종 검색"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="품종 이름으로 찾기 (예: 필로덴드론)"
        value={keyword}
        onChange={(event) => {
          setKeyword(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      />

      {isOpen && (
        <ul id={listId} role="listbox" className={styles.list}>
          {suggestions.length === 0 ? (
            <li className={styles.empty}>검색 결과가 없어요</li>
          ) : (
            suggestions.map((species) => (
              <li key={species.speciesId} role="option" aria-selected="false">
                <button
                  type="button"
                  className={styles.option}
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
