import axios from "axios";
import { HANDLE_TRANSLATION_API_URL } from "../../config/translation";
import { Language, TranslationMap } from "../../types/translation";

export const fetchTranslation = async (language: Language) => {
  const response = await axios.get<TranslationMap>(
    `${HANDLE_TRANSLATION_API_URL}/${language}`,
  );
  return response.data;
};
