/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}', './src/**/**/*.{js,jsx}'],
    theme: {
        extend: {
            //theme main color
            colors: {
                primary: {
                    DEFAULT: 'slate-950', // 기본
                    dark: '#081524', // 어두운 버전
                    light: '#1e2b3f', // 약간 밝은 버전
                },
                accent: '#facc15', // 강조 색상 : 노랑색
            },
            fontFamily: {
                sans: ['Pretendard', 'sans-serif'], //커스텀 폰트
                clash: ['Clash Display', 'sans-serif'], //Clash Display 폰트
                unbounded: ['Unbounded', 'sans-serif'],
                roboto: ['Roboto mono', 'monospace'],
                robert: ['Robert Sans', 'sans-serif'],
                ibm: ['IBM Plex Sans KR', 'sans-serif'],
            },
        },
      },
    darkMode: 'class', // ✅ 다크모드 지원
    plugins: [],
  };