import i18n, { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { i18Namespace } from './common';

const options: InitOptions = {
  fallbackLng: 'en',
  supportedLngs: ['en', 'zh'],
  load: 'languageOnly', 
  ns: [i18Namespace],
  defaultNS: i18Namespace,

  saveMissing: true,
  debug: true,

  interpolation: {
    escapeValue: false, // not needed for react!!
    formatSeparator: ',',
    format: (value, format, lng) => {
      if (format === 'uppercase') return value.toUpperCase();
      return value;
    },
  },
};

// for browser use http backend to load translations and browser lng detector
if (process && !process.release) {
  i18n.use(Backend).use(initReactI18next).use(LanguageDetector);
}

// initialize if not already initialized
if (!i18n.isInitialized) {
  i18n.init(options);
}

export default i18n;