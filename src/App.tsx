import { useEffect, useRef, useState } from 'react';
import { seatingData } from './data';
import { computeDisplayThemeTokens, resolveTheme, DISPLAY_THEME_VARS } from './domain/theme';
import { loadLang, saveLang, type Lang } from './domain/i18n';
import { I18nProvider, useT } from './ui/i18n/I18nContext';
import { ToastProvider } from './ui/components/Toast';
import { SparkleLayer } from './ui/components/SparkleLayer';
import { LangToggle } from './ui/components/LangToggle';
import { Hero } from './ui/features/hero/Hero';
import { SearchCard } from './ui/features/search/SearchCard';
import { ChipsRow } from './ui/features/chips/ChipsRow';
import { PlanCard, type PlanCardHandle } from './ui/features/plan/PlanCard';
import type { FloorplanObject } from './domain/floorplan';

function Screen({ lang, onLangChange }: { lang: Lang; onLangChange: (lang: Lang) => void }) {
  const { t } = useT();
  const planRef = useRef<PlanCardHandle | null>(null);

  useEffect(() => {
    document.title = t('docTitle');
    document.documentElement.lang = lang;
  }, [t, lang]);

  function focusTable(obj: FloorplanObject, highlightName: string | null) {
    planRef.current?.focusTable(obj, highlightName);
  }

  return (
    <>
      <div className="bg-glow" />
      <SparkleLayer />
      <LangToggle lang={lang} onChange={onLangChange} />
      <div id="wrap">
        <Hero logo={seatingData.logo} />
        <SearchCard floorplan={seatingData.floorplan} guests={seatingData.guests} onFocusTable={focusTable} />
        <ChipsRow floorplan={seatingData.floorplan} onFocusTable={focusTable} />
        <PlanCard ref={planRef} floorplan={seatingData.floorplan} guests={seatingData.guests} />
      </div>
    </>
  );
}

export default function App() {
  const [{ lang, userSet }, setLangState] = useState(() => loadLang());

  // Apply the bundled data's theme once at boot (this app has no theme picker — it purely
  // renders whatever theme the exported data specifies).
  useEffect(() => {
    const resolved = resolveTheme(seatingData.theme);
    const root = document.documentElement.style;
    if (!resolved) {
      DISPLAY_THEME_VARS.forEach((v) => root.removeProperty(v));
      return;
    }
    const tokens = computeDisplayThemeTokens(resolved);
    (Object.entries(tokens) as Array<[string, string]>).forEach(([k, v]) => root.setProperty(k, v));
  }, []);

  // applyDataLang: auto-adopt the bundled data's language UNLESS the user has manually
  // toggled language before (persisted forever once set).
  const effectiveLang: Lang = !userSet && (seatingData.lang === 'th' || seatingData.lang === 'en') ? seatingData.lang : lang;

  function handleLangChange(next: Lang) {
    saveLang(next);
    setLangState({ lang: next, userSet: true });
  }

  return (
    <I18nProvider lang={effectiveLang}>
      <ToastProvider>
        <Screen lang={effectiveLang} onLangChange={handleLangChange} />
      </ToastProvider>
    </I18nProvider>
  );
}
