const POSTCODE_SCRIPT_URL =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

let loadPromise = null;

/**
 * 우편번호 서비스 스크립트를 한 번만 불러옴
 * 화면에 들어올 때 미리 호출해 두면 버튼 클릭 시 바로 팝업이 열림
 */
export function loadPostcodeScript() {
  if (window.daum?.Postcode) return Promise.resolve();

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = POSTCODE_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loadPromise = null;
        reject(new Error('우편번호 서비스를 불러오지 못했습니다.'));
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

/**
 * 우편번호 검색 팝업을 열고, 주소를 고르면 { zipcode, address1 }을 넘겨줌
 */
export async function openPostcode(onComplete) {
  await loadPostcodeScript();

  new window.daum.Postcode({
    oncomplete: (data) => {
      onComplete({
        zipcode: data.zonecode,
        address1: data.roadAddress || data.jibunAddress,
      });
    },
  }).open();
}
