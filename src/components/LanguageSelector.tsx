import { useTranslation } from 'react-i18next';
import styles from './LanguageSelector.module.css';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18n-language', lng);
  };

  return (
    <div className={styles.languageSelector}>
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className={styles.select}
        aria-label={t('language.title')}
      >
        <option value='pt-BR'>{t('language.ptBR')}</option>
        <option value='en-US'>{t('language.enUS')}</option>
      </select>
    </div>
  );
}
