import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import uz from './uz.json';
import ru from './ru.json';
import en from './en.json';
import be from './be.json';
import uk from './uk.json';
import kk from './kk.json';
import de from './de.json';
import az from './az.json';
import pl from './pl.json';
import ka from './ka.json';
import zh from './zh.json';

const resources = {
  ru: { translation: ru },
  uz: { translation: uz },
  en: { translation: en },
  be: { translation: be },
  uk: { translation: uk },
  kk: { translation: kk },
  de: { translation: de },
  az: { translation: az },
  pl: { translation: pl },
  ka: { translation: ka },
  zh: { translation: zh },
};

// Detect device language, fallback to 'en'
const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLangs = ['ru', 'uz', 'en', 'be', 'uk', 'kk', 'de', 'az', 'pl', 'ka', 'zh'];
const detectedLang = supportedLangs.includes(deviceLang) ? deviceLang : 'en';

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
