import type { Dictionary, Lang } from './types';
import th from './th';
import en from './en';

export type { Dictionary, Lang } from './types';

export const DICTIONARIES: Record<Lang, Dictionary> = { th, en };

const LANG_KEY = 'seating-display-lang';

export function loadLang(): { lang: Lang; userSet: boolean } {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'th') return { lang: saved, userSet: true };
  } catch {
    /* ignore */
  }
  return { lang: 'th', userSet: false };
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}
