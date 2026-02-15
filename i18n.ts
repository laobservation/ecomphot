import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const configureI18n = async () => {
  try {
    const fetchLocale = async (locale: string) => {
      const res = await fetch(`/locales/${locale}.json`);
      if (!res.ok) {
        throw new Error(`Failed to load ${locale} locale: ${res.status}`);
      }
      return res.json();
    };

    const [en, fr, es, ar] = await Promise.all([
      fetchLocale('en'),
      fetchLocale('fr'),
      fetchLocale('es'),
      fetchLocale('ar'),
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