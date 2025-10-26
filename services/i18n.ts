
const LANGUAGES = ['en', 'es', 'hi', 'ar', 'fr', 'de', 'zh', 'pt', 'ru', 'ja', 'bn', 'id', 'it', 'ko'];

export const loadAllTranslations = async (): Promise<{ [key: string]: { [key: string]: string } }> => {
  const translations: { [key: string]: { [key: string]: string } } = {};

  const promises = LANGUAGES.map(lang =>
    fetch(`/locales/${lang}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${lang}.json`);
        }
        return response.json();
      })
      .then(data => ({ lang, data }))
      .catch(error => {
        console.error(error);
        return { lang, data: null }; // Handle failed fetch
      })
  );

  const results = await Promise.all(promises);

  for (const result of results) {
    if (result.data) {
      translations[result.lang] = result.data;
    }
  }

  if (!translations.en) {
      throw new Error("Critical: English translation file failed to load.");
  }
  
  return translations;
};