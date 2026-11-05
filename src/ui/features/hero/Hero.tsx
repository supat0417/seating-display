import { useT } from '../../i18n/I18nContext';

export function Hero({ logo }: { logo?: string | null }) {
  const { t } = useT();
  return (
    <header className="hero">
      {logo && <img className="hero-logo" src={logo} alt="" />}
      <h1>{t('heroTitle')}</h1>
      <p>{t('heroDesc')}</p>
    </header>
  );
}
