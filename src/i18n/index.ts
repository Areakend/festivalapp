import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import fr from './locales/fr.json';
import nl from './locales/nl.json';
import de from './locales/de.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'nl', 'de', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Best-match device language, falling back to English. */
function detectDeviceLanguage(): SupportedLanguage {
  const deviceCode = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceCode)
    ? (deviceCode as SupportedLanguage)
    : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    nl: { translation: nl },
    de: { translation: de },
    es: { translation: es },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
