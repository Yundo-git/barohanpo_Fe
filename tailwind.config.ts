import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color)",
        main: "#00bfa5",
        mainText: "#111111",
        subText: "#505050",
        subText2: "#767676",
        disabled: "#999999",
        border: "#E5E5EC"
      },
      fontFamily: {
        sans: ["Pretendard"],
      },
      // 폰트 굵기(Weight) 커스텀 설정
      fontWeight: {
        rg: "400", // Regular
        md: "500", // Medium
        sb: "600", // Semi-bold
      },
      // 자간(Letter Spacing) 커스텀 설정
      letterSpacing: {
        "tight-2_5": "-0.025em", // 피그마 -2.5%
      },
      // 폰트 크기(Size)와 행간(Line Height) 커스텀 설정
      fontSize: {
        // Headline
        "h1-32": ["32px", { lineHeight: "41.6px" }],
        "h2-28": ["28px", { lineHeight: "39.2px" }],
        "h3-24": ["24px", { lineHeight: "33.6px" }],
        "h3-20": ["20px", { lineHeight: "28px" }],
        "h4-18": ["18px", { lineHeight: "25.2px" }],
        "h6-16": ["16px", { lineHeight: "22.4px" }],

        // Title
        "t1-24": ["24px", { lineHeight: "33.6px" }],
        "t2-20": ["20px", { lineHeight: "28px" }],
        "t3-18": ["18px", { lineHeight: "25.2px" }],
        "t4-16": ["16px", { lineHeight: "22.4px" }],

        // Body
        "b1-15": ["15px", { lineHeight: "21.75px" }],
        "b2-14": ["14px", { lineHeight: "20.3px" }],
        "b3-13": ["13px", { lineHeight: "18.85px" }],
        "b4-12": ["12px", { lineHeight: "17.4px" }],
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config;
