import { LanguageCode } from "./charting_library";
import defaultLanguage from "../config/default-language.json";

const languages = [
  "english",
  "portuguese",
  "chinese",
  "korean",
  "vietnamese",
] as const;
export type Language = (typeof languages)[number];

export type LanguageType = {
  language: Language;
  languageDisplay: string;
  icon: string;
  code: LanguageCode; //for TradingView
};

export const translationLanguages: LanguageType[] = [
  {
    language: "english",
    languageDisplay: "english",
    icon: "en-logo.png",
    code: "en",
  },
  {
    language: "chinese",
    languageDisplay: "中国人",
    icon: "cn-logo.png",
    code: "zh",
  },
  {
    language: "portuguese",
    languageDisplay: "português",
    icon: "br-logo.png",
    code: "pt",
  },
  {
    language: "korean",
    languageDisplay: "한국인",
    icon: "ko-logo.png",
    code: "ko",
  },
  {
    language: "vietnamese",
    languageDisplay: "Tiếng Việt",
    icon: "vi-logo.png",
    code: "vi",
  },
];

export type TranslationKey = keyof typeof defaultLanguage;

export type TranslationMap = Record<TranslationKey, string>;
