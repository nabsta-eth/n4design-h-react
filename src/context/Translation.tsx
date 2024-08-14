import * as React from "react";
import { HANDLE_DEFAULT_LANGUAGE } from "../config";
import {
  translationLanguages as languages,
  LanguageType,
  Language,
  TranslationMap,
} from "../types/translation";
import {
  languageLocalStorage,
  translationLocalStorage,
} from "../utils/local-storage";
import { fetchTranslation } from "../utils/trade/translation";
import defaultLanguage from "../config/default-language.json";

type TranslationContextValue = {
  t: TranslationMap;
  languages: LanguageType[];
  language?: Language;
  setLanguage: (language: Language) => void;
};

export const TranslationContext = React.createContext<
  TranslationContextValue | undefined
>(undefined);
export const TranslationProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const [language, setLanguageInternal] = React.useState<Language>(
    languageLocalStorage.get() || HANDLE_DEFAULT_LANGUAGE,
  );
  const [translation, setTranslation] = React.useState<TranslationMap | null>();
  const setTranslationInternal = (t: TranslationMap) => {
    setTranslation(t);
    translationLocalStorage.set(t);
  };
  React.useEffect(() => {
    if (language === HANDLE_DEFAULT_LANGUAGE) {
      setTranslationInternal(defaultLanguage);
    } else {
      fetchTranslation(language)
        .then(response => {
          setTranslationInternal({ ...defaultLanguage, ...response });
        })
        .catch(error => {
          console.error("Error fetching language:", error);
          setTranslationInternal(defaultLanguage);
        });
    }
  }, [language]);
  const setLanguage = React.useCallback((newLanguage: Language) => {
    setLanguageInternal(newLanguage);
    languageLocalStorage.set(newLanguage);
  }, []);

  if (!translation) return null;

  return (
    <TranslationContext.Provider
      value={{
        languages,
        t: translation,
        language,
        setLanguage,
      }}
    >
      {props.children}
    </TranslationContext.Provider>
  );
};

export const useLanguageStore = () => {
  const context = React.useContext(TranslationContext);

  if (context === undefined) {
    throw new Error(
      "useLanguageStore must be used within a TranslationProvider",
    );
  }
  return context;
};

export const useLanguage = (): string | undefined => {
  const { language } = useLanguageStore();
  return language;
};
