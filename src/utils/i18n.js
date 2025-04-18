import i18next from 'i18next';
import i18nextMiddleware from 'i18next-http-middleware';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create locales directory if it doesn't exist
const localesDir = path.join(__dirname, '../../locales');
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
  
  // Create default language directories
  const languages = ['en', 'es'];
  languages.forEach(lang => {
    const langDir = path.join(localesDir, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir);
      
      // Create a default translation file
      const defaultTranslation = lang === 'en' 
        ? { welcome: 'Welcome to the Community Events API' }
        : { welcome: 'Bienvenido a la API de Eventos Comunitarios' };
      
      fs.writeFileSync(
        path.join(langDir, 'translation.json'), 
        JSON.stringify(defaultTranslation, null, 2)
      );
    }
  });
}

// Initialize i18next
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(localesDir, '{{lng}}/{{ns}}.json'),
      addPath: path.join(localesDir, '{{lng}}/{{ns}}.missing.json')
    },
    fallbackLng: 'en',
    preload: ['en', 'es'],
    saveMissing: true,
    detection: {
      order: ['querystring', 'cookie', 'header'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupHeader: 'accept-language',
      caches: ['cookie']
    },
    ns: ['translation'],
    defaultNS: 'translation'
  });

export const i18nMiddleware = i18nextMiddleware.handle(i18next);

export default i18next;