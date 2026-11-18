/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';

// 시안(Stitch · 캔버스 「replant 웹 시안」)의 tailwind.config와 같은 값
// forms: 02-1 메인 시안만 forms 플러그인을 씀 → 다른 화면에 영향이 없게 'class' 방식으로 켜고,
//        메인의 입력칸 · 체크박스에만 form-input · form-checkbox 클래스를 붙임
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        replant: { forest: '#1b4332' },
      },
    },
  },
  plugins: [forms({ strategy: 'class' })],
};
