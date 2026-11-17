/** @type {import('tailwindcss').Config} */
// 시안(Stitch · 캔버스 「replant 웹 시안」)의 tailwind.config와 같은 값
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        replant: { forest: '#1b4332' },
      },
    },
  },
  plugins: [],
};
