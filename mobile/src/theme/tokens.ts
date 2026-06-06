export type ColorScheme = "light" | "dark";

/**
 * Light: warm-white premium surfaces, deep forest green + warm amber accents.
 * Dark: neutral charcoal (brand green/gold as accents only).
 */
export interface AppTheme {
  colors: {
    brand: string;
    brandMuted: string;
    brandText: string;
    onBrand: string;
    gold: string;
    appBg: string;
    card: string;
    ink: string;
    ink2: string;
    ink3: string;
    border: string;
    authBg: string;
    authHero: string;
    destructive: string;
    inputBg: string;
    summaryBg: string;
    /** Hero card (dark brand surface) */
    heroBg: string;
    heroInk: string;
    heroInk2: string;
    /** Invoice preview paper */
    paper: string;
    paperBorder: string;
    /** Filter chip colors — indexed by status */
    filterAll: { bg: string; activeBg: string; text: string; activeText: string };
    filterUnpaid: { bg: string; activeBg: string; text: string; activeText: string };
    filterPaid: { bg: string; activeBg: string; text: string; activeText: string };
    filterDraft: { bg: string; activeBg: string; text: string; activeText: string };
  };
  radius: {
    input: number;
    card: number;
    pill: number;
  };
  field: {
    fontSize: number;
    fontSizeSm: number;
    paddingH: number;
    paddingV: number;
    placeholder: string;
  };
}

const shared = {
  brand: "#0A3D2E",
  authBg: "#061A11",
  authHero: "#0A3D2E",
  radius: { input: 10, card: 12, pill: 20 },
  field: {
    fontSize: 15,
    fontSizeSm: 13,
    paddingH: 14,
    paddingV: 12,
  },
} as const;

export const lightTheme: AppTheme = {
  colors: {
    ...shared,
    // Warm white — not cold gray-white
    appBg: "#F6F6F3",
    card: "#FFFFFF",
    inputBg: "#FFFFFF",
    // Deep forest green accents
    brandMuted: "#EAF4EE",
    brandText: "#0A3D2E",
    onBrand: "#FFFFFF",
    // Warm amber gold
    gold: "#C07C20",
    // Ink — warm near-black with green undertone
    ink: "#0E1C16",
    ink2: "#3E5A4A",
    ink3: "#8AA396",
    border: "#E4EBE7",
    summaryBg: "#EEF3EF",
    destructive: "#C8392B",
    // Hero is always dark (brand identity anchor)
    heroBg: "#0A3D2E",
    heroInk: "#FFFFFF",
    heroInk2: "#A8D5BC",
    // Paper for invoice preview
    paper: "#FFFFFF",
    paperBorder: "#E4EBE7",
    // Status filter colors
    filterAll: {
      bg: "#EEF3EF",
      activeBg: "#0A3D2E",
      text: "#3E5A4A",
      activeText: "#FFFFFF",
    },
    filterUnpaid: {
      bg: "#FEF3E2",
      activeBg: "#D97706",
      text: "#92400E",
      activeText: "#FFFFFF",
    },
    filterPaid: {
      bg: "#D4EDE5",
      activeBg: "#059669",
      text: "#065F46",
      activeText: "#FFFFFF",
    },
    filterDraft: {
      bg: "#F0F4FF",
      activeBg: "#4F46E5",
      text: "#3730A3",
      activeText: "#FFFFFF",
    },
  },
  radius: shared.radius,
  field: { ...shared.field, placeholder: "#8AA396" },
};

export const darkTheme: AppTheme = {
  colors: {
    ...shared,
    brandMuted: "#1A2E26",
    brandText: "#5EC9A0",
    onBrand: "#FFFFFF",
    gold: "#D4A84B",
    appBg: "#0F0F0F",
    card: "#1A1A1A",
    ink: "#F3F4F6",
    ink2: "#9CA3AF",
    ink3: "#6B7280",
    border: "#2D2D2D",
    inputBg: "#242424",
    summaryBg: "#1A1A1A",
    destructive: "#F87171",
    heroBg: "#1A2E26",
    heroInk: "#F3F4F6",
    heroInk2: "#5EC9A0",
    paper: "#FFFFFF",
    paperBorder: "#E5E7EB",
    filterAll: {
      bg: "#1A2E26",
      activeBg: "#5EC9A0",
      text: "#5EC9A0",
      activeText: "#0F0F0F",
    },
    filterUnpaid: {
      bg: "#3D3420",
      activeBg: "#D97706",
      text: "#D4A84B",
      activeText: "#0F0F0F",
    },
    filterPaid: {
      bg: "#1A2E26",
      activeBg: "#059669",
      text: "#5EC9A0",
      activeText: "#FFFFFF",
    },
    filterDraft: {
      bg: "#252535",
      activeBg: "#4F46E5",
      text: "#818CF8",
      activeText: "#FFFFFF",
    },
  },
  radius: shared.radius,
  field: { ...shared.field, placeholder: "#6B7280" },
};

/** @deprecated Use useAppTheme() */
export const theme = lightTheme;

export function getTheme(scheme: ColorScheme): AppTheme {
  return scheme === "dark" ? darkTheme : lightTheme;
}
