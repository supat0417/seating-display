import type { Lang } from '../../domain/i18n';
import { useT } from '../i18n/I18nContext';

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  const { t } = useT();
  return (
    <div className="lang-toggle2" title={t('langToggleTitle')}>
      <button className={`lang-opt2${lang === 'th' ? ' active' : ''}`} onClick={() => onChange('th')}>TH</button>
      <button className={`lang-opt2${lang === 'en' ? ' active' : ''}`} onClick={() => onChange('en')}>EN</button>
    </div>
  );
}
