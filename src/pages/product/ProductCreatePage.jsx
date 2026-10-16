import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import {
  createProduct,
  issueImageUploadUrls,
  searchSpecies,
  uploadToPresignedUrl,
} from '../../api/productApi';
import styles from './ProductCreatePage.module.css';

// 백엔드 ProductImageService 규칙과 같게 유지
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 10;
const TITLE_MAX_LENGTH = 100;
const SEARCH_DELAY_MS = 300;

let photoSeq = 0;

// 검색어와 일치하는 부분만 굵게
function HighlightedName({ name, keyword }) {
  const index = keyword ? name.indexOf(keyword) : -1;
  if (index < 0) return name;
  return (
    <>
      {name.slice(0, index)}
      <strong className={styles.match}>{name.slice(index, index + keyword.length)}</strong>
      {name.slice(index + keyword.length)}
    </>
  );
}

function ProductCreatePage() {
  usePageTitle('상품 등록');
  const navigate = useNavigate();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const fileInputRef = useRef(null);

  const [photos, setPhotos] = useState([]); // { id, file, previewUrl }
  const [dragIndex, setDragIndex] = useState(null);

  const [species, setSpecies] = useState(null); // { speciesId, name }
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(0);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(''); // 숫자만 저장
  const [description, setDescription] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 페이지를 떠날 때 미리보기 URL 해제 (메모리 정리)
  const photosRef = useRef(photos);
  // 렌더링 중에 ref를 바꾸지 않고, 화면에 반영된 뒤 최신 목록으로 갱신
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  // 품종 검색 (입력이 멈추고 0.3초 뒤에 요청)
  useEffect(() => {
    if (!isDropdownOpen) return undefined;
    let ignore = false;
    const timer = setTimeout(() => {
      searchSpecies({ keyword: speciesQuery.trim() || undefined, size: 8 })
        .then((response) => {
          if (ignore) return;
          setSpeciesOptions(response.data.data.content);
          setActiveOption(0);
        })
        .catch(() => {
          if (!ignore) setSpeciesOptions([]);
        });
    }, SEARCH_DELAY_MS);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [speciesQuery, isDropdownOpen]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role !== 'SELLER') return <Navigate to="/seller/register" replace />;

  // ── 사진 ──
  const handleFiles = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ''; // 같은 파일을 다시 고를 수 있게 초기화

    const valid = files.filter((f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    if (valid.length < files.length) {
      setErrorMessage('JPG·PNG·WEBP 형식의 10MB 이하 사진만 올릴 수 있어요.');
    } else {
      setErrorMessage('');
    }

    const room = MAX_PHOTOS - photos.length;
    if (valid.length > room) {
      setErrorMessage(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
    }

    const added = valid.slice(0, room).map((file) => ({
      id: ++photoSeq,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...added]);
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const movePhoto = (from, to) => {
    if (from === null || from === to) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  // ── 품종 ──
  const selectSpecies = (option) => {
    setSpecies({ speciesId: option.speciesId, name: option.name });
    setSpeciesQuery(option.name);
    setIsDropdownOpen(false);
  };

  const handleSpeciesChange = (event) => {
    setSpeciesQuery(event.target.value);
    setSpecies(null); // 글자를 고치면 선택 해제 → 목록에서 다시 골라야 함
    setIsDropdownOpen(true);
  };

  const handleSpeciesKeyDown = (event) => {
    if (!isDropdownOpen || speciesOptions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveOption((i) => Math.min(i + 1, speciesOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveOption((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectSpecies(speciesOptions[activeOption]);
    } else if (event.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // ── 등록 ──
  const priceNumber = Number(price);
  const hasPhoto = photos.length > 0; // 사진 최소 1장 필수
  const canSubmit =
    hasPhoto &&
    species !== null &&
    title.trim() !== '' &&
    priceNumber > 0 &&
    description.trim() !== '' &&
    !isSubmitting;

  const uploadPhotos = async () => {
    if (photos.length === 0) return [];
    const files = photos.map((p) => ({ contentType: p.file.type, size: p.file.size }));
    const response = await issueImageUploadUrls(files);
    const links = response.data.data; // 요청한 순서대로 응답
    await Promise.all(links.map((link, i) => uploadToPresignedUrl(link.uploadUrl, photos[i].file)));
    return links.map((link) => link.imageUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage('');

    let pictureUrls;
    try {
      pictureUrls = await uploadPhotos();
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? '사진 업로드에 실패했습니다. 다시 시도해 주세요.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await createProduct({
        speciesId: species.speciesId,
        title: title.trim(),
        description: description.trim(),
        price: priceNumber,
        pictureUrls,
      });
      navigate(`/products/${response.data.data.productId}`, { replace: true });
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? '상품 등록에 실패했습니다. 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backLink} onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        돌아가기
      </button>
      <h1 className={styles.pageTitle}>상품 등록</h1>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">error</span>
            {errorMessage}
          </div>
        )}

        {/* 사진 */}
        <div className={styles.field}>
          <div className={styles.photoHeader}>
            <span id="photo-label" className={styles.label}>
              사진 <span className={styles.optional}>({photos.length}/{MAX_PHOTOS})</span>
            </span>
            <span className={styles.hint}>첫 번째 사진이 대표 사진이 돼요. 끌어서 순서를 바꿀 수 있어요.</span>
          </div>
          <ul aria-labelledby="photo-label" className={styles.photoGrid}>
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                draggable={!isSubmitting}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  movePhoto(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`${styles.photo} ${index === 0 ? styles.coverPhoto : ''} ${dragIndex === index ? styles.dragging : ''}`}
              >
                <img src={photo.previewUrl} alt={`선택한 사진 ${index + 1}`} />
                {index === 0 && <span className={styles.coverBadge}>대표</span>}
                <span className={`material-symbols-outlined ${styles.dragHandle}`} aria-hidden="true">
                  drag_indicator
                </span>
                <button
                  type="button"
                  aria-label={`사진 ${index + 1} 삭제`}
                  className={styles.removeButton}
                  onClick={() => removePhoto(photo.id)}
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </li>
            ))}
            {photos.length < MAX_PHOTOS && (
              <li className={styles.addCell}>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">add_a_photo</span>
                  사진 추가
                </button>
              </li>
            )}
          </ul>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            hidden
            onChange={handleFiles}
          />
        </div>

        {/* 품종 */}
        <div className={styles.field}>
          <label htmlFor="pf-species" className={styles.label}>품종</label>
          <div className={styles.comboWrap}>
            <span className={`${styles.combo} ${isDropdownOpen ? styles.comboOpen : ''}`}>
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                id="pf-species"
                type="text"
                role="combobox"
                aria-expanded={isDropdownOpen}
                aria-controls="pf-species-list"
                aria-autocomplete="list"
                autoComplete="off"
                placeholder="품종을 검색해 주세요"
                value={speciesQuery}
                onChange={handleSpeciesChange}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                onKeyDown={handleSpeciesKeyDown}
                disabled={isSubmitting}
              />
              <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
            </span>
            {isDropdownOpen && (
              <ul id="pf-species-list" role="listbox" className={styles.dropdown}>
                {speciesOptions.length === 0 && <li className={styles.emptyOption}>검색 결과가 없어요</li>}
                {speciesOptions.map((option, index) => (
                  <li
                    key={option.speciesId}
                    role="option"
                    aria-selected={index === activeOption}
                    className={`${styles.option} ${index === activeOption ? styles.optionActive : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSpecies(option)}
                  >
                    <HighlightedName name={option.name} keyword={speciesQuery.trim()} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 상품명 */}
        <label className={styles.field}>
          <span className={styles.label}>상품명</span>
          <input
            type="text"
            className={styles.input}
            placeholder="예) 알로카시아 프라이덱 (40cm, 잎 6장)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            disabled={isSubmitting}
          />
        </label>

        {/* 가격 */}
        <div className={styles.field}>
          <label htmlFor="pf-price" className={styles.label}>가격</label>
          <span className={styles.priceBox}>
            <input
              id="pf-price"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={price ? Number(price).toLocaleString('ko-KR') : ''}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 9))}
              disabled={isSubmitting}
            />
            <span>원</span>
          </span>
        </div>

        {/* 설명 */}
        <label className={styles.field}>
          <span className={styles.label}>설명</span>
          <textarea
            rows={7}
            className={styles.textarea}
            placeholder="키운 기간, 크기, 잎 상태, 화분 등 식물의 상태를 자세히 적어 주세요."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </label>

        <div className={styles.notice}>
          <span className="material-symbols-outlined" aria-hidden="true">info</span>
          식물 1개체당 판매글 1개만 등록돼요
        </div>

        {!hasPhoto && (
          <div className={`${styles.notice} ${styles.noticeError}`} role="status">
            <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>
            사진을 1장 이상 등록해 주세요
          </div>
        )}

        <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
          {isSubmitting ? '등록 중...' : '상품 등록하기'}
        </button>
      </form>
    </div>
  );
}

export default ProductCreatePage;
