import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const configureI18n = async () => {
  try {
    const [en, fr, es, ar] = await Promise.all([
      fetch('./locales/en.json').then(res => res.json()),
      fetch('./locales/fr.json').then(res => res.json()),
      fetch('./locales/es.json').then(res => res.json()),
      fetch('./locales/ar.json').then(res => res.json()),
    ]);

    const resources = {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      ar: { translation: ar },
    };

    await i18next
      .use(initReactI18next)
      .init({
        lng: 'en',
        fallbackLng: 'en',
        resources,
        interpolation: {
          escapeValue: false, 
        },
      });
  } catch (error) {
    console.error("Failed to initialize i18next:", error);
  }
};

export const i18nPromise = configureI18n();

export default i18next;
