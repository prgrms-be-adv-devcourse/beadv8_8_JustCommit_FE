import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
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
import ErrorPage from '../../components/common/ErrorPage';
import { EDITABLE_PRODUCT_STATUSES, QUOTA_PLACEHOLDER } from '../../constants/seller';
import ProductFormView, { MAX_PHOTOS } from './ProductFormView';

// 백엔드 ProductImageService 규칙과 같게 유지 (시안 안내: JPEG · PNG, 10MB 이하)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SEARCH_DELAY_MS = 300;

let photoSeq = 0;

// 새 파일: { id, file, previewUrl } / 이미 올라간 사진: { id, file: null, url, previewUrl: url }
function toUploadedPhoto(url) {
  photoSeq += 1;
  return { id: photoSeq, file: null, url, previewUrl: url };
}

// 등록 · 수정 겸용 양식 (productId가 있으면 수정 모드)
function ProductForm({ productId }) {
  const isEdit = Boolean(productId);
  usePageTitle(isEdit ? '상품 수정' : '상품 등록');
  const navigate = useNavigate();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';
  const fileInputRef = useRef(null);

  // 수정 모드: 불러온 상품 (판매자 · 상태 확인, 화면에 없는 값 보존용)
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
  if (loadState === 'loading') return <main className="flex-1" />;

  // 수정할 수 없는 경우 (실제 권한 검사는 백엔드가 함)
  if (loadState === 'error') return <ErrorPage type="PRODUCT_NOT_FOUND" />;
  if (isEdit && loadedProduct.sellerId !== user.memberId) return <ErrorPage type="FORBIDDEN" />;
  if (isEdit && !EDITABLE_PRODUCT_STATUSES.includes(loadedProduct.status)) {
    return <Navigate to="/mypage/products" replace />;
  }

  // ── 사진 ──
  const handleFiles = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ''; // 같은 파일을 다시 고를 수 있게 초기화

    const valid = files.filter((f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    if (valid.length < files.length) {
      setErrorMessage('JPEG · PNG 형식의 10MB 이하 사진만 올릴 수 있어요.');
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

  const photoHandlers = {
    onAdd: () => fileInputRef.current?.click(),
    onRemove: (id) =>
      setPhotos((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target?.file) URL.revokeObjectURL(target.previewUrl);
        return prev.filter((p) => p.id !== id);
      }),
    onDragStart: setDragIndex,
    onDragEnd: () => setDragIndex(null),
    onDrop: (to) => {
      const from = dragIndex;
      setDragIndex(null);
      if (from === null || from === to) return;
      setPhotos((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    },
  };

  // ── 품종 ──
  const selectSpecies = (option) => {
    setSpecies({ speciesId: option.speciesId, name: option.name });
    setSpeciesQuery(option.name);
    setIsDropdownOpen(false);
  };

  const speciesProps = {
    query: speciesQuery,
    options: speciesOptions,
    isOpen: isDropdownOpen,
    activeIndex: activeOption,
    onSelect: selectSpecies,
    onOpen: () => setIsDropdownOpen(true),
    onClose: () => setTimeout(() => setIsDropdownOpen(false), 150),
    onChange: (event) => {
      setSpeciesQuery(event.target.value);
      setSpecies(null); // 글자를 고치면 선택 해제 → 목록에서 다시 골라야 함
      setIsDropdownOpen(true);
    },
    onKeyDown: (event) => {
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
    },
  };

  // ── 저장 ──
  const priceNumber = Number(price);
  const canSubmit =
    photos.length > 0 &&
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
      // 등록 · 수정 모두 검수를 받으므로 검수 결과 화면으로 (양식 페이지는 기록에서 대체)
      navigate(`/products/${savedId}/review`, { replace: true });
    } catch (error) {
      const fallback = isEdit ? '상품 수정에 실패했습니다.' : '상품 등록에 실패했습니다.';
      setErrorMessage(error.response?.data?.message ?? `${fallback} 다시 시도해 주세요.`);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ProductFormView
        isEdit={isEdit}
        quota={QUOTA_PLACEHOLDER}
        status={loadedProduct?.status}
        photos={photos}
        photoHandlers={photoHandlers}
        species={speciesProps}
        title={title}
        onTitleChange={setTitle}
        priceText={price ? Number(price).toLocaleString('ko-KR') : ''}
        onPriceChange={(value) => setPrice(value.replace(/\D/g, '').slice(0, 9))}
        description={description}
        onDescriptionChange={setDescription}
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onCancel={() => navigate(-1)}
        onSubmit={handleSubmit}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        hidden
        onChange={handleFiles}
      />
    </>
  );
}

// 다른 상품으로 이동하면 양식을 새로 만들도록 key로 다시 마운트
function ProductCreatePage() {
  const { productId } = useParams();
  return <ProductForm key={productId ?? 'new'} productId={productId} />;
}

export default ProductCreatePage;
