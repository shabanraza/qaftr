import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";
import { translations, type Locale, type TranslationTree } from "@/i18n/translations";

export type { Locale };
import { getTheme, type AppTheme, type ColorScheme } from "@/theme/tokens";

const LOCALE_KEY = "qaftr_locale";
const SCHEME_KEY = "qaftr_scheme";

interface PreferencesContextValue {
  locale: Locale;
  colorScheme: ColorScheme;
  theme: AppTheme;
  t: TranslationTree;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [colorScheme, setSchemeState] = useState<ColorScheme>("light");

  useEffect(() => {
    Appearance.setColorScheme(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    (async () => {
      try {
        const storedLocale = await SecureStore.getItemAsync(LOCALE_KEY);
        const storedScheme = await SecureStore.getItemAsync(SCHEME_KEY);
        if (storedLocale === "ar" || storedLocale === "en") setLocaleState(storedLocale);
        if (storedScheme === "light" || storedScheme === "dark") setSchemeState(storedScheme);
      } catch {
        // defaults
      }
    })();
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void SecureStore.setItemAsync(LOCALE_KEY, next);
  }, []);

  const setColorScheme = useCallback((next: ColorScheme) => {
    setSchemeState(next);
    void SecureStore.setItemAsync(SCHEME_KEY, next);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setSchemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      void SecureStore.setItemAsync(SCHEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      locale,
      colorScheme,
      theme: getTheme(colorScheme),
      t: translations[locale],
      isRTL: locale === "ar",
      setLocale,
      setColorScheme,
      toggleColorScheme,
    }),
    [locale, colorScheme, setLocale, setColorScheme, toggleColorScheme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}

export function useAppTheme() {
  return usePreferences().theme;
}

export function useTranslation() {
  const { t, locale, isRTL } = usePreferences();
  return { t, locale, isRTL };
}

export function useLayout() {
  const { isRTL } = usePreferences();
  return {
    isRTL,
    textAlign: (isRTL ? "right" : "left") as "right" | "left",
    row: (isRTL ? "row-reverse" : "row") as "row-reverse" | "row",
    alignEnd: (isRTL ? "flex-end" : "flex-start") as "flex-end" | "flex-start",
  };
}

export function formatMoney(amount: number, locale: Locale) {
  const tag = locale === "ar" ? "ar-SA" : "en-US";
  return amount.toLocaleString(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
