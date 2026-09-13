import { useT } from '../../i18n/I18nContext';

export function Hero({ logo }: { logo?: string | null }) {
  const { t } = useT();
  return (
    <div className="hero">
      {logo && <img className="hero-logo" src={logo} alt="" />}
      <div className="hero-eyebrow">{t('docTitle')}</div>
      <h1>{t('heroTitle')}</h1>
      <div className="flourish"><span className="ln" /><span className="dm">◆</span><span className="ln r" /></div>
      <p>{t('heroDesc')}</p>
    </div>
  );
}
