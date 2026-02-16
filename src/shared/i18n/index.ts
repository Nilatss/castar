import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import uz from './uz.json';
import ru from './ru.json';
import en from './en.json';

const resources = {
  uz: { translation: uz },
  ru: { translation: ru },
  en: { translation: en },
};

// Detect device language, fallback to 'uz'
const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'uz';
const supportedLangs = ['uz', 'ru', 'en'];
const detectedLang = supportedLangs.includes(deviceLang) ? deviceLang : 'uz';

i18n.use(initReactI18next).init({
  resources,
  lng: detectedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
