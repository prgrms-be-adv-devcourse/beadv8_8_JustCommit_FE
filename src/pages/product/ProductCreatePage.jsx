import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import {
  createProduct,
  getProduct,
  issueImageUploadUrls,
  searchSpecies,
  updateProduct,
  uploadToPresignedUrl,
} from '../../api/productApi';
import styles from './ProductCreatePage.module.css';

// 백엔드 ProductImageService 규칙과 같게 유지
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 10;
const TITLE_MAX_LENGTH = 100;
const SEARCH_DELAY_MS = 300;
const MY_PRODUCTS_PATH = '/mypage/products';

let photoSeq = 0;

// 새 파일: { id, file, previewUrl } / 이미 올라간 사진: { id, file: null, url, previewUrl: url }
function toUploadedPhoto(url) {
  photoSeq += 1;
  return { id: photoSeq, file: null, url, previewUrl: url };
}

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

// 등록·수정 겸용 양식 (productId가 있으면 수정 모드)
function ProductForm({ productId }) {
  const isEdit = Boolean(productId);
  usePageTitle(isEdit ? '상품 수정' : '상품 등록');
  const navigate = useNavigate();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';
  const fileInputRef = useRef(null);

  // 수정 모드: 불러온 상품 (판매자·상태 확인, 화면에 없는 값 보존용)
  const [loadedProduct, setLoadedProduct] = useState(null);
  const [loadState, setLoadState] = useState(isEdit ? 'loading' : 'done');

  const [photos, setPhotos] = useState([]);
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

  // 페이지를 떠날 때 새 파일 미리보기 URL만 해제 (이미 올라간 사진 주소는 대상 아님)
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () =>
      photosRef.current.forEach((p) => {
        if (p.file) URL.revokeObjectURL(p.previewUrl);
      }),
    [],
  );

  // 수정 모드: 기존 상품 정보로 양식 채우기
  useEffect(() => {
    if (!isEdit) return undefined;
    let ignore = false;
    getProduct(productId)
      .then((response) => {
        if (ignore) return;
        const product = response.data.data;
        setLoadedProduct(product);
        setTitle(product.title ?? '');
        setPrice(String(product.price ?? ''));
        setDescription(product.description ?? '');
        if (product.species) {
          setSpecies({ speciesId: product.species.speciesId, name: product.species.name });
          setSpeciesQuery(product.species.name);
        }
        setPhotos((product.imageUrls ?? []).map((url) => toUploadedPhoto(url)));
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });
    return () => {
      ignore = true;
    };
  }, [isEdit, productId]);

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
  if (!canSell) return <Navigate to="/seller/register" replace />;

  if (loadState === 'loading') {
    return <p className={styles.stateMessage}>상품 정보를 불러오는 중...</p>;
  }

  // 수정할 수 없는 경우 (실제 권한 검사는 백엔드가 함)
  let blockedMessage = null;
  if (loadState === 'error') {
    blockedMessage = '상품 정보를 불러오지 못했어요.';
  } else if (isEdit && loadedProduct.sellerId !== user.memberId) {
    blockedMessage = '내가 등록한 상품만 수정할 수 있어요.';
  } else if (isEdit && loadedProduct.status !== 'ACTIVE') {
    blockedMessage = '판매중인 상품만 수정할 수 있어요.';
  }
  if (blockedMessage) {
    return (
      <div className={styles.page}>
        <Link to={MY_PRODUCTS_PATH} className={styles.backLink}>
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          내 판매 목록
        </Link>
        <p className={styles.stateMessage}>{blockedMessage}</p>
      </div>
    );
  }

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

    const added = valid.slice(0, room).map((file) => {
      photoSeq += 1;
      return { id: photoSeq, file, previewUrl: URL.createObjectURL(file) };
    });
    setPhotos((prev) => [...prev, ...added]);
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
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

  // ── 저장 ──
  const priceNumber = Number(price);
  const hasPhoto = photos.length > 0; // 사진 최소 1장 필수
  const canSubmit =
    hasPhoto &&
    species !== null &&
    title.trim() !== '' &&
    priceNumber > 0 &&
    description.trim() !== '' &&
    !isSubmitting;

  // 새 파일만 업로드하고, 화면 순서대로 주소 목록을 만듦 (이미 올라간 사진은 주소 그대로)
  const buildPictureUrls = async () => {
    const newPhotos = photos.filter((p) => p.file);
    let uploadedById = {};
    if (newPhotos.length > 0) {
      const files = newPhotos.map((p) => ({ contentType: p.file.type, size: p.file.size }));
      const response = await issueImageUploadUrls(files);
      const links = response.data.data; // 요청한 순서대로 응답
      await Promise.all(links.map((link, i) => uploadToPresignedUrl(link.uploadUrl, newPhotos[i].file)));
      uploadedById = Object.fromEntries(newPhotos.map((p, i) => [p.id, links[i].imageUrl]));
    }
    return photos.map((p) => (p.file ? uploadedById[p.id] : p.url));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage('');

    let pictureUrls;
    try {
      pictureUrls = await buildPictureUrls();
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? '사진 업로드에 실패했습니다. 다시 시도해 주세요.');
      setIsSubmitting(false);
      return;
    }

    const body = {
      speciesId: species.speciesId,
      title: title.trim(),
      description: description.trim(),
      price: priceNumber,
      pictureUrls,
      // 화면에 없는 값: 수정 시 기존 값을 그대로 보냄 (빠지면 지워질 수 있음)
      heightCm: loadedProduct?.heightCm ?? null,
      potSize: loadedProduct?.potSize ?? null,
      growNote: loadedProduct?.growNote ?? null,
    };

    try {
      let savedId = productId;
      if (isEdit) {
        await updateProduct(productId, body);
      } else {
        const response = await createProduct(body);
        savedId = response.data.data.productId;
      }
      // 등록·수정 모두 상품 상세로 (양식 페이지는 기록에서 대체 → 뒤로 가면 이전 목록)
      navigate(`/products/${savedId}`, { replace: true, state: { backTo: '/' } });
    } catch (error) {
      const fallback = isEdit ? '상품 수정에 실패했습니다.' : '상품 등록에 실패했습니다.';
      setErrorMessage(error.response?.data?.message ?? `${fallback} 다시 시도해 주세요.`);
      setIsSubmitting(false);
    }
  };

  let submitLabel = isEdit ? '수정하기' : '등록하기';
  if (isSubmitting) submitLabel = isEdit ? '수정 중...' : '등록 중...';

  return (
    <div className={styles.page}>
      <Link to={MY_PRODUCTS_PATH} className={styles.backLink}>
        <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        내 판매 목록
      </Link>
      <h1 className={styles.pageTitle}>{isEdit ? '상품 수정' : '상품 등록'}</h1>

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
                <img src={photo.previewUrl} alt={`상품 사진 ${index + 1}`} />
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

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate(MY_PRODUCTS_PATH)}
            disabled={isSubmitting}
          >
            취소
          </button>
          <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

// 상품 ID가 바뀌면 key로 양식을 새로 만들어 이전 입력이 남지 않게 함
function ProductCreatePage() {
  const { productId } = useParams();
  return <ProductForm key={productId ?? 'new'} productId={productId} />;
}

export default ProductCreatePage;
